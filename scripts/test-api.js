// scripts/test-api.js - Test your deployed API routes

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const LEAGUE_ID = process.env.VITE_FPL_LEAGUE_ID || '1858389';

console.log('🧪 Testing FPL API Routes');
console.log('📍 Base URL:', BASE_URL);
console.log('🏆 League ID:', LEAGUE_ID);
console.log('─'.repeat(50));

// Test function with timing
async function testEndpoint(name, url) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`📡 URL: ${url}`);
  
  const start = Date.now();
  
  try {
    const response = await fetch(url);
    const duration = Date.now() - start;
    
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Success!');
        
        // Show relevant data summary
        if (data.data) {
          const d = data.data;
          
          if (d.currentGameweek) {
            console.log(`   📅 Current Gameweek: ${d.currentGameweek}`);
          }
          
          if (d.standings) {
            console.log(`   👥 Managers: ${d.standings.length}`);
            console.log(`   🏆 Leader: ${d.standings[0]?.teamName || 'N/A'} (${d.standings[0]?.totalPoints || 0} pts)`);
          }
          
          if (d.gameweekTable) {
            console.log(`   📈 Gameweeks analyzed: ${d.gameweekTable.length}`);
          }
          
          if (d.leagueStats) {
            console.log(`   📊 Average score: ${d.leagueStats.averageScore || 0}`);
            console.log(`   🔥 Highest total: ${d.leagueStats.highestTotal || 0}`);
          }
          
          if (d.gameweeks) {
            console.log(`   📅 Gameweeks: ${d.gameweeks.length}`);
          }
          
          if (d.managerId) {
            console.log(`   👤 Manager ID: ${d.managerId}`);
            console.log(`   📈 History entries: ${d.gameweeks?.length || 0}`);
          }
        }
        
        if (data.performance) {
          console.log(`   ⚡ Server processing: ${data.performance.processingTime || 'N/A'}`);
        }
        
      } else {
        console.log('❌ API returned error:', data.error);
      }
    } else {
      console.log('❌ HTTP Error:', response.status, response.statusText);
    }
    
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`⏱️  Failed after: ${duration}ms`);
    console.log('❌ Error:', error.message);
  }
}

// Main test function
async function runTests() {
  const tests = [
    {
      name: 'Bootstrap Data',
      url: `${BASE_URL}/api/bootstrap`
    },
    {
      name: 'League Data',
      url: `${BASE_URL}/api/league?leagueId=${LEAGUE_ID}`
    },
    {
      name: 'Complete League Data (Optimized)',
      url: `${BASE_URL}/api/league-complete?leagueId=${LEAGUE_ID}`
    },
    {
      name: 'Manager History (Sample)',
      url: `${BASE_URL}/api/manager-history?managerId=1827725`
    }
  ];
  
  console.log('🚀 Starting API tests...\n');
  
  for (const test of tests) {
    await testEndpoint(test.name, test.url);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '─'.repeat(50));
  console.log('✅ All tests completed!');
  console.log('\n💡 Tips:');
  console.log('   • Fast responses (<1000ms) likely indicate cache hits');
  console.log('   • First request may be slower (cold start)');
  console.log('   • Check Vercel dashboard for detailed function logs');
  console.log('   • Use browser dev tools to see cache headers');
}

// Run the tests
runTests().catch(console.error);