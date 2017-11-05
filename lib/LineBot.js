var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var crypto = require('crypto');
var bodyParser = require('body-parser');

function linebot(configuration) {

	//@TODO set Line api root
    var api_host = configuration.api_host || 'api.line.me/v2';

    // Create a core botkit bot
    var line_botkit = Botkit(configuration || {});

	//@TODO Format Middleware
    line_botkit.middleware.format.use(function(bot, message, platform_message, next) {

        platform_message.to = message.channel;
        platform_message.messages = [] 

		let _msg = {}

		if (message.text) {
			_msg.text = message.text;
			_msg.type = 'text'
		}

		if (message.attachment) {
			platform_message.message.attachment = message.attachment;
		}

		// if (message.image) {
		// 	 _msg.image = message.tag;
		// }

		if (message.sticker_id) {
			platform_message.message.sticker_id = message.sticker_id;
		}

		platform_message.messages.push(_msg)

        next();

    });

    // customize the bot definition, which will be used when new connections
    // spawn!
    line_botkit.defineBot(function(botkit, config) {

        var bot = {
            type: 'line',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

		// @TODO Bot.send request
        bot.send = function(message, cb) {

			// how to send a messsage with Line?
			// Push message
            request({
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
					'Authorization': `Bearer ${process.env.access_token}`
                },
                body: message,
                uri: 'https://' + api_host + '/bot/message/push'
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


		// @TODO Bot.reply function, depends on send
        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;
            msg.to = src.user;

            bot.say(msg, cb);
        };

		// @TODO findConversation function
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

	// @TODO Ehhh, helper webhook setup bleh
    // set up a web route for receiving outgoing webhooks and/or slash commands
    line_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        line_botkit.log(
            '** Serving webhook endpoints for Messenger Platform at: ' +
            'http://' + line_botkit.config.hostname + ':' + line_botkit.config.port + '/line/receive');
        webserver.post('/line/receive', function(req, res) {
            res.send('ok');
            line_botkit.handleWebhookPayload(req, res, bot);
        });

        webserver.get('/line/receive', function(req, res) {
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

        return line_botkit;
    };

    line_botkit.handleWebhookPayload = function(req, res, bot) {

        var payload = req.body;
		
        // line may send more than 1 message payload at a time
        // we split these up into multiple message objects for ingestion
        if (payload.events) {
            for (var e = 0; e < payload.events.length; e++) {
				line_botkit.ingest(bot, payload.events[e], res)
            }
        }

    };

	// @TODO Normalize middleware - Test room/group
    // universal normalizing steps
    // handle normal messages from users (text, stickers, files, etc count!)
    line_botkit.middleware.normalize.use(function normalizeMessage(bot, message, next) {


		// channel id
		// Group Message
		if (message.source.groupId) {
			message.channel = message.source.groupId
		} else {
			// Room Message
			if (message.source.roomId) {
				message.channel = message.source.roomId
			} else {
				// User Message
				message.channel = message.source.userId
			}
		}

		// UserId is not always present in rooms or groups, if user has not agreed to messaging terms
		!message.source.userId ? line_botkit.debug(`No userId available for ${message.source.type} message!`) : null

        // capture the user ID
        message.user = message.source.userId;

        next();

    });

    // handle message event from users (text, stickers, files, etc count!)
    line_botkit.middleware.normalize.use(function handleMessage(bot, message, next) {

        if (message.message) {

            // capture the message text
            message.text = message.message.text;

			message.type = 'message_received'

            // copy over some line specific features
            message.sticker = message.message.type === 'sticker' ? message.message.stickerId : null;
            message.image = message.message.type === 'image' ? message.message.image.id : null;
            message.video = message.message.hasOwnProperty('video') ? message.message.video.id : null;
            message.audio = message.message.hasOwnProperty('audio') ? message.message.audio.id : null;
            message.file = message.message.hasOwnProperty('file') ? message.message.file : null;
			message.location = message.message.hasOwnProperty('location') ? message.message.location : null;
        }

		// Line specific fields
		message.replyToken = message.hasOwnProperty('replyToken') ? message.replyToken : null;

        next();

    });

    // handle postback messages (when a user clicks a button)
    line_botkit.middleware.normalize.use(function handlePostback(bot, message, next) {

        if (message.message.type === 'postback') {

            message.text = message.message.postback.data;
            message.payload = message.message.postback.data;

            message.type = 'line_postback';
        }

        next();

    });

	//@TODO Categorize middleware
    // handle message sub-types
    line_botkit.middleware.categorize.use(function handleOptIn(bot, message, next) {


		// Lets see what happens when we don't classify anything, does it check for a type?
		//
        // if (message.raw_message.source.type === '') {
        //     message.type = 'message_echo';
        // }

        next();

    });

	// @TODO Verify webhook requests come from Line
    line_botkit.on('webserver_up', function(webserver) {

        // Validate that requests come from line, and abort on validation errors
        if (line_botkit.config.validate_requests === true) {
            // Load verify middleware just for post route on our receive webhook, and catch any errors it might throw to prevent the request from being parsed further.
            webserver.post('/line/receive', bodyParser.json({verify: verifyRequest}));
            webserver.use(abortOnValidationError);
        }

    });

    var messenger_profile_api = {
        greeting: function(payload) {
            var message = {
                'greeting': []
            };
            if (Array.isArray(payload)) {
                message.greeting = payload;
            } else {
                message.greeting.push({
                    'locale': 'default',
                    'text': payload
                });
            }
            line_botkit.api.messenger_profile.postAPI(message);
        },
        delete_greeting: function() {
            line_botkit.api.messenger_profile.deleteAPI('greeting');
        },
        get_greeting: function(cb) {
            line_botkit.api.messenger_profile.getAPI('greeting', cb);
        },
        get_started: function(payload) {
            var message = {
                'get_started': {
                    'payload': payload
                }
            };
            line_botkit.api.messenger_profile.postAPI(message);
        },
        delete_get_started: function() {
            line_botkit.api.messenger_profile.deleteAPI('get_started');
        },
        get_get_started: function(cb) {
            line_botkit.api.messenger_profile.getAPI('get_started', cb);
        },
        menu: function(payload) {
            var messege = {
                persistent_menu: payload
            };
            line_botkit.api.messenger_profile.postAPI(messege);
        },
        delete_menu: function() {
            line_botkit.api.messenger_profile.deleteAPI('persistent_menu');
        },
        get_menu: function(cb) {
            line_botkit.api.messenger_profile.getAPI('persistent_menu', cb);
        },
        account_linking: function(payload) {
            var message = {
                'account_linking_url': payload
            };
            line_botkit.api.messenger_profile.postAPI(message);
        },
        delete_account_linking: function() {
            line_botkit.api.messenger_profile.deleteAPI('account_linking_url');
        },
        get_account_linking: function(cb) {
            line_botkit.api.messenger_profile.getAPI('account_linking_url', cb);
        },
        domain_whitelist: function(payload) {
            var message = {
                'whitelisted_domains': Array.isArray(payload) ? payload : [payload]
            };
            line_botkit.api.messenger_profile.postAPI(message);
        },
        delete_domain_whitelist: function() {
            line_botkit.api.messenger_profile.deleteAPI('whitelisted_domains');
        },
        get_domain_whitelist: function(cb) {
            line_botkit.api.messenger_profile.getAPI('whitelisted_domains', cb);
        },
        target_audience: function(payload) {
            var message = {
                'target_audience': payload
            };
            line_botkit.api.messenger_profile.postAPI(message);
        },
        delete_target_audience: function() {
            line_botkit.api.messenger_profile.deleteAPI('target_audience');
        },
        get_target_audience: function(cb) {
            line_botkit.api.messenger_profile.getAPI('target_audience', cb);
        },
        home_url: function(payload) {
            var message = {
                home_url: payload
            };
            line_botkit.api.messenger_profile.postAPI(message);
        },
        delete_home_url: function() {
            line_botkit.api.messenger_profile.deleteAPI('home_url');
        },
        get_home_url: function(cb) {
            line_botkit.api.messenger_profile.getAPI('home_url', cb);
        },
        postAPI: function(message) {
            request.post('https://' + api_host + '/v2.6/me/messenger_profile?access_token=' + configuration.access_token,
                {form: message},
                function(err, res, body) {
                    if (err) {
                        line_botkit.log('Could not configure messenger profile');
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            line_botkit.log('ERROR in messenger profile API call: Could not parse JSON', err, body);
                        }

                        if (results) {
                            if (results.error) {
                                line_botkit.log('ERROR in messenger profile API call: ', results.error.message);
                            } else {
                                line_botkit.debug('Successfully configured messenger profile', body);
                            }
                        }
                    }
                });
        },
        deleteAPI: function(type) {
            var message = {
                'fields': [type]
            };
            request.delete('https://' + api_host + '/v2.6/me/messenger_profile?access_token=' + configuration.access_token,
                {form: message},
                function(err, res, body) {
                    if (err) {
                        line_botkit.log('Could not configure messenger profile');
                    } else {
                        line_botkit.debug('Successfully configured messenger profile', message);
                    }
                });
        },
        getAPI: function(fields, cb) {
            request.get('https://' + api_host + '/v2.6/me/messenger_profile?fields=' + fields + '&access_token=' + configuration.access_token,
                function(err, res, body) {
                    if (err) {
                        line_botkit.log('Could not get messenger profile');
                        cb(err);
                    } else {
                        line_botkit.debug('Successfully got messenger profile ', body);
                        cb(null, body);
                    }
                });
        },
        get_messenger_code: function(image_size, cb, ref) {
            var message = {
                'type': 'standard',
                'image_size': image_size || 1000
            };

            if (ref) {
                message.data = {'ref': ref};
            }

            request.post('https://' + api_host + '/v2.6/me/messenger_codes?access_token=' + configuration.access_token,

                {form: message},
                function(err, res, body) {
                    if (err) {
                        line_botkit.log('Could not configure get messenger code');
                        cb(err);
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            line_botkit.log('ERROR in messenger code API call: Could not parse JSON', err, body);
                            cb(err);
                        }

                        if (results) {
                            if (results.error) {
                                line_botkit.log('ERROR in messenger code API call: ', results.error.message);
                                cb(results.error);
                            } else {
                                var uri = results.uri;
                                line_botkit.log('Successfully got messenger code', uri);
                                cb(null, uri);
                            }
                        }
                    }
                });
        }
    };

    var attachment_upload_api = {
        upload: function(attachment, cb) {
            var message = {
                message: {
                    attachment: attachment
                }
            };

            request.post('https://' + api_host + '/v2.6/me/message_attachments?access_token=' + configuration.access_token,
                { form: message },
                function(err, res, body) {
                    if (err) {
                        line_botkit.log('Could not upload attachment');
                        cb(err);
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            line_botkit.log('ERROR in attachment upload API call: Could not parse JSON', err, body);
                            cb(err);
                        }

                        if (results) {
                            if (results.error) {
                                line_botkit.log('ERROR in attachment upload API call: ', results.error.message);
                                cb(results.error);
                            } else {
                                var attachment_id = results.attachment_id;
                                line_botkit.log('Successfully got attachment id ', attachment_id);
                                cb(null, attachment_id);
                            }
                        }
                    }
                });
        }

    };

    var tags = {
        get_all: function(cb) {
            request.get('https://' + api_host + '/v2.6/page_message_tags?access_token=' + configuration.access_token,
                function(err, res, body) {
                    if (err) {
                        line_botkit.log('Could not get tags list');
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            line_botkit.log('ERROR in page message tags call: Could not parse JSON', err, body);
                        }

                        if (results) {
                            if (results.error) {
                                line_botkit.log('ERROR in page message tags: ', results.error.message);
                            } else {
                                line_botkit.debug('Successfully call page message tags', body);
                                cb(results);
                            }
                        }
                    }
                });
        }
    };

    var nlp = {
        enable: function(custom_token) {
            line_botkit.api.nlp.postAPI(true, custom_token);
        },
        disable: function() {
            line_botkit.api.nlp.postAPI(false);
        },
        postAPI: function(value, custom_token) {
            var uri = 'https://' + api_host + '/v2.8/me/nlp_configs?nlp_enabled=' + value + '&access_token=' + configuration.access_token;
            if (custom_token) {
                uri += '&custom_token=' + custom_token;
            }
            request.post(uri, {},
                function(err, res, body) {
                    if (err) {
                        line_botkit.log('Could not enable/disable build-in NLP');
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            line_botkit.log('ERROR in build-in NLP API call: Could not parse JSON', err, body);
                        }

                        if (results) {
                            if (results.error) {
                                line_botkit.log('ERROR in build-in API call: ', results.error.message);
                            } else {
                                line_botkit.debug('Successfully enable/disable build-in NLP', body);
                            }
                        }
                    }
                });
        }
    };

    line_botkit.api = {
        'messenger_profile': messenger_profile_api,
        'thread_settings': messenger_profile_api,
        'attachment_upload': attachment_upload_api,
        'nlp': nlp,
        'tags': tags,
    };

    // Verifies the SHA1 signature of the raw request payload before bodyParser parses it
    // Will abort parsing if signature is invalid, and pass a generic error to response
    function verifyRequest(req, res, buf, encoding) {
        var expected = req.headers['x-hub-signature'];
        var calculated = getSignature(buf);
        if (expected !== calculated) {
            throw new Error('Invalid signature on incoming request');
        } else {
            // line_botkit.debug('** X-Hub Verification successful!')
        }
    }

    function getSignature(buf) {
        var hmac = crypto.createHmac('sha1', line_botkit.config.app_secret);
        hmac.update(buf, 'utf-8');
        return 'sha1=' + hmac.digest('hex');
    }

    function abortOnValidationError(err, req, res, next) {
        if (err) {
            line_botkit.log('** Invalid X-HUB signature on incoming request!');
            line_botkit.debug('** X-HUB Validation Error:', err);
            res.status(400).send({
                error: 'Invalid signature.'
            });
        } else {
            next();
        }
    }


    line_botkit.startTicking();


    return line_botkit;
};

module.exports = linebot;
