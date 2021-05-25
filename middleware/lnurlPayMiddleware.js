const lnurl = require("lnurl");
const querystring = require("querystring");
const crypto = require("crypto");
const lnService = require('ln-service');
const lnd = require('../lnd');

const invoiceMessage = "Pay me msg";

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
        return res.status(200).send({ url: getPayUrl(options) });
    }
}

const getPayUrl = function (options) {
    const encoded = lnurl.encode(
      `${options.callbackUrl}?${querystring.stringify({
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
        const payPayload = { 
            callback: options.callbackUrl,
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
    const amount = Number.parseInt(amountRaw, 10);
    const tokens= amount / 1000;
    const description = invoiceMessage;
    const description_hash = crypto.createHash("sha256").update(responseMetadata).digest();
    const invoice = await lnService.createInvoice({
        lnd,
        tokens,
        description,
        description_hash,
      });
    res.status(200).json({
        pr: invoice.request,
        successAction: {
            tag: 'message',
            message: 'Thank you for paying me!!!'
         },
        disposable: true,
    });
}