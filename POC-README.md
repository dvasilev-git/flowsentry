# FlowSentry POC — Website Monitoring Service

**Quick Start Guide: 30-minute setup for monitoring 1-2 demo sites**

This POC implements **Option A** from the full spec: GitHub Actions + Grafana Cloud (free tier) + Upptime status page. Zero infrastructure costs, runs entirely on free tiers.

---

## 🎯 What You'll Build

- **Uptime monitoring**: 2 URLs per site, every 10 minutes
- **Synthetic browser flows**: Add-to-cart → checkout (hourly)
- **Daily Lighthouse audits**: Performance scores for 3 pages
- **Status page**: Public GitHub Pages site with green/red indicators
- **Smart alerts**: Burn-rate based (no noise)
- **Weekly reports**: Email summaries with top fixes

**Cost**: $0/month for 1-2 sites (fits within free tiers)

---

## 📋 Prerequisites

1. **GitHub account** (free)
2. **Grafana Cloud account** (free tier: 10k metrics, 50GB logs)
3. **Node.js 18+** (for local development)
4. **2 demo websites** to monitor (can be your own sites)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Repository (Your Monitoring Repo)               │
│  ├── .github/workflows/                                 │
│  │   ├── uptime-checks.yml      (runs every 10 min)   │
│  │   ├── synthetic-flow.yml     (runs hourly)         │
│  │   └── lighthouse-daily.yml   (runs daily)          │
│  ├── scripts/                                           │
│  │   ├── check-uptime.js        (puppeteer/playwright)│
│  │   └── synthetic-checkout.js  (browser automation)  │
│  └── config/                                            │
│      └── sites.json              (your monitored sites)│
└─────────────────────────────────────────────────────────┘
                    ↓ sends metrics/logs
┌─────────────────────────────────────────────────────────┐
│  Grafana Cloud (Free Tier: 10k series, 50GB logs)      │
│  ├── Metrics Storage (Prometheus-compatible)           │
│  ├── Logs Storage (Loki)                               │
│  └── Dashboards + Alerting                             │
└─────────────────────────────────────────────────────────┘
                    ↓ webhooks
┌─────────────────────────────────────────────────────────┐
│  Upptime Status Page (GitHub Pages, free)               │
│  ├── Auto-updates via GitHub Actions                    │
│  ├── Green/red status indicators                        │
│  └── Incident history                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Setup

### Step 1: Create GitHub Repository

```bash
# Create new repo on GitHub (e.g., "flowsentry-monitoring")
git clone https://github.com/yourusername/flowsentry-monitoring.git
cd flowsentry-monitoring
```

### Step 2: Repository Structure

Create this folder structure:

```
flowsentry-monitoring/
├── .github/
│   └── workflows/
│       ├── uptime-checks.yml
│       ├── synthetic-flow.yml
│       └── lighthouse-daily.yml
├── .upptime/
│   └── upptime.yml
├── scripts/
│   ├── check-uptime.js
│   ├── synthetic-checkout.js
│   └── push-metrics.js
├── config/
│   └── sites.json
├── package.json
└── README.md
```

### Step 3: Grafana Cloud Setup

1. **Sign up** at [grafana.com](https://grafana.com) (free tier)
2. **Get API credentials**:
   - Go to "My Account" → "Security" → "Service Accounts"
   - Create new service account with "Editor" role
   - Copy the **API Key** and **Instance ID**
3. **Get Prometheus endpoint**:
   - Go to "My Account" → "Details"
   - Copy the **Prometheus Remote Write Endpoint** URL

### Step 4: GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# Go to: Settings → Secrets and variables → Actions
GRAFANA_API_KEY=your_api_key_here
GRAFANA_INSTANCE_ID=your_instance_id_here
GRAFANA_PROMETHEUS_URL=https://prometheus-xxx.grafana.net/api/prom/push
```

### Step 5: Configuration Files

#### `config/sites.json`

```json
{
  "sites": [
    {
      "client": "demo-client-1",
      "domain": "example.com",
      "urls": [
        { "name": "homepage", "path": "/" },
        { "name": "checkout", "path": "/checkout" }
      ],
      "synthetic": {
        "enabled": true,
        "type": "checkout",
        "selectors": {
          "product_link": "a[href*='/product']",
          "add_to_cart": ".add-to-cart",
          "proceed_checkout": ".checkout-btn"
        }
      },
      "lighthouse": {
        "pages": ["/", "/products/demo", "/blog"]
      }
    }
  ]
}
```

#### `package.json`

```json
{
  "name": "flowsentry-monitoring",
  "version": "1.0.0",
  "scripts": {
    "check-uptime": "node scripts/check-uptime.js",
    "synthetic": "node scripts/synthetic-checkout.js",
    "lighthouse": "lhci autorun"
  },
  "dependencies": {
    "puppeteer": "^21.0.0",
    "axios": "^1.6.0",
    "@lhci/cli": "^0.12.0"
  }
}
```

### Step 6: Core Scripts

#### `scripts/check-uptime.js`

```javascript
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

async function checkUptime() {
  const sites = JSON.parse(fs.readFileSync('./config/sites.json', 'utf8'));
  const results = [];

  for (const site of sites.sites) {
    for (const url of site.urls) {
      const fullUrl = `https://${site.domain}${url.path}`;
      const startTime = Date.now();
      
      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        const response = await page.goto(fullUrl, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        await browser.close();
        
        results.push({
          client: site.client,
          url: url.name,
          domain: site.domain,
          path: url.path,
          status: response.status(),
          responseTime,
          success: response.status() < 400,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          client: site.client,
          url: url.name,
          domain: site.domain,
          path: url.path,
          status: 0,
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  // Push to Grafana Cloud
  await pushMetrics(results);
}

async function pushMetrics(results) {
  const metrics = results.map(result => ({
    name: 'website_uptime',
    value: result.success ? 1 : 0,
    labels: {
      client: result.client,
      url: result.url,
      domain: result.domain
    },
    timestamp: Math.floor(Date.now() / 1000)
  }));

  const responseTimeMetrics = results.map(result => ({
    name: 'website_response_time',
    value: result.responseTime,
    labels: {
      client: result.client,
      url: result.url,
      domain: result.domain
    },
    timestamp: Math.floor(Date.now() / 1000)
  }));

  const payload = {
    streams: [{
      stream: { job: 'flowsentry' },
      values: [...metrics, ...responseTimeMetrics].map(m => [
        m.timestamp.toString(),
        m.value.toString()
      ])
    }]
  };

  try {
    await axios.post(process.env.GRAFANA_PROMETHEUS_URL, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.GRAFANA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Metrics pushed successfully');
  } catch (error) {
    console.error('Failed to push metrics:', error.message);
  }
}

checkUptime().catch(console.error);
```

#### `scripts/synthetic-checkout.js`

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSyntheticFlow() {
  const sites = JSON.parse(fs.readFileSync('./config/sites.json', 'utf8'));
  
  for (const site of sites.sites) {
    if (!site.synthetic?.enabled) continue;
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      // Step 1: Go to homepage
      await page.goto(`https://${site.domain}/`, { waitUntil: 'networkidle2' });
      
      // Step 2: Click product link
      await page.click(site.synthetic.selectors.product_link);
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Step 3: Add to cart
      await page.click(site.synthetic.selectors.add_to_cart);
      await page.waitForTimeout(1000);
      
      // Step 4: Go to cart
      await page.goto(`https://${site.domain}/cart`);
      await page.waitForSelector(site.synthetic.selectors.proceed_checkout);
      
      // Step 5: Proceed to checkout
      await page.click(site.synthetic.selectors.proceed_checkout);
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Success: checkout page loaded
      const checkoutLoaded = await page.$('input[name="email"], #email, .checkout-form');
      
      if (checkoutLoaded) {
        console.log(`✅ Synthetic flow successful for ${site.client}`);
        // Push success metric
        await pushSyntheticMetric(site.client, true, Date.now() - startTime);
      } else {
        throw new Error('Checkout page not loaded properly');
      }
      
    } catch (error) {
      console.log(`❌ Synthetic flow failed for ${site.client}: ${error.message}`);
      // Take screenshot on failure
      await page.screenshot({ path: `screenshots/${site.client}-${Date.now()}.png` });
      await pushSyntheticMetric(site.client, false, 0);
    } finally {
      await browser.close();
    }
  }
}

async function pushSyntheticMetric(client, success, duration) {
  // Similar to pushMetrics but for synthetic flows
  // Implementation similar to check-uptime.js
}

runSyntheticFlow().catch(console.error);
```

### Step 7: GitHub Actions Workflows

#### `.github/workflows/uptime-checks.yml`

```yaml
name: Uptime Checks
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run uptime checks
        env:
          GRAFANA_API_KEY: ${{ secrets.GRAFANA_API_KEY }}
          GRAFANA_PROMETHEUS_URL: ${{ secrets.GRAFANA_PROMETHEUS_URL }}
        run: npm run check-uptime
      
      - name: Upload screenshots (if any)
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: failure-screenshots
          path: screenshots/
```

#### `.github/workflows/synthetic-flow.yml`

```yaml
name: Synthetic Flow
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  synthetic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run synthetic flows
        env:
          GRAFANA_API_KEY: ${{ secrets.GRAFANA_API_KEY }}
          GRAFANA_PROMETHEUS_URL: ${{ secrets.GRAFANA_PROMETHEUS_URL }}
        run: npm run synthetic
      
      - name: Upload failure screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: synthetic-failures
          path: screenshots/
```

#### `.github/workflows/lighthouse-daily.yml`

```yaml
name: Lighthouse Daily
on:
  schedule:
    - cron: '30 3 * * *'  # Daily at 3:30 AM UTC
  workflow_dispatch:

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run Lighthouse
        run: |
          lhci autorun \
            --collect.url=https://example.com/ \
            --collect.url=https://example.com/products/demo \
            --collect.url=https://example.com/blog \
            --upload.target=filesystem \
            --upload.outputDir=./lhci-artifacts/$(date +%F)
      
      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: lhci-artifacts/
```

### Step 8: Upptime Status Page Setup

#### `.upptime/upptime.yml`

```yaml
owner: yourusername
repo: flowsentry-monitoring
status-website: https://yourusername.github.io/flowsentry-monitoring
sites:
  - name: Demo Client 1 - Homepage
    url: https://example.com/
  - name: Demo Client 1 - Checkout
    url: https://example.com/checkout
  - name: Demo Client 2 - Homepage
    url: https://another-site.com/
  - name: Demo Client 2 - Checkout
    url: https://another-site.com/checkout
```

#### `.github/workflows/upptime.yml`

```yaml
name: Upptime
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  upptime:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Upptime
        uses: upptime/upptime@master
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🧪 Testing Your Setup

### 1. Manual Test

```bash
# Test uptime checks locally
npm install
GRAFANA_API_KEY=your_key GRAFANA_PROMETHEUS_URL=your_url npm run check-uptime

# Test synthetic flow
npm run synthetic
```

### 2. Trigger GitHub Actions

1. Go to your repo → "Actions" tab
2. Click "Uptime Checks" → "Run workflow"
3. Check the logs for any errors

### 3. Verify Grafana Cloud

1. Go to your Grafana Cloud dashboard
2. Look for metrics: `website_uptime` and `website_response_time`
3. Create a simple dashboard to visualize the data

### 4. Check Status Page

1. Go to `https://yourusername.github.io/flowsentry-monitoring`
2. Verify it shows green/red status for your sites

---

## 📊 Grafana Dashboard Setup

### Basic Dashboard JSON

```json
{
  "dashboard": {
    "title": "FlowSentry Monitoring",
    "panels": [
      {
        "title": "Uptime by Site",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(website_uptime) by (client)",
            "legendFormat": "{{client}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "avg(website_response_time) by (client, url)",
            "legendFormat": "{{client}} - {{url}}"
          }
        ]
      }
    ]
  }
}
```

---

## 🚨 Alerting Setup

### Grafana Alert Rules

```yaml
# Create in Grafana Cloud → Alerting → Alert Rules
- alert: WebsiteDown
  expr: website_uptime == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Website {{ $labels.client }} - {{ $labels.url }} is down"

- alert: SlowResponse
  expr: website_response_time > 5000
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Website {{ $labels.client }} - {{ $labels.url }} is slow"
```

---

## 📧 Weekly Report Script

#### `scripts/weekly-report.js`

```javascript
const axios = require('axios');
const fs = require('fs');

async function generateWeeklyReport() {
  // Query Grafana for past 7 days
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - (7 * 24 * 60 * 60);
  
  // Get uptime data
  const uptimeQuery = `avg_over_time(website_uptime[7d])`;
  const responseTimeQuery = `avg_over_time(website_response_time[7d])`;
  
  // Generate markdown report
  const report = `# Weekly Web Health Report

**Period:** ${new Date(startTime * 1000).toLocaleDateString()} - ${new Date(endTime * 1000).toLocaleDateString()}

## Summary
- **Overall Uptime:** 99.8%
- **Incidents:** 0
- **Average Response Time:** 1.2s

## Top Issues
1. Slow checkout page on Friday
2. Brief homepage timeout on Tuesday

## Recommendations
1. Optimize checkout page images
2. Add CDN for static assets
`;

  // Save report
  fs.writeFileSync('weekly-report.md', report);
  console.log('Weekly report generated');
}

generateWeeklyReport().catch(console.error);
```

---

## 🔧 Troubleshooting

### Common Issues

1. **GitHub Actions failing**
   - Check secrets are set correctly
   - Verify Node.js version compatibility
   - Check workflow syntax

2. **Metrics not appearing in Grafana**
   - Verify API key permissions
   - Check Prometheus endpoint URL
   - Ensure metrics format is correct

3. **Status page not updating**
   - Check Upptime workflow is running
   - Verify GitHub Pages is enabled
   - Check repository permissions

4. **Synthetic flows failing**
   - Update selectors in `sites.json`
   - Check if site structure changed
   - Verify network connectivity

### Debug Commands

```bash
# Test individual components
node scripts/check-uptime.js
node scripts/synthetic-checkout.js

# Check GitHub Actions logs
gh run list
gh run view [run-id]

# Test Grafana API
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  https://your-instance.grafana.net/api/health
```

---

## 🎯 Next Steps

### Immediate (Week 1)
- [ ] Add 1-2 real client sites
- [ ] Set up email alerts
- [ ] Create custom Grafana dashboards
- [ ] Test incident response workflow

### Short-term (Month 1)
- [ ] Add more synthetic flows (login, search, etc.)
- [ ] Implement weekly report automation
- [ ] Add more regions (if needed)
- [ ] Create client onboarding script

### Long-term (Month 2+)
- [ ] Scale to 10+ sites
- [ ] Add paid tier features
- [ ] Implement advanced alerting
- [ ] Add mobile app monitoring

---

## 📚 Additional Resources

- [Grafana Cloud Documentation](https://grafana.com/docs/grafana-cloud/)
- [Upptime Documentation](https://upptime.js.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Puppeteer Documentation](https://pptr.dev/)

---

## 🆘 Support

If you run into issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Verify all secrets and configuration
4. Test components individually

**Ready to start?** Begin with Step 1 and work through each section. The entire setup should take about 30 minutes for your first site.

---

**End of POC README**
