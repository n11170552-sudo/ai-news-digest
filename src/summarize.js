const { Anthropic } = require('@anthropic-ai/sdk');
const config = require('./config');

const client = new Anthropic({
  baseURL: config.anthropic.baseURL,
  apiKey: config.anthropic.apiKey
});

async function summarizeOne(article) {
  const isChinese = article.lang === 'zh';

  const prompt = isChinese
    ? `请将以下中文AI新闻精简为50字以内的摘要，保留英文专业术语。\n\n标题：${article.title}\n内容：${article.rawContent.slice(0, 500)}\n\n请严格按以下格式回复：\n标签：产品发布/研究进展/开源动态/其他（四选一）\n摘要：<50字中文摘要>`
    : `请将以下英文AI新闻翻译成中文摘要（50字以内），专业术语保留英文（如RLHF、MoE、Transformer）。\n\n标题：${article.title}\n内容：${article.rawContent.slice(0, 500)}\n\n请严格按以下格式回复：\n标签：产品发布/研究进展/开源动态/其他（四选一）\n摘要：<50字中文摘要>`;

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const text = textBlock ? textBlock.text : '';
    const tagMatch = text.match(/标签：(.+)/);
    const summaryMatch = text.match(/摘要：(.+)/);

    return {
      tag: tagMatch ? tagMatch[1].trim() : '综合',
      summary: summaryMatch ? summaryMatch[1].trim() : article.title
    };
  } catch (err) {
    console.error(`  Summarize failed: "${article.title.slice(0, 40)}" — ${err.message}`);
    return { tag: '综合', summary: article.title };
  }
}

async function summarizeAll(articles) {
  const results = [];
  for (let i = 0; i < articles.length; i++) {
    console.log(`  Summarizing ${i + 1}/${articles.length}: ${articles[i].title.slice(0, 50)}`);
    const enriched = await summarizeOne(articles[i]);
    results.push({ ...articles[i], ...enriched });
  }
  return results;
}

module.exports = { summarizeAll };
