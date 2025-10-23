const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { pushToLoki } = require('./push-loki');

async function checkUptime() {
  console.log('🔍 Starting uptime checks...');
  
  const sites = JSON.parse(fs.readFileSync('./config/sites.json', 'utf8'));
  const results = [];

  for (const site of sites.sites) {
    console.log(`\n📊 Checking site: ${site.client} (${site.domain})`);
    
    for (const url of site.urls) {
      const fullUrl = `https://${site.domain}${url.path}`;
      const startTime = Date.now();
      
      console.log(`  🔗 Checking: ${url.name} (${fullUrl})`);
      
      try {
        const browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (compatible; FlowSentry/1.0; +https://github.com/dvasilev-git/flowsentry)');
        
        const response = await page.goto(fullUrl, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        await browser.close();
        
        const result = {
          client: site.client,
          url: url.name,
          domain: site.domain,
          path: url.path,
          status: response.status(),
          responseTime,
          success: response.status() < 400,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        
        console.log(`    ✅ ${url.name}: ${response.status()} (${responseTime}ms)`);
        
      } catch (error) {
        const result = {
          client: site.client,
          url: url.name,
          domain: site.domain,
          path: url.path,
          status: 0,
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        
        console.log(`    ❌ ${url.name}: FAILED - ${error.message}`);
      }
    }
  }
  
  console.log(`\n📈 Results: ${results.filter(r => r.success).length}/${results.length} successful`);
  
  // Push to Grafana Cloud if credentials are available
  if (process.env.GRAFANA_LOKI_URL && process.env.GRAFANA_API_KEY) {
    await pushToLoki(results, 'uptime');
  } else {
    console.log('⚠️  Grafana Loki credentials not found, skipping logs push');
    console.log('   Set GRAFANA_LOKI_URL, GRAFANA_LOKI_USER and GRAFANA_API_KEY environment variables');
  }
  
  // Save results to file for debugging
  const resultsFile = `./results/uptime-${new Date().toISOString().split('T')[0]}.json`;
  if (!fs.existsSync('./results')) {
    fs.mkdirSync('./results');
  }
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${resultsFile}`);
  
  return results;
}


// Run if called directly
if (require.main === module) {
  checkUptime()
    .then(results => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      console.log(`\n🎯 Summary: ${successCount}/${totalCount} checks passed`);
      // Don't exit with error code - we want to continue with status page generation
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkUptime };
