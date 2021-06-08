const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = function sessionMiddleware(req, res, next) {
  return session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    },
    store: MongoStore.create({
      client: req.dbClient,
      stringify: false,
    }),
  })(req, res, next);
}