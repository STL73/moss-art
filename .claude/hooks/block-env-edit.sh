#!/bin/bash
# PreToolUse hook: block Write/Edit on gitignored secrets files (.env, .env.*),
# except .env.example which is meant to be committed. See .gitignore and
# .claude/rules/backend.md (Protected files).

input=$(cat)
file=$(node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);process.stdout.write(i.tool_input?.file_path||'')})" <<< "$input")

base=$(basename "$file")

if [ "$base" = ".env.example" ]; then
  exit 0
fi

case "$base" in
  .env|.env.*)
    echo "[Hook] BLOCKED: $file is a gitignored secrets file. Edit it outside Claude Code if this is intentional." >&2
    exit 2
    ;;
esac

exit 0
