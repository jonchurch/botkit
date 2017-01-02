

var Botkit = require('./lib/Botkit.js')

var controller = Botkit.googlehomebot({
    debug: true,

})

var bot = controller.spawn()

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {

    controller.createWebhookEndpoints(webserver, bot)

})

controller.on('assistant.intent.action.MAIN', function(assistant) {
    console.log('=============HEARD MAIN INTENT')

    var message = assistant.buildInputPrompt(false, 'I can tell you if something is known to be bad for dogs!', ['Ask me if something is bad for dogs', 'Did your dog eat something weird?', 'Hello? I can help you find out if something is bad for your dog'])

    assistant.ask(message)
})


controller.on('assistant.intent.action.TEXT', function(assistant) {
    console.log('=========HEARD TEXT INTENT!')

    if (assistant.getRawInput() === 'bye') {
        assistant.tell('Goodbye!');
    }

    // var message = assistant.buildInputPrompt(false, 'I am pretty sure that pizza is good for dogs. Spaghetti too.')

    assistant.tell('I am pretty sure that pizza is good for dogs. Spaghetti too.')
})

controller.on('ask_if_bad', function(assistant) {
    console.log('==============BAD FOR DOG ASK!!!');
    var message = assistant.buildInputPrompt(false, 'I am pretty sure that pizza is good for dogs. Ravioli too.')

    assistant.tell('You asked if something is bad for your dog')

})
