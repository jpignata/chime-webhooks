const axios = require('axios');
const webhookUrl = process.env.WEBHOOK_URL;

axios.defaults.headers.post['Content-Type'] = 'application/json';

exports.custom_message = async function(event, context) {
  await axios.post(webhookUrl, {
    Content: event['Message'],
  });

  console.log(`custom_message webhook_url=${webhookUrl} message=${event['Message']}`);
}

exports.status_page = async function(event, context) {
  const request = JSON.parse(event.body);

  if (!('incident' in request)) {
    return { 'statusCode': 200 };
  }

  let response;

  try {
    const url = `https://${request.page.id}.statuspage.io/api/v2/summary.json`;
    response = await axios.get(url);
  } catch (error) {
    console.log(`statuspage error=${error}`);
    return { 'statusCode': 500 };
  }

  const pageName = response.data.page.name
  const incidentName = request.incident.name;
  const url = request.incident.shortlink;
  const status = request.incident.status;
  const updates = request.incident.incident_updates;

  if (updates.length != 1) {
    return { 'statusCode': 200 };
  }

  const update = updates.sort((a, b) => b.updated_at - a.updated_at)[0];

  try {
    await axios.post(webhookUrl, {
      Content: `/md **${pageName}** [${incidentName}](${url}) (${status})\n\n ${update.body}`,
    });
  } catch (error) {
    console.log(`statuspage error=${error}`);
    console.log(request)
    return { 'statusCode': 500 };
  }

  return { 'statusCode': 200 };
}
