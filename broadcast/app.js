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
  console.log(request);

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
    return { 'statusCode': 500 };
  }

  return { 'statusCode': 200 };
}

exports.github = async function(event, context) {
  const request = JSON.parse(event.body);
  console.log(request);

  if ('review' in request) {
    const { review, repository, action, pull_request } = request
    const { html_url, state, user, body } = review;
    const title = pull_request.title;
    const login = user.login;
    const repo = repository.name;

    if (action === 'submitted') {
      await announceNewPullRequestReview(login, title, body, state, repo, html_url);
    }
  } else if ('pull_request' in request) {
    const { pull_request, repository } = request
    const { title, html_url, user, body } = pull_request;
    const login = user.login;
    const repo = repository.name;

    if (request.action === 'opened') {
      await announceNewPullRequest(login, title, repo, body, html_url);
    } else if (request.action === 'closed' && request.merged === true) {
      await announceMergedPullRequest(login, title, repo, html_url);
    }
  } 

  return { 'statusCode': 200 };
}

async function announceNewPullRequest(login, title, repo, body, html_url) {
  await say(`/md [[*${repo}*]] ${login} opened [${title}](${html_url})\n\n---\n\n${body}`);
}

async function announceMergedPullRequest(login, title, repo, html_url) {
  await say(`/md [[*${repo}*]] ${login} merged [${title}](${html_url})`);
}

async function announceNewPullRequestReview(login, title, body, state, repo, html_url) {
  let action;

  if (state === 'approved') {
    action = 'approved';
  } else if (state === 'REQUEST_CHANGES') {
    action = 'requested changes in';
  } else {
    action = 'commented on';
  }

  await say(`/md [[*${repo}*]] ${login} ${action} [${title}](${html_url})\n\n---\n\n${body}`);
}

async function say(message) {
  await axios.post(webhookUrl, {
    Content: message,
  });
}