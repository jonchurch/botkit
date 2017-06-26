# [Botkit](https://botkit.ai) - Building Blocks for Building Bots

[![npm](https://img.shields.io/npm/v/botkit.svg)](https://www.npmjs.com/package/botkit)
[![David](https://img.shields.io/david/howdyai/botkit.svg)](https://david-dm.org/howdyai/botkit)
[![npm](https://img.shields.io/npm/l/botkit.svg)](https://spdx.org/licenses/MIT)
[![bitHound Overall Score](https://www.bithound.io/github/howdyai/botkit/badges/score.svg)](https://www.bithound.io/github/howdyai/botkit)

Botkit is designed to ease the process of designing and running useful, creative bots that live inside messaging platforms.
Bots are applications that can send and receive messages, and in many cases, appear alongside their human counterparts as _users._

Some bots talk like people, others silently work in the background, while others present interfaces much like modern mobile applications.
Botkit gives developers the necessary tools for building bots of any kind! It provides an easy-to-understand interface for sending and receiving messages so that developers can focus on creating novel applications and experiences instead of dealing with API endpoints.

Botkit features a comprehensive set of tools to deal with popular messaging platforms, including:

* [Slack](readme-slack.md)
* [Facebook Messenger](readme-facebook.md)
* [Twilio IP Messaging](readme-twilioipm.md)
* [Telegram](readme-telegram.md)
* [Microsoft Bot Framework](readme-botframework.md)
* Yours? [info@howdy.ai](mailto:info@howdy.ai)

## Botkit Studio

[Botkit Studio](https://studio.botkit.ai) is a hosted development environment for bots from the same team that built Botkit.
Based on feedback from the developer community, as well as experience running our flagship Botkit-powered bot, [Howdy](http://howdy.ai),
the tools in Botkit Studio allow bot designers and developers to manage many aspects of bot behavior without writing additional code.

[Start building your bot with Botkit Studio](readme-studio.md) and you'll start from day one with extra tools and features that
help you create and manage a successful bot application. It is also possible to add Studio features to your existing Botkit application. [With a few lines of code](readme-studio.md#adding-studio-features-to-an-existing-bot), you can add access new features and APIs.

Botkit Studio is built on top of Botkit, so everything that works with Botkit continues to just work. All of the available plugins and middleware are compatible!

## Getting Started

There are two ways to start a Botkit project:

1) [Install the Botkit Studio Starter Kit](https://github.com/howdyai/botkit-studio-starter) and build on top of an already fully functioning bot
that comes pre-configured with popular middleware plug-ins and components.

2) [Install Botkit directly from NPM or Github](#install-botkit-from-npm-or-github) and build a new app from scratch, or use one of the [included examples](#included-examples) as a starting point.

After you've installed Botkit using one of these methods, the first thing you'll need to do is register your bot with a messaging platform, and get a few configuration options set. This will allow your bot to connect, send and receive messages.

If you intend to create a bot that
lives in Slack, [follow these instructions for attaining a Bot Token](readme-slack.md#getting-started).

If you intend to create a bot that lives in Facebook Messenger, [follow these instructions for configuring your Facebook page](readme-facebook.md#getting-started).

If you intend to create a bot that lives inside a Twilio IP Messaging client, [follow these instructions for configuring your app](readme-twilioipm.md#getting-started).

If you intend to create a bot that uses Microsoft Bot Framework to send and receive messages, [follow these instructions for configuring your app](readme-botframework.md#getting-started).


## Install Botkit from NPM or Github

Botkit is available via NPM.

```bash
npm install --save botkit
```

You can also check out Botkit directly from Git.
If you want to use the example code and included bots, it may be preferable to use Github over NPM.

```bash
git clone git@github.com:howdyai/botkit.git
```

After cloning the Git repository, you have to install the node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.
```bash
npm install
```

Use the `--production` flag to skip the installation of devDependencies from Botkit. Useful if you just wish to run the example bot.
```bash
npm install --production
```


## Core Concepts

Bots built with Botkit have a few key capabilities, which can be used to create clever, conversational applications. These capabilities map to the way real human people talk to each other.

Bots can [hear things](#receiving-messages), [say things and reply](#sending-messages) to what they hear.

With these two building blocks, almost any type of conversation can be created.

To organize the things a bot says and does into useful units, Botkit bots have a subsystem available for managing [multi-message conversations](#multi-message-replies-to-incoming-messages). Conversations add features like the ability to ask a question, queue several messages at once, and track when an interaction has ended.  Handy!

After a bot has been told what to listen for and how to respond,
it is ready to be connected to a stream of incoming messages. Currently, Botkit supports receiving messages from a variety of sources:

* [Slack Real Time Messaging (RTM)](http://api.slack.com/rtm)
* [Slack Incoming Webhooks](http://api.slack.com/incoming-webhooks)
* [Slack Slash Commands](http://api.slack.com/slash-commands)
* [Facebook Messenger Webhooks](https://developers.facebook.com/docs/messenger-platform/implementation)
* [Twilio IP Messaging](https://www.twilio.com/user/account/ip-messaging/getting-started)
* [Microsoft Bot Framework](http://botframework.com/)

Read more about [connecting your bot to Slack](readme-slack.md#connecting-your-bot-to-slack), [connecting your bot to Facebook](readme-facebook.md#getting-started), [connecting your bot to Twilio](readme-twilioipm.md#getting-started),
or [connecting your bot to Microsoft Bot Framework](readme-botframework.md#getting-started)

## Included Examples

These examples are included in the Botkit [Github repo](https://github.com/howdyai/botkit).

[slack_bot.js](https://github.com/howdyai/botkit/blob/master/slack_bot.js) An example bot that can be connected to your team. Useful as a basis for creating your first bot!

[facebook_bot.js](https://github.com/howdyai/botkit/blob/master/facebook_bot.js) An example bot that can be connected to your Facebook page. Useful as a basis for creating your first bot!

[twilio_ipm_bot.js](https://github.com/howdyai/botkit/blob/master/twilio_ipm_bot.js) An example bot that can be connected to your Twilio IP Messaging client. Useful as a basis for creating your first bot!

[botframework_bot.js](https://github.com/howdyai/botkit/blob/master/botframework_bot.js) An example bot that can be connected to the Microsoft Bot Framework network. Useful as a basis for creating your first bot!

[examples/demo_bot.js](https://github.com/howdyai/botkit/blob/master/examples/demo_bot.js) another example bot that uses different ways to send and receive messages.

[examples/team_outgoingwebhook.js](https://github.com/howdyai/botkit/blob/master/examples/team_outgoingwebhook.js) an example of a Botkit app that receives and responds to outgoing webhooks from a single team.

[examples/team_slashcommand.js](https://github.com/howdyai/botkit/blob/master/examples/team_slashcommand.js) an example of a Botkit app that receives slash commands from a single team.

[examples/slackbutton_bot.js](https://github.com/howdyai/botkit/blob/master/examples/slackbutton_bot.js) an example of using the Slack Button to offer a bot integration.

[examples/slackbutton_incomingwebhooks.js](https://github.com/howdyai/botkit/blob/master/examples/slackbutton_incomingwebhooks.js) an example of using the Slack Button to offer an incoming webhook integration. This example also includes a simple form which allows you to broadcast a message to any team who adds the integration.

[example/sentiment_analysis.js](https://github.com/howdyai/botkit/blob/master/examples/sentiment_analysis.js) a simple example of a chatbot using sentiment analysis. Keeps a running score of each user based on positive and negative keywords. Messages and thresholds can be configured.


## Basic Usage

Here's an example of using Botkit with Slack's [real time API](https://api.slack.com/rtm), which is the coolest one because your bot will look and act like a real user inside Slack.

This sample bot listens for the word "hello" to be said to it -- either as a direct mention ("@bot hello") or an indirect mention ("hello @bot") or a direct message (a private message inside Slack between the user and the bot).

The Botkit constructor returns a `controller` object. By attaching event handlers
to the controller object, developers can specify what their bot should look for and respond to,
including keywords, patterns and various [messaging and status events](#responding-to-events).
These event handlers can be thought of metaphorically as skills or features the robot brain has -- each event handler defines a new "When a human says THIS the bot does THAT."

The `controller` object is then used to `spawn()` bot instances that represent
a specific bot identity and connection to Slack. Once spawned and connected to
the API, the bot user will appear online in Slack, and can then be used to
send messages and conduct conversations with users. They are called into action by the `controller` when firing event handlers.

```javascript
var Botkit = require('botkit');

var controller = Botkit.slackbot({
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
  token: <my_slack_bot_token>,
}).startRTM()

// give the bot something to listen for.
controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {

  bot.reply(message,'Hello yourself.');

});

```

### Botkit Statistics Gathering

As of version 0.4, Botkit records anonymous usage statistics about Botkit bots in the wild.
These statistics are used by the Botkit team at [Howdy](http://howdy.ai) to measure and
analyze the Botkit community, and help to direct resources to the appropriate parts of the project.

We take the privacy of Botkit developers and their users very seriously. Botkit does not collect,
or transmit any message content, user data, or personally identifiable information to our statistics system.
The information that is collected is anonymized inside Botkit and converted using one-way encryption
into a hash before being transmitted.

#### Opt Out of Stats

To opt out of the stats collection, pass in the `stats_optout` parameter when initializing Botkit,
as seen in the example below:

```
var controller = Botkit.slackbot({
    stats_optout: true
});
```


# Developing with Botkit

Table of Contents

* [Receiving Messages](#receiving-messages)
* [Sending Messages](#sending-messages)
* [Middleware](#middleware)
* [Advanced Topics](#advanced-topics)

### Responding to events

Once connected to a messaging platform, bots receive a constant stream of events - everything from the normal messages you would expect to typing notifications and presence change events. The set of events your bot will receive will depend on what messaging platform it is connected to.

All platforms will receive the `message_received` event. This event is the first event fired for every message of any type received - before any platform specific events are fired.

```javascript
controller.on('message_received', function(bot, message) {

    // carefully examine and
    // handle the message here!
    // Note: Platforms such as Slack send many kinds of messages, not all of which contain a text field!
});
```

Due to the multi-channel, multi-user nature of Slack, Botkit does additional filtering on the messages (after firing message_recieved), and will fire more specific events based on the type of message - for example, `direct_message` events indicate a message has been sent directly to the bot, while `direct_mention` indicates that the bot has been mentioned in a multi-user channel.
[List of Slack-specific Events](readme-slack.md#slack-specific-events)

Twilio IPM bots can also exist in a multi-channel, multi-user environmnet. As a result, there are many additional events that will fire. In addition, Botkit will filter some messages, so that the bot will not receive it's own messages or messages outside of the channels in which it is present.
[List of Twilio IPM-specific Events](readme-twilioipm.md#twilio-ipm-specific-events)

Facebook messages are fairly straightforward. However, because Facebook supports inline buttons, there is an additional event fired when a user clicks a button.
[List of Facebook-specific Events](readme-facebook.md#facebook-specific-events)


## Receiving Messages

Botkit bots receive messages through a system of specialized event handlers. Handlers can be set up to respond to specific types of messages, or to messages that match a given keyword or pattern.

These message events can be handled by attaching an event handler to the main controller object.
These event handlers take two parameters: the name of the event, and a callback function which is invoked whenever the event occurs.
The callback function receives a bot object, which can be used to respond to the message, and a message object.

```javascript
// reply to any incoming message
controller.on('message_received', function(bot, message) {
    bot.reply(message, 'I heard... something!');
});

// reply to a direct mention - @bot hello
controller.on('direct_mention',function(bot,message) {
  // reply to _message_ by using the _bot_ object
  bot.reply(message,'I heard you mention me!');
});

// reply to a direct message
controller.on('direct_message',function(bot,message) {
  // reply to _message_ by using the _bot_ object
  bot.reply(message,'You are talking directly to me');
});
```

### Matching Patterns and Keywords with `hears()`

In addition to these traditional event handlers, Botkit also provides the `hears()` function,
which configures event handlers based on matching specific keywords or phrases in the message text.
The hears function works just like the other event handlers, but takes a third parameter which
specifies the keywords to match.

| Argument | Description
|--- |---
| patterns | An _array_ or a _comma separated string_ containing a list of regular expressions to match
| types  | An _array_ or a _comma separated string_ of the message events in which to look for the patterns
| middleware function | _optional_ function to redefine how patterns are matched. see [Botkit Middleware](#middleware)
| callback | callback function that receives a message object

```javascript
controller.hears(['keyword','^pattern$'],['message_received'],function(bot,message) {

  // do something to respond to message
  bot.reply(message,'You used a keyword!');

});
```

When using the built in regular expression matching, the results of the expression will be stored in the `message.match` field and will match the expected output of normal Javascript `string.match(/pattern/i)`. For example:

```javascript
controller.hears('open the (.*) doors',['message_received'],function(bot,message) {
  var doorType = message.match[1]; //match[1] is the (.*) group. match[0] is the entire group (open the (.*) doors).
  if (doorType === 'pod bay') {
    return bot.reply(message, 'I\'m sorry, Dave. I\'m afraid I can\'t do that.');
  }
  return bot.reply(message, 'Okay');
});
```

## Sending Messages

Bots have to send messages to deliver information and present an interface for their
functionality.  Botkit bots can send messages in several different ways, depending
on the type and number of messages that will be sent.

Single message replies to incoming commands can be sent using the `bot.reply()` function.

Multi-message replies, particularly those that present questions for the end user to respond to,
can be sent using the `bot.startConversation()` function and the related conversation sub-functions.

Bots can originate messages - that is, send a message based on some internal logic or external stimulus -
using `bot.say()` method.  

All `message` objects must contain a `text` property, even if it's only an empty string.

### Single Message Replies to Incoming Messages

Once a bot has received a message using a `on()` or `hears()` event handler, a response
can be sent using `bot.reply()`.

Messages sent using `bot.reply()` are sent immediately. If multiple messages are sent via
`bot.reply()` in a single event handler, they will arrive in the  client very quickly
and may be difficult for the user to process. We recommend using `bot.startConversation()`
if more than one message needs to be sent.

You may pass either a string, or a message object to the function.

Message objects may also contain any additional fields supported by the messaging platform in use:

[Slack's chat.postMessage](https://api.slack.com/methods/chat.postMessage) API accepts several additional fields. These fields can be used to adjust the message appearance, add attachments, or even change the displayed user name.

This is also true of Facebook. Calls to [Facebook's Send API](https://developers.facebook.com/docs/messenger-platform/send-api-reference) can include attachments which result in interactive "structured messages" which can include images, links and action buttons.

#### bot.reply()

| Argument | Description
|--- |---
| message | Incoming message object
| reply | _String_ or _Object_ Outgoing response
| callback | _Optional_ Callback in the form function(err,response) { ... }

Simple reply example:
```javascript
controller.hears(['keyword','^pattern$'],['message_received'],function(bot,message) {

  // do something to respond to message
  // ...

  bot.reply(message,"Tell me more!");

});
```

Slack-specific fields and attachments:
```javascript
controller.on('ambient',function(bot,message) {

    // do something...

    // then respond with a message object
    //
    bot.reply(message,{
      text: "A more complex response",
      username: "ReplyBot",
      icon_emoji: ":dash:",
    });

})

//Using attachments
controller.hears('another_keyword','direct_message,direct_mention',function(bot,message) {
  var reply_with_attachments = {
    'username': 'My bot' ,
    'text': 'This is a pre-text',
    'attachments': [
      {
        'fallback': 'To be useful, I need you to invite me in a channel.',
        'title': 'How can I help you?',
        'text': 'To be useful, I need you to invite me in a channel ',
        'color': '#7CD197'
      }
    ],
    'icon_url': 'http://lorempixel.com/48/48'
    }

  bot.reply(message, reply_with_attachments);
});

```


Facebook-specific fields and attachments:
```
// listen for the phrase `shirt` and reply back with structured messages
// containing images, links and action buttons
controller.hears(['shirt'],'message_received',function(bot, message) {
    bot.reply(message, {
        attachment: {
            'type':'template',
            'payload':{
                 'template_type':'generic',
                 'elements':[
                   {
                     'title':'Classic White T-Shirt',
                     'image_url':'http://petersapparel.parseapp.com/img/item100-thumb.png',
                     'subtitle':'Soft white cotton t-shirt is back in style',
                     'buttons':[
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/view_item?item_id=100',
                         'title':'View Item'
                       },
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/buy_item?item_id=100',
                         'title':'Buy Item'
                       },
                       {
                         'type':'postback',
                         'title':'Bookmark Item',
                         'payload':'USER_DEFINED_PAYLOAD_FOR_ITEM100'
                       }
                     ]
                   },
                   {
                     'title':'Classic Grey T-Shirt',
                     'image_url':'http://petersapparel.parseapp.com/img/item101-thumb.png',
                     'subtitle':'Soft gray cotton t-shirt is back in style',
                     'buttons':[
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/view_item?item_id=101',
                         'title':'View Item'
                       },
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/buy_item?item_id=101',
                         'title':'Buy Item'
                       },
                       {
                         'type':'postback',
                         'title':'Bookmark Item',
                         'payload':'USER_DEFINED_PAYLOAD_FOR_ITEM101'
                       }
                     ]
                   }
                 ]
               }
        }
    });
});
```

### Multi-message Replies to Incoming Messages

For more complex commands, multiple messages may be necessary to send a response,
particularly if the bot needs to collect additional information from the user.

Botkit provides a `Conversation` object type that is used to string together several
messages, including questions for the user, into a cohesive unit. Botkit conversations
provide useful methods that enable developers to craft complex conversational
user interfaces that may span a several minutes of dialog with a user, without having to manage
the complexity of connecting multiple incoming and outgoing messages across
multiple API calls into a single function.

Messages sent as part of a conversation are sent no faster than one message per second,
which roughly simulates the time it would take for the bot to "type" the message.

### Start a Conversation

#### bot.startConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

`startConversation()` is a function that creates conversation in response to an incoming message.
The conversation will occur _in the same channel_ in which the incoming message was received.
Only the user who sent the original incoming message will be able to respond to messages in the conversation.

#### bot.startPrivateConversation()
| Argument | Description
|---  |---
| message   | message object containing {user: userId} of the user you would like to start a conversation with
| callback  | a callback function in the form of  function(err,conversation) { ... }

`startPrivateConversation()` is a function that initiates a conversation with a specific user. Note function is currently *Slack-only!*

#### bot.createConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

This works just like `startConversation()`, with one main difference - the conversation
object passed into the callback will be in a dormant state. No messages will be sent,
and the conversation will not collect responses until it is activated using [convo.activate()](#conversationactivate).

Use `createConversation()` instead of `startConversation()` when you plan on creating more complex conversation structures using [threads](#conversation-threads) or [variables and templates](#using-variable-tokens-and-templates-in-conversation-threads) in your messages.

### Control Conversation Flow

#### conversation.activate()

This function will cause a dormant conversation created with [bot.createConversation()](#botcreateconversation) to be activated, which will cause it to start sending messages and receiving replies from end users.

A conversation can be kept dormant in order to preload it with [variables](#using-variable-tokens-and-templates-in-conversation-threads), particularly data that requires asynchronous actions to take place such as loading data from a database or remote source.  You may also keep a conversation inactive while you build threads, setting it in motion only when all of the user paths have been defined.

#### conversation.say()
| Argument | Description
|---  |---
| message   | String or message object

Call convo.say() several times in a row to queue messages inside the conversation. Only one message will be sent at a time, in the order they are queued.

```javascript
controller.hears(['hello world'], 'message_received', function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

Our goal with Botkit is to make bot building easy, fun, and accessible to anyone with the desire to create
a future filled with talking machines! We provide several tools to make this vision a reality:

* [Botkit Studio](#start-with-botkit-studio), an integrated development environment for designing and building bots
* [Starter Kits](#start-with-a-starter-kit), boilerplate applications pre-configured to work with popular platforms
* [Botkit Core Library](#botkit-core-library), an SDK for creating conversational software
* [Plugins and Middlewares](docs/readme-middlewares.md) that can extend and enhance your bot

Botkit features a comprehensive set of tools to deal with popular messaging platforms, including:

* [Slack](docs/readme-slack.md)
* [Cisco Spark](docs/readme-ciscospark.md)
* [Facebook Messenger and Facebook @Workplace](docs/readme-facebook.md)
* [Twilio IP Messaging](docs/readme-twilioipm.md)
* [Microsoft Bot Framework](docs/readme-botframework.md)
* Yours? [info@howdy.ai](mailto:info@howdy.ai)

---

## [Start with Botkit Studio](https://studio.botkit.ai/signup)

Botkit Studio is a hosted development environment for building bots with Botkit.
Developers using Botkit Studio get the full capabilities of Botkit, with the addition of many powerful bot-building features such as:

* All the code you need to get your bot online in minutes
* A visual authoring environment for designing and managing dialog
* A real-time message console for monitoring activity
* APIs that enable content and features to be added to bots without additional code
* Role-based, multi-user teams support
* Detailed usage statistics
* Built-in integrations with top plugins and platform tools

Click below to sign up for a free developer account, [and please contact us if you have any questions.](mailto:info@howdy.ai)

**[![Sign up for Botkit Studio](docs/studio.png)](https://studio.botkit.ai/signup?code=readme)**


## Start with a Starter Kit

Based on the best practices we've established since the release of Botkit, our starter kits include
everything you need to bring a Botkit bot online in minutes. Don't start from scratch -- start with a
well structured, extensible application boilerplate!

These starter kits are easy to set up and run on your own hosting service, but the fastest (and cheapest) way to get
started is to deploy directly to [Glitch](http://glitch.com), a free-to-use code editor and hosting system!

Note: While [using Botkit Studio](https://studio.botkit.ai) is highly recommended, these starter kits can be used without registering for Studio as well.

> ### [Slack Bot Starter Kit](https://github.com/howdyai/botkit-starter-slack)
> The Slack starter kit contains everything you need to create a multi-team Slack application,
suitable for internal use or submission to [Slack's app store.](https://slack.com/apps)
> #### [![Remix on Glitch](docs/glitch.png)](https://glitch.com/edit/#!/import/github/howdyai/botkit-starter-slack)

> ### [Cisco Spark Bot Starter Kit](https://github.com/howdyai/botkit-starter-ciscospark)
> Build a bot inside Cisco Spark's collaboration and messaging platform. Bots built with the starter kit
are ready to submit to [Cisco Spark's Depot app store](https://depot.ciscospark.com/).
> #### [![Remix on Glitch](docs/glitch.png)](https://glitch.com/edit/#!/import/github/howdyai/botkit-starter-ciscospark)

> ### [Facebook Bot Starter Kit](https://github.com/howdyai/botkit-starter-facebook)
> The Facebook starter kit contains all the code necessary to stand up a Facebook bot on either Facebook Messenger, or Facebook Work Chat. With just a few pieces of configuration, set up a bot that automatically responds to messages sent to your Facebook page.
> #### [![Remix on Glitch](docs/glitch.png)](https://glitch.com/edit/#!/import/github/howdyai/botkit-starter-facebook)

# Developer & Support Community

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 4500 members strong, [our open Slack group](http://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

We also host a [regular meetup and annual conference called TALKABOT.](http://talkabot.ai)
Come meet and learn from other bot developers! [Full video of our 2016 event is available on Youtube.](https://www.youtube.com/playlist?list=PLD3JNfKLDs7WsEHSal2cfwG0Fex7A6aok)



# Botkit Core Library

Botkit is designed around the idea of giving developers a language-like interface for building bots.
Instead of dealing directly with messaging platform protocols and APIs, Botkit provides semantic functions
designed around the normal parts of human conversation: _hearing things_ and _saying things_.

On top of these basic build blocks, Botkit offers a powerful system for creating and managing dynamic
conversational interfaces, and tapping into cutting edge technology like artificial intelligence (AI)
and natural language understanding (NLP/NLU) tools.

Practically speaking, this results in code that looks like this:

```javascript
// respond when a user sends a DM to the bot that says "hello"
controller.hears('hello', 'direct_message', function(bot, message) {
    bot.reply(message, 'Hello human.');
});
```

All Botkit bots, built for any platform, use these same building blocks. This means developers are not required
to learn the intricacies of each platform, and can build bots that port easily between them.

Botkit can be used to build a stand-alone application, or it can be integrated into existing Node.js
apps to offer a bot experience, or to send application notifications into messaging apps. It is released
under the [MIT open source license](LICENSE.md), which means developers are free to use it any way they choose,
in any type of project.


## Install Botkit from NPM or Github

Botkit is available via NPM.

```bash
npm install --save botkit
```

You can also check out Botkit directly from Git.
If you want to use the example code and included bots, it may be preferable to use Github over NPM.

```bash
git clone git@github.com:howdyai/botkit.git
```

After cloning the Git repository, you have to install the node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.
```bash
npm install
```

Use the `--production` flag to skip the installation of devDependencies from Botkit. Useful if you just wish to run the example bot.
```bash
npm install --production
```

## Documentation

* [Get Started](docs/readme.md)
* [Botkit Studio API](docs/readme-studio.md)
* [Function index](docs/readme.md#developing-with-botkit)
* [Extending Botkit with Plugins and Middleware](docs/middleware.md)
  * [List of current plugins](docs/readme-middlewares.md)
* [Storing Information](docs/storage.md)
* [Logging](docs/logging.md)
* Platforms
  * [Slack](docs/readme-slack.md)
  * [Cisco Spark](docs/readme-ciscospark.md)
  * [Facebook Messenger](docs/readme-facebook.md)
  * [Twilio IPM](docs/readme-twilioipm.md)
  * [Microsoft Bot Framework](docs/readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](CONTRIBUTING.md)
  * [Building Middleware/plugins](docs/howto/build_middleware.md)
  * [Building platform connectors](docs/howto/build_connector.md)

# About Botkit

Botkit is a product of [Howdy](https://howdy.ai).

For support, check out [the Developer Community](#developer--support-community) and find our team in the #Botkit channel.
