"use strict";
const parseString = require('xml2js').parseString;
const http = require('http');
const base_url = 'http://geninhofloripa.ddns.net:82';
const Alexa = require("alexa-sdk");

const replies = {
    "LAUNCH1":"switchboard listening!",
    "LAUNCH2":"Hello, this is the switchboard. This is deployed on a aws lambda function. All systems are go!",
    "WHOIS" :"Hey Marcelo, that is easy! Eugenio is the most special man on earth! You guys make a wonderful couple together",
    "WLON" :"this one?",
    "WLOFF":"ok",
    "DLON" :"got it this time?",
    "DLOFF":"ok",
    "BLON" :"is that it?",
    "BLOFF":"done",
    "GT_CL": "the sensor shows gate is closed",
    "GT_OP": "the sensor shows gate is open",
    "GT_OP_ING": "gate should be opening now",
    "GT_CL_ING": "gate should be closing now",
    "GT_AL_CL": "sorry gate seems to be already closed",
    "GT_AL_OP": "sorry gate seems to be already open",

};

const pins = {
    "WORKLIGHTS"    :62,
    "PORTCH"        :26,
    "VERDE FUNDOS"  :30,
    "FRED LOW"      :32,
    "FIGUEIRA"      :34,
    "DECK MAIN"     :36,
    "HIDROMASSAGEM" :29,
    "RAMPA"         :33,
    "DECK HI"       :37,
    "LUZ HIDRO"     :38,
    "FILL"          :40,
    "HOLLY+DECK"    :42,
    "SHELVES"       :46,
    "DESK"          :48,
    "LAVANDERIA"    :66,
    "PORTAO"        :24,
};

// registra handlers e executa Lambda.
exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

function callArduino(pinNum, action, reply) {
    var url = `${base_url}/PIN${pinNum} = ${action}`;
    //url = base_url + '/PIN' + pinNum + '=' + action;
    console.log(url);
    return function () {
        console.log('getting');
        http.get(url, (error, response, body) => {
            this.response.speak(reply);
            this.emit(':responseReady');
        });
    };
}

function isGateClosed(callback) {
    http.get(base_url, (res) => {
        res.setEncoding('utf8');
        let xml = '';
        res.on('data', (chunk) => { xml += chunk; });
        res.on('end', () => {
            parseString(xml, function (err, result) {
                const error = err;
                const gateState = result.estadoDomotica.Pin.filter(pin => pin.digitalPin[0] === '14')[0].Estado[0].namePin[0];
                callback(gateState == 'portão fechado');
            });
        });
    });
}


var handlers = {
    // <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  //
    "WhoIsTheOne": function () {
        this.response.speak(replies["WHOIS"] );
        this.emit(':responseReady');
    },    //  :-)    :-)    :-)    :-)    :-)    :-)    :-)    :-)    :-)   //

    "LaunchRequest": function () {
        this.response.speak(replies["LAUNCH1"]);
        this.emit(':responseReady');
    },

    "CeilingLightsOnIntent" : callArduino.call(this, pins["WORKLIGHTS"], "ON",  replies["WLON"] ),
    "CeilingLightsOffIntent": callArduino.call(this, pins["WORKLIGHTS"], "OFF", replies["WLOFF"] ),

    "DeskLightsOnIntent" : callArduino.call(this, pins["DESK"], "ON",  replies["DLON"] ),
    "DeskLightsOffIntent": callArduino.call(this, pins["DESK"], "OFF", replies["DLOFF"] ),

    "bathroomLightsOnIntent"  : callArduino.call(this, pins["LAVANDERIA"], "ON",  replies["BLON"]),
    "bathroomLightsOffIntent" : callArduino.call(this, pins["LAVANDERIA"], "OFF", replies["BLOFF"]),

    // QUER ABRIR
    "gateOpenIntent": function () {
        isGateClosed(isClosed => {
            // esta fechado
            if (isClosed) {
                callArduino.call(this, pins["PORTAO"], "ON", replies["GT_OP_ING"]).call(this);
            } else {
            // estava aberto
                this.response.speak(replies["GT_AL_OP"]);
                this.emit(':responseReady');
           }
        });
    },

    //QUER FECHAR
    "gateCloseIntent": function () {
        isGateClosed(isClosed => {
            // mas ja esta fechado
            if (isClosed) {
                this.response.speak(replies["GT_AL_CL"]);
                this.emit(':responseReady');
            } else {
                // manda abrir
                callArduino.call(this, pins["PORTAO"], "ON", replies["GT_OP_ING"]).call(this);
            }
        });
    },

    // CHECAR ESTADO
    "gateStateIntent": function () {
        isGateClosed(isClosed => {
               this.response.speak(isClosed ? replies["GT_CL"] : replies["GT_OP"]);
               this.emit(':responseReady');
        });
    },

    /* TODO: Create intent for items below:
    gardenLightsOnIntent
    gardenLightsOffIntent

    bathroomLightsOnIntent
    bathroomLightsOnIntent

    shelvesLightOnIntent
    shelvesLightOffIntent

    jacuzziFillIntentOn
    jacuzziFillIntentOff

    jacuzziMassageOnIntent
    jacuzziMassageOffIntent

    jacuzziLightsOnIntent
    jacuzziLightsOffIntent
    */

};
