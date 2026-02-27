#!/bin/bash
SKILL_DIR="$HOME/.claude/skills/i18n-extract"
mkdir -p "$HOME/.claude/skills"
cp -r "$(dirname "$0")/.." "$SKILL_DIR"
echo "✅ Skill installed to $SKILL_DIR"
