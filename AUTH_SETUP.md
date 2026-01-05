# Authentication Setup Guide

## Setting Up Authentication

Your PaperTracker now has authentication! Follow these steps to complete the setup:

### Step 1: Generate Password Hash

Run this command with your desired password:

```bash
node generate-password-hash.js "YourSecurePassword123"
```

This will output a SHA-256 hash of your password.

### Step 2: Set Environment Secrets

Set your admin email:
```bash
npx wrangler secret put ADMIN_EMAIL
# When prompted, enter your email address
```

Set your password hash:
```bash
npx wrangler secret put ADMIN_PASSWORD_HASH
# When prompted, paste the hash from Step 1
```

### Step 3: Deploy

Deploy your application:
```bash
cd frontend
npm run build
cd ..
npx wrangler pages deploy frontend/dist
```

## What's Protected

- ✅ **Dashboard**: "Add New Paper" button (hidden when not logged in)
- ✅ **Reader**: "Focus" button (hidden when not logged in)
- ✅ **Focus Page**: Entire page requires login
- ✅ **API Endpoints**: All POST/PUT/DELETE operations require authentication

## What's Public

- ✅ **Dashboard**: View all papers (read-only)
- ✅ **Reader**: View papers and notes (read-only)
- ✅ All GET endpoints (browsing)

## Authentication Features

- **Session Duration**: 2 days
- **Rate Limiting**: 20 login attempts per hour per IP
- **Stay Logged In**: Sessions persist across browser restarts
- **Secure Cookies**: HTTP-only, SameSite=Strict

## Testing Locally

For local development, you need to create a `.dev.vars` file in the project root. This file is used **only for local development** and is separate from production secrets.

**Important**: Add `.dev.vars` to your `.gitignore` to avoid committing secrets!

### Option 1: Create .dev.vars manually

Create a file called `.dev.vars` in the project root with:

```bash
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD_HASH=your-hash-here
```

### Option 2: Use command line

```bash
# First, generate your password hash
node generate-password-hash.js "fullsec"

# Then create .dev.vars file
cat > .dev.vars << EOF
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD_HASH=0e27513c83fece63368027750bb0ca5b39699680902fcd33ca0175a726190055
EOF
```

### Running locally

```bash
# Build the frontend first
cd frontend && npm run build && cd ..

# Run local dev server
npx wrangler pages dev frontend/dist
```

The local server will read secrets from `.dev.vars` automatically.

### Important Notes

- **Production secrets** (set via `wrangler secret put`) are encrypted and cannot be retrieved
- **Local secrets** (in `.dev.vars`) are only for development
- You can use the **same password/email** for both local and production
- Make sure `.dev.vars` is in your `.gitignore`

## Security Notes

⚠️ **Important**: The current implementation uses SHA-256 for password hashing, which is a simplified approach. For production with multiple users, consider upgrading to bcrypt or argon2.

For your personal use case (single user), SHA-256 is adequate, but make sure to:
- Use a strong password (12+ characters, mixed case, numbers, symbols)
- Always use HTTPS in production (Cloudflare provides this automatically)
- Keep your password hash secret and never commit it to version control
