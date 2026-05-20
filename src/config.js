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
