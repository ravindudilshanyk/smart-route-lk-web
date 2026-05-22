import { test, expect } from '@playwright/test';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

function unique(prefix = '') {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

test.describe('Profile banner', () => {
  test('complete profile hides banner', async ({ page, request }) => {
    const whatsapp = `+9477${Math.floor(1000000 + Math.random() * 9000000)}`;
    const password = 'TestPass123!';

    // Register with date_of_birth -> complete profile
    const reg = await request.post(`${BACKEND}/api/auth/register`, {
      data: {
        nic: unique('NIC'),
        first_name: 'Playwright',
        last_name: 'User',
        date_of_birth: '1990-01-01',
        gender: 'other',
        whatsapp_number: whatsapp,
        email: `pw+${unique()}@example.com`,
        password,
      },
    });
    expect(reg.ok()).toBeTruthy();

    const login = await request.post(`${BACKEND}/api/auth/login`, {
      data: { whatsapp_number: whatsapp, password },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();

    const meRes = await request.get(`${BACKEND}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(meRes.ok()).toBeTruthy();
    const meJson = await meRes.json();

    // Seed localStorage before page load
    await page.addInitScript((t) => localStorage.setItem('token', t), token);
    await page.addInitScript((u) => localStorage.setItem('user', JSON.stringify(u)), meJson.user);

    await page.goto('/');

    await expect(page.locator('text=Complete your profile')).toHaveCount(0);
  });

  test('incomplete profile shows banner', async ({ page, request }) => {
    const whatsapp = `+9477${Math.floor(1000000 + Math.random() * 9000000)}`;
    const password = 'TestPass123!';

    // Register WITHOUT date_of_birth -> incomplete profile
    const reg = await request.post(`${BACKEND}/api/auth/register`, {
      data: {
        nic: unique('NIC'),
        first_name: 'Playwright',
        last_name: 'Incomplete',
        // date_of_birth omitted intentionally
        gender: 'other',
        whatsapp_number: whatsapp,
        email: `pw+${unique()}@example.com`,
        password,
      },
    });
    expect(reg.ok()).toBeTruthy();

    const login = await request.post(`${BACKEND}/api/auth/login`, {
      data: { whatsapp_number: whatsapp, password },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();

    const meRes = await request.get(`${BACKEND}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(meRes.ok()).toBeTruthy();
    const meJson = await meRes.json();

    await page.addInitScript((t) => localStorage.setItem('token', t), token);
    await page.addInitScript((u) => localStorage.setItem('user', JSON.stringify(u)), meJson.user);

    await page.goto('/');

    await expect(page.locator('text=Complete your profile')).toBeVisible();
  });
});
