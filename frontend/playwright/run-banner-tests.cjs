const playwright = require('playwright');
const axios = require('axios');

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

function unique(prefix = '') {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function registerUser(withDob = true) {
  const password = 'TestPass123!';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const whatsapp = `+9477${Math.floor(1000000 + Math.random() * 9000000)}`;
    const body = {
      nic: 'NIC' + Math.floor(100000 + Math.random() * 900000),
      first_name: 'E2E',
      last_name: withDob ? 'Complete' : 'Incomplete',
      gender: 'other',
      whatsapp_number: whatsapp,
      email: `e2e+${unique()}@example.com`,
      password,
    };
    if (withDob) body.date_of_birth = '1990-01-01';

    try {
      const reg = await axios.post(`${BACKEND}/api/auth/register`, body);
      if (reg.status !== 201) throw new Error('Register failed');

      const login = await axios.post(`${BACKEND}/api/auth/login`, {
        whatsapp_number: whatsapp,
        password,
      });
      if (login.status !== 200) throw new Error('Login failed');
      const token = login.data.token;
      const me = await axios.get(`${BACKEND}/api/auth/me`, {
        headers: { authorization: `Bearer ${token}` },
      });
      return { token, user: me.data.user };
    } catch (err) {
      if (err.response) {
        console.error(`Attempt ${attempt} - Register error response:`, err.response.status, err.response.data);
      } else {
        console.error(`Attempt ${attempt} - Register error:`, err.message || err);
      }
      if (attempt === 3) throw err;
      // short backoff
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

async function checkBannerVisible(page) {
  // Wait a short while for app to hydrate
  await page.waitForTimeout(800);
  const text = await page.locator('text=Complete your profile').count();
  return text > 0;
}

async function run() {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Complete profile -> banner hidden
    const complete = await registerUser(true);
    await page.addInitScript((t) => localStorage.setItem('token', t), complete.token);
    await page.addInitScript((u) => localStorage.setItem('user', JSON.stringify(u)), complete.user);
    await page.goto(FRONTEND + '/');
    const hidden = !(await checkBannerVisible(page));
    console.log('Complete profile banner hidden:', hidden);
    if (!hidden) throw new Error('Banner visible for complete profile');

    // Incomplete profile -> banner visible
    const incomplete = await registerUser(false);
    await context.clearCookies();
    const page2 = await context.newPage();
    await page2.addInitScript((t) => localStorage.setItem('token', t), incomplete.token);
    await page2.addInitScript((u) => localStorage.setItem('user', JSON.stringify(u)), incomplete.user);
    await page2.goto(FRONTEND + '/');
    const visible = await checkBannerVisible(page2);
    console.log('Incomplete profile banner visible:', visible);
    if (!visible) throw new Error('Banner hidden for incomplete profile');

    await browser.close();
    console.log('E2E banner checks passed');
    process.exit(0);
  } catch (err) {
    console.error('E2E failure:', err.message || err);
    await browser.close();
    process.exit(2);
  }
}

run();
