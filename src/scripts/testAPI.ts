import dotenv from 'dotenv';
dotenv.config();

async function testAPI() {
  const baseURL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
  
  console.log('🧪 TESTING BITESPEED API');
  console.log(`📡 Testing endpoint: ${baseURL}\n`);

  const testCases = [
    {
      name: 'Test 1: First contact (from task example)',
      payload: { email: 'lorraine@hillvalley.edu', phoneNumber: '123456' }
    },
    {
      name: 'Test 2: Secondary contact creation (from task example)',
      payload: { email: 'mcfly@hillvalley.edu', phoneNumber: '123456' }
    },
    {
      name: 'Test 3: Email-only query',
      payload: { email: 'mcfly@hillvalley.edu' }
    },
    {
      name: 'Test 4: Phone-only query',
      payload: { phoneNumber: '123456' }
    },
    {
      name: 'Test 5: New contact',
      payload: { email: 'george@hillvalley.edu', phoneNumber: '919191' }
    },
    {
      name: 'Test 6: Primary consolidation',
      payload: { email: 'george@hillvalley.edu', phoneNumber: '123456' }
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n🎯 ${testCase.name}`);
    console.log(`📤 Request: ${JSON.stringify(testCase.payload)}`);
    
    try {
      const response = await fetch(`${baseURL}/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: ${JSON.stringify(result, null, 2)}`);
        successCount++;
      } else {
        const errorResult = result as { error?: string };
        console.log(`❌ Error: ${errorResult.error || 'Unknown error'}`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error}`);
      failCount++;
    }
    
    console.log('─'.repeat(80));
  }

  console.log(`\n📊 Test Summary:`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`);
}

// Check if server is running before testing
async function checkServer() {
  const baseURL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
  
  try {
    console.log('🔍 Checking server health...');
    const response = await fetch(`${baseURL}/health`);
    if (response.ok) {
      const health = await response.json() as { service?: string };
      console.log('✅ Server is healthy:', health.service || 'Unknown service');
      console.log('🚀 Starting API tests...\n');
      await testAPI();
    } else {
      console.log('❌ Server responded but not healthy');
    }
  } catch (error) {
    console.log('❌ Server is not running or not reachable.');
    console.log('💡 For local testing: Start the server with "npm run dev"');
    console.log('💡 For production testing: Set API_URL environment variable');
  }
}

checkServer();
