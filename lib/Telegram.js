var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Telegrambot(configuration) {

    // Create a core botkit bot
    var telegram_botkit = Botkit(configuration || {});
		if (! configuration.identity) {

			request({
					method: 'GET',
					json: true,
					headers: {
						'content-type': 'application/json',
					},
					uri: 'https://api.telegram.org/bot' + configuration.access_token + '/getMe'
				},
				function(err, res, body) {
					if (err) {
						telegram_botkit.debug('WEBHOOK ERROR', err);
						return 
					}

					if (body.error) {
						telegram_botkit.debug('API ERROR', body.error);
						return 
					}

					configuration.identity = body.result
				});
		}

    // customize the bot definition, which will be used when new connections
    // spawn!
    telegram_botkit.defineBot(function(botkit, config) {

        var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
			identity: configuration.identity || null 
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {

            /* This formatting logic will go into a pipeline middleware */

            // telegram_message.chat_id = message.channel;

            // if (message.text) {
            //     telegram_message.text = message.text;
            // }



            request({
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: message,
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

        bot.editMessageText = function(src, resp, cb) {
			var msg = {}

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }
            msg.chat_id = src.chat.id
			msg.message_id = src.message_id;
			msg.inline_message_id = src.inline_message_id;

            request({
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: msg,
                    uri: 'https://api.telegram.org/bot' + configuration.access_token + '/editMessageText'
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

                    botkit.debug('WEBHOOK SUCCESS - EDITED MESSAGE', body);
                    cb && cb(null, body);
                });

        };

        bot.answerCallbackQuery = function(message, res, cb) {
            var telegram_message = {
                callback_query_id: message.callback_query_id
            };
			if (res) {

				if (res.text) {
					telegram_message.text = res.text;
				}

				if (res.show_alert) {
					telegram_message.show_alert = res.show_alert;
				}

				if (res.url) {
					telegram_message.url = res.url;
				}
			}

            request({
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: telegram_message,
                    uri: 'https://api.telegram.org/bot' + configuration.access_token + '/answerCallbackQuery'
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

                    botkit.debug('WEBHOOK SUCCESS - ANSWER CALLBACK QUERY SENT', body);
                    cb && cb(null, body);
                });

        }

		bot.answerInlineQuery = function(src, payload, cb) {
			if (typeof payload == 'object' && payload.constructor === Array) {
				// payload is an array of results
				payload = {
					inline_query_id: src.inline_query_id,
					results: payload
				}
			}
			request.post('https://api.telegram.org/bot' + configuration.access_token + '/answerInlineQuery', {
					body: payload,
					json: true
				},
				function(err, res, body) {
					if (err) {
						telegram_botkit.log('Could not answer Inline Query');
					} else {
						if (body.ok) {
							botkit.debug('answerInlineQuery success')
							cb && cb(null, body)
						} else {
							botkit.debug('Error answering inline query:', body)
							cb && cb(body)
						}
					}
				});
		}


        // Need to specify recipient of game, either a single user's id or the chat_id of target conversation
        bot.sendGame = function(message, cb) {
            var telegram_message = {
                chat_id: message.chat_id,
                game_short_name: message.game_short_name
            };

            if (message.reply_to_message_id) {
                telegram_message.reply_to_message_id = message.reply_to_message_id;
            }

            if (message.disable_notification) {
                telegram_message.disable_notification = message.disable_notification;
            }

            if (message.reply_markup) {
                telegram_message.reply_markup = message.reply_markup;
            }

            request({
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: telegram_message,
                    uri: 'https://api.telegram.org/bot' + configuration.access_token + '/sendGame'
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

                    botkit.debug('WEBHOOK SUCCESS - GAME SENT', body);
                    cb && cb(null, body);
                });

        };

        return bot;

    });

    /* Messaging Pipeline Middlewares */

	// Ingest Stage
	// Ingestion into Botkit is the first step in the message pipeline.
	
	// Send http response to Telegram 
    telegram_botkit.middleware.ingest.use(function sendResponse(bot, message, res, next) {

        if (res && res.statusCode) {
            res.status(200).send('');
        }
        next();
    })

	// Normalize Stage
	/* After passing through the normalize phase, the message object is expected to have the following fields:
		* type will contain either the raw value of the incoming type field specified by the platform, OR message_received which is the default message type defined by Botkit.
		* user will contain the unique id of the sending user

		* channel will include the unique id of the channel in which the message was sent
		* text will contain the text, if any, of the message. 
	 */
	telegram_botkit.middleware.normalize.use(function handleMessage(bot, message, next) {
		// handle event.messages
		// console.log('Normalize:\n', message)
		
		// default message type, not sure if I need this?
		message.type = 'message_received'

		if (message.message) {
			const msg = message.message
			// this is a Telegram update Message type
			message.user = msg.from.id
			message.channel = msg.chat.id
			message.text = msg.text || null

			// message.photo = msg.photo

			// loop through all props on message.message, add to our message
			for (var prop in msg) {
				if (msg.hasOwnProperty(prop)) {
					message[prop] = msg[prop];
				}
			}

		} if (message.channel_post) {

		}
		next()
	})

	telegram_botkit.middleware.normalize.use(function handleInlineMessages(bot, message, next) {


		// handle inline queries
		if (message.inline_query) {
			message.type = 'inline_query'

			message.inline_query_id = message.inline_query.id
			message.text = message.inline_query.query
			message.user = message.inline_query.from.id
			// not sure if we ever get context (or need it) for channel user is in when query is delivered
			message.channel = 'inline'
			if (message.inline_query.location) {
				// bot can request location info when a user sends an inline query
				message.location = message.inline_query.location
			}

		}
		if (message.chosen_inline_result) {
			// user has selected an inline query result
			message.type = 'chosen_inline_result'
			// sticking to the event format here, even though its not consistent
			message.inline_message_id = message.chosen_inline_result.inline_message_id
			// id of the chosen result
			message.result_id = message.chosen_inline_result.result_id
			// inline query string used to find the result
			// not sure what/if text should be here...
			// prolly unnecessary, just stick to the format of the event, these dont really belong in conversations?
			message.text = message.chosen_inline_result.query
			message.user = message.inline_query.from.id
			message.channel = ''//'inline_query'
			if (message.inline_query.location) {
				// bot can request location info when a user sends an inline query
				message.location = message.inline_query.location
			}

		}
		next()
	})

	telegram_botkit.middleware.normalize.use(function handleInteractiveMessages(bot, message, next) {
		// handle callbacks, message updates?
		if (message.callback_query) {
			message.type = 'interactive_message_callback'

			message.channel = message.callback_query.message.chat.id
			message.user = message.callback_query.from.id
			message.callback_query_id = message.callback_query.id
			message.source_message = message.callback_query.message 
			message.source_inline_message = message.callback_query.inline_message_id

			// put callback data in message text, so we can use the data conversations
			message.text = message.callback_query.data
		}

		next()
	})
	
	// Categorize Stage
	// After passing through the catgorize phase, the message object's type field should represent a the final event type that will be handled by Botkit.
	
	// Set message type 
    telegram_botkit.middleware.categorize.use(function categorize(bot, message, next) {
        //categorize message type 
		// categorize text message type
        if (message.message && message.message.text) {
			const chat = message.message.chat
			if (chat.type === 'private') {
				message.type = 'direct_message'
			} else if (chat.type === 'group') {
				message.type = 'group_message'
			} else if (chat.type === 'channel') {
				message.type = 'channel_message'
			} else if (chat.type === 'supergroup') {
				message.type = 'supergroup_message'
			}

			// Telegram sends messageEntities, but they don't give us enough info to rely on them for determining if our bot is being mentioned, so we will parse it ourselves
			var mentionSyntax = '@' + bot.identity.username;
			var mention = new RegExp(mentionSyntax, 'i');
			var direct_mention = new RegExp('^' + mentionSyntax, 'i');
			if (direct_mention.test(message.text)) {
                message.text = message.text.replace(direct_mention, '')
				message.type = 'direct_mention'
			} else if (message.text.match(mention)) {
				message.type = 'mention'
			} else {
				// not sure if want ambient message types? Might be more useful to split it into group_message and channel_message
				// message.type = 'ambient'
			}
        } else {
			// Telegram has SO MANY TYPES sent under message!
			// Most are things users aren't explicitly sending you, but are types of updates. We want to trigger events for the unique side effects, not a message_received event
			if (message.new_chat_member) {
				if (message.new_chat_member.is_bot) {
					if (message.new_chat_member.id === configuration.identity.id) {
						message.type = 'bot_join'
					} else {
						message.type = 'other_bot_join'
					}
				} else {
					message.type = 'user_join'
				}
			} else if (message.left_chat_member) {
				if (message.left_chat_member.is_bot) {
					if (message.left_chat_member.id === configuration.identity.id) {
						message.type = 'bot_leave'
					} else {
						message.type = 'other_bot_leave'
					}
				} else {
					message.type = 'user_leave'
				}
			} else if (message.photo) {
				message.type = 'photo'
			} else if (message.video) {
				message.type = 'video'
			} else if (message.audio) {
				message.type = 'audio'
					message.type = 'bot_join'
			} 
		}
		next()
    })

	// Receive Stage

    telegram_botkit.handleWebhookPayload = function(req, res, bot) {
            // telegram_botkit.debug('GOT A MESSAGE HOOK');

		telegram_botkit.ingest(bot, req.body, res)
            // var telegram_message = req.body;
            // if (telegram_message.message) {

            //     var message = {
            //         text: telegram_message.message.text,
            //         user: telegram_message.message.from.id,
            //         channel: telegram_message.message.from.id,
            //         timestamp: telegram_message.message.date,
            //     };

            //     if (telegram_message.update_id) {
            //         message.update_id = telegram_message.update_id;
            //     }

            //     if (telegram_message.message.message_id) {
            //         message.message_id = telegram_message.message.message_id;
            //     }

            //     if (telegram_message.message.forward_from) {
            //         message.forward_from = telegram_message.message.forward_from;
            //     }

            //     if (telegram_message.message.forward_from_chat) {
            //         message.forward_from_chat = telegram_message.message.forward_from_chat;
            //     }

            //     if (telegram_message.message.forward_from_date) {
            //         message.forward_from_date = telegram_message.message.forward_from_date;
            //     }

            //     if (telegram_message.message.reply_to_message) {
            //         message.reply_to_message = telegram_message.message.reply_to_message;
            //     }

            //     if (telegram_message.message.entities) {
            //         message.entities = telegram_message.message.entities;
            //     }

            //     if (telegram_message.message.document) {
            //         message.document = telegram_message.message.document;
            //     }

            //     if (telegram_message.message.photo) {
            //         message.photo = telegram_message.message.photo;
            //     }

            //     if (telegram_message.message.sticker) {
            //         message.sticker = telegram_message.message.sticker;
            //     }

            //     if (telegram_message.message.video) {
            //         message.video = telegram_message.message.video;
            //     }

            //     if (telegram_message.message.voice) {
            //         message.voice = telegram_message.message.voice;
            //     }

            //     if (telegram_message.message.caption) {
            //         message.caption = telegram_message.message.caption;
            //     }

            //     if (telegram_message.message.contact) {
            //         message.contact = telegram_message.message.contact;
            //     }

            //     if (telegram_message.message.location) {
            //         message.location = telegram_message.message.location;
            //     }

            //     if (telegram_message.message.venue) {
            //         message.venue = telegram_message.message.venue;
            //     }

            //     telegram_botkit.receiveMessage(bot, message);

            // } else if (telegram_message.callback_query) {

            //     var message = {
            //         // Telegram uses a field called data not payload
            //         // Default to the way facebook messenger names it
            //         payload: telegram_message.callback_query.data,
            //         user: telegram_message.callback_query.from.id,
            //         channel: telegram_message.callback_query.from.id,
            //         callback_id: telegram_message.callback_query.id,
            //         parent_message: telegram_message.callback_query.message,
            //     };

            //     telegram_botkit.trigger('telegram_postback', [bot, message]);

            //     var message = {
            //         text: telegram_message.callback_query.data,
            //         user: telegram_message.callback_query.from.id,
            //         channel: telegram_message.callback_query.from.id,
            //         timestamp: telegram_message.callback_query.message.date,
            //         callback_id: telegram_message.callback_query.id,
            //         parent_message: telegram_message.callback_query.message
            //     };

            //     telegram_botkit.receiveMessage(bot, message);

            // } else {
            //     telegram_botkit.log('Got an unexpected message from Telegram: ', telegram_message);
            // }

            // res.send('ok');
        }
        // set up a web route for receiving outgoing webhooks and/or slash commands
	

	// Format Stage
	
	telegram_botkit.middleware.format.use(function formatOutgoing(bot, message, platform_message, next) {

		// format the message that will be sent as a payload to Telegram

		// required fields
		platform_message.chat_id = message.channel
		platform_message.text = message.text

		if (message.parse_mode) {
			platform_message.parse_mode = message.parse_mode;
		}

		if (message.disable_web_preview) {
			platform_message.disable_web_preview = message.disable_web_preview;
		}

		if (message.disable_notification) {
			platform_message.disable_notification = message.disable_notification;
		}

		if (message.reply_message_id) {
			platform_message.reply_message_id = message.reply_message_id;
		}

		if (message.reply_markup) {
			platform_message.reply_markup = message.reply_markup;
		}

		console.log('OUTGOING MSG IN FORMAT:\n', platform_message)
		next()

	})

    telegram_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        telegram_botkit.log(
            '** Serving webhook endpoints for Slash commands and outgoing ' +
            'webhooks at: http://MY_HOST:' + telegram_botkit.config.port + '/telegram/receive');
        webserver.post('/telegram/receive', function(req, res) {

            telegram_botkit.handleWebhookPayload(req)
            res.status(200).send('ok')
        });

        if (cb) {
            cb();
        }

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


        request.post('https://api.telegram.org/bot' + configuration.access_token + '/setWebhook', {
                form: {
                    url: configuration.webhook_url + 'telegram/receive'
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
