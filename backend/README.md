Security notes

- Do not commit `.env` or secrets to source control. The repository root `.gitignore` excludes `.env` files.
- If PayHere credentials were rotated for testing, rotate them again in production and store secrets in a secrets manager.
- To restart the backend in development:

```bash
cd backend
npm run dev
```

If you need, I can add a `backend/.env.example` file with the required keys (no values).