const lnurl = require("lnurl");
const querystring = require("querystring");
const crypto = require("crypto");
const lnService = require('ln-service');
const lnd = require('../lnd');

const invoiceMessage = "Fund your account";

const responseMetadata = JSON.stringify([
    [
        "text/plain", 
        invoiceMessage
    ]
]);

module.exports.payUrl = function(options){
    if (!options.callbackUrl) {
        throw new Error('Missing required middleware option: "callbackUrl"');
    }
    return function(req, res, next){
        if(req.session.lnurlAuth.linkingPublicKey)
            return res.status(200).send({ url: getPayUrl(options, req.session.lnurlAuth.linkingPublicKey) });
        else
            res.status(500).json({ 
                status: "ERROR",
                reason: "Login to deposit funds",
            });
    }
}

const getPayUrl = function (options, linkingPublicKey) {
    const fullCallbackUrl = options.callbackUrl.replace(":linkingPublicKey", linkingPublicKey);
    const encoded = lnurl.encode(
      `${fullCallbackUrl}?${querystring.stringify({
        tag: "payRequest",
      })}`
    );
    return `lightning:${encoded}`;
  };

module.exports.info = function(options){
    if (!options.callbackUrl) {
        throw new Error('Missing required middleware option: "callbackUrl"');
    }
    return function(req, res){
        const { linkingPublicKey } = req.params;
        const fullCallbackUrl = options.callbackUrl.replace(":linkingPublicKey", linkingPublicKey);
        const payPayload = { 
            callback: fullCallbackUrl,
            minSendable:4000,
            maxSendable:4000,
            metadata: responseMetadata,
            tag: "payRequest",
        }
        res.status(200).json(payPayload);
    }
}

module.exports.callback = async function(req, res){
    const { amount : amountRaw } = req.query;
    const { linkingPublicKey } = req.params;
    const amount = Number.parseInt(amountRaw, 10);
    const tokens = amount / 1000;
    const description = invoiceMessage;
    const description_hash = crypto.createHash("sha256").update(responseMetadata).digest();
    
    const AccountModel = require("../models/Account");
    const account = await AccountModel.findOne({ linkingPublicKey });
    console.log(account);

    const lnInvoice = await lnService.createInvoice({
        lnd,
        tokens,
        description,
        description_hash,
      });
    console.log(lnInvoice);

    const invoiceModel = require("../models/Invoice");
    const invoice = new invoiceModel({
        rawInvoice: lnInvoice.request,
        account,
        amount: tokens
    });
    await invoice.save();
    res.status(200).json({
        pr: lnInvoice.request,
        successAction: {
            tag: 'message',
            message: 'Thank you for paying me!!!'
         },
        disposable: true,
    });
}