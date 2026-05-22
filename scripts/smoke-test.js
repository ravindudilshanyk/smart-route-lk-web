(async () => {
  try {
    const base = 'http://localhost:5000';

    // 1. Register
    const regRes = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          nic: 'SMK001',
          first_name: 'Smoke',
          last_name: 'Test',
          date_of_birth: '1990-01-01',
          gender: 'male',
          whatsapp_number: '+9477012345',
          email: 'smoke+01@example.com',
          password: 'Password123!'
        })
    });
    const reg = await regRes.json().catch(() => ({ status: 'invalid json' }));
    console.log('REGISTER:', regRes.status, JSON.stringify(reg));

    // 2. Login
    // Use token from registration if available, otherwise login
    let token = reg.token;
    if (!token) {
      const loginRes = await fetch(base + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: '+9477012345', password: 'Password123!' })
      });
      const login = await loginRes.json().catch(() => ({ status: 'invalid json' }));
      console.log('LOGIN:', loginRes.status, JSON.stringify(login));
      token = login.token;
    }
    if (!token) {
      console.error('No token received, aborting.');
      process.exit(1);
    }

    // 3. Me
    const meRes = await fetch(base + '/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const me = await meRes.json().catch(() => ({ status: 'invalid json' }));
    console.log('ME:', meRes.status, JSON.stringify(me));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
