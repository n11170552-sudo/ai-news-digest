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

### 3. 手动触发

在 Actions 标签页 → "Daily AI News Digest" → "Run workflow"

### 4. 本地测试

```bash
cp .env.example .env
# 编辑 .env 填入真实值
source .env
npm install
node index.js
```
