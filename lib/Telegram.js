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


            request({
                method: "POST",
                json: true,
                headers: {
                    "content-type": "application/json",
                },
                body: telegram_message,
                uri: 'https://api.telegram.org/bot' + configuration.access_token + '/sendMessage'
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
                })
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
            console.log('=========REQUEST BODY\n', req.body);
            var telegram_message = req.body;
            if (telegram_message.message) {

              console.log('FOUND MESSAGE IN REQ BODY');
                var message = {
                    text: telegram_message.message.text,
                    user: telegram_message.message.from.id,
                    channel: telegram_message.message.from.id,
                    timestamp: telegram_message.message.date,
                    // seq: telegram_message.message.seq,
                    // mid: telegram_message.message.mid,
                };

                telegram_botkit.receiveMessage(bot, message);

            }  else if (telegram_message.callback_query) {

              var message ={
                // telegram uses a field called data not payload
                // Ive defaulted to the way facebook names it
                payload: telegram_message.callback_query.data,
                text: telegram_message.callback_query.message.text,
                user: telegram_message.callback_query.message.from.id,
                channel: telegram_message.callback_query.message.from.id,
                timestamp: telegram_message.callback_query.message.date
              };

              telegram_botkit.trigger('telegram_postback', [bot, message]);

              var message = {
                text: telegram_message.callback_query.data,
                user: telegram_message.callback_query.message.from.id,
                channel: telegram_message.callback_query.message.from.id,
                timestamp: telegram_message.callback_query.message.date
              };
              telegram_botkit.receiveMessage(bot, message);
            } else {
                telegram_botkit.log('Got an unexpected message from Telegram: ', telegram_message);
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
        telegram_botkit.webserver.use(bodyParser.urlencoded({
            extended: true
        }));
        telegram_botkit.webserver.use(express.static(__dirname + '/public'));

        var server = telegram_botkit.webserver.listen(
            telegram_botkit.config.port,
            function() {
                telegram_botkit.log('** Starting webserver on port ' +
                    telegram_botkit.config.port);
                if (cb) {
                    cb(null, telegram_botkit.webserver);
                }
            });


        request.post('https://api.telegram.org/bot' + configuration.access_token + '/' + 'setWebhook', {
                form: {
                    url: configuration.webhook_url
                }
            },
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
