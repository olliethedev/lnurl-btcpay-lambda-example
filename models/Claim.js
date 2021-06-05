const mongoose = require('mongoose');

const { getConnection } = require("../helpers/databaseHelper");

const conn = getConnection();

const claimSchema = new mongoose.Schema({
    secret: { 
        type: String,
        required: true
    },
    invoiceRequest: { 
        type: String,
    },
    paymentId: {
        type: String,
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    amountRequested: { 
        type: Number,
        default: 0,
    },
    state: {
        type: String,
        enum : [ "OPEN","SETTLED", "CANCELED" ],
        default: "OPEN",
        required: true
    },
},
{
    timestamps: true
});

module.exports = conn.model('Claim', claimSchema);