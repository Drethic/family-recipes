# Check Files Below 90% Coverage

Identify all source files with less than 90% coverage in any category (statements, branches, functions, or lines).

## Command
This command runs coverage and filters for files below the 90% threshold.

```bash
cd frontend && npm run test:coverage 2>&1 | awk '/^File.*Stmts/,/^ERROR/' | grep -v "^-" | grep -v "^File" | grep -v "^ERROR" | grep -v "^All files"
```

## Output Format
Files are displayed with their coverage percentages:
- Column 1: File path
- Column 2: % Statements
- Column 3: % Branch
- Column 4: % Functions
- Column 5: % Lines
- Column 6: Uncovered line numbers
