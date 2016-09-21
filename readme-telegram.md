# Botkit and Telegram

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms.


Botkit features a comprehensive set of tools
to deal with [Telegram's Bot platform](https://core.telegram.org/bots/api/), and allows
developers to build interactive bots and applications that send and receive messages just like real humans.

This document covers the Telegram-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Telegram-specific Events](#telegram-specific-events)
* [Working with Telegram Webhooks](#working-with-facebook-messenger)
* [Using Inline Keyboards, Custom Keyboards, and Callback Queries](#using-structured-messages-and-postbacks)
* [Running Botkit with an Express server](#use-botkit-for-telegram-with-an-express-web-server)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Create a Telegram Bot by talking to [Botfather](https://telegram.me/botfather). Use the `/newbot` command to create a new bot. Botfather will ask for a name (which will be displayed in contacts and elsewhere) and a username (which will be used for `@mentions` and telegram.me links), usernames must end in 'bot'. Learn more about setting up your bot with Botfather [here](https://core.telegram.org/bots#6-botfather).

3) Note the token Botfather gives you, it is required to send requests to the Telegram Bot API. Copy this token, you'll need it!

4) You need to run your bot at a public, SSL-enabled address, or use localtunnel.me on your development machine to receive webhooks from Telegram. telegram_token

5) Run the example bot app, passing in your Telegram bot's token from Botfather, and the base url you will receive webhooks at. If you are _not_ running your bot at a public, SSL-enabled internet address, use the --lt option and set a custom url. Botkit will register the url you pass into webhook_url with Telegram. DO NOT FORGET THE TRAILING SLASH IN THE webhook_url ENVIRONMENT VARIABLE! Your bot will receive webhooks at https:<YOUR_URL>:8443/telegram/receive

> Note that Telegram webhooks only supports ports 443, 80, 88, 8443 at this time.

```
telegram_token=<MY BOT TOKEN> webhook_url=<https://EXAMPLE.localtunnel.me/> node telegram_bot.js [--lt [--ltsubdomain EXAMPLE]]
```

6) Your bot should be online! Within Telegram, search for your bot and start a conversation.

Try:
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

Here is the complete code for a basic Facebook bot:

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

## Using Inline Keyboards, Custom Keyboards, and Postbacks

You can attach little bubbles, called an inline keyboard

And in those bubbles can be buttons
and when a user clicks the button, it sends a postback with the value.

```javascript
controller.hears('test', 'message_received', function(bot, message) {

    var attachment = {
        'type':'template',
        'payload':{
            'template_type':'generic',
            'elements':[
                {
                    'title':'Chocolate Cookie',
                    'image_url':'http://cookies.com/cookie.png',
                    'subtitle':'A delicious chocolate cookie',
                    'buttons':[
                        {
                        'type':'postback',
                        'title':'Eat Cookie',
                        'payload':'chocolate'
                        }
                    ]
                },
            ]
        }
    };

    bot.reply(message, {
        attachment: attachment,
    });

});

controller.on('facebook_postback', function(bot, message) {

    if (message.payload == 'chocolate') {
        bot.reply(message, 'You ate the chocolate cookie!')
    }

});
```

## Typing indicator

Use a message with a sender_action field with "typing_on" to create a typing indicator. The typing indicator lasts 20 seconds, unless you send another message with "typing_off"

```
var reply_message = {
  sender_action: "typing_on"
}

bot.reply(message, reply_message)
```

## Use BotKit for Facebook Messenger with an Express web server
Instead of the web server generated with setupWebserver(), it is possible to use a different web server to receive webhooks, as well as serving web pages.

Here is an example of [using an Express web server alongside BotKit for Facebook Messenger](https://github.com/mvaragnat/botkit-messenger-express-demo).
