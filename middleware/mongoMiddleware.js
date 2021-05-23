const mongoose = require("mongoose");

const connect = async (databaseUrl) => {
    let connection;
    try {
      console.log("creating connection");
      const connectionSettings = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      connection = await mongoose.createConnection(databaseUrl, connectionSettings);
      console.log("connected!");
      return connection;
    } catch (e) {
      console.error("Could not connect to MongoDB...");
      throw e;
    }
  };

  module.exports =  async function mongoMiddleware(req, res, next) {
    const connection = await connect(process.env.MONGO_DB_URL);
    req.dbClient = connection.getClient();
    return next();
}