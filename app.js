const express = require('express')
const bodyParser= require('body-parser')
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const MetaProvider = require('@bot-whatsapp/provider/meta')
const MockAdapter = require('@bot-whatsapp/database/mock')

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

const flowSecundario = addKeyword(['2', 'siguiente']).addAnswer(['📄 Aquí tenemos el flujo secundario'])

const flowDocs = addKeyword(['doc', 'documentacion', 'documentación']).addAnswer(
    [
        '📄 Aquí encontras las documentación recuerda que puedes mejorarla',
        'https://bot-whatsapp.netlify.app/',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowTuto = addKeyword(['tutorial', 'tuto']).addAnswer(
    [
        '🙌 Aquí encontras un ejemplo rapido',
        'https://bot-whatsapp.netlify.app/docs/example/',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowGracias = addKeyword(['gracias', 'grac']).addAnswer(
    [
        '🚀 Puedes aportar tu granito de arena a este proyecto',
        '[*opencollective*] https://opencollective.com/bot-whatsapp',
        '[*buymeacoffee*] https://www.buymeacoffee.com/leifermendez',
        '[*patreon*] https://www.patreon.com/leifermendez',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowDiscord = addKeyword(['discord']).addAnswer(
    ['🤪 Únete al discord', 'https://link.codigoencasa.com/DISCORD', '\n*2* Para siguiente paso.'],
    null,
    null,
    [flowSecundario]
)

const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
    .addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAnswer(
        [
            'te comparto los siguientes links de interes sobre el proyecto',
            '👉 *doc* para ver la documentación',
            '👉 *gracias*  para ver la lista de videos',
            '👉 *discord* unirte al discord',
        ],
        null,
        null,
        [flowDocs, flowGracias, flowTuto, flowDiscord]
    )

const app = express();

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal])

    const adapterProvider = createProvider(MetaProvider, {
        jwtToken: 'EAAISNFGjQmkBABdy1JSBjts6puNQwjYgFvy92tY6DZCZB2yQqFNtrCVeCLAGWALd51dlxgqYZAdGhOumAcTsZBnEsMQoSnCDiNQXqfFfClGfVXAv5BS9Lu6FU3ZBHXxDXDOgEduZAHgVjc1VOudht52iV9gKc8QIE7JKvdn1Nl8cRLJrzgw4GevdyXqUCRcgOgb5oXcHZA8ZB3HNNQi5qFWQsX3d6nFVZBsAZD',
        numberId: '106949302460057',
        verifyToken: 'ASD54858ASDEDRFEWF',
        version: 'v17.0',
    })



    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json())
    

    app.post("/webhook", function (request, response) {
        console.log('Incoming webhook: ' + JSON.stringify(request.body));
        response.sendStatus(200);
    });
    app.get("/webhook", function (req, res) {
        console.log(req)
        if (
          req.query["hub.mode"] == "subscribe" &&
          req.query["hub.verify_token"] == "ASD54858ASDEDRFEWF"
        ) {
          res.send(req.query["hub.challenge"]);
        } else {
          res.sendStatus(400);
        }
      });

  

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    app.listen(4000, () => {
        console.log('SERVER ARRIBA');
    })

}

main()

