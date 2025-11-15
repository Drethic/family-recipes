# Pre-Commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality checks before commits are allowed.

## What Gets Checked

Every commit automatically runs the following checks:

### Frontend Checks
1. **ESLint** - Code style and quality checks
2. **TypeScript Type Check** - Ensures no type errors
3. **Unit Tests** - All 514 tests must pass

### Backend Checks
1. **ESLint** - Code style and quality checks
2. **TypeScript Type Check** - Ensures no type errors
3. **Unit Tests** - All 820 tests must pass

## How It Works

When you run `git commit`, the pre-commit hook automatically:
- Runs all linting checks
- Runs type checking
- Runs all unit tests
- Blocks the commit if any check fails

## Setup

The hooks are automatically installed when you run:
```bash
npm install
```

This triggers the `prepare` script which installs Husky hooks.

## Bypassing Hooks (Not Recommended)

In emergency situations, you can bypass the pre-commit hook with:
```bash
git commit --no-verify
```

**⚠️ Warning:** Only use this when absolutely necessary. All commits should pass the checks.

## Testing the Hook

To test the pre-commit hook without making a commit:
```bash
.husky/pre-commit
```

## Troubleshooting

### Hook doesn't run
- Make sure you ran `npm install` in the root directory
- Verify `.husky/pre-commit` is executable: `chmod +x .husky/pre-commit`

### Tests take too long
- The hook runs all tests to ensure quality
- This is intentional to catch issues early
- Consider using `git commit --amend` for small fixes

## Benefits

✅ Catches issues before they reach CI
✅ Ensures code quality standards
✅ Prevents broken code from being committed
✅ Saves time by failing fast
✅ Maintains high test coverage
