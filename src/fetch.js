const Parser = require('rss-parser');
const config = require('./config');

const parser = new Parser({ timeout: 10000 });

async function fetchAll() {
  const allArticles = [];

  for (const source of config.sources) {
    try {
      const feed = await parser.parseURL(source.url);
      const articles = feed.items
        .slice(0, config.maxArticlesPerSource)
        .map(item => ({
          title: (item.title || '').trim(),
          url: item.link || '',
          source: source.name,
          lang: source.lang,
          rawContent: item.contentSnippet || item.content || ''
        }));
      allArticles.push(...articles);
      console.log(`  ${source.name}: ${articles.length} articles`);
    } catch (err) {
      console.error(`  ${source.name}: FAILED — ${err.message}`);
    }
  }

  const seen = new Set();
  const deduped = allArticles.filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  console.log(`  Total: ${deduped.length} (${allArticles.length - deduped.length} duplicates removed)`);
  return deduped.slice(0, config.maxTotalArticles);
}

module.exports = { fetchAll };
