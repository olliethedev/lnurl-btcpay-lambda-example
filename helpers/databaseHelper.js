const mongoose = require("mongoose");

let connection;
module.exports.connect = async function (databaseUrl) {
    if(connection){
        return connection;
    }
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