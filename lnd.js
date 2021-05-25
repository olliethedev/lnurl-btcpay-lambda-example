const lnService = require("ln-service");

module.exports = lnService.authenticatedLndGrpc({
    cert: process.env.LND_CERT,
    macaroon: process.env.LND_MACAROON,
    socket: process.env.LND_URL,
  }).lnd;