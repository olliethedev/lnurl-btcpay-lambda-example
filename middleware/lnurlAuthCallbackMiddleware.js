
const { updateSession } = require('../helpers/sessionHelper');

const { verifyAuthorizationSignature } = require('lnurl/lib');

module.exports = async (req, res) => {
    try {
      const { k1, sig, key } = req.query;
      if (!verifyAuthorizationSignature(sig, k1, key)) {
        throw new Error("Invalid signature", 400);
      }
      await updateSession("session.lnurlAuth.k1", k1, "session.lnurlAuth.linkingPublicKey", key);
      res.status(200).json({ status: "OK" });
    } catch (error) {
      console.trace(error);
      res.status(error.status ? error.status: 500).json({
        status: "ERROR",
        reason: error.message ? error.message : "Unexpected error",
      });
    }
  }