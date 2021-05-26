"use strict";
const serverless = require('serverless-http');
const express = require('express');
const lnService = require('ln-service');
const lnd = require('./lnd');

const {findAccountForSession} = require('./helpers/sessionHelper');

const sessionMiddleware = require("./middleware/sessionMiddleware");
const mongoMiddleware = require("./middleware/mongoMiddleware");
const lnurlMiddleware = require("./middleware/lnurlAuthMiddleware");
const lnurlPayMiddleware = require('./middleware/lnurlPayMiddleware');
const lnurlWithdrawMiddleware = require('./middleware/lnurlWithdrawMiddleware');

const app = express()

app.use(mongoMiddleware)
  .use(sessionMiddleware);


// Authentication
app.get(
  "/login-lnurl/login",
  new lnurlMiddleware.info({
    callbackUrl: `${process.env.PUBLIC_URL}/login-lnurl/callback`,
  })
);

app.get("/login-lnurl/callback", lnurlMiddleware.callback);

// Account
app.get('/account', async function (req, res, next) {
  req.session.views = req.session.views ? req.session.views + 1 : 1;
  const linkingPublicKey = req.session.lnurlAuth ? req.session.lnurlAuth.linkingPublicKey: false;
  const account = await findAccountForSession(req.session);
  res.status(200).json({ 
    loggedin: linkingPublicKey ? true : false, 
    views: req.session.views,
    account
  });
})

app.get('/account/logout', async function (req, res, next) {
  await req.session.destroy();
  res.status(200).json({ status: "OK" });
})

// Payment
app.get("/pay-lnurl/pay", new lnurlPayMiddleware.payUrl({
    callbackUrl: `${process.env.PUBLIC_URL}/pay-lnurl/pay-info/:linkingPublicKey`,
  })
);

app.get("/pay-lnurl/pay-info/:linkingPublicKey", new lnurlPayMiddleware.info({
    callbackUrl: `${process.env.PUBLIC_URL}/pay-lnurl/callback/:linkingPublicKey`
  })
);

app.get("/pay-lnurl/callback/:linkingPublicKey", lnurlPayMiddleware.callback);

app.get("/node/invoice/:invoiceId", lnurlPayMiddleware.invoice);

// Withdraw
app.get("/withdraw-lnurl/withdraw", new lnurlWithdrawMiddleware.withdrawUrl({
  callbackUrl: `${process.env.PUBLIC_URL}/withdraw-lnurl/withdraw-info`,
}))

app.get("/withdraw-lnurl/withdraw-info", new lnurlWithdrawMiddleware.info({
  callbackUrl: `${process.env.PUBLIC_URL}/withdraw-lnurl/callback`,
}))

app.get("/withdraw-lnurl/callback", lnurlWithdrawMiddleware.callback);

// Misc
app.get("/node/ping", async function(req, res) {
  const response = await lnService.getWalletInfo({lnd});
  console.log(response);
  res.status(200).json({status:response.public_key});
})

module.exports.hello = serverless(app);
