const mongoose = require('mongoose');

const { getConnection } = require("../helpers/databaseHelper");

const conn = getConnection();

const invoiceSchema = new mongoose.Schema({
    rawInvoice: { 
        type: String,
        required: true
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    state: {
        type: String,
        enum : [ "OPEN","SETTLED", "CANCELED", "ACCEPTED" ],
        default: "OPEN",
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});

module.exports = conn.model('Invoice', invoiceSchema);