# FlowSentry POC Setup Instructions

This guide will help you set up the FlowSentry monitoring POC in about 30 minutes.

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Test the Setup

```bash
npm run test
```

This will verify all files are in place and configuration is valid.

### 3. Run Your First Check

```bash
npm run check-uptime
```

This will test the uptime monitoring with the demo sites.

## 🔧 Full Setup (30 minutes)

### Step 1: Create GitHub Repository

1. Create a new repository on GitHub (e.g., `flowsentry-monitoring`)
2. Clone it locally:
   ```bash
   git clone https://github.com/yourusername/flowsentry-monitoring.git
   cd flowsentry-monitoring
   ```

### Step 2: Set Up Grafana Cloud (Optional but Recommended)

1. **Sign up** at [grafana.com](https://grafana.com) (free tier)
2. **Get API credentials**:
   - Go to "My Account" → "Security" → "Service Accounts"
   - Create new service account with "Editor" role
   - Copy the **API Key** and **Instance ID**
3. **Get Prometheus endpoint**:
   - Go to "My Account" → "Details"
   - Copy the **Prometheus Remote Write Endpoint** URL

### Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository:
- Go to: Settings → Secrets and variables → Actions

```
GRAFANA_API_KEY=your_api_key_here
GRAFANA_INSTANCE_ID=your_instance_id_here
GRAFANA_PROMETHEUS_URL=https://prometheus-xxx.grafana.net/api/prom/push
```

### Step 4: Update Configuration Files

#### Update `.upptime/upptime.yml`:
```yaml
owner: yourusername  # Replace with your GitHub username
repo: flowsentry-monitoring  # Replace with your repository name
status-website: https://yourusername.github.io/flowsentry-monitoring
```

#### Update `config/sites.json`:
Replace the demo sites with your actual sites:
```json
{
  "sites": [
    {
      "client": "your-client-name",
      "domain": "your-domain.com",
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

### Step 5: Enable GitHub Pages

1. Go to your repository → Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` (will be created by Upptime)
4. Save

### Step 6: Test Everything

```bash
# Test the setup
npm run test

# Test uptime checks
npm run check-uptime

# Test synthetic flows
npm run synthetic

# Generate a weekly report
npm run weekly-report
```

### Step 7: Push to GitHub

```bash
git add .
git commit -m "Initial FlowSentry POC setup"
git push origin main
```

## 🧪 Testing Your Setup

### Local Testing

```bash
# Test individual components
npm run check-uptime
npm run synthetic
npm run weekly-report

# Test with environment variables
GRAFANA_API_KEY=your_key GRAFANA_PROMETHEUS_URL=your_url npm run check-uptime
```

### GitHub Actions Testing

1. Go to your repo → "Actions" tab
2. Click "Uptime Checks" → "Run workflow"
3. Check the logs for any errors

### Verify Status Page

1. Wait 5-10 minutes after pushing
2. Go to `https://yourusername.github.io/flowsentry-monitoring`
3. Verify it shows green/red status for your sites

## 🔍 Troubleshooting

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

## 📊 What You'll Get

After setup, you'll have:

- ✅ **Uptime monitoring** every 10 minutes
- ✅ **Synthetic flows** every hour
- ✅ **Daily Lighthouse audits**
- ✅ **Status page** at `https://yourusername.github.io/flowsentry-monitoring`
- ✅ **Weekly reports** every Monday
- ✅ **Grafana dashboards** (if configured)
- ✅ **Smart alerts** (if configured)

## 🎯 Next Steps

1. **Add real client sites** to `config/sites.json`
2. **Set up email alerts** in Grafana Cloud
3. **Create custom dashboards** in Grafana
4. **Test incident response** workflow
5. **Scale to more sites** as needed

## 📚 Additional Resources

- [Grafana Cloud Documentation](https://grafana.com/docs/grafana-cloud/)
- [Upptime Documentation](https://upptime.js.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Puppeteer Documentation](https://pptr.dev/)

## 🆘 Support

If you run into issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Verify all secrets and configuration
4. Test components individually

**Ready to start?** Run `npm install` and `npm run test` to begin!
