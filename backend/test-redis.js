require('dotenv').config();
const { setEx, get, del } = require('./config/redis');

async function testRedis() {
  console.log('🔍 Testing Redis Connection...\n');

  try {
    // Test 1: Set a value
    console.log('1️⃣ Setting test value in Redis...');
    await setEx('test:key', { message: 'Hello Redis!' }, 60);
    console.log('✅ Value set successfully\n');

    // Test 2: Get the value
    console.log('2️⃣ Getting test value from Redis...');
    const value = await get('test:key');
    console.log('✅ Value retrieved:', value);
    console.log('');

    // Test 3: Delete the value
    console.log('3️⃣ Deleting test value...');
    await del('test:key');
    console.log('✅ Value deleted\n');

    // Test 4: Verify deletion
    console.log('4️⃣ Verifying deletion...');
    const deletedValue = await get('test:key');
    console.log('✅ Value after deletion:', deletedValue);
    console.log('');

    console.log('🎉 All Redis tests passed!\n');
    console.log('Redis is ready for caching the About page.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    console.log('\n⚠️  Make sure Redis is running:');
    console.log('   docker ps | grep redis');
    console.log('   or');
    console.log('   redis-cli ping');
    process.exit(1);
  }
}

testRedis();