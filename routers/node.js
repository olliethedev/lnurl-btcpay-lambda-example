const express = require('express');
const { getInfo } = require('../helpers/lndRequestHelper');

let router = express.Router();
router.get('/ping', async function(req, res) {
  try{
    const response = await getInfo();
  
    console.log(response);
    res.status(200).json({status:response.identity_pubkey});
  }catch(e){
    console.trace(e);
    res.status(500).json({error:"Failed getting info"});
  }
})

module.exports = router;