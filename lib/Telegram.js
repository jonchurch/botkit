var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Telegrambot(configuration) {

    // Create a core botkit bot
    var telegram_botkit = Botkit(configuration || {});

    // customize the bot definition, which will be used when new connections
    // spawn!
    telegram_botkit.defineBot(function(botkit, config) {

        var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {

            var telegram_message = {
                chat_id: {},
                text: {}
            };

            telegram_message.chat_id = message.channel;

            if (message.text) {
                telegram_message.text = message.text;
            }

            if (message.parse_mode) {
                telegram_message.parse_mode = message.parse_mode;
            }

            if (message.disable_web_preview) {
              telegram_message.disable_web_preview = message.disable_web_preview;
            }

            if (message.disable_notification) {
              telegram_message.disable_notification = message.disable_notification;
            }

            if (message.reply_message_id) {
              telegram_message.reply_message_id = message.reply_message_id;
            }

            if (message.reply_markup) {
              telegram_message.reply_markup = message.reply_markup;
            }

            request.post('https://api.telegram.org/bot' + configuration.access_token + '/' + 'sendMessage',
                function(err, res, body) {
                    if (err) {
                        botkit.debug('WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }

                    try {

                        var json = JSON.parse(body);

                    } catch (err) {

                        botkit.debug('JSON Parse error: ', err);
                        return cb && cb(err);

                    }

                    if (json.error) {
                        botkit.debug('API ERROR', json.error);
                        return cb && cb(json.error.message);
                    }

                    botkit.debug('WEBHOOK SUCCESS', body);
                    cb && cb(null, body);
                }).form(telegram_message);
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
    telegram_botkit.createWebhookEndpoints = function(webserver, bot) {

        telegram_botkit.log(
            '** Serving webhook endpoints for Slash commands and outgoing ' +
            'webhooks at: http://MY_HOST:' + telegram_botkit.config.port + '/telegram/receive');
        webserver.post('/telegram/receive', function(req, res) {

            telegram_botkit.debug('GOT A MESSAGE HOOK');
            console.log('=========REQUEST BODY',req.body);
            var telegram_message = req.body.message;
            if (telegram_message.message_id) {



                            var message = {
                                text: telegram_message.text,
                                user: telegram_message.from.id,
                                channel: telegram_message.from.id,
                                timestamp: telegram_message.date,
                                // seq: telegram_message.message.seq,
                                // mid: telegram_message.message.mid,
                            };


                            console.log('==========COMPOSED MESSAGE OBJECT',message);
                            telegram_botkit.receiveMessage(bot, message);

                         }
                         // else if (telegram_message.edited_message) {
                        //
                        //     var message = {
                        //         payload: facebook_message.postback.payload,
                        //         user: facebook_message.sender.id,
                        //         channel: facebook_message.sender.id,
                        //         timestamp: facebook_message.timestamp,
                        //     };
                        //
                        //     facebook_botkit.trigger('facebook_postback', [bot, message]);
                        // } else if (facebook_message.optin) {
                        //
                        //     var message = {
                        //         optin: facebook_message.optin,
                        //         user: facebook_message.sender.id,
                        //         channel: facebook_message.sender.id,
                        //         timestamp: facebook_message.timestamp,
                        //     };
                        //
                        //     facebook_botkit.trigger('facebook_optin', [bot, message]);
                        // } else if (facebook_message.delivery) {
                        //
                        //     var message = {
                        //         optin: facebook_message.delivery,
                        //         user: facebook_message.sender.id,
                        //         channel: facebook_message.sender.id,
                        //         timestamp: facebook_message.timestamp,
                        //     };
                        //
                        //     facebook_botkit.trigger('message_delivered', [bot, message]);
                        //
                        // }
                            else {
                            botkit.log('Got an unexpected message from Telegram: ', telegram_message);
                        }



            res.send('ok');
        });

        // webserver.get('/telegram/receive', function(req, res) {
        //     console.log(req.query);
        //     if (req.query['hub.mode'] == 'subscribe') {
        //         if (req.query['hub.verify_token'] == configuration.verify_token) {
        //             res.send(req.query['hub.challenge']);
        //         } else {
        //             res.send('OK');
        //         }
        //     }
        // });

        return telegram_botkit;
    };

    telegram_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        telegram_botkit.config.port = port;

        telegram_botkit.webserver = express();
        telegram_botkit.webserver.use(bodyParser.json());
        telegram_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        telegram_botkit.webserver.use(express.static(__dirname + '/public'));

        var server = telegram_botkit.webserver.listen(
            telegram_botkit.config.port,
            function() {
                telegram_botkit.log('** Starting webserver on port ' +
                    telegram_botkit.config.port);
                if (cb) { cb(null, telegram_botkit.webserver); }
            });


        request.post('https://api.telegram.org/bot' + configuration.access_token + '/' + 'setWebhook', {form: {url: configuration.webhook_url }},
            function(err, res, body) {
                if (err) {
                    telegram_botkit.log('Could not set webhook with Telegram');
                } else {
                    telegram_botkit.debug('Successfully setup Telegram webhook', body);
                    telegram_botkit.startTicking();
                }
            });

        return telegram_botkit;

    };

    return telegram_botkit;
};

module.exports = Telegrambot;
