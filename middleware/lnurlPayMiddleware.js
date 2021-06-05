const lnurl = require("lnurl");
const querystring = require("querystring");
const { createInvoiceAndSyncDB } = require("../helpers/invoiceHelper");

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
            minSendable:1000,
            maxSendable:1000000,
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
    
    const request = await createInvoiceAndSyncDB(linkingPublicKey, tokens, description, responseMetadata, req.models.account, req.models.invoice);
    
    res.status(200).json({
        pr: request,
        successAction: {
            tag: 'message',
            message: 'Funds added to your account'
         },
        disposable: true,
    });
}
