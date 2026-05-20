const { fetchAll } = require('./src/fetch');
const { summarizeAll } = require('./src/summarize');
const { buildEmail } = require('./src/template');
const { send } = require('./src/email');

async function main() {
  console.log('AI News Digest — starting...\n');

  console.log('[1/4] Fetching news...');
  const articles = await fetchAll();
  if (articles.length === 0) {
    console.error('No articles fetched. Aborting.');
    process.exit(1);
  }

  console.log(`\n[2/4] Summarizing ${articles.length} articles...`);
  const summarized = await summarizeAll(articles);

  const now = new Date();
  console.log(`\n[3/4] Building email...`);
  const html = buildEmail(summarized, now);

  console.log(`[4/4] Sending email...`);
  await send(html, now);

  console.log(`\nDone! ${summarized.length} articles sent.`);
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
