/**
 * Debug script để test authentication
 * Copy và paste vào Browser Console
 */

export const debugAuth = async () => {
  console.log('=== 🔍 AUTH DEBUG START ===\n');

  // 1. Check localStorage
  console.log('1️⃣ localStorage:');
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');
  console.log('   Token:', token ? '✅ Found' : '❌ Not found');
  console.log('   User:', user ? '✅ Found' : '❌ Not found');
  if (user) {
    try {
      console.log('   User data:', JSON.parse(user));
    } catch (e) {
      console.error('   Error parsing user:', e);
    }
  }
  console.log('');

  // 2. Test API endpoints
  console.log('2️⃣ Testing API endpoints:');
  
  // Test register endpoint
  try {
    const registerRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'debug@test.com', 
        password: 'debug123456',
        name: 'Debug User'
      })
    });
    const registerData = await registerRes.json();
    console.log('   Register API:', registerRes.status === 200 ? '✅ OK' : `❌ ${registerRes.status}`);
    console.log('   Response:', registerData);
  } catch (e) {
    console.error('   Register API Error:', e);
  }
  console.log('');

  // Test login endpoint
  try {
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'debug@test.com', 
        password: 'debug123456'
      })
    });
    const loginData = await loginRes.json();
    console.log('   Login API:', loginRes.status === 200 ? '✅ OK' : `❌ ${loginRes.status}`);
    console.log('   Response:', loginData);
  } catch (e) {
    console.error('   Login API Error:', e);
  }
  console.log('');

  // 3. Test routes
  console.log('3️⃣ Testing routes:');
  const routes = ['/login', '/register', '/'];
  for (const route of routes) {
    try {
      const res = await fetch(route);
      console.log(`   ${route}:`, res.status === 200 ? '✅ OK' : `❌ ${res.status}`);
    } catch (e) {
      console.error(`   ${route} Error:`, e.message);
    }
  }
  console.log('');

  // 4. Check current location
  console.log('4️⃣ Current location:');
  console.log('   URL:', window.location.href);
  console.log('   Pathname:', window.location.pathname);
  console.log('');

  // 5. Check React Router
  console.log('5️⃣ React Router:');
  console.log('   Available:', typeof window !== 'undefined' ? '✅' : '❌');
  console.log('');

  console.log('=== ✅ AUTH DEBUG END ===');
  
  return {
    token,
    user: user ? JSON.parse(user) : null,
    currentUrl: window.location.href
  };
};

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  console.log('💡 Run debugAuth() in console to debug authentication');
}
