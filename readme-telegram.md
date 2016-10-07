# Botkit and Telegram

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms.


Botkit features a comprehensive set of tools
to deal with [Telegram's Bot platform](https://core.telegram.org/bots/api/), and allows
developers to build interactive bots and applications that send and receive messages just like real humans.

This document covers the Telegram-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Telegram allows you to format your messages using Markdown, or HTML, in addition to allowing you to edit messages your bot has already sent.

Table of Contents

* [Getting Started](#getting-started)
* [Telegram-specific Events](#telegram-specific-events)
* [Working with Telegram Webhooks](#working-with-facebook-messenger)
* [Using Inline Keyboards, Custom Keyboards, and Callback Queries](#using-structured-messages-and-postbacks)
* [Running Botkit with an Express server](#use-botkit-for-telegram-with-an-express-web-server)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Create a Telegram Bot by talking to [Botfather](https://telegram.me/botfather). Use the `/newbot` command to create a new bot. Botfather will ask for a Name (which will be displayed in contacts and elsewhere) and a username (which will be used for `@mentions` and telegram.me links), usernames must end in 'bot'. Learn more about setting up your bot with Botfather [here](https://core.telegram.org/bots#6-botfather).

3) Note the token Botfather gives you, it is required to send requests to the Telegram Bot API. Copy this token, you'll need it!

4) You need to run your bot at a public, SSL-enabled address, or use localtunnel.me on your development machine to receive webhooks from Telegram. telegram_token

5) Run the example bot app, passing in your Telegram bot's token from Botfather, and the base url you will receive webhooks at. If you are _not_ running your bot at a public, SSL-enabled internet address, use the --lt option and set a custom url. Botkit will register the url you pass into webhook_url with Telegram. DO NOT FORGET THE TRAILING SLASH IN THE `webhook_url=` ENVIRONMENT VARIABLE! Your bot will receive webhooks at https:<YOUR_URL>:8443/telegram/receive

> *Note* that Telegram webhooks only supports ports 443, 80, 88, 8443 at this time. 9/30/2016

```
telegram_token=<MY BOT TOKEN> webhook_url=<https://EXAMPLE.localtunnel.me/> node telegram_bot.js [--lt [--ltsubdomain EXAMPLE]]
```

6) Your bot should be online! Within Telegram, search for your bot and start a conversation.

Try:
  * show me what you got
  * who are you?
  * call me Bob
  * shutdown


### Things to note

Since Telegram delivers messages via web hook, your application must be available at a public internet address on a supported port _(443, 80, 88, 8443)_.  Additionally, Telegram requires this address to use SSL.  Luckily, you can use [LocalTunnel](https://localtunnel.me/) to make a process running locally or in your dev environment available in a HTTPS-friendly way.

When you are ready to go live, consider [LetsEncrypt.org](http://letsencrypt.org), a _free_ SSL Certificate Signing Authority which can be used to secure your website very quickly. It is fabulous and we love it.

## Telegram-specific Events

Once connected to Telegram, bots receive a constant stream of events.

Normal messages will be sent to your bot using the `message_received` event.  In addition, several other events may fire, depending on your implementation.

| Event | Description
|--- |---
| message_received | a message was received by the bot
| telegram_postback | user clicked a button in an inline keyboard and triggered a webhook postback

All incoming events will contain the fields `user` and `channel`, both of which represent the Telegram user's ID, and a `timestamp` field.

`message_received` events will also contain either a `text` field or one of telegram's many [message types](https://core.telegram.org/bots/api#available-types)

`telegram_postback` events will contain a `payload` field with the callback data from the inline keyboard button pressed by user.

More information about the data found in these fields can be found [here](https://core.telegram.org/bots/api#available-types).

## Working with Telegram

Botkit receives messages from Telegram using webhooks, and sends messages using Telegram's APIs. This means that your bot application must present a web server that is publicly addressable. Everything you need to get started is already included in Botkit.

To connect your bot to Telegram, you need to register the webhook you will be receiving messages at with Telegram. Learn more about setting webhooks with Telegram [here](https://core.telegram.org/bots/api#setwebhook). Botkit will do this automatically when you supply the webhook_url in the environment. To learn more about setting up a public webhook for Telegram check [here](https://core.telegram.org/bots/webhooks)

_*Note:* You cannot use longpolling updates for Telegram while a webhook is registered_

Here is the complete code for a basic Telegram bot:

```javascript
var Botkit = require('botkit');
var controller = Botkit.telegrambot({
        telegram_token: process.env.access_token,
        webhook_url: process.env.webhook_url,
})

var bot = controller.spawn({
});

// if you are already using Express, you can use your own server instance...
// see "Use BotKit with an Express web server"
controller.setupWebserver(process.env.port || 8443,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
      console.log('This bot is online!!!');
  });
});

// user said hello
controller.hears(['hello'], 'message_received', function(bot, message) {

    bot.reply(message, 'Hey there.');

});

controller.hears(['cookies'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.say('Did someone say cookies!?!!');
        convo.ask('What is your favorite type of cookie?', function(response, convo) {
            convo.say('Golly, I love ' + response.text + ' too!!!');
            convo.next();
        });
    });
});
```


#### controller.setupWebserver()
| Argument | Description
|---  |---
| port | port for webserver, use one of 443, 80, 88, 8443
| callback | callback function

Setup an [Express webserver](http://expressjs.com/en/index.html) for
use with `createWebhookEndpoints()`

If you need more than a simple webserver to receive webhooks,
you should by all means create your own Express webserver! Here is a [boilerplate demo](https://github.com/mvaragnat/botkit-messenger-express-demo).

The callback function receives the Express object as a parameter,
which may be used to add further web server routes.

#### controller.createWebhookEndpoints()

This function configures the route `https://_your_server_/telegram/receive`
to receive webhooks from Facebook.

This url should be used when configuring Telegram.

### bot.editMessageText()
Telegram allows you to edit messages sent by your bot. Pass in a message object which contains the required `chat_id`, `message_id`, updated `text`, and optional `reply_markup` for the specific message you would like to edit. Learn more about Telegram's ediMessageText method [here](https://core.telegram.org/bots/api#updating-messages)

## Using Inline Keyboards, Custom Keyboards, and Postbacks

Telegram allows you to create custom keyboards for users to interact with your bot. Inline keyboards are attached directly under the message they are sent with, and trigger a Postback with the button's data, which is not sent to the chat window or visible to the user (by default, Botkit still receieves the data from a inline keyboard's postback as a message so inline keyboards can be used to reply during multi-step conversations).

Custom Keyboards replace the users keyboard, and the button's text is sent directly into the chat as a message when clicked.


```javascript
controller.hears('test', 'message_received', function(bot, message) {

  var msg = {
    channel: message.channel,
    text: 'Want to see a magic trick? ',
    reply_markup: {
        inline_keyboard: [
            [{
                text: 'Yes',
                callback_data: 'yes'
            }],
            [{
                text: 'No',
                callback_data: 'No'
            }]
        ]
    }
};

    bot.reply(message, msg);

});
//
//
//  Ughhh this all smells, what am I sending over on telegram postbacks? parent message id would be v helpful if it was exposed here in the right place
// In what way do I intend people to handle updating messages? The message_id has to be
// available wherever it is they are updating messages.
//
//
controller.on('telegram_postback', function(bot, message) {

    if (message.payload == 'yes') {
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
        bot.editMessageText(msg)
    }
    if (message.payload == 'no') {
      bot.reply(message, 'Okay cool that\'s fine...')
    }

});
```
