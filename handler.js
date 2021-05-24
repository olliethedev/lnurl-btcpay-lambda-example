"use strict";
const serverless = require('serverless-http');
const express = require('express')
const app = express()

const sessionMiddleware = require("./middleware/sessionMiddleware");
const mongoMiddleware = require("./middleware/mongoMiddleware");
const lnurlMiddleware = require("./middleware/lnurlAuthMiddleware");
const lnurlAuthCallbackMiddleware = require('./middleware/lnurlAuthCallbackMiddleware');

app.use(mongoMiddleware)
  .use(sessionMiddleware);

app.get('/foo', function (req, res, next) {
  req.session.views = req.session.views ? req.session.views + 1 : 1;
  res.status(200).json({ loggedin: req.session.lnurlAuth.linkingPublicKey ? true : false, views: req.session.views})
})

app.get(
  "/login-lnurl/login",
  new lnurlMiddleware({
    callbackUrl: `${process.env.PUBLIC_URL}login-lnurl/callback`,
    cancelUrl: "http://localhost:3000",
  })
);

app.get("/login-lnurl/callback", lnurlAuthCallbackMiddleware);

module.exports.hello = serverless(app);
