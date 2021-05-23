const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = function sessionMiddleware(req, res, next) {
    if(req.dbClient){
        console.log("has dbclient")
    }
  return session({
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      client: req.dbClient,
      stringify: false,
      saveUninitialized: false,
      resave: false,
    }),
  })(req, res, next);
}