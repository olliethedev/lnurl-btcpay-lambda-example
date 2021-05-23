"use strict";
const serverless = require('serverless-http');
const express = require('express')
const app = express()

const { verifyAuthorizationSignature } = require('lnurl/lib');


const sessionMiddleware = require("./middleware/sessionMiddleware");
const mongoMiddleware = require("./middleware/mongoMiddleware");
const lnurlMiddleware = require("./middleware/lnurlMiddleware");
const { findSession, updateSession } = require('./helpers/sessionHelper');


app.use(mongoMiddleware)
  .use(sessionMiddleware);

app.get('/foo', function (req, res, next) {
  req.session.views = req.session.views ? req.session.views + 1 : 1;
  res.status(200).json({ name: 'John Doe', views: req.session.views})
})

app.get(
  "/login-lnurl/login",
  new lnurlMiddleware({
    callbackUrl: `${process.env.PUBLIC_URL}login-lnurl/callback`,
    cancelUrl: "http://localhost:3000",
  })
);

app.get("/login-lnurl/callback", async (req, res) => {
  try {
    const { k1, sig, key } = req.query;
    if (!verifyAuthorizationSignature(sig, k1, key)) {
      throw new Error("Invalid signature", 400);
    }
    await updateSession("session.lnurlAuth.k1", k1, "session.lnurlAuth.linkingPublicKey", key);
    res.status(200).json({ status: "OK" });
  } catch (error) {
    console.trace(error);
    res.status(error?.status ?? 500).json({
      status: "ERROR",
      reason: error?.message ?? "Unexpected error",
    });
  }
});

module.exports.hello = serverless(app);
