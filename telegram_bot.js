if (!process.env.telegram_token) {
    console.log('Error: Specify telegram_token in environment');
    process.exit(1);
}

if (!process.env.webhook_url) {
    console.log('Error: Specify webhook_url in environment');
    process.exit(1);
}


var Botkit = require('./lib/Botkit.js');
var os = require('os');
var commandLineArgs = require('command-line-args');
var localtunnel = require('localtunnel');

const ops = commandLineArgs([
      {name: 'lt', alias: 'l', args: 1, description: 'Use localtunnel.me to make your bot available on the web.',
      type: Boolean, defaultValue: false},
      {name: 'ltsubdomain', alias: 's', args: 1,
      description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
      type: String, defaultValue: null},
   ]);

if(ops.lt === false && ops.ltsubdomain !== null) {
    console.log("error: --ltsubdomain can only be used together with --lt.");
    process.exit();
}

var controller = Botkit.telegrambot({
    debug: true,
    access_token: process.env.telegram_token,
    webhook_url: process.env.webhook_url
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.port || 8443, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if(ops.lt) {
            var tunnel = localtunnel(process.env.port || 8443, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/telegram/receive');
            });

            tunnel.on('close', function() {
                console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
                process.exit();
            });
        }
    });
});


controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
          bot.reply(message, 'Hello ' + user.name + '!')

        } else {
            bot.reply(message, 'Hello.');
        }
    });
});

controller.hears(['structured', 'inline', '🐛'], 'message_received', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        convo.ask({
            channel: message.channel,
            text: '✨🎉🍻🎉🍻🎉🍻🎉🍻✨',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: '🔍Inspect',
                        callback_data: 'CALLBACK_QUERY/LOOK'
                    }],
                    [{
                        text: '✨🔮✨',
                        callback_data: 'CALLBACK_QUERY/EXIT/EXPAND'
                    }]
                ]
            }
        }, function(response, convo) {
            //should recieve postback payload
            if (response.callback_id) {
                var msg = {
                    chat_id: response.user,
                    message_id: response.parent_message.message_id,
                    text: '🔮🔮🔮🔮🔮🔮🔮🔮',
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: '🍻🍻🍻🍻🍻🍻',
                                callback_data: 'CALLBACK_QUERY/LOOK'
                            }],
                            [{
                                text: '🎉🎉🎉🎉🎉🎉',
                                callback_data: 'CALLBACK_QUERY/EXIT/EXPAND'
                            }]
                        ]
                    }
                };
                bot.editMessageText(msg);
                convo.next();
            } else {
                convo.silentRepeat()
            }

        });
    });
});

controller.on('telegram_postback', function(bot, message) {
    // bot.reply(message, 'Great Choice!!!');
    bot.reply(message, 'You said ' + message.payload);

});

controller.hears(['call me (.*)', 'my name is (.*)'], 'message_received', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'message_received', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [{
                            pattern: 'yes',
                            callback: function(response, convo) {
                                // since no further messages are queued after this,
                                // the conversation will end naturally with status == 'completed'
                                convo.next();
                            }
                        }, {
                            pattern: 'no',
                            callback: function(response, convo) {
                                // stop the conversation. this will cause it to end with status == 'stopped'
                                convo.stop();
                            }
                        }, {
                            default: true,
                            callback: function(response, convo) {
                                convo.repeat();
                                convo.next();
                            }
                        }]);

                        convo.next();

                    }, {
                        'key': 'nickname'
                    }); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});

controller.hears(['shutdown'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [{
            pattern: bot.utterances.yes,
            callback: function(response, convo) {
                convo.say('Bye!');
                convo.next();
                setTimeout(function() {
                    process.exit();
                }, 3000);
            }
        }, {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'], 'message_received',
    function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot. I have been running for ' + uptime + ' on ' + hostname + '.');
    });


controller.hears(['^CALLBACK_QUERY'], 'message_received', function(bot, message) {
    //suppress callbacks
    return false
});

controller.on('message_received', function(bot, message) {
    bot.reply(message, 'Try: `what is my name` or `structured` or `call me captain`');
    return false;
});


function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
