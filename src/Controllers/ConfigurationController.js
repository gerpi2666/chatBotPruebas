module.exports={
    GetConfiguration
}

const axios = require('axios');

async function GetConfiguration(){
    return new Promise(function(resolve, reject){
        let URL = 'https://ciclonweb.azurewebsites.net/api/ciclon/GetConfigurationClient?ClientID=999' //https://localhost:44370
        
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        axios.get(URL).then(resp=>{
            resolve(resp.data);
        }).catch(err=>{
            reject(err);
        })
    })
}