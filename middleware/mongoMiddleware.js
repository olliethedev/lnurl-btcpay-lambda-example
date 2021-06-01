const { connect } = require('../helpers/databaseHelper');

  module.exports =  async function mongoMiddleware(req, res, next) {
    const connection = await connect(process.env.MONGO_DB_URL);
    console.log("got db")
    req.dbClient = connection.getClient();
    req.dbConnection = connection;
    return next();
}