const crypto = require("crypto");
const { getConnection, connect } = require("./databaseHelper");
const { getInvoice, createInvoice, parsePaymentRequest, pay } = require('./lndRequestHelper');

module.exports.createInvoiceAndSyncDB = async function ( linkingPublicKey, amountInvoiced, description, responseMetadata, accountModel, invoiceModel){
    const description_hash = crypto.createHash("sha256").update(responseMetadata).digest();
    const account = await accountModel.findOne({ linkingPublicKey });
    console.log(account);

    const lnInvoice = await createInvoice(amountInvoiced, description, description_hash.toString('base64'));
    console.log(lnInvoice);

    const invoice = new invoiceModel({
        invoiceId : Buffer.from(lnInvoice.r_hash, 'base64').toString('hex'), // consider refactoring to ignore this field
        invoiceRequest: lnInvoice.payment_request,
        account,
        amountInvoiced
    });
    await invoice.save();
    return lnInvoice.payment_request;
}

module.exports.createPaymentClaimAndSyncDB = async function (linkingPublicKey, accountModel, claimModel) {
    const account = await accountModel.findOne({ linkingPublicKey });
    console.log(account);
    const oldClaim = await claimModel.findOne({account, state:"OPEN"});
    if(oldClaim) {
        console.log({oldClaim});
        return oldClaim;
    }
    const k1 = crypto.randomBytes(32).toString("hex");
    const claim = new claimModel({
        secret: k1,
        account
    });
    return claim.save();
}

module.exports.findClaimAndAccount = async function (secret, accountModel, claimModel) {
    const claim = await claimModel.findOne({secret});
    if(claim.state !== "OPEN"){
        throw new Error("Already paid or canceled this claim");
    }
    const account = await accountModel.findById(claim.account);
    return {account, claim};
}

module.exports.payInvoiceAndSyncDB = async function( secret, pr, accountModel, claimModel ) {
    const conn = getConnection();
    const dbSession = await conn.startSession();

    let claim;
    let account;

    await dbSession.withTransaction(async () => {
        claim = await claimModel.findOne({secret}).session(dbSession);
        account = await accountModel.findById(claim.account).session(dbSession);
        const requestDetails = await parsePaymentRequest(pr);
        //note: getInvoice using the requestDetails.payment_hash will fail for some nodes, dont rely on it.
        const amountRequested = parseInt(requestDetails.num_satoshis);
        console.log(requestDetails);
        if(amountRequested > account.balance){
            claim.state = "CANCELED";
            await claim.save();
            throw new Error("Not enough funds to fill invoice");
        }
        const paymentResp = await pay(pr);
        console.log(paymentResp);
        if(!paymentResp.payment_error || paymentResp.payment_error===0){
            account.balance -= amountRequested; //todo: take note of fees parseInt(paymentResp.payment_route.total_fees)
            await account.save();
            claim.invoiceRequest = pr;
            // claim.paymentId = invoice.r_hash; //to string?
            claim.state = "SETTLED";
            claim.amountRequested = amountRequested;
        }else{
            claim.state = "CANCELED";
        }
        await claim.save();
    });
    return {account, claim};
}

module.exports.getAllLndInvoicesAndSyncDB = async function(account, invoiceModel){
    if(!account) return [];
    const conn = getConnection();
    const dbSession = await conn.startSession();

    let invoices;

    await dbSession.withTransaction(async () => {
        invoices = await invoiceModel.find({account}).sort({updatedAt:-1}).session(dbSession);
        for(let i = 0; i < invoices.length; i++){
            let invoice = invoices[i];
            if(invoice.state !== "SETTLED"){
                const invoiceDetails = await getInvoice(invoice.invoiceId);
                // console.log(invoiceDetails)
                if(invoice.state === "OPEN" && invoiceDetails.state==="SETTLED"){
                    invoice.state = "SETTLED";
                    invoice.amountReceived = parseInt(invoiceDetails.value);
                    account.balance += parseInt(invoiceDetails.value);
                    await invoice.save();
                }else if(invoice.state === "OPEN" && invoiceDetails.state==="CANCELED"){
                    invoice.state = "CANCELED";
                    await invoice.save();
                }
            }
        }

        await account.save();
    });

    dbSession.endSession();

    return invoices;
}
module.exports.getAllClaims = async function(account, claimModel){
    return claimModel.find({account}).sort({updatedAt:-1});
}