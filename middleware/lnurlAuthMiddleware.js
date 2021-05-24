const crypto = require("crypto");
const querystring = require("querystring");
const lnurl = require("lnurl");

module.exports = function (options) {
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

