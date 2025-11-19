# Terraform Environment Configuration

This directory contains environment-specific configuration files for the Family Recipes infrastructure.

## Quick Start

### 1. Create Your Configuration Files

Copy the example files to create your actual configuration files:

```bash
cd terraform/environments

# For local/development environment
cp local.tfvars.example local.tfvars

# For production environment
cp production.tfvars.example production.tfvars
```

### 2. Generate Secure Secrets

Generate strong, random secrets for your deployment:

```bash
# Database password (32 characters for dev, 48 for production)
openssl rand -base64 32

# JWT secret (32 characters for dev, 48 for production)
openssl rand -base64 32

# JWT refresh secret (32 characters for dev, 48 for production)
openssl rand -base64 32

# Test user passwords (dev only, 16 characters)
openssl rand -base64 16  # admin
openssl rand -base64 16  # member
```

### 3. Edit Your Configuration Files

Open `local.tfvars` and `production.tfvars` in a secure text editor and fill in the sensitive values:

```hcl
# Required for both environments
db_username        = "recipeuser"
db_password        = "PASTE_GENERATED_PASSWORD_HERE"
jwt_secret         = "PASTE_GENERATED_JWT_SECRET_HERE"
jwt_refresh_secret = "PASTE_GENERATED_JWT_REFRESH_SECRET_HERE"

# Required for local/dev only
test_admin_password  = "PASTE_GENERATED_ADMIN_PASSWORD_HERE"
test_member_password = "PASTE_GENERATED_MEMBER_PASSWORD_HERE"
```

**IMPORTANT**: Use different secrets for development and production!

### 4. Secure Your Secrets

- **Never commit** `*.tfvars` files to version control (they're gitignored)
- **Store production secrets** in a secure password manager
- **Share secrets securely** using encrypted channels only
- **Rotate secrets** quarterly or when team members change

## File Descriptions

| File | Purpose | Tracked in Git? |
|------|---------|-----------------|
| `local.tfvars.example` | Template for local/dev config | ✅ Yes |
| `production.tfvars.example` | Template for production config | ✅ Yes |
| `local.tfvars` | Actual local/dev config with secrets | ❌ No (gitignored) |
| `production.tfvars` | Actual production config with secrets | ❌ No (gitignored) |

## Alternative: Environment Variables

Instead of editing `.tfvars` files, you can set secrets via environment variables:

```bash
# Required for all environments
export TF_VAR_db_username="recipeuser"
export TF_VAR_db_password="YOUR_PASSWORD"
export TF_VAR_jwt_secret="YOUR_JWT_SECRET"
export TF_VAR_jwt_refresh_secret="YOUR_JWT_REFRESH_SECRET"

# Required for local/dev only
export TF_VAR_test_admin_password="YOUR_ADMIN_PASSWORD"
export TF_VAR_test_member_password="YOUR_MEMBER_PASSWORD"

# Then deploy without specifying secrets in files
cd ../
terraform apply -var-file="environments/local.tfvars"
```

This is especially useful for CI/CD pipelines (GitHub Actions).

## Deploying

Once your configuration files are set up:

```bash
# Deploy local/dev environment
cd ..  # Back to terraform root
terraform init
terraform plan -var-file="environments/local.tfvars"
terraform apply -var-file="environments/local.tfvars"

# Deploy production environment
terraform plan -var-file="environments/production.tfvars"
terraform apply -var-file="environments/production.tfvars"
```

Or use the management script:

```bash
cd ../..  # Back to project root
./scripts/manage-infrastructure.sh deploy local
./scripts/manage-infrastructure.sh deploy production
```

## Security Checklist

Before deploying production:

- [ ] Used very strong passwords (48+ characters for production)
- [ ] Different secrets for dev and production
- [ ] Stored production secrets in password manager
- [ ] Never shared secrets via email/chat
- [ ] `.tfvars` files are in `.gitignore`
- [ ] Verified no secrets in git history
- [ ] Limited team access to production secrets
- [ ] MFA enabled on AWS account
- [ ] Plan to rotate secrets quarterly

## Troubleshooting

### "No variable definition found"

Make sure you're using `-var-file=` with the correct path:

```bash
terraform apply -var-file="environments/local.tfvars"
```

### "tfvars file not found"

Make sure you created the `.tfvars` files from the `.example` templates:

```bash
cp environments/local.tfvars.example environments/local.tfvars
```

### "Invalid value for variable"

Check that all required variables are set in your `.tfvars` file or as environment variables.

## Additional Resources

- [Main Deployment Guide](../../DEPLOYMENT.md)
- [Terraform README](../README.md)
- [Management Script](../../scripts/manage-infrastructure.sh)
