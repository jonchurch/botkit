
var Botkit = require('./lib/Botkit.js');
var express = require('express');
var https = require('https');
var bodyParser = require('body-parser');
var request = require('request');


const fs = require('fs');

const opts = {
    key: fs.readFileSync(__dirname + '/key.pem', 'utf8'),
    cert: fs.readFileSync(__dirname + '/cert.pem', 'utf8'),
};

// --------------------- Bot Configuration ----------------------- //

var controller = Botkit.facebookbot({
    debug: true,
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
})

var bot = controller.spawn({});

// --------------------- Bot Configuration End ----------------------- //


// --------------------- Server Configuration ----------------------- //
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var server = https.createServer(opts, app);

server.listen(3000, function () {
    console.log('gonna try to add web hook . . .');
    controller.createWebhookEndpoints(app, bot, function () {
        console.log('ONLINE!');
    });
});

request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + process.env.page_token,
    function (err, res, body) {
        if (err) {
            console.log('Could not subscribe to page messages');
        } else {
            console.log('Successfully subscribed to Facebook events:', body);
            controller.startTicking();
        }
    });

// --------------------- Server Configuration End ----------------------- //

var title;
var artist;

// this is triggered when a user clicks the send-to-messenger plugin
controller.on('facebook_optin', function (bot, message) {
    bot.say(message, 'Welcome!');
});

// user said hello
controller.hears(['hi', 'hello', 'bot', 'whats up', 'sup'], ['message_received'], function (bot, message) {

    bot.reply(message, 'Hi there!');
});
