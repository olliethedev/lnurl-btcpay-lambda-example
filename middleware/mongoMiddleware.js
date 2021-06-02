const { connect } = require('../helpers/databaseHelper');

  module.exports =  async function mongoMiddleware(req, res, next) {
    const connection = await connect(process.env.MONGO_DB_URL);
    console.log("got db")
    const invoice = require("../models/Invoice");
    const account = require("../models/Account");
    const claim = require("../models/Claim");
    req.dbClient = connection.getClient();
    req.dbConnection = connection;
    req.models = {account, invoice, claim};
    return next();
}