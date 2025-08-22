#!/bin/bash

# Script to fix logger import issues in API tool files

echo "Fixing logger import issues..."

# Find all API tool files
find tools/zapsign-workspace/api/ -name "*.js" -type f | while read -r file; do
    echo "Processing: $file"
    
    # Remove any incorrectly placed logger imports
    sed -i '/^import { logger } from "\.\.\/\.\.\/\.\.\/lib\/logger\.js";$/d' "$file"
    
    # Find the line number after the JSDoc comment (first line that starts with import)
    import_line=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)
    
    if [ -n "$import_line" ]; then
        # Add logger import after the first import line
        sed -i "${import_line}a import { logger } from '../../../lib/logger.js';" "$file"
    fi
    
    # Replace console.error with logger.error
    sed -i 's/console\.error/logger.error/g' "$file"
    
    # Replace console.log with logger.info
    sed -i 's/console\.log/logger.info/g' "$file"
    
    # Fix quote issues - replace double quotes with single quotes in import statements
    sed -i 's/import "\([^"]*\)"/import '\''\1'\''/g' "$file"
done

echo "Logger import issues fixed!"
