Security notes

- Do not commit `.env` or secrets to source control. The repository root `.gitignore` excludes `.env` files.
- If PayHere credentials were rotated for testing, rotate them again in production and store secrets in a secrets manager.
- To restart the backend in development:

```bash
cd backend
npm run dev
```

If you need, I can add a `backend/.env.example` file with the required keys (no values).

Login troubleshooting (local)

- Health check:

```bash
curl http://localhost:5000/health
```

- If login requests hang or timeout, check for a stale process on port 5000:

```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
cd backend
npm run dev
```

- Demo users from `docs/database/seed.sql` now use a deterministic password:
	- Password: `password`
	- Example numbers: `+94760000001` (admin), `+94770000002` (owner), `+94710000006` (passenger)