"use strict";
const serverless = require('serverless-http');
const express = require('express');
const lnService = require('ln-service');
const lnd = require('./lnd');

const app = express()

const sessionMiddleware = require("./middleware/sessionMiddleware");
const mongoMiddleware = require("./middleware/mongoMiddleware");
const lnurlMiddleware = require("./middleware/lnurlAuthMiddleware");
const lnurlPayMiddleware = require('./middleware/lnurlPayMiddleware');

app.use(mongoMiddleware)
  .use(sessionMiddleware);

app.get('/account', function (req, res, next) {
  req.session.views = req.session.views ? req.session.views + 1 : 1;
  res.status(200).json({ loggedin: req.session.lnurlAuth.linkingPublicKey ? true : false, views: req.session.views})
})

// Authentication
app.get(
  "/login-lnurl/login",
  new lnurlMiddleware.info({
    callbackUrl: `${process.env.PUBLIC_URL}/login-lnurl/callback`,
  })
);

app.get("/login-lnurl/callback", lnurlMiddleware.callback);


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

// Health
app.get("/node/ping", async function(req, res) {
  const response = await lnService.getWalletInfo({lnd});
  console.log(response);
  res.status(200).json({status:response.public_key});
})

module.exports.hello = serverless(app);
