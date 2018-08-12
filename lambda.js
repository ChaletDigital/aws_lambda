"use strict";
const parseString = require('xml2js').parseString;
const http = require('http');
const base_url = 'http://geninhofloripa.ddns.net:82';
const Alexa = require("alexa-sdk");

/*
const replies = {
    "LAUNCH1":"switchboard listening!",
    "LAUNCH2":"Hello, this is the switchboard. This is deployed on a aws lambda function. All systems are go!",
    "WHOIS" :"Hey Marcelo, that is easy! Eugenio is the most special man on earth! You guys make a wonderful couple together",
    "WLON" :"your wish is a command. ceiling lights in full bright!",
    "WLOFF":"ceiling lights off",
    "DLON" :"your wish is a command. desk is now on",
    "DLOFF":"your wish is a command. desk lights are off",
    "BLON" :"fluorescent lights are on",
    "BLOFF" :"fluorescent lights are now off"
};
*/

const replies = {
    "WHOIS" :"Hey Marcelo, that is easy! Eugenio is the most special man on earth! You guys make a wonderful couple together",
    "LAUNCH1":"switchboard listening!",
    "LAUNCH2":"Hello, this is the switchboard. This is deployed on a aws lambda function. All systems are go!",
    "WLON" :"this one?",
    "WLOFF":"ok",
    "DLON" :"got it this time?",
    "DLOFF":"ok",
    "BLON" :"is that it?",
    "BLOFF":"done",
    "GATEOP": "gate should be opening now",
    "GATECL": "gate should be closing now",
    "GATE_CLOSED": "gate seems to be closed",
    "GATE_OPEN": "gate seems to be open",
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

function callArduino(pinNum, action, reply) {
    var url = `${base_url}/PIN${pinNum}=${action}`;
    //var url = base_url + '/PIN' + pinNum + '=' + action;
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
                const gateState = result.estadoDomotica.Pin.filter(pin => pin.digitalPin[0] === '14')[0].Estado[0].namePin[0]
                callback(gateState == 'portão fechado')
            });
        });
    });
}


var handlers = {

    // <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  <3  //

    "WhoIsTheOne": function () {
        this.response.speak(replies["WHOIS"] );
        this.emit(':responseReady');
    },
    //  :-)    :-)    :-)    :-)    :-)    :-)    :-)    :-)    :-)   //


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

    "gateOpenIntent" : callArduino.call(this, pins["PORTAO"], "ON", replies["GATEOP"]),

    "gateCloseIntent": callArduino.call(this, pins["PORTAO"], "ON", replies["GATECL"]),

    "gateStateIntent": function () {
        isGateClosed(isClosed => {
               this.response.speak(isClosed ? replies["GATE_CLOSED"] : replies["GATE_OPEN"]);
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

// registra handlers e executa Lambda
exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
