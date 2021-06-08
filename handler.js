"use strict";
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

const {findAccountForSession} = require('./helpers/sessionHelper');

const sessionMiddleware = require("./middleware/sessionMiddleware");
const mongoMiddleware = require("./middleware/mongoMiddleware");
const lnurlMiddleware = require("./middleware/lnurlAuthMiddleware");
const lnurlPayMiddleware = require('./middleware/lnurlPayMiddleware');
const lnurlWithdrawMiddleware = require('./middleware/lnurlWithdrawMiddleware');
const { disconnect } = require('./helpers/databaseHelper');
const { getAllLndInvoicesAndSyncDB, getAllClaims } = require('./helpers/invoiceHelper');
const { getInfo } = require('./helpers/lndRequestHelper');

const app = express()

const corsOptions = {
  origin: ["http://localhost:3001", "http://localhost:3000", "https://c060b3731238.ngrok.io", process.env.FRONT_END_URL],
  credentials: true
};

//app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(mongoMiddleware);
app.use(sessionMiddleware);

// to force express to recognize connection as HTTPS and receive cookie with 'secure' set
app.set('trust proxy', 1);


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
})

app.get('/account/logout', async function (req, res, next) {
  await req.session.destroy();
  res.status(200).json({ status: "OK" });
  next();
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

// Withdraw
app.get("/withdraw-lnurl/withdraw", new lnurlWithdrawMiddleware.withdrawUrl({
  callbackUrl: `${process.env.PUBLIC_URL}/withdraw-lnurl/withdraw-info`,
}))

app.get("/withdraw-lnurl/withdraw-info", new lnurlWithdrawMiddleware.info({
  callbackUrl: `${process.env.PUBLIC_URL}/withdraw-lnurl/callback`,
}))

app.get("/withdraw-lnurl/callback", lnurlWithdrawMiddleware.callback);

// Misc
app.get("/node/ping", async function(req, res, next) {
  try{
    const response = await getInfo();
  
    console.log(response);
    res.status(200).json({status:response.identity_pubkey});
  }catch(e){
    console.trace(e);
    res.status(500).json({error:"Failed getting info"});
  }
  
  next();
})

module.exports.hello = serverless(app);
