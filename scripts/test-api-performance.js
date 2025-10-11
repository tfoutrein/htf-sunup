#!/usr/bin/env node

/**
 * Script de test de performance API
 * Teste les endpoints critiques et mesure les temps de réponse
 * 
 * Usage: node scripts/test-api-performance.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

// Token de test - À remplacer par un vrai token
const TEST_TOKEN = process.env.TEST_TOKEN || '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function testEndpoint(name, url, options = {}) {
  const fullUrl = `${API_BASE_URL}${url}`;
  console.log(`\n${colorize('Testing:', 'cyan')} ${name}`);
  console.log(`${colorize('URL:', 'blue')} ${fullUrl}`);

  const headers = {
    'Content-Type': 'application/json',
    ...(TEST_TOKEN ? { 'Authorization': `Bearer ${TEST_TOKEN}` } : {}),
    ...options.headers,
  };

  try {
    const startTime = performance.now();
    const response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    const status = response.status;
    const statusColor = status >= 200 && status < 300 ? 'green' : 
                       status >= 400 && status < 500 ? 'yellow' : 'red';

    console.log(`${colorize('Status:', 'blue')} ${colorize(status, statusColor)}`);
    console.log(`${colorize('Duration:', 'blue')} ${colorize(`${duration}ms`, duration < 100 ? 'green' : duration < 500 ? 'yellow' : 'red')}`);

    if (response.ok) {
      const data = await response.json();
      const dataSize = JSON.stringify(data).length;
      console.log(`${colorize('Response Size:', 'blue')} ${(dataSize / 1024).toFixed(2)} KB`);
      
      if (Array.isArray(data)) {
        console.log(`${colorize('Items Count:', 'blue')} ${data.length}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`${colorize('Error:', 'red')} ${errorText.slice(0, 100)}...`);
    }

    return {
      name,
      url,
      status,
      duration: parseFloat(duration),
      success: response.ok,
    };
  } catch (error) {
    console.log(`${colorize('Error:', 'red')} ${error.message}`);
    return {
      name,
      url,
      status: 0,
      duration: 0,
      success: false,
      error: error.message,
    };
  }
}

async function runPerformanceTests() {
  console.log(colorize('\n🚀 HTF Sunup - API Performance Test\n', 'cyan'));
  console.log(colorize('=' .repeat(60), 'blue'));

  const results = [];

  // Test 1: Health check
  results.push(await testEndpoint(
    'Health Check',
    '/'
  ));

  // Test 2: Liste des campagnes
  results.push(await testEndpoint(
    'Get All Campaigns',
    '/campaigns'
  ));

  // Test 3: Campagnes actives
  results.push(await testEndpoint(
    'Get Active Campaigns',
    '/campaigns/active'
  ));

  // Test 4: Liste des managers
  results.push(await testEndpoint(
    'Get All Managers (Public)',
    '/public/users/managers'
  ));

  // Tests nécessitant authentification
  if (TEST_TOKEN) {
    console.log(colorize('\n📝 Tests avec authentification', 'cyan'));

    // Test 5: Profil utilisateur
    results.push(await testEndpoint(
      'Get Current User',
      '/auth/me'
    ));

    // Test 6: Tous les challenges
    results.push(await testEndpoint(
      'Get All Challenges',
      '/challenges'
    ));

    // Test 7: Challenges d'aujourd'hui
    results.push(await testEndpoint(
      'Get Today Challenges',
      '/challenges/today'
    ));

    // Test 8: Tous les bonus
    results.push(await testEndpoint(
      'Get My Bonuses',
      '/daily-bonus/my-bonuses'
    ));

    // Test 9: Liste des membres (potentiellement lourd)
    results.push(await testEndpoint(
      'Get All Members',
      '/users/all-members'
    ));
  } else {
    console.log(colorize('\n⚠️  Skipping authenticated tests (no TEST_TOKEN provided)', 'yellow'));
    console.log(colorize('   Set TEST_TOKEN environment variable to test authenticated endpoints', 'yellow'));
  }

  // Résumé
  console.log(colorize('\n' + '=' .repeat(60), 'blue'));
  console.log(colorize('\n📊 Performance Summary\n', 'cyan'));

  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);

  console.log(`${colorize('Total Tests:', 'blue')} ${results.length}`);
  console.log(`${colorize('Successful:', 'green')} ${successfulTests.length}`);
  console.log(`${colorize('Failed:', 'red')} ${failedTests.length}`);

  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration);
    const avgDuration = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2);
    const minDuration = Math.min(...durations).toFixed(2);
    const maxDuration = Math.max(...durations).toFixed(2);

    console.log(`\n${colorize('Response Times:', 'blue')}`);
    console.log(`  Average: ${colorize(`${avgDuration}ms`, avgDuration < 200 ? 'green' : avgDuration < 500 ? 'yellow' : 'red')}`);
    console.log(`  Min: ${colorize(`${minDuration}ms`, 'green')}`);
    console.log(`  Max: ${colorize(`${maxDuration}ms`, maxDuration < 500 ? 'green' : maxDuration < 1000 ? 'yellow' : 'red')}`);

    // Endpoints les plus lents
    console.log(`\n${colorize('Slowest Endpoints:', 'yellow')}`);
    successfulTests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name}: ${colorize(`${r.duration}ms`, 'yellow')}`);
      });

    // Endpoints les plus rapides
    console.log(`\n${colorize('Fastest Endpoints:', 'green')}`);
    successfulTests
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 3)
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name}: ${colorize(`${r.duration}ms`, 'green')}`);
      });
  }

  if (failedTests.length > 0) {
    console.log(`\n${colorize('Failed Tests:', 'red')}`);
    failedTests.forEach(r => {
      console.log(`  - ${r.name}: ${r.error || `Status ${r.status}`}`);
    });
  }

  // Recommandations
  console.log(colorize('\n' + '=' .repeat(60), 'blue'));
  console.log(colorize('\n💡 Recommendations\n', 'cyan'));

  if (successfulTests.length > 0) {
    const slowEndpoints = successfulTests.filter(r => r.duration > 500);
    
    if (slowEndpoints.length > 0) {
      console.log(colorize('⚠️  Performance Issues Detected:', 'yellow'));
      slowEndpoints.forEach(r => {
        console.log(`   - ${r.name} is slow (${r.duration}ms)`);
      });
      console.log('\n   Consider:');
      console.log('   • Adding database indexes');
      console.log('   • Implementing caching');
      console.log('   • Optimizing queries (check for N+1)');
      console.log('   • Adding pagination');
    } else {
      console.log(colorize('✅ All endpoints are performing well!', 'green'));
    }
  }

  console.log('\n');
}

// Run tests
runPerformanceTests().catch(console.error);







