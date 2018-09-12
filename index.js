// Registering bugsnag at the entry point catches *every* possible error
const bugsnag = require('bugsnag');
bugsnag.register(process.env.BUGSNAG_TOKEN);

module.exports = require('./src');
