"use strict";
const serverless = require('serverless-http');
const express = require('express')
const app = express()


const sessionMiddleware = require("./middleware/sessionMiddleware");
const mongoMiddleware = require("./middleware/mongoMiddleware");


app.use(mongoMiddleware)
  .use(sessionMiddleware);

app.all('/foo', function (req, res, next) {
  req.session.views = req.session.views ? req.session.views + 1 : 1;
  res.status(200).json({ name: 'John Doe', views: req.session.views})
})


module.exports.hello = serverless(app);
