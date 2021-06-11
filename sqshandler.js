
const sqsHandler = async (event) => {
    console.log('handler')
    for (const record of event.Records) {
      const messageAttributes = record.messageAttributes;
      console.log(
        "Message Attributte: ",
        messageAttributes.AttributeName.stringValue
      );
      console.log("Message Body: ", record.body);
    }
  };

module.exports.sqshandler = sqsHandler;