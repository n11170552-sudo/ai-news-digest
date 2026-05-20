# AI News Daily Digest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Actions cron job that fetches AI news from 5 RSS sources, summarizes them via DeepSeek API in Chinese, and sends a formatted HTML email via Gmail SMTP every morning at 9:00 Beijing time.

**Architecture:** Single Node.js script orchestrated by GitHub Actions cron. Four modules (fetch, summarize, template, email) with a config module and main entry point. Each module is independently testable.

**Tech Stack:** Node.js 24, rss-parser, @anthropic-ai/sdk, nodemailer, GitHub Actions

---

### Task 1: Project Scaffold

**Goal:** Initialize the project with package.json, .gitignore, and directory structure.

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `src/` directory

**Acceptance Criteria:**
- [ ] `npm install` succeeds without errors
- [ ] Dependencies installed: rss-parser, @anthropic-ai/sdk, nodemailer
- [ ] `node --check index.js` passes (even with empty file)

**Verify:** `npm install && node -e "require('rss-parser'); require('@anthropic-ai/sdk'); require('nodemailer'); console.log('OK')"` → prints OK

**Steps:**

- [ ] **Step 1: Create package.json**

```json
{
  "name": "ai-news-digest",
  "version": "1.0.0",
  "description": "Daily AI news digest via email",
  "type": "commonjs",
  "scripts": {
    "start": "node index.js",
    "test": "node test/manual.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "nodemailer": "^6.10.0",
    "rss-parser": "^3.13.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.env
```

- [ ] **Step 3: Create src/ directory**

```bash
mkdir -p src
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: scaffold project with dependencies"
```

---

### Task 2: Config Module

**Goal:** Centralize all configuration — news sources, email settings, AI API params — read from env vars where sensitive.

**Files:**
- Create: `src/config.js`

**Acceptance Criteria:**
- [ ] Exports `sources` array with 5 RSS feeds (name, url, lang)
- [ ] Exports `email` object with from/to/smtp using env vars
- [ ] Exports `anthropic` object with baseURL/apiKey/model from env vars
- [ ] Exports `maxArticlesPerSource` (3) and `maxTotalArticles` (10)

**Verify:** `node -e "const c = require('./src/config'); console.log(c.sources.length, c.maxTotalArticles)"` → prints `5 10`

**Steps:**

- [ ] **Step 1: Write src/config.js**

```js
module.exports = {
  sources: [
    {
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      lang: 'en'
    },
    {
      name: 'The Verge AI',
      url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
      lang: 'en'
    },
    {
      name: 'MIT Tech Review',
      url: 'https://www.technologyreview.com/feed/',
      lang: 'en'
    },
    {
      name: '机器之心',
      url: 'https://www.jiqizhixin.com/rss',
      lang: 'zh'
    },
    {
      name: '量子位',
      url: 'https://www.qbitai.com/feed',
      lang: 'zh'
    }
  ],

  maxArticlesPerSource: 3,
  maxTotalArticles: 10,

  email: {
    from: process.env.GMAIL_USER,
    to: process.env.TO_EMAIL,
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    }
  },

  anthropic: {
    baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic',
    apiKey: process.env.ANTHROPIC_AUTH_TOKEN,
    model: process.env.ANTHROPIC_MODEL || 'deepseek-v4-pro'
  }
};
```

- [ ] **Step 2: Verify the module**

```bash
node -e "const c = require('./src/config'); console.log(c.sources.length, c.maxTotalArticles)"
```

- [ ] **Step 3: Commit**

```bash
git add src/config.js
git commit -m "feat: add config module with 5 RSS sources and env-based settings"
```

---

### Task 3: RSS Fetch Module

**Goal:** Fetch RSS feeds from all configured sources, parse articles, deduplicate by URL, return top N.

**Files:**
- Create: `src/fetch.js`

**Acceptance Criteria:**
- [ ] `fetchAll()` returns array of articles with `{title, url, source, lang, rawContent}`
- [ ] Each source limited to `maxArticlesPerSource` (3)
- [ ] Total limited to `maxTotalArticles` (10)
- [ ] Deduplicates by URL
- [ ] Single source failure does not crash entire fetch

**Verify:** `node -e "const {fetchAll} = require('./src/fetch'); fetchAll().then(a => console.log(a.length, a[0].title))"` → prints article count and first title

**Steps:**

- [ ] **Step 1: Write src/fetch.js**

```js
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
```

- [ ] **Step 2: Run a fetch test**

```bash
node -e "const {fetchAll} = require('./src/fetch'); fetchAll().then(a => { console.log('OK:', a.length, 'articles'); a.forEach(x => console.log(' -', x.title.slice(0, 60))); })"
```

- [ ] **Step 3: Commit**

```bash
git add src/fetch.js
git commit -m "feat: add RSS fetch module with 5 sources and dedup"
```

---

### Task 4: AI Summarize Module

**Goal:** Call DeepSeek Anthropic API to translate/summarize each article into Chinese (≤50 chars) with a category tag, preserving English technical terms.

**Files:**
- Create: `src/summarize.js`

**Acceptance Criteria:**
- [ ] `summarizeAll(articles)` returns articles enriched with `{tag, summary}`
- [ ] Chinese sources are condensed, not re-translated
- [ ] English sources are translated to Chinese with tech terms preserved
- [ ] API failure on one article skips that item with fallback, does not crash batch

**Verify:** `node -e "const {summarizeAll} = require('./src/summarize'); summarizeAll([{title:'GPT-5 released',rawContent:'OpenAI announced GPT-5 with video reasoning',lang:'en',url:'http://x.com',source:'Test'}]).then(r => console.log(r[0]))"` → prints article with tag and summary fields

**Steps:**

- [ ] **Step 1: Write src/summarize.js**

```js
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

    const text = response.content[0].text;
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
```

- [ ] **Step 2: Run a single-article test**

```bash
node -e "const {summarizeAll} = require('./src/summarize'); summarizeAll([{title:'GPT-5 released',rawContent:'OpenAI announced GPT-5',lang:'en',url:'http://x.com',source:'Test'}]).then(r => { const a=r[0]; console.log('tag:', a.tag, '| summary:', a.summary); })"
```

- [ ] **Step 3: Commit**

```bash
git add src/summarize.js
git commit -m "feat: add AI summarize module via DeepSeek API"
```

---

### Task 5: Email HTML Template

**Goal:** Generate the HTML email body from summarized articles with proper styling.

**Files:**
- Create: `src/template.js`

**Acceptance Criteria:**
- [ ] `buildEmail(articles, date)` returns valid HTML string
- [ ] Each article rendered with tag badge, title, summary, source link
- [ ] Subject line formatted as `🤖 AI 新闻早报 | YYYY年M月D日`
- [ ] Footer contains crawl timestamp

**Verify:** `node -e "const {buildEmail} = require('./src/template'); const h = buildEmail([{title:'Test',summary:'test',tag:'产品发布',url:'http://x.com',source:'Test'}], new Date()); console.log(h.includes('产品发布'), h.includes('Test'), h.includes('AI 新闻早报'))"` → prints `true true true`

**Steps:**

- [ ] **Step 1: Write src/template.js**

```js
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
```

- [ ] **Step 2: Verify the template renders correctly**

```bash
node -e "const {buildEmail,buildSubject} = require('./src/template'); const h = buildEmail([{title:'GPT-5发布',summary:'OpenAI发布新一代模型',tag:'产品发布',url:'http://x.com',source:'Test'}], new Date()); console.log(buildSubject(new Date())); console.log(h.includes('产品发布'), h.includes('GPT-5发布'), h.length > 100)"
```

- [ ] **Step 3: Commit**

```bash
git add src/template.js
git commit -m "feat: add HTML email template with Gmail-compatible styling"
```

---

### Task 6: Email Send Module

**Goal:** Send formatted HTML email via Gmail SMTP using nodemailer.

**Files:**
- Create: `src/email.js`

**Acceptance Criteria:**
- [ ] `send(html, date)` sends email with correct subject, HTML body, from/to addresses
- [ ] Uses `buildSubject()` from template module for subject line
- [ ] SMTP connection uses TLS on port 587

**Verify:** `node -e "const {send} = require('./src/email'); send('<h1>Test</h1>', new Date()).then(() => console.log('OK')).catch(e => console.error(e.message))"` → prints OK (requires valid env vars) or descriptive error

**Steps:**

- [ ] **Step 1: Write src/email.js**

```js
const nodemailer = require('nodemailer');
const config = require('./config');
const { buildSubject } = require('./template');

const transporter = nodemailer.createTransport(config.email.smtp);

async function send(html, date) {
  const info = await transporter.sendMail({
    from: `AI News Digest <${config.email.from}>`,
    to: config.email.to,
    subject: buildSubject(date),
    html
  });
  console.log(`  Message sent: ${info.messageId}`);
}

module.exports = { send };
```

- [ ] **Step 2: Verify SMTP connection (optional, needs env vars)**

```bash
node -e "const {send} = require('./src/email'); send('<h1>Test</h1>', new Date()).then(() => console.log('OK')).catch(e => console.error(e.message))"
```

- [ ] **Step 3: Commit**

```bash
git add src/email.js
git commit -m "feat: add email send module via Gmail SMTP"
```

---

### Task 7: Main Entry Point

**Goal:** Orchestrate the full pipeline — fetch → summarize → build email → send.

**Files:**
- Create: `index.js`

**Acceptance Criteria:**
- [ ] Running `node index.js` executes the full pipeline
- [ ] Each step logs progress to console
- [ ] Errors are caught and logged, process exits with code 1 on failure
- [ ] Works end-to-end with valid env vars

**Verify:** `node index.js` → prints fetch/summarize/send progress and `Done!` (with valid env vars)

**Steps:**

- [ ] **Step 1: Write index.js**

```js
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
```

- [ ] **Step 2: Verify the script runs (may fail at send without env vars — that's expected)**

```bash
node --check index.js && echo "Syntax OK"
```

- [ ] **Step 3: Commit**

```bash
git add index.js
git commit -m "feat: add main entry point orchestrating fetch→summarize→email pipeline"
```

---

### Task 8: GitHub Actions Workflow

**Goal:** Schedule the script to run daily at 9:00 AM Beijing time via GitHub Actions, with manual trigger support.

**Files:**
- Create: `.github/workflows/daily.yml`

**Acceptance Criteria:**
- [ ] Cron schedule: `0 1 * * *` (UTC 1:00 = Beijing 9:00)
- [ ] `workflow_dispatch` allows manual trigger from Actions tab
- [ ] All 6 secrets passed as env vars
- [ ] Uses Node.js 24, runs `npm ci` then `node index.js`

**Verify:** Push to GitHub → Actions tab → "Run workflow" → job succeeds (with valid secrets)

**Steps:**

- [ ] **Step 1: Create .github/workflows/ directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write .github/workflows/daily.yml**

```yaml
name: Daily AI News Digest

on:
  schedule:
    - cron: '0 1 * * *'
  workflow_dispatch:

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm ci
      - run: node index.js
        env:
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
          TO_EMAIL: ${{ secrets.TO_EMAIL }}
          ANTHROPIC_BASE_URL: ${{ secrets.ANTHROPIC_BASE_URL }}
          ANTHROPIC_AUTH_TOKEN: ${{ secrets.ANTHROPIC_AUTH_TOKEN }}
          ANTHROPIC_MODEL: ${{ secrets.ANTHROPIC_MODEL }}
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/daily.yml
git commit -m "ci: add GitHub Actions cron for daily 9am Beijing time"
```

---

### Task 9: README & Setup Guide

**Goal:** Document setup instructions so the project can be reused or handed off.

**Files:**
- Create: `README.md`

**Acceptance Criteria:**
- [ ] Covers Gmail App Password setup steps
- [ ] Lists all 6 GitHub Secrets with descriptions
- [ ] Shows how to manually trigger first run
- [ ] Documents local testing procedure

**Verify:** Read through README — a new user should be able to set up from scratch

**Steps:**

- [ ] **Step 1: Write README.md**

```markdown
# AI News Daily Digest

每天早上 9:00（北京时间）自动抓取 AI 新闻并发送早报邮件。

## 新闻源

| 来源 | 语言 |
|------|------|
| TechCrunch AI | EN |
| The Verge AI | EN |
| MIT Technology Review | EN |
| 机器之心 | ZH |
| 量子位 | ZH |

## 快速开始

### 1. Gmail 配置

1. 开启 Gmail 两步验证：https://myaccount.google.com/security
2. 生成应用专用密码：https://myaccount.google.com/apppasswords
   - 选择 "Mail" → "其他"，命名为 "AI News Digest"
   - 保存生成的 16 位密码

### 2. GitHub Secrets

在仓库 Settings → Secrets and variables → Actions → New repository secret：

| Secret | 说明 |
|--------|------|
| `GMAIL_USER` | 发件 Gmail 地址 |
| `GMAIL_APP_PASSWORD` | Gmail 应用专用密码（16位） |
| `TO_EMAIL` | 收件邮箱地址 |
| `ANTHROPIC_BASE_URL` | Anthropic API 地址 |
| `ANTHROPIC_AUTH_TOKEN` | API 密钥 |
| `ANTHROPIC_MODEL` | 模型名称 |

### 3. 手动测试

在 Actions 标签页 → "Daily AI News Digest" → "Run workflow"

### 4. 本地测试

```bash
cp .env.example .env
# 编辑 .env 填入真实值
source .env
npm install
node index.js
```
```

- [ ] **Step 2: Create .env.example**

```
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
TO_EMAIL=target@example.com
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
ANTHROPIC_AUTH_TOKEN=sk-xxxxxxxx
ANTHROPIC_MODEL=deepseek-v4-pro
```

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add README with setup guide and .env.example"
```

---

### Task 10: End-to-End Validation

**Goal:** Verify the complete pipeline works by running index.js locally (with env vars) and confirming all 4 stages complete.

**Files:**
- None (verification only)

**Acceptance Criteria:**
- [ ] All 5 RSS sources produce articles
- [ ] Summaries are generated for each article
- [ ] HTML email is rendered correctly
- [ ] Email arrives in target inbox

**Verify:** `node index.js` → prints progress for all 4 stages → check inbox

**Steps:**

- [ ] **Step 1: Set env vars**

```bash
export GMAIL_USER=your@gmail.com
export GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
export TO_EMAIL=target@example.com
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-xxxxxxxx
export ANTHROPIC_MODEL=deepseek-v4-pro
```

- [ ] **Step 2: Run full pipeline**

```bash
node index.js
```

- [ ] **Step 3: Verify email received**

Check inbox for email with subject `🤖 AI 新闻早报 | YYYY年M月D日`

- [ ] **Step 4: If successful, push to GitHub**

```bash
git push origin main
```
