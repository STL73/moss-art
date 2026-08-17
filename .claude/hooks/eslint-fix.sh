#!/bin/bash
# PostToolUse hook: eslint --fix on files edited under client/ or server/.
# client/ and server/ have separate eslint.config.js + node_modules, so this
# picks the right subproject and runs its local eslint rather than a root one
# (there is no root package.json/eslint config in this repo).

input=$(cat)
file=$(node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);process.stdout.write(i.tool_input?.file_path||'')})" <<< "$input")

case "$file" in
  *node_modules*) exit 0 ;;
esac

case "$file" in
  */client/*.js|*/client/*.jsx)
    rel="${file#*client/}"
    (cd client && npx eslint --fix "$rel") 2>&1
    ;;
  */server/*.js|*/server/*.mjs|*/server/*.cjs)
    rel="${file#*server/}"
    (cd server && npx eslint --fix "$rel") 2>&1
    ;;
esac

exit 0
