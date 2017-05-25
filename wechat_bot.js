

var Botkit = require('./lib/Botkit.js')

var controller = Botkit.wechatbot({
    debug: true,
    access_token: process.env.access_token,
    app_secret: process.env.app_secret,

})

var bot = controller.spawn({})

controller.setupWebserver(process.env.port, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
    console.log('Online!')})
})

controller.hears('hi', 'message_received', function(bot, message) {
    console.log('=====HEARD HI WOWEEE!')
    bot.reply(message, 'Ni hao!')
})
