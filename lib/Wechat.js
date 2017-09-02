var Botkit = require(__dirname + '/CoreBot.js'); var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser)
var crypto = require('crypto');

function Wechatbot(configuration) {

    var api_host = configuration.api_host || 'graph.facebook.com';

    // Create a core botkit bot
    var wechat_botkit = Botkit(configuration || {});

    if (wechat_botkit.config.require_delivery) {

        wechat_botkit.on('message_delivered', function(bot, message) {

            // get list of mids in this message
            for (var m = 0; m < message.delivery.mids.length; m++) {
                var mid = message.delivery.mids[m];

                // loop through all active conversations this bot is having
                // and mark messages in conversations as delivered = true
                bot.findConversation(message, function(convo) {
                    if (convo) {
                        for (var s = 0; s < convo.sent.length; s++) {
                            if (convo.sent[s].sent_timestamp <= message.delivery.watermark ||
                                (convo.sent[s].api_response && convo.sent[s].api_response.mid == mid)) {
                                convo.sent[s].delivered = true;
                            }
                        }
                    }
                });
            }

        });

    }

    // customize the bot definition, which will be used when new connections
    // spawn!
    wechat_botkit.defineBot(function(botkit, config) {

        var bot = {
            type: 'wechat',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.createConversation = function(message, cb) {
            botkit.createConversation(this, message, cb);
        };


        bot.send = function(message, cb) {

            var wechat_message = {
                touser: message.channel,
                msgtype: 'text',
                text: {
                    content: message.text
                } 
            };

            request({
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: wechat_message,
                uri: 'https://api.wechat.com/cgi-bin/message/custom/send?access_token=' + configuration.access_token
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

        bot.startTyping = function(src, cb) {
            var msg = {};
            msg.channel = src.channel;
            msg.sender_action = 'typing_on';
            bot.say(msg, cb);
        };

        bot.stopTyping = function(src, cb) {
            var msg = {};
            msg.channel = src.channel;
            msg.sender_action = 'typing_off';
            bot.say(msg, cb);
        };

        bot.replyWithTyping = function(src, resp, cb) {
            var textLength;

            if (typeof(resp) == 'string') {
                textLength = resp.length;
            } else if (resp.text) {
                textLength = resp.text.length;
            } else {
                textLength = 80; //default attachement text length
            }

            var avgWPM = 85;
            var avgCPM = avgWPM * 7;

            var typingLength = Math.min(Math.floor(textLength / (avgCPM / 60)) * 1000, 5000);

            bot.startTyping(src, function(err) {
                if (err) console.log(err);
                setTimeout(function() {
                    bot.reply(src, resp, cb);
                }, typingLength);
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
    wechat_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        wechat_botkit.log(
            '** Serving webhook endpoints for Wechat at: ' +
            'http://' + wechat_botkit.config.hostname + ':' + wechat_botkit.config.port + '/wechat/receive');
        webserver.post('/wechat/receive', function(req, res) {
            console.log('====MSG RECEIVED\n', req.body)
            res.send('');
            wechat_botkit.handleWebhookPayload(req, res, bot);
        });

        webserver.get('/wechat/receive', function(req, res) {
            // TD check sha sig of request sent from wechat
            res.status(200).send(req.query.echostr)

        
        });

        if (cb) {
            cb();
        }

        return wechat_botkit;
    };

    wechat_botkit.handleWebhookPayload = function(req, res, bot) {

        if (req.body.xml) {
            const obj = req.body.xml

            if (obj.msgtype === 'text') {
                console.log('===GOT A MESSAGE!')
                var message = {
                    text: obj.content,
                    user: obj.fromusername,
                    channel: obj.fromusername,
                    timestamp: obj.createtime,
                    msgid: obj.msgid,
                }
            console.log('===RECEIVING MESSAGE', message)
                wechat_botkit.receiveMessage(bot, message)
            }
        } 
    };

    wechat_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }

        var static_dir =  process.cwd() + '/public';

        if (wechat_botkit.config && wechat_botkit.config.webserver && wechat_botkiwechat_botkit.config.webserver.static_dir)
            static_dir = wechat_botkit.config.webserver.static_dir;

        wechat_botkit.config.port = port;

        wechat_botkit.webserver = express();

        // Validate that requests come from facebook, and abort on validation errors
        // if (wechat_botkit.config.validate_requests === true) {
        //     // Load verify middleware just for post route on our receive webhook, and catch any errors it might throw to prevent the request from being parsed further.
        //     wechat_botkit.webserver.post('/facebook/receive', bodyParser.json({verify: verifyRequest}));
        //     wechat_botkit.webserver.use(abortOnValidationError);
        // }

        wechat_botkit.webserver.use(bodyParser.json());
        wechat_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        wechat_botkit.webserver.use(express.static(static_dir));
        wechat_botkit.webserver.use(bodyParser.xml({xmlParseOptions: { explicitArray: false }}))
        
        var server = wechat_botkit.webserver.listen(
            wechat_botkit.config.port,
            wechat_botkit.config.hostname,
            function() {
                wechat_botkit.log('** Starting webserver on port ' +
                    wechat_botkit.config.port);
                if (cb) { cb(null, wechat_botkit.webserver); }
            });

        return wechat_botkit;

    };


    wechat_botkit.api = {
    };

    // Verifies the SHA1 signature of the raw request payload before bodyParser parses it
    // Will abort parsing if signature is invalid, and pass a generic error to response
    function verifyRequest(req, res, buf, encoding) {
        var expected = req.headers['x-hub-signature'];
        var calculated = getSignature(buf);
        if (expected !== calculated) {
            throw new Error('Invalid signature on incoming request');
        } else {
            // wechat_botkit.debug('** X-Hub Verification successful!')
        }
    }

    function getSignature(buf) {
        var hmac = crypto.createHmac('sha1', wechat_botkit.config.app_secret);
        hmac.update(buf, 'utf-8');
        return 'sha1=' + hmac.digest('hex');
    }

    function abortOnValidationError(err, req, res, next) {
        if (err) {
            wechat_botkit.log('** Invalid X-HUB signature on incoming request!');
            wechat_botkit.debug('** X-HUB Validation Error:', err);
            res.status(400).send({
                error: 'Invalid signature.'
            });
        } else {
            next();
        }
    }

    return wechat_botkit;
};

module.exports = Wechatbot;
