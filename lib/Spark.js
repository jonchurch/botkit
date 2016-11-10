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
                roomId: message.channel,
                // toPersonId: message.user,
                text: message.text
                // markdown: message.markdown
                };
                console.log('==================OUTGOING MESSAGE:\n', spark_message)

            request.post({
                json: true,
                headers: {
                    'Authorization': 'Bearer ' + spark_botkit.config.token,
                    'content-type': 'application/json',
                },
                body: spark_message,
                uri: 'https://api.ciscospark.com/hydra/api/v1/messages'
            },
                function(err, res, body) {
                    console.log('response status', res.statusCode)
                    if (err) {
                        botkit.debug('WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }

                    if (body.errors) {
                        botkit.debug('API ERROR', body.errors);
                        return cb && cb(body.message);
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
            msg.user = src.user;

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
            spark_botkit.debug('GOT A MESSAGE HOOK\n', req.body.data);
            var re = /[a-zA-Z0-9\.]*@(sparkbot.io)/g

            if (req.body.resource === 'messages' && !req.body.data.personEmail.match(re)) {
                console.log('\n\n💌💌💌💌💌💌💌🐙🍕 Message!')
                console.log(req.body.data.personEmail.match(re))

                // Request message text from Spark API using message id
                request.get({
                    uri: 'https://api.ciscospark.com/hydra/api/v1/messages/' + req.body.data.id,
                    headers: {
                        'Authorization': 'Bearer ' + spark_botkit.config.token
                    },
                }, function(err, res, body) {
                    var spark_message = JSON.parse(body);
                    // console.log('💌 Text: ', spark_message.text)
                    // console.log(spark_message)
                    var message = {
                        text: spark_message.text,
                        markdown: spark_message.markdown,
                        user: spark_message.personId,
                        channel: spark_message.roomId,
                        timestamp: spark_message.created,
                    };
                    console.log('=========RECEIVED MESSAGE:\n', message)

                    if (spark_message.mentionedPeople) {
                        message.mentionedPeople = spark_message.mentionedPeople
                    }
                    if (spark_message.files) {
                        message.files = spark_message.files
                    }

                    spark_botkit.receiveMessage(bot, message)
            })
}
            if (req.body.resource === 'memberships') {
                console.log('✨Membership event!✨')
            }

            if (req.body.resource === 'rooms') {
                console.log('🚪Room event!🚪')
            }
            res.end();

        });

        webserver.get('/spark/receive', function(req, res) {
            // console.log(req.query);
            // if (req.query['hub.mode'] == 'subscribe') {
            //     if (req.query['hub.verify_token'] == configuration.verify_token) {
            //         res.send(req.query['hub.challenge']);
            //     } else {
                    res.send('OK');
            //     }
            // }
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


            request.get({
                uri: 'https://api.ciscospark.com/v1/people/me',
                headers: {
                    'Authorization': 'Bearer ' + spark_botkit.config.token
                }
            },
            function(err, res, body) {
                console.log('=========BOT IDENTITY!!\n', body)
            })

        // request.post({
        //     uri: 'https://api.ciscospark.com/v1/webhooks',
        //     auth: {
        //         'bearer': spark_botkit.config.token
        //     },
        //     qs: {
        //         'name': 'Botkit Spark Connector',
        //         'target': spark_botkit.config.webhook_url,
        //         'resource': 'all',
        //         'event': 'all',
        //         'secret': spark_botkit.config.secret
        //     }
        // },
        //     function(err, res, body) {
        //         if (err) {
        //             spark_botkit.log('Could not subscribe to spark messages');
        //         } else {
        //             spark_botkit.debug('Successfully subscribed to Spark events:', body);
        //             spark_botkit.startTicking();
        //         }
        //     });

        return spark_botkit;

    };

    return spark_botkit;
};

module.exports = Sparkbot;
