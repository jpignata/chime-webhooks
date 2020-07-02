const axios = require('axios');
const webhookUrl = process.env.WEBHOOK_URL;

axios.defaults.headers.post['Content-Type'] = 'application/json';

exports.github = async function(event) {
  const { action, pull_request, repository, review } = JSON.parse(event.body);
  const pullRequestTitle = pull_request.title;
  const pullRequestBody = pull_request.body;
  const pullRequestActor = sender.login;
  const pullRequestUrl = pull_request.html_url;
  const pullRequestMerged = pull_request.merged;
  const repositoryName = repository.name;

  if (action === 'submitted' && review.state === 'approved') {
    const reviewer = review.user.login;
    const reviewUrl = review.html_url;

    await say(`/md *${repositoryName}* — ${reviewer} **approved** [${pullRequestTitle}](${reviewUrl})`);
  } else if (action === 'opened') {
    await say(`/md *${repositoryName}* — ${pullRequestActor} **opened** [${pullRequestTitle}](${pullRequestUrl})\n\n---\n\n${pullRequestBody}`);
  } else if (action === 'closed' && pullRequestMerged === true) {
    await say(`/md *${repositoryName}* — ${pullRequestActor} **merged** [${pullRequestTitle}](${pullRequestUrl})`);
  }

  return { 'statusCode': 200 };
}

async function say(message) {
  await axios.post(webhookUrl, {
    Content: message,
  });
}
