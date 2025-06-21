const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'test123';
  const hash = await bcrypt.hash(password, 12);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  // Test verification
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Verification: ${isValid}`);
}

hashPassword().catch(console.error);