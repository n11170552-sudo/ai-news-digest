function buildEmail(articles, date) {
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  const items = articles.map(a => `
    <tr>
      <td style="padding:16px;border-bottom:1px solid #e8eaed">
        <span style="background:#e8f0fe;color:#1a73e8;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500">${a.tag}</span>
        <div style="margin:10px 0 4px;font-size:16px;font-weight:600;color:#202124;line-height:1.4">${a.title}</div>
        <div style="color:#5f6368;margin:4px 0;font-size:14px;line-height:1.5">${a.summary}</div>
        <a href="${a.url}" style="color:#1a73e8;font-size:13px;text-decoration:none">${a.source} →</a>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f8f9fa">
  <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
    <h1 style="color:#202124;font-size:22px;margin:0 0 4px">🤖 AI 新闻早报</h1>
    <p style="color:#9aa0a6;font-size:13px;margin:0 0 20px">${dateStr}</p>
    <div style="border-top:3px solid #1a73e8;margin:0 0 8px"></div>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    <p style="color:#9aa0a6;font-size:12px;margin:24px 0 0;text-align:center;line-height:1.8">
      ⏱️ 抓取时间：${date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} CST<br>
      📬 由 AI News Digest 自动发送
    </p>
  </div>
</body>
</html>`;
}

function buildSubject(date) {
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  return `🤖 AI 新闻早报 | ${dateStr}`;
}

module.exports = { buildEmail, buildSubject };
