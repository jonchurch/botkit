var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Sparkbot(configuration) {

    // Create a core botkit bot
    var spark_botkit = Botkit(configuration || {});

    // customize the bot definition, which will be used when new connections
    // spawn!
    spark_botkit.defineBot(function(botkit, config) {

        var bot = {
            type: 'spark',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };



        bot.send = function(message, cb) {

            var spark_message = {
                };

            request({
                method: 'POST',
                json: true,
                headers: {
                    'Authorizaton': 'Bearer ' + configuartion.access_token,
                    'content-type': 'application/json',
                },
                body: spark_message,
                uri: 'https://api.ciscospark.com/hydra/api/v1/messages'
            },
                function(err, res, body) {


                    if (err) {
                        botkit.debug('WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }

                    if (body.error) {
                        botkit.debug('API ERROR', body.error);
                        return cb && cb(body.error.message);
                    }

                    botkit.debug('WEBHOOK SUCCESS', body);
                    cb && cb(null, body);
                });
        };


        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;

            bot.say(msg, cb);
        };

        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }

            cb();
        };

        return bot;

    });


    // set up a web route for receiving outgoing webhooks and/or slash commands

    spark_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        spark_botkit.log(
            '** Serving webhook endpoints for Cisco Spark platform at: ' +
            'http://MY_HOST:' + spark_botkit.config.port + '/spark/receive');
        webserver.post('/spark/receive', function(req, res) {
            spark_botkit.debug('GOT A MESSAGE HOOK\n', req.body);

            res.send('ok');
        });

        webserver.get('/spark/receive', function(req, res) {
            console.log(req.query);
            if (req.query['hub.mode'] == 'subscribe') {
                if (req.query['hub.verify_token'] == configuration.verify_token) {
                    res.send(req.query['hub.challenge']);
                } else {
                    res.send('OK');
                }
            }
        });

        if (cb) {
            cb();
        }

        return spark_botkit;
    };

    spark_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        var static_dir =  __dirname + '/public';

        if (spark_botkit.config && spark_botkit.config.webserver && spark_botkit.config.webserver.static_dir)
            static_dir = spark_botkit.config.webserver.static_dir;

        spark_botkit.config.port = port;

        spark_botkit.webserver = express();
        spark_botkit.webserver.use(bodyParser.json());
        spark_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        spark_botkit.webserver.use(express.static(static_dir));

        var server = spark_botkit.webserver.listen(
            spark_botkit.config.port,
            function() {
                spark_botkit.log('** Starting webserver on port ' +
                    spark_botkit.config.port);
                if (cb) { cb(null, spark_botkit.webserver); }
            });


        // request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + configuration.access_token,
        //     function(err, res, body) {
        //         if (err) {
        //             facebook_botkit.log('Could not subscribe to page messages');
        //         } else {
        //             facebook_botkit.debug('Successfully subscribed to Facebook events:', body);
        //             facebook_botkit.startTicking();
        //         }
        //     });

        return spark_botkit;

    };

    return spark_botkit;
};

module.exports = Sparkbot;
