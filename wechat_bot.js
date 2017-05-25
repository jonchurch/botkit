

var Botkit = require('botkit')

var controller = Botkit.wechatbot({
    access_token = process.env.access_token,
    app_secret = process.env.app_secret,

})

var bot = controller.spawn({})

controller.setupWebserver(80, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
    console.log('Online!')})
})

controller.hears('hi', 'message_received', function(bot, message) {
    bot.reply(message, 'Ni hao!')
})
