const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = function sessionMiddleware(req, res, next) {
    if(req.dbClient){
        console.log("has dbclient")
    }
  return session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
      client: req.dbClient,
      stringify: false,
    }),
  })(req, res, next);
}