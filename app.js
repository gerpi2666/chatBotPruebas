const express = require('express')
const bodyParser= require('body-parser')
const {createBot, createProvider, createFlow, addKeyword, EVENTS} = require('@bot-whatsapp/bot')

const MetaProvider = require('@bot-whatsapp/provider/meta')
const MockAdapter = require('@bot-whatsapp/database/mock')

const Configuration = require('./src/Controllers/ConfigurationController')
const Request = require('./src/Controllers/RequestController')

const solicitud = {
    Accept:"",
    Identification:"",
    IdentificationType:1,
    RequesterEmail:"",
    RequesterCellPhone:"",
    CreditType:2,
    Amount:0,
    Periods: 24,
    NominalRate:25.00,
    UserEmail:"chatbot@sinertica.net",
    CustomerID:999, //Valor configurable por cliente
    Currency:1,
    TransactionID:1234
}

/**
 * Aqui declaramos los flujos hijos, los flujos se declaran de atras para adelante, es decir que si tienes un flujo de este tipo:
 *
 *          Menu Principal
 *           - SubMenu 1
 *             - Submenu 1.1
 *           - Submenu 2
 *             - Submenu 2.1
 *
 * Primero declaras los submenus 1.1 y 2.1, luego el 1 y 2 y al final el principal.
 */
const flowCancelar = addKeyword('cancelar').addAnswer('Solicitud Cancelada.',null,(ctx,{endFlow})=> {
    endFlow();
});

const flowRequest = addKeyword('request')
.addAnswer('Confirmación de Datos. \n*1* Aceptar \n*2* Rechazar',
{capture:true},
async (ctx, {gotoFlow})=>{
    if(ctx.body == "2"){
       return gotoFlow(flowCancelar);
    }
}).addAction(async (ctx, {flowDynamic})=>{
    Request.CreateRequest(solicitud).then(async resp=>{
        var data = resp.Data;
        console.log(data);
        await flowDynamic(`Para completar la solicitud es necesario que termine de proporcionar la información requerida. \n🤳 Fotografía tipo selfie. \n📷 Fotografía de la identificación por ambos lados. \n🖋️ Firma de Autorización. \n\nIngrese al siguiente enlace para completar los datos. \n${data.Link}`)
    })
});

const flowDatos = addKeyword(['si'])
.addAnswer(
    [
        'Digite su numero de identificación.',
        '\n\n*Cancerlar* para cancelar el proceso.'
    ],
    {capture:true},
    async (ctx, {fallBack,gotoFlow}) => {
        if(ctx.body == "Cancelar"){
            gotoFlow(flowCancelar);
        }else{
            solicitud.identification = ctx.body;

            if(solicitud.identification.length === 9){
                solicitud.identificationType = 1
            }else{
                if(solicitud.identification.length === 12){
                    solicitud.identificationType = 2
                }else{
                    fallBack('Error de identificación, vuelva a digitar el valor.');
                }
            }
        }
    })
    .addAnswer(
    [
        'Digite el monto solicitado.',
        '\n\n*Cancerlar* para cancelar el proceso.'
    ],
    {capture:true},
    async (ctx,{fallBack}) => {
        solicitud.Amount = ctx.body;
        if(isNaN(solicitud.Amount))
            fallBack();
    })
    .addAnswer(
    [
        'Digite el correo electrónico.',
        '\n\n*Cancerlar* para cancelar el proceso.'
    ],
    {capture:true},
    async (ctx,{flowDynamic,fallBack,gotoFlow}) => {
        solicitud.RequesterEmail = ctx.body;
        if(!solicitud.RequesterEmail.includes('@')){
            fallBack();
        }else{
            var tipoIdentificacion = solicitud.identificationType == 1? "Cédula":"DIMEX";
            await flowDynamic(`Datos Guardados! \nLa información proporcionada es: \nIdentificación: *${solicitud.identification}* \nTipo de Identificación: *${tipoIdentificacion}* \nCorreo Electrónico: *${solicitud.RequesterEmail}* \nTeléfono: *${solicitud.RequesterCellPhone}*`)
            console.log(solicitud);
            return gotoFlow(flowRequest);
        }
    });

const flowSolicitud = addKeyword(['solicitud'],{sensitive:true})
.addAnswer(
    [
        '📄 Para realizar una solicitud necesitamos el numero de identificación, tipo de identificación y correo electrónico.',
        '¿Estas dispuesto a brindar dicha información?',
        '\n*1* aceptar ',
        '*2* rechazar',
        '\n*3* para cancelar el proceso'
    ],
    {capture: true},
    async (ctx,{gotoFlow})=>{
        if(ctx.body === "1"){
            solicitud.Accept = ctx.body;
            solicitud.RequesterCellPhone = ctx.from.replace('506','');
            await gotoFlow(flowDatos)
        }
        if(ctx.body === "2" || ctx.body === "3" ){
            solicitud.Accept = ctx.body;
            await gotoFlow(flowCancelar)
        } 
    }
);

const flowRetomar = addKeyword('retomar',{sensitive:true}).addAnswer('Proceso de retomar una solicitud.');

const flowPrincipal = addKeyword(['hola', 'solicitud','menu','buenas','tardes','credito'])
    .addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAnswer('Selecciona la opción que desees realizar:',
        {capture:true, buttons: [{id:"1" ,body: 'Crear solicitud de crédito.' }, { id:"2", body: 'Retomar una solicitud.' }, { id:"3", body: 'Cancelar el proceso.' }]},
        async (ctx, {gotoFlow,flowDynamic}) => {
            await flowDynamic(`ID del boton seleccionado ${ctx.id}`)
            if(ctx.body == "Crear solicitud de crédito.") 
                await gotoFlow(flowSolicitud)
            if(ctx.body == "Retomar una solicitud.") 
                await gotoFlow(flowRetomar)
            if(ctx.body == "Cancelar el proceso.") 
                await gotoFlow(flowCancelar)
        }
    );


const app = express();

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal,flowRetomar,flowSolicitud,flowDatos,flowRequest,flowCancelar])

    const adapterProvider = createProvider(MetaProvider, {
        jwtToken: 'EAAISNFGjQmkBAFv3w8h9IUeZA7PHTiyhsenjw5oOdJnNhaK9GCS4E2xwes291UEDYhNVfSbZCL3rn6Rzqik2ffOzJsUkoExH112W0yq4ZAH1DIZC0KUbZA9jDXn4sjHfoF9ksYKetr6pRo5btoCa17RnyJ8xFnNy771U24WObKqUPMzntk1WRiNI1CHv3r3sOtSJPNqJicQZDZD',
        numberId: '105738085922018', //EAAISNFGjQmkBAFv3w8h9IUeZA7PHTiyhsenjw5oOdJnNhaK9GCS4E2xwes291UEDYhNVfSbZCL3rn6Rzqik2ffOzJsUkoExH112W0yq4ZAH1DIZC0KUbZA9jDXn4sjHfoF9ksYKetr6pRo5btoCa17RnyJ8xFnNy771U24WObKqUPMzntk1WRiNI1CHv3r3sOtSJPNqJicQZDZD
        verifyToken: 'ASD54858ASDEDRFEWF',
        version: 'v17.0',
    })


    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json())
    

    app.post("/webhook", function (request, response) {
        console.log('Incoming webhook: ' + JSON.stringify(request.body));
        response.sendStatus(200).send('POST OK');
    });
    app.get("/webhook", (req, res) => {
   
        const verify_token = 'ASD54858ASDEDRFEWF';
      
        let mode = req.query["hub.mode"];
        let token = req.query["hub.verify_token"];
        let challenge = req.query["hub.challenge"];
      
        if (mode && token) {
          if (mode === "subscribe" && token === verify_token) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
          } else {
            res.sendStatus(403);
          }
        }
        res.send('ok get')
      });
      

  

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    app.listen(4000, () => {
        console.log('SERVER ARRIBA');
    })

};

main()

