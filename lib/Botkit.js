var CoreBot = require(__dirname + '/CoreBot.js');
var Slackbot = require(__dirname + '/SlackBot.js');
var Facebookbot = require(__dirname + '/Facebook.js');
var TwilioIPMbot = require(__dirname + '/TwilioIPMBot.js');
var Telegrambot = require(__dirname + '/Telegrambot.js');

module.exports = {
    core: CoreBot,
    slackbot: Slackbot,
    facebookbot: Facebookbot,
    telegrambot: Telegrambot,
    twilioipmbot: TwilioIPMbot,
};
