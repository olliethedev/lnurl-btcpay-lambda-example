const crypto = require("crypto");
const lnService = require('ln-service');
const lnd = require('../lnd');
const { getConnection } = require("./databaseHelper");

module.exports.createInvoiceAndSyncDB = async function ( linkingPublicKey, amountInvoiced, description, responseMetadata){
    const description_hash = crypto.createHash("sha256").update(responseMetadata).digest();
    const accountModel = require("../models/Account");
    const account = await accountModel.findOne({ linkingPublicKey });
    console.log(account);

    const lnInvoice = await lnService.createInvoice({
        lnd,
        tokens: amountInvoiced,
        description,
        description_hash,
      });
    console.log(lnInvoice);

    const invoiceModel = require("../models/Invoice");
    const invoice = new invoiceModel({
        invoiceId : lnInvoice.id,
        invoiceRequest: lnInvoice.request,
        account,
        amountInvoiced
    });
    await invoice.save();
    return lnInvoice.request;
}

module.exports.getLndInvoiceAndSyncDB = async function( invoiceId ){
    const invoiceModel = require("../models/Invoice");
    const accountModel = require("../models/Account");
    const conn = getConnection();
    const dbSession = await conn.startSession();

    let invoice;
    let account;

    await dbSession.withTransaction(async () => {
        invoice = await invoiceModel.findOne({invoiceId}).session(dbSession);
        account = await accountModel.findById(invoice.account).session(dbSession);
        if(invoice.state !== "SETTLED"){
            const invoiceDetails = await lnService.getInvoice({id:invoiceId, lnd});
            if(invoice.state === "OPEN" && invoiceDetails.is_confirmed){
                invoice.state = "SETTLED";
                invoice.amountReceived = invoiceDetails.received;
                account.balance += invoiceDetails.received;
                await invoice.save();
                await account.save();
            }else if(invoice.state === "OPEN" && invoiceDetails.is_canceled){
                invoice.state = "CANCELED";
                await invoice.save();
            }
        }
    });

    dbSession.endSession();

    return { invoice, account};
}

module.exports.createPaymentClaimAndSyncDB = async function (linkingPublicKey) {
    const claimModel = require("../models/Claim");
    const accountModel = require("../models/Account");
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

module.exports.findClaimAndAccount = async function (secret) {
    const claimModel = require("../models/Claim");
    const accountModel = require("../models/Account");
    const claim = await claimModel.findOne({secret});
    if(claim.state !== "OPEN"){
        throw new Error("Already paid or canceled this claim");
    }
    const account = await accountModel.findById(claim.account);
    return {account, claim};
}

module.exports.payInvoiceAndSyncDB = async function( secret, pr ) {
    const claimModel = require("../models/Claim");
    const accountModel = require("../models/Account");
    const conn = getConnection();
    const dbSession = await conn.startSession();

    let claim;
    let account;

    await dbSession.withTransaction(async () => {
        claim = await claimModel.findOne({secret}).session(dbSession);
        account = await accountModel.findById(claim.account).session(dbSession);
        const requestDetails = lnService.parsePaymentRequest({request: pr});
        if(requestDetails.safe_tokens > account.balance){
            claim.state = "CANCELED";
            await claim.save();
            throw new Error("Not enough funds to fill invoice");
        }
        const paymentResp = await lnService.pay({lnd, request:pr});
        if(paymentResp.is_confirmed === true){
            const amountRequested = paymentResp.tokens - paymentResp.fee; //eat the fee to avoid negative user balance
            account.balance -= amountRequested;
            await account.save();
            claim.invoiceRequest = pr;
            claim.paymentId = paymentResp.id;
            claim.state = "CONFIRMED";
            claim.amountRequested = amountRequested;
            await claim.save();
        }
    });
    return {account, claim};
}