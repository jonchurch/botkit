var Botkit = require('./lib/Botkit.js');

if (!process.env.token || !process.env.port) {
    console.log('Error: Specify token and port in environment');
    process.exit(1);
}


var controller = Botkit.sparkbot({
    token: process.env.token,
    debug: true
});

controller.setupWebserver(process.env.port, function(err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);

});
