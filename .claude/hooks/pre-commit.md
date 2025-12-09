# Pre-Commit Hook

Runs before every git commit to ensure code quality.

## Checks

1. **TypeScript Compilation** - Ensure no type errors
2. **Linting** - Check code style
3. **Format** - Verify Prettier formatting

## Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint src/ --ext .ts

# Format check
npx prettier --check src/
```

## Auto-fix

If issues found, offer to auto-fix:

```bash
npx eslint src/ --ext .ts --fix
npx prettier --write src/
```

## Skip Conditions

Skip hook if:
- Commit message contains `[skip-ci]`
- Only README/docs changes
- Emergency hotfix branch
