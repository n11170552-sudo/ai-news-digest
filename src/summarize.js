const { Anthropic } = require('@anthropic-ai/sdk');
const config = require('./config');

const MAX_CONTENT_CHARS = 500;

const client = new Anthropic({
  baseURL: config.anthropic.baseURL,
  apiKey: config.anthropic.apiKey
});

function validateArticle(article) {
  if (!article || typeof article !== 'object') {
    throw new TypeError('article must be an object');
  }
  if (typeof article.title !== 'string' || !article.title.trim()) {
    throw new TypeError('article.title must be a non-empty string');
  }
}

async function summarizeOne(article) {
  validateArticle(article);

  const isChinese = article.lang === 'zh';
  const content = typeof article.rawContent === 'string'
    ? article.rawContent.slice(0, MAX_CONTENT_CHARS)
    : '';

  const prompt = isChinese
    ? `请将以下中文AI新闻精简为50字以内的摘要，保留英文专业术语。\n\n标题：${article.title}\n内容：${content}\n\n请严格按以下格式回复：\n标签：产品发布/研究进展/开源动态/其他（四选一）\n摘要：<50字中文摘要>`
    : `请将以下英文AI新闻翻译成中文摘要（50字以内），专业术语保留英文（如RLHF、MoE、Transformer）。\n\n标题：${article.title}\n内容：${content}\n\n请严格按以下格式回复：\n标签：产品发布/研究进展/开源动态/其他（四选一）\n摘要：<50字中文摘要>`;

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const text = textBlock ? textBlock.text : '';
    const tagMatch = text.match(/标签：(.+)/);
    const summaryMatch = text.match(/摘要：(.+)/);

    return {
      tag: tagMatch ? tagMatch[1].trim() : '综合',
      summary: summaryMatch ? summaryMatch[1].trim() : '[摘要生成失败]'
    };
  } catch (err) {
    console.error(`  Summarize failed: "${article.title.slice(0, 40)}" — ${err.message}`);
    return { tag: '综合', summary: '[摘要生成失败]' };
  }
}

async function summarizeAll(articles) {
  const results = [];
  for (let i = 0; i < articles.length; i++) {
    const title = articles[i].title || '(untitled)';
    console.log(`  Summarizing ${i + 1}/${articles.length}: ${title.slice(0, 50)}`);
    const enriched = await summarizeOne(articles[i]);
    results.push({ ...articles[i], ...enriched });
  }
  return results;
}

module.exports = { summarizeAll, summarizeOne };
