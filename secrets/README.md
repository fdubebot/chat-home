# Secrets Folder

Store local credentials here.

## Email credentials
1. Copy `email.env.example` to `email.env`
2. Fill in your real values
3. Keep `email.env` local only (ignored by git)

Expected keys in `email.env`:
- `EMAIL_PROVIDER`
- `EMAIL_ADDRESS`
- `EMAIL_APP_PASSWORD`
- `EMAIL_RECOVERY_EMAIL` (optional)
- `EMAIL_NOTES` (optional)
