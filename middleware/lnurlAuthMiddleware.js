const crypto = require("crypto");
const querystring = require("querystring");
const lnurl = require("lnurl");
const { updateSession } = require('../helpers/sessionHelper');

const { verifyAuthorizationSignature } = require('lnurl/lib');

module.exports.info = function (options) {
  if (!options.callbackUrl) {
    throw new Error('Missing required middleware option: "callbackUrl"');
  }
  return function (req, res, next) {
    // generate login url from secret, and add secret to session

    let k1;
    if (!req.session.lnurlAuth) {
      k1 = crypto.randomBytes(32).toString("hex");
      req.session.lnurlAuth = { k1, linkingPublicKey : false };
    }else{
        k1 = req.session.lnurlAuth.k1;
    }
    return res.status(200).send({ url: getLoginUrl(k1, options) });
  };
};

const getLoginUrl = function (k1, options) {
  const encoded = lnurl.encode(
    `${options.callbackUrl}?${querystring.stringify({
      k1,
      tag: "login",
    })}`
  );
  return `lightning:${encoded}`;
};

module.exports.callback = async (req, res) => {
    try {
      const { k1, sig, key } = req.query;
      if (!verifyAuthorizationSignature(sig, k1, key)) {
        throw new Error("Invalid signature", 400);
      }
      await updateSession("session.lnurlAuth.k1", k1, "session.lnurlAuth.linkingPublicKey", key);
      const AccountModel = require("../models/Account");
      await AccountModel.findOneAndUpdate(
        {linkingPublicKey: key},
        {upsert: true, setDefaultsOnInsert: true}
      )
      res.status(200).json({ status: "OK" });
    } catch (error) {
      console.trace(error);
      res.status(error.status ? error.status: 500).json({
        status: "ERROR",
        reason: error.message ? error.message : "Unexpected error",
      });
    }
  }