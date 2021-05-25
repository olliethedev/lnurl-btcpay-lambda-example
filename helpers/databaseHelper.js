const mongoose = require("mongoose");

let connection;
module.exports.connect = async function (databaseUrl) {
    if(connection){
        return connection;
    }
    try {
      const connectionSettings = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      connection = await mongoose.createConnection(databaseUrl, connectionSettings);
      return connection;
    } catch (e) {
      console.error("Could not connect to MongoDB...");
      throw e;
    }
  };