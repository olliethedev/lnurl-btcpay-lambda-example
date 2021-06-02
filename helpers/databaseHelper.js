const mongoose = require("mongoose");

let connection;
let connecting = false;
module.exports.connect = async function (databaseUrl) {
    while(connecting){
      console.log("waiting on connection");
      await sleep(100)
    }
    if(connection){
      console.log("reusing connection");
        return connection;
    }
    try {
      const connectionSettings = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      console.log("new connection");
      connecting = true;
      connection = await mongoose.createConnection(databaseUrl, connectionSettings);
      connecting = false;
      return connection;
    } catch (e) {
      console.error("Could not connect to MongoDB...");
      connecting = false;
      throw e;
    }
  };

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.getConnection = function () {
  return connection;
};

module.exports.disconnect = async function () {
  await mongoose.disconnect();
  connection = null;
}