const lnurl = require("lnurl");
const querystring = require("querystring");

const { createPaymentClaimAndSyncDB, findClaimAndAccount, payInvoiceAndSyncDB } = require('../helpers/invoiceHelper');

module.exports.withdrawUrl = function(options){
    if (!options.callbackUrl) {
        throw new Error('Missing required middleware option: "callbackUrl"');
    }
    return async function(req, res, next){
        if(!req.session.lnurlAuth || !req.session.lnurlAuth.linkingPublicKey){
            throw new Error('Please login first'); 
        }
        const claim = await createPaymentClaimAndSyncDB(req.session.lnurlAuth.linkingPublicKey, req.models.account, req.models.claim);
        return res.status(200).send({ url: getWithdrawUrl(options, claim.secret) });  
    }
}

const getWithdrawUrl = function (options, secret) {
    const encoded = lnurl.encode(
      `${options.callbackUrl}?${querystring.stringify({
        tag: "withdrawRequest",
      })}&${querystring.stringify({
        secret,
      })}`
    );
    return `lightning:${encoded}`;
  };

module.exports.info = function(options){
    if (!options.callbackUrl) {
        throw new Error('Missing required middleware option: "callbackUrl"');
    }
    return async function(req, res){
        const { secret } = req.query;
        console.log(secret);
        const {account, claim} = await findClaimAndAccount(secret, req.models.account, req.models.claim);
        console.log({ account, claim});
        if( !claim || claim.state !== "OPEN" ) { 
            throw new Error('Withdrawal already paid out');
        }
        const fullCallbackUrl = `${options.callbackUrl}?${querystring.stringify({
            secret,
          })}`;
        const payPayload = { 
            callback: fullCallbackUrl,
            k1: claim.secret,
            minWithdrawable: 0,
            maxWithdrawable: account.balance * 1000,
            defaultDescription: "Withdraw your funds",
            tag: "withdrawRequest",
        }
        res.status(200).json(payPayload);
    }
}
module.exports.callback = async function(req, res){
    console.log(req.query);
    const {k1, pr} = req.query;
    const { account, claim } = await payInvoiceAndSyncDB(k1, pr, req.models.account, req.models.claim);
    console.log({account, claim});
    res.status(200).json({status: "OK"});
}