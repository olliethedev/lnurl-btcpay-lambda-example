// lightning REST Api docs : https://api.lightning.community/
const fetch = require('node-fetch');
const https = require("https");

const agent = new https.Agent({
    rejectUnauthorized: false // used for selfsigned ssl cert
})
const headers = {
    "Grpc-Metadata-macaroon": process.env.LND_MACAROON_HEX
};

const requestOptions = {
    headers,
    redirect: 'follow',
    agent
};

module.exports.getInfo = async function(){
    return makeCall("GET", "/v1/getinfo");
};

module.exports.getInvoice = async function(invoiceId){
    return makeCall("GET", `/v1/invoice/${invoiceId}`);
};

module.exports.createInvoice = async function(amount, description, description_hash){
    return makeCall("POST", `/v1/invoices`, {value: amount, memo:description, description_hash});
}

module.exports.parsePaymentRequest = async function(payRequest) {
    return makeCall("GET", `/v1/payreq/${payRequest}`);
}

module.exports.pay = async function(payRequest) {
    return makeCall("POST", "/v1/channels/transactions", {payment_request: payRequest});
}

module.exports.payAsync = async function(payRequest, timeoutSeconds=60) {
    return makeCall("POST", "/v2/router/send", {payment_request: payRequest, timeout_seconds: timeoutSeconds});
}

async function makeCall(method, path, body){
    const fetchOptions = {
        ...requestOptions, 
        method, 
        body: body?JSON.stringify(body):null
    };
    const url = `${process.env.LND_REST_URL}${path}`;
    // console.log({url, fetchOptions});
    try{
        const responseRaw = await fetch(url, fetchOptions);
        // console.log(responseRaw);
        const response = await responseRaw.json();
        // console.log(response);
        return response;
    }catch(err){
        console.error(err);
        throw new Error("REST API error");
    }
}