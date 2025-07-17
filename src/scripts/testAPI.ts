import dotenv from 'dotenv';
dotenv.config();

async function testAPI() {
  const baseURL = `http://localhost:${process.env.PORT || 3000}`;
  
  console.log('🧪 TESTING BITESPEED API\n');

  const testCases = [
    {
      name: 'Test 1: First contact',
      payload: { email: 'lorraine@hillvalley.edu', phoneNumber: '123456' }
    },
    {
      name: 'Test 2: Secondary contact creation',
      payload: { email: 'mcfly@hillvalley.edu', phoneNumber: '123456' }
    },
    {
      name: 'Test 3: Another primary contact',
      payload: { email: 'george@hillvalley.edu', phoneNumber: '919191' }
    },
    {
      name: 'Test 4: Linking two primary contacts',
      payload: { email: 'george@hillvalley.edu', phoneNumber: '123456' }
    },
    {
      name: 'Test 5: Email-only query',
      payload: { email: 'mcfly@hillvalley.edu' }
    },
    {
      name: 'Test 6: Phone-only query',
      payload: { phoneNumber: '123456' }
    }
  ];

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
        console.log(`📥 Response: ${JSON.stringify(result, null, 2)}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error}`);
    }
    
    console.log('─'.repeat(50));
  }
}

// Check if server is running before testing
async function checkServer() {
  const baseURL = `http://localhost:${process.env.PORT || 3000}`;
  
  try {
    const response = await fetch(`${baseURL}/health`);
    if (response.ok) {
      console.log('✅ Server is running, starting tests...');
      await testAPI();
    } else {
      console.log('❌ Server responded but not healthy');
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm run dev');
    console.log('   Then run this test with: npm run test:api');
  }
}

checkServer();
