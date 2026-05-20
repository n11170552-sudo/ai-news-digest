# AI News Daily Digest — Design Spec

**Date:** 2026-05-20
**Status:** Draft

## Overview

每天 9:00 自动抓取 AI 新闻 → DeepSeek 翻译摘要 → Gmail 发送早报邮件。

## Architecture

```
GitHub Actions cron (北京时间 9:00)
  ↓
index.js 入口
  ↓
src/fetch.js     → RSS 抓取 5 个新闻源
src/summarize.js → DeepSeek API 翻译 + 摘要
src/email.js     → Gmail SMTP 发送 HTML 邮件
src/config.js    → 新闻源列表 + 邮箱 + API 配置
```

## News Sources

| # | Source | RSS URL | Language |
|---|--------|---------|----------|
| 1 | TechCrunch AI | `https://techcrunch.com/category/artificial-intelligence/feed/` | EN |
| 2 | The Verge AI | `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` | EN |
| 3 | MIT Tech Review | `https://www.technologyreview.com/feed/` | EN |
| 4 | 机器之心 | `https://www.jiqizhixin.com/rss` | ZH |
| 5 | 量子位 | `https://www.qbitai.com/feed` | ZH |

Each source: fetch latest 3-5 articles → deduplicate → top 10.

## AI Summarization

- **API:** DeepSeek Anthropic-compatible endpoint (already in use by user)
- **Prompt rules:**
  - 50 字以内中文摘要
  - Preserve English technical terms (RLHF, MoE, Transformer, etc.)
  - Classify into 3 tags: 产品发布 / 研究进展 / 开源动态
  - Chinese sources: condense only, don't re-translate

## Email Format

- **Subject:** 🤖 AI 新闻早报 | YYYY年M月D日
- **Body:** HTML, each news item: tag + title + 50-char summary + source link
- **Footer:** crawl timestamp + unsubscribe note

## Email Sending

- **Method:** nodemailer + Gmail SMTP
- **SMTP:** smtp.gmail.com:587 (TLS)
- **Auth:** Gmail App Password (not regular password)
- **From:** user's Gmail
- **To:** target email (configurable)

## Scheduling

- **Platform:** GitHub Actions
- **Cron:** `0 1 * * *` (UTC 01:00 = Beijing 09:00)
- **Runtime:** Node.js 24
- **Secrets:** `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `TO_EMAIL`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`

## File Structure

```
ai-news-digest/
├── .github/workflows/daily.yml
├── src/
│   ├── fetch.js
│   ├── summarize.js
│   ├── email.js
│   └── config.js
├── index.js
├── package.json
└── README.md
```

## Error Handling

- RSS fetch timeout: 10s per source, skip if fails, continue with remaining
- AI API failure: retry once, skip summarization for that item if still fails, fallback to raw title
- SMTP failure: log error, GitHub Actions job marked as failed (GitHub sends notification)

## Setup Steps (user manual)

1. Enable Gmail 2FA → generate App Password at https://myaccount.google.com/apppasswords
2. Create GitHub repo → Settings → Secrets → add all 6 secrets
3. Push code → GitHub Actions auto-starts on schedule
4. Can manually trigger first run via Actions tab → "Run workflow"
