const mongoose = require('mongoose');

const { getConnection } = require("../helpers/databaseHelper");

const conn = getConnection();

const accountSchema = new mongoose.Schema({
    linkingPublicKey: { 
        type: String, 
        required: true 
    },
    balance: {
        type: Number,
        default: 0,
        required: true
    }
},
{
    timestamps: true
});

module.exports = conn.model('Account', accountSchema);