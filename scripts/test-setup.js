const fs = require('fs');
const path = require('path');

async function testSetup() {
  console.log('🧪 Testing FlowSentry POC setup...\n');
  
  let allTestsPassed = true;
  
  // Test 1: Check if required files exist
  console.log('📁 Testing file structure...');
  const requiredFiles = [
    'package.json',
    'config/sites.json',
    'scripts/check-uptime.js',
    'scripts/synthetic-checkout.js',
    'scripts/weekly-report.js'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      allTestsPassed = false;
    }
  }
  
  // Test 2: Check if config is valid JSON
  console.log('\n📋 Testing configuration...');
  try {
    const config = JSON.parse(fs.readFileSync('config/sites.json', 'utf8'));
    if (config.sites && Array.isArray(config.sites)) {
      console.log(`  ✅ sites.json is valid (${config.sites.length} sites configured)`);
      config.sites.forEach((site, i) => {
        console.log(`    - ${site.client}: ${site.domain} (${site.urls.length} URLs)`);
      });
    } else {
      console.log('  ❌ sites.json has invalid structure');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ sites.json is invalid JSON: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 3: Check if package.json is valid
  console.log('\n📦 Testing package.json...');
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (pkg.dependencies) {
      console.log('  ✅ package.json is valid');
      console.log(`    - Dependencies: ${Object.keys(pkg.dependencies).length}`);
      console.log(`    - Scripts: ${Object.keys(pkg.scripts).length}`);
    } else {
      console.log('  ❌ package.json missing dependencies');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ package.json is invalid JSON: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: Check environment variables
  console.log('\n🔐 Testing environment variables...');
  const requiredEnvVars = [
    'GRAFANA_API_KEY',
    'GRAFANA_PROMETHEUS_URL'
  ];
  
  let envVarsSet = 0;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar} is set`);
      envVarsSet++;
    } else {
      console.log(`  ⚠️  ${envVar} is not set (optional for testing)`);
    }
  }
  
  if (envVarsSet === requiredEnvVars.length) {
    console.log('  ✅ All Grafana credentials are configured');
  } else {
    console.log('  ⚠️  Grafana credentials not fully configured (metrics won\'t be pushed)');
  }
  
  // Test 5: Check if directories exist
  console.log('\n📂 Testing directory structure...');
  const requiredDirs = [
    '.github/workflows',
    'scripts',
    'config',
    '.upptime'
  ];
  
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`  ✅ ${dir}/`);
    } else {
      console.log(`  ❌ ${dir}/ - MISSING`);
      allTestsPassed = false;
    }
  }
  
  // Test 6: Check GitHub Actions workflows
  console.log('\n⚙️  Testing GitHub Actions workflows...');
  const workflowFiles = [
    '.github/workflows/uptime-checks.yml',
    '.github/workflows/synthetic-flow.yml',
    '.github/workflows/lighthouse-daily.yml'
  ];
  
  let workflowsFound = 0;
  for (const workflow of workflowFiles) {
    if (fs.existsSync(workflow)) {
      console.log(`  ✅ ${workflow}`);
      workflowsFound++;
    } else {
      console.log(`  ⚠️  ${workflow} - not found (will be created)`);
    }
  }
  
  // Test 7: Check Upptime configuration
  console.log('\n📊 Testing Upptime configuration...');
  if (fs.existsSync('.upptime/upptime.yml')) {
    console.log('  ✅ .upptime/upptime.yml exists');
  } else {
    console.log('  ⚠️  .upptime/upptime.yml not found (will be created)');
  }
  
  // Summary
  console.log('\n🎯 Test Summary:');
  if (allTestsPassed) {
    console.log('  ✅ All core tests passed!');
    console.log('  🚀 Ready to run monitoring scripts');
  } else {
    console.log('  ❌ Some tests failed - check the issues above');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('  1. Run: npm install');
  console.log('  2. Set up Grafana Cloud credentials (optional)');
  console.log('  3. Test: npm run check-uptime');
  console.log('  4. Test: npm run synthetic');
  console.log('  5. Set up GitHub Actions workflows');
  console.log('  6. Configure Upptime status page');
  
  return allTestsPassed;
}

// Run if called directly
if (require.main === module) {
  testSetup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test setup failed:', error);
      process.exit(1);
    });
}

module.exports = { testSetup };
