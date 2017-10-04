const Botkit = require(__dirname + '/CoreBot.js')

const request = require('request')
const crypto = require('crypto')

function LineBot(configuration) {
	// const api_host =
	
	const line_bot = Botkit(configuration || {}) 

	line_bot.defineBot(function(botkit, config) {
		
		const bot = {
			type: 'line',
			botkit,
			config: config || {},
			utterances: botkit.utterances
		}

		bot.send = function(message, cb) {

		}
	})
	
}
