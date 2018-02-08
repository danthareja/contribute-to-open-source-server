// Registering bugsnag at the entry point catches *every* possible error
const bugsnag = require('bugsnag');
bugsnag.register(process.env.BUGSNAG_TOKEN);

module.exports.handleGitHubWebhook = require('./hooks/github');
module.exports.handleCircleCIWebhook = require('./hooks/circleci');
module.exports.handleCleanupTask = require('./tasks/cleanup');
