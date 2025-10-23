# FlowSentry Context - Current Status

## 🎯 **Project Overview**
FlowSentry is a "Website Mystery Shopper" monitoring service that acts like real customers to catch breakages before they cost revenue. It's a POC using GitHub Actions + Grafana Cloud + custom status page.

## 🚀 **Current Status (Last Updated: 2025-10-23)**
- ✅ **Monitoring System**: Fully operational (3/4 checks successful)
- ✅ **Status Page**: Working at https://dvasilev-git.github.io/flowsentry/
- ✅ **GitHub Actions**: All workflows running (uptime every 10min, synthetic hourly)
- ⚠️ **Prometheus Integration**: Authentication issue (401 error) - needs Service Account API key
- ✅ **Repository**: Public at https://github.com/dvasilev-git/flowsentry

## 🔧 **Recent Migration: Loki → Prometheus**
**Completed:**
- ✅ Created new Prometheus push script (`scripts/push-prometheus.js`)
- ✅ Updated monitoring scripts to use Prometheus
- ✅ Updated GitHub Actions with Prometheus credentials
- ✅ Created Prometheus-based Grafana dashboard
- ✅ Created PromQL-based alert rules
- ✅ Updated setup documentation

**Issue:** 401 authentication error when pushing to Prometheus
**Solution Needed:** Create Service Account API key in Grafana Cloud

## 📋 **GitHub Secrets Status**
**Current Secrets:**
- ✅ `GRAFANA_API_KEY` - Set (but may need Service Account key)
- ✅ `GRAFANA_PROMETHEUS_URL` - Set
- ✅ `GRAFANA_PROMETHEUS_USER` - Set

**Removed Secrets:**
- ❌ `GRAFANA_LOKI_URL` - Removed (migrated to Prometheus)
- ❌ `GRAFANA_LOKI_USER` - Removed (migrated to Prometheus)

## 🎯 **Next Steps (Priority Order)**
1. **Fix Prometheus Authentication**:
   - Go to Grafana Cloud → Security → Service Accounts
   - Create new Service Account with Editor role
   - Generate API key
   - Update `GRAFANA_API_KEY` secret in GitHub

2. **Import Dashboard**:
   - Use `grafana-dashboard-simple.json` for testing
   - Import to Grafana Cloud

3. **Set Up Alerts**:
   - Import `grafana-alerts.yaml` to Grafana Cloud
   - Configure email notifications

## 📊 **Monitoring Metrics**
**Prometheus Metrics Being Generated:**
- `flowsentry_uptime_status` - 1=up, 0=down
- `flowsentry_response_time_seconds` - Response time
- `flowsentry_http_status_code` - HTTP status codes
- `flowsentry_checks_total` - Check counters
- `flowsentry_synthetic_success` - Synthetic flow success
- `flowsentry_synthetic_duration_seconds` - Synthetic flow duration

## 🔍 **Troubleshooting**
**Common Issues:**
- 401 Authentication Error: Use Service Account API key, not personal key
- Empty Dashboard: Use `grafana-dashboard-simple.json` first
- Missing Metrics: Check GitHub Actions logs for push errors

**Test Commands:**
```bash
# Test Prometheus push locally
node test-prometheus-push.js

# Test authentication
node test-auth.js
```

## 📁 **Key Files**
- `scripts/push-prometheus.js` - Prometheus metrics push
- `scripts/check-uptime.js` - Uptime monitoring
- `scripts/synthetic-checkout.js` - Synthetic flow testing
- `grafana-dashboard-simple.json` - Simple test dashboard
- `grafana-alerts.yaml` - Alert rules
- `GRAFANA-SETUP.md` - Setup documentation

## 🌐 **URLs**
- **Repository**: https://github.com/dvasilev-git/flowsentry
- **Status Page**: https://dvasilev-git.github.io/flowsentry/
- **Grafana Cloud**: https://grafana.com/orgs/flowsentry

## 💡 **Architecture**
```
GitHub Actions (Monitoring) → Grafana Cloud (Prometheus) → Grafana Dashboards
                         ↓
                    Status Page (GitHub Pages)
```

## 🎯 **Business Context**
- **Target**: E-commerce and lead-gen sites
- **Value Prop**: "Mystery Shopper" monitoring - catch issues before customers do
- **Pricing**: Free tier for POC, plans from €199/month
- **Competitors**: Checkly, Oh Dear, Better Stack, RapidSpike

---
*Last updated: 2025-10-23 - Migration to Prometheus completed, authentication issue pending*
