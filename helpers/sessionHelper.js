const { connect } = require('../helpers/databaseHelper');

module.exports.findSession = async function(key, value){
    const connection = await connect(process.env.MONGO_DB_URL);
    let sessions = connection.collection('sessions');
    return sessions.findOne({[key]:value});
}

module.exports.findAccountForSession = async function(session, accountModel){
    const linkingPublicKey = session.lnurlAuth ? session.lnurlAuth.linkingPublicKey: false;
    if(!linkingPublicKey){
        return null;
    }
    return accountModel.findOne({ linkingPublicKey });
}

module.exports.updateSession = async function(findKey, findValue, setKey, setValue){
    const connection = await connect(process.env.MONGO_DB_URL);
    let sessions = connection.collection('sessions');
    const updateResult = await sessions.findOneAndUpdate(
        { [findKey] : findValue },
        { $set: { [setKey]: setValue } }
    );
    if(updateResult.ok === 1){
        return true;
    }
    throw new Error("No matching session", 400);
}