const express = require('express');
const cors = require('cors');

const lnurlRouter = require("./routers/lnurl");
const accountRouter = require("./routers/account");
const nodeRouter = require("./routers/node");
const { SQS } = require("aws-sdk");


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

app.use("/enqueue", async function(req, res) {
  console.log("enqueue");
  let options = {};
  console.log({IS_OFFLINE:process.env.IS_OFFLINE})
  if (process.env.IS_OFFLINE) {
    options = {
      region: 'us-east-1',
      endpoint: process.env.QUEUE_URL_OFFLINE,
      accessKeyId: 'root',
      secretAccessKey: 'root'
    };
  }
  const sqs = new SQS(options);
  let message;
  try {
    await sqs
      .sendMessage({
        QueueUrl: process.env.IS_OFFLINE?process.env.QUEUE_URL_OFFLINE:process.env.QUEUE_URL,
        MessageBody: "Hello, world!!!",
        MessageAttributes: {
          AttributeName: {
            StringValue: "Attribute Value",
            DataType: "String",
          },
        },
      })
      .promise();

    message = "Message accepted!";
  } catch (error) {
    console.log(error);
    message = error;
    statusCode = 500;
  }

  res.status(200).json({status:message});
})

module.exports = app;