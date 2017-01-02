var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

var ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;

function GoogleHomeBot(configuration) {

    // Create a core botkit bot
    var google_botkit = Botkit(configuration || {});

    google_botkit.defineBot(function(botkit, config) {

        var bot = {
            type: 'fb',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {

        };

        return bot
    });

    google_botkit.actionsMap = new Map();

    google_botkit.on = function(event, cb) {
            this.actionsMap.set(event, cb);
    }

    google_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        google_botkit.log(
            '** Serving webhook endpoints for Google Actions Platform at: ' +
            'http://' + google_botkit.config.hostname + ':' + google_botkit.config.port + '/google/receive');
        webserver.post('/google/receive', function(req, res) {
            console.log('=========== GOT A REQUEST!!')
            google_botkit.handleWebhookPayload(req, res, bot);
        });
        webserver.get('/', function(req, res) {
            res.send('OK')
        })

        if (cb) {
            cb();
        }
        return google_botkit;
    };
    google_botkit.handleWebhookPayload = function(req, res, bot) {
        var assistant = new ActionsSdkAssistant({request: req, response: res});

        // var map = new Map();

        assistant.handleRequest(google_botkit.actionsMap)
    }

    google_botkit.setupWebserver = function(port, cb) {
        if (!port) {
            throw new Error('Cannot start webserver without a port')
        }

    var static_dir =  process.cwd() + '/public';

    google_botkit.config.port = port;

    google_botkit.webserver = express();
    google_botkit.webserver.use(bodyParser.json());
    google_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
    google_botkit.webserver.use(express.static(static_dir));

    var server = google_botkit.webserver.listen(
        google_botkit.config.port,
        google_botkit.config.hostname,
        function() {
            google_botkit.log('** Starting webserver on port ' + google_botkit.config.port);
            if (cb) { cb(null, google_botkit.webserver); }
        }
    );
    return google_botkit;

    }

    return google_botkit;
}

module.exports = GoogleHomeBot;
