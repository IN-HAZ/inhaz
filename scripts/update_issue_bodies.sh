#!/usr/bin/env bash
#
# Rewrite existing GitHub issue bodies so inline image refs point at the
# github.com blob pages (the repo is private, so raw URLs 404) instead of
# broken relative paths.
#
# Iterates the *actual* GitHub issues (matching by the US-id prefix in the
# title, not a static story list) so every backlog issue gets fixed regardless
# of title drift.
#

set -euo pipefail

GREEN='\033[0;32m'
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_NAME="${REPO_NAME:-IN-HAZ/inhaz}"
RAW_BASE="${RAW_BASE:-https://github.com/IN-HAZ/inhaz/blob/develop}"

DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run) DRY_RUN=true ;;
    esac
done

if ! gh auth status &>/dev/null; then
    echo -e "${RED}❌ gh CLI is not authenticated. Please run 'gh auth login' first.${NC}"
    exit 1
fi

updated_count=0
skipped_count=0
failed_count=0

readarray -t issues < <(gh issue list --repo "$REPO_NAME" --state all --limit 100 --json number,title --jq '.[] | "\(.number)|\(.title)"')

for entry in "${issues[@]}"; do
    num="${entry%%|*}"
    title="${entry#*|}"
    us_id=$(echo "$title" | grep -oP 'US-\d+' | head -1 || true)

    if [ -z "$us_id" ]; then
        echo -e "  ${YELLOW}ℹ️  No US id in title, skipping:${NC} #{${num}} ${title}"
        skipped_count=$((skipped_count + 1))
        continue
    fi

    us_slug="us-${us_id#US-}"
    readme=$(ls "$SCRIPT_DIR"/../dev/*/${us_slug}-*/README.md 2>/dev/null | head -1 || true)
    if [ -z "$readme" ]; then
        echo -e "  ${YELLOW}ℹ️  No README found for:${NC} #{${num}} ${title}"
        skipped_count=$((skipped_count + 1))
        continue
    fi

    epic_dir=$(basename "$(dirname "$(dirname "$readme")")")
    us_dir=$(basename "$(dirname "$readme")")

    # Rewrite relative `](assets/x.png)` refs to blob URLs on develop.
    rewrite() { sed -E "s#\]\(assets/([^)]+)\)#](${RAW_BASE}/dev/${epic_dir}/${us_dir}/assets/\1)#g" "$readme"; }

    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[Dry Run]${NC} #{${num}} ${title}"
        echo -e "  ${BLUE}    would set body to:${NC} $(rewrite | grep -o 'github.com/IN-HAZ[^)]*' | head -1)"
        continue
    fi

    if gh issue edit "$num" --repo "$REPO_NAME" --body-file <(rewrite) 2>/tmp/upd_err; then
        echo -e "  ${GREEN}✓ Updated:${NC} #{${num}} ${title}"
        updated_count=$((updated_count + 1))
    else
        echo -e "  ${RED}✗ Failed:${NC} #{${num}} ${title} — $(cat /tmp/upd_err)"
        failed_count=$((failed_count + 1))
    fi
done

echo ""
echo -e "${GREEN}====================================================${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${GREEN}🎉 Dry run complete. Run without --dry-run to update issue bodies.${NC}"
else
    echo -e "${GREEN}🎉 Done. Updated: ${updated_count} | Skipped: ${skipped_count} | Failed: ${failed_count}${NC}"
fi
echo -e "${GREEN}====================================================${NC}"
