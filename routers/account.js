const express = require('express');

const sessionMiddleware = require("../middleware/sessionMiddleware");
const mongoMiddleware = require("../middleware/mongoMiddleware");

const { getAllLndInvoicesAndSyncDB, getAllClaims } = require('../helpers/invoiceHelper');
const { findAccountForSession } = require('../helpers/sessionHelper');


module.exports = function () {

    let router = express.Router();

    // Start DB and session
    router.use(mongoMiddleware);
    router.use(sessionMiddleware);

    // Account
    router.get('/', async function (req, res, next) {
    const linkingPublicKey = req.session.lnurlAuth ? req.session.lnurlAuth.linkingPublicKey: false;
    try{
        const account = await findAccountForSession(req.session, req.models.account);
        const invoices = await getAllLndInvoicesAndSyncDB(account, req.models.invoice);
        const claims = await getAllClaims(account, req.models.claim);
        res.status(200).json({ 
        loggedin: linkingPublicKey ? true : false, 
        account,
        invoices,
        claims
        });

    }catch(ex){
        console.trace(ex);
        res.status(200).json({ loggedin: false });
    }
    next();
    });

    router.get('/logout', async function (req, res, next) {
        await req.session.destroy();
        res.status(200).json({ status: "OK" });
        next();
    })
    return router;
}