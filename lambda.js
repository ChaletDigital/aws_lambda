"use strict";
const parseString = require('xml2js').parseString;
const http = require('http');
const base_url = 'http://geninhofloripa.ddns.net:82';
const Alexa = require("alexa-sdk");

const replies = {
    launch1: "switchboard listening!",
    launch2: "Hello, this is the switchboard. This is deployed on a aws lambda function. All systems are go!",
    whoIs : "Hey Marcelo, that is easy! Eugenio is the most special man on earth! You guys make a wonderful couple together",
    worklightsOn : "this one?",
    worklightsOff: "ok",
    deskOn : "desklights are on",
    deskOff: "desklights are off",
    bathLightsOff : "is that it?",
    bathLightsOn: "done",
    gateStateClose: "the sensor shows gate is closed",
    gateStateOpen: "the sensor shows gate is open",
    gateOpening: "gate should be opening now",
    gateClosing: "gate should be closing now",
    gateAlreadyClosed: "sorry gate seems to be already closed",
    gateAlreadyOpen: "sorry gate seems to be already open",
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
    const url = base_url + '/PIN' + pinNum + '=' + action;
    return function () {
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

    "CeilingLightsOnIntent" : callArduino.call(this, pins["WORKLIGHTS"], "ON",  replies.worklightsOn ),
    "CeilingLightsOffIntent": callArduino.call(this, pins["WORKLIGHTS"], "OFF", replies.worklightsOff ),

    "DeskLightsOnIntent" : callArduino.call(this, pins["DESK"], "ON",  replies.deskOn),
    "DeskLightsOffIntent": callArduino.call(this, pins["DESK"], "OFF", replies.deskOff ),

    "bathroomLightsOnIntent"  : callArduino.call(this, pins["LAVANDERIA"], "ON",  replies.bathLightsOn),
    "bathroomLightsOffIntent" : callArduino.call(this, pins["LAVANDERIA"], "OFF", replies.bathLightsOff),

    "gateOpenIntent": function () {
        isGateClosed(isClosed => {
            if (isClosed) {
                callArduino.call(this, pins["PORTAO"], "ON", replies.gateOpening).call(this);
            } else {
                this.response.speak(replies.gateAlreadyOpen);
                this.emit(':responseReady');
           }
        });
    },

    "gateCloseIntent": function () {
        isGateClosed(isClosed => {
            if (isClosed) {
                this.response.speak(replies.gateAlreadyClosed);
                this.emit(':responseReady');
            } else {
                callArduino.call(this, pins["PORTAO"], "ON", replies.gateOpening).call(this);
            }
        });
    },

    "gateStateIntent": function () {
        isGateClosed(isClosed => {
               this.response.speak(isClosed ? replies.gateStateClose : replies.gateStateOpen);
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

// registra handlers e executa Lambda.
exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
