const NEWSLETTER_TITLE = 'AI 新闻早报';

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function buildEmail(articles, date) {
  if (!Array.isArray(articles)) throw new TypeError('articles must be an array');
  if (!(date instanceof Date)) throw new TypeError('date must be a Date object');

  const dateStr = formatDate(date);

  const items = articles.length === 0
    ? '<tr><td style="padding:24px;text-align:center;color:#9aa0a6;font-size:16px">今日暂无 AI 新闻</td></tr>'
    : articles.map(a => `
    <tr>
      <td style="padding:16px;border-bottom:1px solid #e8eaed">
        <span style="background:#e8f0fe;color:#1a73e8;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500">${escapeHtml(a.tag)}</span>
        <div style="margin:10px 0 4px;font-size:16px;font-weight:600;color:#202124;line-height:1.4">${escapeHtml(a.title)}</div>
        <div style="color:#5f6368;margin:4px 0;font-size:14px;line-height:1.5">${escapeHtml(a.summary)}</div>
        <a href="${escapeHtml(a.url)}" style="color:#1a73e8;font-size:13px;text-decoration:none">${escapeHtml(a.source)} &rarr;</a>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f8f9fa">
  <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
    <h1 style="color:#202124;font-size:22px;margin:0 0 4px"><span aria-hidden="true">🤖</span> ${escapeHtml(NEWSLETTER_TITLE)}</h1>
    <p style="color:#9aa0a6;font-size:13px;margin:0 0 20px">${escapeHtml(dateStr)}</p>
    <div style="border-top:3px solid #1a73e8;margin:0 0 8px"></div>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    <p style="color:#9aa0a6;font-size:12px;margin:24px 0 0;text-align:center;line-height:1.8">
      <span aria-hidden="true">⏱️</span> 抓取时间：${escapeHtml(date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))} CST<br>
      <span aria-hidden="true">📬</span> 由 ${escapeHtml(NEWSLETTER_TITLE)} 自动发送
    </p>
  </div>
</body>
</html>`;
}

function buildSubject(date) {
  const dateStr = formatDate(date);
  return `🤖 ${NEWSLETTER_TITLE} | ${dateStr}`;
}

module.exports = { buildEmail, buildSubject };
