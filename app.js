const express = require('express');
const cors = require('cors');

const lnurlRouter = require("./routers/lnurl");
const accountRouter = require("./routers/account");
const nodeRouter = require("./routers/node");

const app = express()

const corsOptions = {
  origin: ["http://localhost:3001", "http://localhost:3000", process.env.FRONT_END_URL],
  credentials: true
};

app.set('trust proxy', 1);
app.use(cors(corsOptions));

// LNURL
app.use('/lnurl', lnurlRouter({path:'/lnurl'}))

// Account
app.use('/account', accountRouter());

// Node
app.use("/node", nodeRouter);

module.exports = app;