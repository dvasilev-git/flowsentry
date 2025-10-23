const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runSyntheticFlow() {
  console.log('🛒 Starting synthetic checkout flows...');
  
  const sites = JSON.parse(fs.readFileSync('./config/sites.json', 'utf8'));
  const results = [];
  
  for (const site of sites.sites) {
    if (!site.synthetic?.enabled) {
      console.log(`⏭️  Skipping synthetic flow for ${site.client} (disabled)`);
      continue;
    }
    
    console.log(`\n🛍️  Running synthetic flow for: ${site.client} (${site.domain})`);
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (compatible; FlowSentry/1.0; +https://github.com/dvasilev-git/flowsentry)');
    
    const startTime = Date.now();
    let success = false;
    let error = null;
    let screenshotPath = null;
    
    try {
      // Step 1: Go to homepage
      console.log('  🏠 Step 1: Loading homepage...');
      await page.goto(`https://${site.domain}/`, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      // Step 2: Click product link (if available)
      if (site.synthetic.selectors.product_link) {
        console.log('  🛍️  Step 2: Looking for product link...');
        try {
          await page.waitForSelector(site.synthetic.selectors.product_link, { timeout: 5000 });
          await page.click(site.synthetic.selectors.product_link);
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
          console.log('    ✅ Product page loaded');
        } catch (e) {
          console.log('    ⚠️  Product link not found, continuing...');
        }
      }
      
      // Step 3: Add to cart (if available)
      if (site.synthetic.selectors.add_to_cart) {
        console.log('  🛒 Step 3: Adding to cart...');
        try {
          await page.waitForSelector(site.synthetic.selectors.add_to_cart, { timeout: 5000 });
          await page.click(site.synthetic.selectors.add_to_cart);
          await page.waitForTimeout(2000);
          console.log('    ✅ Added to cart');
        } catch (e) {
          console.log('    ⚠️  Add to cart button not found, continuing...');
        }
      }
      
      // Step 4: Go to cart (if available)
      console.log('  🛒 Step 4: Going to cart...');
      try {
        await page.goto(`https://${site.domain}/cart`, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        console.log('    ✅ Cart page loaded');
      } catch (e) {
        console.log('    ⚠️  Cart page not available, trying checkout...');
        try {
          await page.goto(`https://${site.domain}/checkout`, { 
            waitUntil: 'networkidle2',
            timeout: 10000 
          });
          console.log('    ✅ Checkout page loaded');
        } catch (e2) {
          console.log('    ⚠️  Checkout page not available, flow completed');
        }
      }
      
      // Step 5: Proceed to checkout (if available)
      if (site.synthetic.selectors.proceed_checkout) {
        console.log('  💳 Step 5: Proceeding to checkout...');
        try {
          await page.waitForSelector(site.synthetic.selectors.proceed_checkout, { timeout: 5000 });
          await page.click(site.synthetic.selectors.proceed_checkout);
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        } catch (e) {
          console.log('    ⚠️  Checkout button not found, continuing...');
        }
      }
      
      // Step 6: Verify checkout page loaded
      console.log('  ✅ Step 6: Verifying checkout page...');
      const checkoutLoaded = await page.$('input[name="email"], #email, .checkout-form, [data-testid="checkout"], .checkout');
      
      if (checkoutLoaded) {
        success = true;
        console.log(`    ✅ Synthetic flow successful for ${site.client}`);
      } else {
        throw new Error('Checkout page not loaded properly - no checkout form found');
      }
      
    } catch (err) {
      error = err.message;
      console.log(`    ❌ Synthetic flow failed for ${site.client}: ${error}`);
      
      // Take screenshot on failure
      if (!fs.existsSync('./screenshots')) {
        fs.mkdirSync('./screenshots');
      }
      screenshotPath = `./screenshots/${site.client}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`    📸 Screenshot saved: ${screenshotPath}`);
    } finally {
      await browser.close();
    }
    
    const duration = Date.now() - startTime;
    const result = {
      client: site.client,
      domain: site.domain,
      success,
      duration,
      error,
      screenshotPath,
      timestamp: new Date().toISOString()
    };
    
    results.push(result);
    
    // Push synthetic metric if credentials are available
    if (process.env.GRAFANA_PROMETHEUS_URL && process.env.GRAFANA_API_KEY) {
      await pushSyntheticMetric(result);
    }
  }
  
  console.log(`\n📈 Synthetic Results: ${results.filter(r => r.success).length}/${results.length} successful`);
  
  // Save results to file
  const resultsFile = `./results/synthetic-${new Date().toISOString().split('T')[0]}.json`;
  if (!fs.existsSync('./results')) {
    fs.mkdirSync('./results');
  }
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${resultsFile}`);
  
  return results;
}

async function pushSyntheticMetric(result) {
  const axios = require('axios');
  
  const payload = {
    streams: [{
      stream: { 
        job: 'flowsentry-synthetic',
        __name__: 'synthetic_flow_success'
      },
      values: [[
        (Date.now()).toString(),
        result.success ? '1' : '0'
      ]]
    }, {
      stream: { 
        job: 'flowsentry-synthetic',
        __name__: 'synthetic_flow_duration'
      },
      values: [[
        (Date.now()).toString(),
        result.duration.toString()
      ]]
    }]
  };

  try {
    await axios.post(process.env.GRAFANA_PROMETHEUS_URL, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.GRAFANA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Synthetic metrics pushed successfully');
  } catch (error) {
    console.error('❌ Failed to push synthetic metrics:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runSyntheticFlow()
    .then(results => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      console.log(`\n🎯 Summary: ${successCount}/${totalCount} synthetic flows passed`);
      process.exit(0); // Always exit successfully to not fail the workflow
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runSyntheticFlow, pushSyntheticMetric };
