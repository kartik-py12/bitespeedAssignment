import dotenv from 'dotenv';
dotenv.config();

import { ContactService } from '../services/contactService';

async function testTaskExamples() {
  const contactService = new ContactService();
  
  console.log('🧪 TESTING TASK EXAMPLES\n');

  try {
    // Reset database first
    const { database } = await import('../database');
    await database.run('DELETE FROM Contact');
    console.log('🗑️  Database cleared\n');

    // Test 1: First contact creation
    console.log('📝 Test 1: First contact');
    console.log('Request: { email: "lorraine@hillvalley.edu", phoneNumber: "123456" }');
    const result1 = await contactService.identifyContact({
      email: "lorraine@hillvalley.edu",
      phoneNumber: "123456"
    });
    console.log('Response:', JSON.stringify(result1, null, 2));
    console.log('✅ Expected: Primary contact created with ID 1\n');

    // Test 2: Secondary contact creation
    console.log('📝 Test 2: Secondary contact (new email, same phone)');
    console.log('Request: { email: "mcfly@hillvalley.edu", phoneNumber: "123456" }');
    const result2 = await contactService.identifyContact({
      email: "mcfly@hillvalley.edu",
      phoneNumber: "123456"
    });
    console.log('Response:', JSON.stringify(result2, null, 2));
    console.log('✅ Expected: Secondary contact created, linked to primary ID 1\n');

    // Test 3: Email-only query (should NOT create new contact)
    console.log('📝 Test 3: Email-only query');
    console.log('Request: { email: "mcfly@hillvalley.edu" }');
    const result3 = await contactService.identifyContact({
      email: "mcfly@hillvalley.edu"
    });
    console.log('Response:', JSON.stringify(result3, null, 2));
    console.log('✅ Expected: Same response as Test 2, NO new contact created\n');

    // Test 4: Phone-only query (should NOT create new contact)
    console.log('📝 Test 4: Phone-only query');
    console.log('Request: { phoneNumber: "123456" }');
    const result4 = await contactService.identifyContact({
      phoneNumber: "123456"
    });
    console.log('Response:', JSON.stringify(result4, null, 2));
    console.log('✅ Expected: Same response as Test 2, NO new contact created\n');

    // Test 5: Original email query (should NOT create new contact)
    console.log('📝 Test 5: Original email query');
    console.log('Request: { email: "lorraine@hillvalley.edu" }');
    const result5 = await contactService.identifyContact({
      email: "lorraine@hillvalley.edu"
    });
    console.log('Response:', JSON.stringify(result5, null, 2));
    console.log('✅ Expected: Same response as Test 2, NO new contact created\n');

    // Verify all responses have same primary contact ID and same data
    const allResults = [result2, result3, result4, result5];
    const allSame = allResults.every(result => 
      result.contact.primaryContatctId === result2.contact.primaryContatctId &&
      JSON.stringify(result.contact.emails.sort()) === JSON.stringify(result2.contact.emails.sort()) &&
      JSON.stringify(result.contact.phoneNumbers.sort()) === JSON.stringify(result2.contact.phoneNumbers.sort()) &&
      JSON.stringify(result.contact.secondaryContactIds.sort()) === JSON.stringify(result2.contact.secondaryContactIds.sort())
    );

    if (allSame) {
      console.log('🎉 SUCCESS: All queries return identical consolidated data!');
    } else {
      console.log('❌ FAILURE: Queries returned different data');
    }

    // Show final database state
    console.log('\n📊 Final Database State:');
    const allContacts = await database.all('SELECT * FROM Contact WHERE deletedAt IS NULL ORDER BY id');
    console.table(allContacts);

    await database.close();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTaskExamples();
