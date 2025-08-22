#!/bin/bash

# Script to fix all ESLint issues in the project

echo "Fixing all ESLint issues..."

# Fix logger imports in API tool files
find tools/zapsign-workspace/api/ -name "*.js" -type f | while read -r file; do
    echo "Processing: $file"
    
    # Add logger import if not present
    if ! grep -q "import.*logger" "$file"; then
        # Add logger import after the first import line
        sed -i '1a import { logger } from "../../../lib/logger.js";' "$file"
    fi
    
    # Replace console.error with logger.error
    sed -i 's/console\.error/logger.error/g' "$file"
    
    # Replace console.log with logger.info
    sed -i 's/console\.log/logger.info/g' "$file"
    
    # Fix quote issues - replace double quotes with single quotes in import statements
    sed -i 's/import "\([^"]*\)"/import '\''\1'\''/g' "$file"
done

echo "ESLint issues fixed!"
