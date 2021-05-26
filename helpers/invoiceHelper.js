const crypto = require("crypto");
const lnService = require('ln-service');
const lnd = require('../lnd');
const { getConnection } = require("./databaseHelper");

module.exports.createInvoiceAndSyncDB = async function ( linkingPublicKey, amountInvoiced, description, responseMetadata){
    const description_hash = crypto.createHash("sha256").update(responseMetadata).digest();
    const AccountModel = require("../models/Account");
    const account = await AccountModel.findOne({ linkingPublicKey });
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