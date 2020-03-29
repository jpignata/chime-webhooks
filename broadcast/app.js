const axios = require('axios');

axios.defaults.headers.post['Content-Type'] = 'application/json';

exports.broadcast = async function(event, context) {
  await axios.post(event['WebhookUrl'], {
    Content: event['Message'],
  });

  console.log(`broadcast webhook_url=${event['WebhookUrl']} message=${event['Message']}`);
}
