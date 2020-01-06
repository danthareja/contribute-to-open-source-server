const events = require('./events');

module.exports = async function handle(event) {
  const type = event.headers['X-Buildkite-Event'];
  console.log(`Processing Buildkite event: ${type}`);

  if (!events[type]) {
    throw new Error(
      `Buildkite event ${type} not implemented. Please an implementation in events/ or uncheck it from the repo's webhook settings.`
    );
  }

  return events[type](event.body);
};
