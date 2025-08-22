#!/bin/bash

# Script to fix console statements in API tool files
# Replace console.error with logger.error and console.log with logger.info

echo "Fixing console statements in API tool files..."

# Find all API tool files
find tools/zapsign-workspace/api/ -name "*.js" -type f | while read -r file; do
    echo "Processing: $file"
    
    # Replace console.error with logger.error
    sed -i 's/console\.error/logger.error/g' "$file"
    
    # Replace console.log with logger.info
    sed -i 's/console\.log/logger.info/g' "$file"
    
    # Add logger import if not present
    if ! grep -q "import.*logger" "$file"; then
        # Add logger import after the first import line
        sed -i '1a import { logger } from "../../../lib/logger.js";' "$file"
    fi
done

echo "Console statements fixed!"
