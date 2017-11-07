var Botkit = require(__dirname + '/CoreBot.js');
var clone = require('clone');
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

		// Sending Text messages
		if (message.text) {
			_msg.text = message.text;
			_msg.type = 'text'
		}

			console.log('OUTGOING MESSSAGE', {message})
		if (message.sticker) {
			_msg.packageId = message.sticker.packageId
			_msg.stickerId = message.sticker.stickerId
			_msg.type = 'sticker'
		}

		if (message.image) {
			_msg.originalContentUrl = message.image
			_msg.previewImageUrl = 'https://placehold.it/240x240' //@TODO previewImageUrl for sending images
			_msg.type = 'image'
		}

		if (message.video) {
			_msg.originalContentUrl = message.video
			_message.previewImageUrl = 'https://placehold.it/240x240'//@TODO previewImageUrl for sending videos
			_msg.type = 'video'
		}

		if (message.audio) {
			_msg.originalContentUrl = message.audio.url
			_msg.duration = message.audio.duration
			_msg.type = 'audio'
		}

		if (message.location) {
			_msg.title = message.location.title
			_msg.address = message.location.address
			_msg.latitude = message.location.latitude
			_msg.longitude = message.location.longitude
			_msg.type = 'location'
		}

		if (message.imagemap) {
			_msg.baseUrl = message.imagemap.baseUrl
			_msg.altText = message.imagemap.altText
			_msg.baseSize = {}
			_msg.baseSize.width = message.imagemap.baseSize.width
			_msg.baseSize.heigth = message.imagemap.baseSize.height
			_msg.actions = message.imagemap.actions
			_msg.type = 'imagemap'
		}

		if (message.template) {
			_msg.altText = message.template.altText
			_msg.template = message.template.template
			_msg.type = 'template'
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

	// Ingest Middleware to start with a fresh object
	
    line_botkit.middleware.ingest.use(function(bot, message, res, next) {

		// Start with a message object that has a copy of the raw message
        message = { raw_message: clone(message) };
		next()
	});

	// @TODO Normalize middleware - Test room/group
    // universal normalizing steps
    // handle normal messages from users (text, stickers, files, etc count!)
    line_botkit.middleware.normalize.use(function normalizeMessage(bot, message, next) {


		// Group Message
		if (message.raw_message.source.groupId) {
			message.channel = message.raw_message.source.groupId
		} else {
			// Room Message
			if (message.raw_message.source.roomId) {
				message.channel = message.raw_message.source.roomId
			} else {
				// User Message
				message.channel = message.raw_message.source.userId
			}
		}

		// UserId is not always present in rooms or groups, if user has not agreed to messaging terms
		!message.raw_message.source.userId ? line_botkit.debug(`No userId available for ${message.source.type} message!`) : null

        // capture the user ID
        message.user = message.raw_message.source.userId;

		// replyToken is used for basic response messaging
		message.replyToken = message.raw_message.replyToken || null;

        next();

    });

    // handle message event from users (text, stickers, files, etc count!)
    line_botkit.middleware.normalize.use(function handleMessage(bot, message, next) {
		const message_event = message.raw_message.message

        if (message_event) {

            // capture the message text
            message.text = message_event.text;

			message.type = 'message_received'
			
			// Line specific fields
			// Message id is required for content endpoint
			message.id = message_event.id

            // copy over some line specific features
            message.sticker = message_event.type === 'sticker' ? {stickerId: message_event.stickerId, packageId: message_event.packageId} : null;
            message.image = message_event.type === 'image' ? message_event.id : null;
            message.video = message_event.type ==='video' ? message_event.id : null;
            message.audio = message_event.type === 'audio' ? message_event.id: null;
            message.file = message_event.type === 'file' ? { fileName: message_event.fileName, fileSize: message_event.fileSize} : null;
			message.location = message_event.type === 'location' ? { title: message_event.title, address: message_event.address, latitude: message_event.latitude, longitude: message_event.longitude } : null;
        }


        next();

    });

    // handle postback messages (when a user clicks a button)
    line_botkit.middleware.normalize.use(function handlePostback(bot, message, next) {

        if (message.postback) {
			// For DateTime action, the selected date, time, or datetime comes back as params
			const selection = Object.keys(message.postback.params)
			// Postback and DateTime action have a data field
			const data = message.postback.data

			// If present, use params for text, otherwise use data
            message.text = selection.length === 1 ? message.postback.params[selection[0]] : data;

            message.payload = data;
			message.params = message.postback.params || null;

            message.type = 'line_postback';
        }

        next();

    });

	//@TODO Categorize middleware
    // handle message sub-types
    line_botkit.middleware.categorize.use(function handleOptIn(bot, message, next) {
		console.log(message.raw_message)
		if (message.raw_message.type === 'follow') {
			message.type = 'line_follow'
		}
		if (message.raw_message.type === 'unfollow') {
			message.type = 'line_unfollow'
		}
		if (message.raw_message.type === 'join') {
			message.type = 'channel_join'
		}
		if (message.raw_message.type === 'leave') {
			message.type = 'channel_leave'
		}

        next();

    });

	// Line Beacon events
	line_botkit.middleware.categorize.use(function beaconEvent(bot, message, next) {
		if (message.raw_message.type === 'beacon') {
			message.type = 'line_beacon'
			message.beacon = {
				hwid: message.raw_message.beacon.hwid,
				type: message.raw_message.beacon.type,
				dm: message.raw_message.beacon.dm
			}
		}
	})

	// @TODO Verify webhook requests come from Line
    line_botkit.on('webserver_up', function(webserver) {

        // Validate that requests come from line, and abort on validation errors
        if (line_botkit.config.validate_requests === true) {
            // Load verify middleware just for post route on our receive webhook, and catch any errors it might throw to prevent the request from being parsed further.
            webserver.post('/line/receive', bodyParser.json({verify: verifyRequest}));
            webserver.use(abortOnValidationError);
        }

    });

	// default headers and json for api requets
	var api_request = request.defaults({
		auth: {
			bearer: configuration.access_token
		},
		json: true
	})

	var getContent = function getContent(messageId, cb){
		api_request.get(`https://api.line.me/v2/bot/message/${messageId}/content`, (err, res, body) => {
			if (err) {
				line_botkit.log('Error retreiving content')
				cb && cb(err)
			} else {
				line_botkit.log('API Success: retrieved content')
				cb && cb(null, body)
			}
		})
	}
	var profile = {
			getUser: function getUser(userId, cb) {
			api_request.get(`https://api.line.me/v2/bot/profile/${userId}`, (err, res, body) => {
				if (err) {
					line_botkit.log('Error getting user profile')
					cb && cb(err)
				} else {
					line_botkit.debug('Successfully got user profile')
					cb && cb(null, body)
				}
			})
		}
	}

	var group = {
		getMember: function getGroupMember(opts, cb) {
			const groupId = opts.groupId
			const userId = opts.userId
			if (userId && groupId) {

				api_request.get(`https://api.line/v2/bot/group/${groupId}/member/${userId}`, (err, res, body) => {
					if (err) {
						line_botkit.log('Error getting group member profile')
						cb && cb(err)
					} else {
						if (!body.error) {
							line_botkit.log('API Success: got group member profile')
							cb && cb(null, body)
						}
					}
				})
			} else {
				const err = 'API Error groupId and userId required'
				line_botkit.log(err)
				cb && cb(err)
			}
		},
		listMembers: function listMembers(opts, cb) {
			groupId = typeof opts === 'object' ? opts.groupId : opts
			api_request.get(`https://api.line.me/v2/bot/group/${groupId}/members/ids?start=${opts.continuationToken}`, (err, res, body) => {
				if (err) {
					line_botkit.log('Error getting group users')
					cb && cb(err)
				} else {
					line_botkit.log('API Success: got group members')
					cb && cb(null, body)
				}
			})
			
		},
		leave: function leave(groupId, cb){
			api_request.post(`https://api.line.me/v2/bot/group/${groupId}/leave`, (err, res, body) => {
				if (err) {
					line_botkit.log('Error leaving group')
					cb && cb(err) 
				} else {
					line_botkit.log('API Success: left group')
					cb && cb(null, body)
				}
			})
		}
	}

	//@TODO Test all these new api calls
    line_botkit.api = {
		'profile': profile,
		'group': group,
		'getContent': getContent
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
