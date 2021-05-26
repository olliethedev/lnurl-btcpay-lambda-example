const mongoose = require('mongoose');

const { getConnection } = require("../helpers/databaseHelper");

const conn = getConnection();

const invoiceSchema = new mongoose.Schema({
    invoiceId: {
        type: String,
        required: true
    },
    invoiceRequest: { 
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
    amountInvoiced: {
        type: Number,
        required: true
    },
    amountReceived: { 
        type: Number,
        default: 0,
    }
},
{
    timestamps: true
});

module.exports = conn.model('Invoice', invoiceSchema);