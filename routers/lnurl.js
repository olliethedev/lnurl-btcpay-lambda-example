const express = require('express');

const sessionMiddleware = require("../middleware/sessionMiddleware");
const mongoMiddleware = require("../middleware/mongoMiddleware");
const lnurlMiddleware = require("../middleware/lnurlAuthMiddleware");
const lnurlPayMiddleware = require('../middleware/lnurlPayMiddleware');
const lnurlWithdrawMiddleware = require('../middleware/lnurlWithdrawMiddleware');


module.exports = function(options){
    if (!options.path) {
        throw new Error('Missing required route option `path`');
    }
    const {path} = options;
    console.log(path)
    let router = express.Router();

    router.use(mongoMiddleware);
    router.use(sessionMiddleware);

    // Authentication
    router.get(
        `/login-lnurl/login`,
        new lnurlMiddleware.info({
            callbackUrl: `${process.env.PUBLIC_URL}${path}/login-lnurl/callback`,
        })
    );

    router.get(`/login-lnurl/callback`, lnurlMiddleware.callback);

    // Payment
    router.get(`/pay-lnurl/pay`, new lnurlPayMiddleware.payUrl({
            callbackUrl: `${process.env.PUBLIC_URL}${path}/pay-lnurl/pay-info/:linkingPublicKey`,
        })
    );

    router.get(`/pay-lnurl/pay-info/:linkingPublicKey`, new lnurlPayMiddleware.info({
            callbackUrl: `${process.env.PUBLIC_URL}${path}/pay-lnurl/callback/:linkingPublicKey`
        })
    );

    router.get(`/pay-lnurl/callback/:linkingPublicKey`, lnurlPayMiddleware.callback);

    // Withdraw
    router.get(`/withdraw-lnurl/withdraw`, new lnurlWithdrawMiddleware.withdrawUrl({
        callbackUrl: `${process.env.PUBLIC_URL}${path}/withdraw-lnurl/withdraw-info`,
    }))

    router.get(`/withdraw-lnurl/withdraw-info`, new lnurlWithdrawMiddleware.info({
        callbackUrl: `${process.env.PUBLIC_URL}${path}/withdraw-lnurl/callback`,
    }))

    router.get(`/withdraw-lnurl/callback`, lnurlWithdrawMiddleware.callback);
    
    return router;
};