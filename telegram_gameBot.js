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


controller.hears(['(.*)'], 'message_received', function(bot, message) {
  // lookup user info 👍
  //  controller.storage.users.get(message.user, function(err, user) { })
  const game = {
    chat_id: message.user,
    game_short_name: 'Trumpdunk'
  }

bot.sendGame(game)

})
