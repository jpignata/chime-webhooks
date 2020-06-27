const axios = require('axios');
const webhookUrl = process.env.WEBHOOK_URL;

axios.defaults.headers.post['Content-Type'] = 'application/json';

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