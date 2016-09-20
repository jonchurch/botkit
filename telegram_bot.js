if (!process.env.telegram_token) {
    console.log('Error: Specify telegram_token in environment');
    process.exit(1);
}


var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.telegrambot({
    debug: true,
    access_token: process.env.telegram_token,
    webhook_url: process.env.webhook_url
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.port || 8443, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
    });
});


controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {
    // console.log('========MESSAGE:\n', message);


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});


controller.hears(['🏀', '🍕'], 'message_received', function(bot, message) {
console.log('PIZZA MESSAGE\n',message);
    var message = {
        channel: message.channel,
        text: 'Pizza!🍕',
    }
    bot.send(message, function(err) {
      if (err) {
        console.log('ERROR',err);
      }
    });

});

controller.hears(['structured', 'inline', '🐛'], 'message_received', function(bot, message) {
    console.log('HEARD STRUCTURED');
    bot.startConversation(message, function(err, convo) {
        // console.log('CONVO STARTED======\n', convo);
        // console.log('MESSAGE IN CONVO FUNCTION\n', messag);
        convo.ask({
            channel: message.channel,
            text: '✨🎉🍻🎉🍻🎉🍻🎉🍻✨',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: '🔍Inspect',
                        callback_data: 'LOOK'
                    }],
                    [{
                        text: '✨🔮✨',
                        callback_data: 'EXIT/EXPAND'
                    }]
                ]
            }
        }, function(response, convo) {
            //should recieve postback payload
            convo.say('You said ' + response.text)
            console.log('HEARD IT I HEARD THAT POSTBACK BOYEEE');
            convo.next();
        });
    });
});

controller.on('telegram_postback', function(bot, message) {
  console.log('==============HEARD POSTBACK!!!\n');
  console.log('MESSAGE=========\n', message);
    bot.reply(message, 'Great Choice!!!');

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
          console.log('==========NAME MESSAGE\n', message);
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
            ':robot_face: I am a bot named <@' + bot.identity.name +
            '>. I have been running for ' + uptime + ' on ' + hostname + '.');
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
