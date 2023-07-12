module.exports={
    CreateRequest
}

const axios = require('axios');

async function CreateRequest(solicitud){
    console.log('Entra en la funcion de Crear Request ' + solicitud.Identification);
    return new Promise(function(resolve, reject){
        let URL = 'https://ciclonweb.azurewebsites.net/api/request/CrearSolicitudCICOC' //https://localhost:44370
        
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        axios.post(URL,{
            Identification: solicitud.Identification,
            IdentificationType : solicitud.IdentificationType,
            RequesterEmail: solicitud.RequesterEmail,
            RequesterCellPhone: solicitud.RequesterCellPhone,
            CreditType: solicitud.CreditType,
            Amount: solicitud.Amount,
            Periods: solicitud.Periods,
            NominalRate: solicitud.NominalRate,
            UserEmail: solicitud.UserEmail,
            CustomerID: solicitud.CustomerID,
            Currency: solicitud.Currency,
            TransactionID: solicitud.TransactionID
        }).then(resp=>{
            console.log(resp.data);
            resolve(resp.data);
            console.log('Sale correctamente de Crear Request');
        }).catch(err=>{
            reject(err);
            console.log('Sale erroneamente de Crear Request');
        })
    })
}