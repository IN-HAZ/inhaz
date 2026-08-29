#!/usr/bin/env bash
#
# Rewrite existing GitHub issue bodies so inline image refs point at the
# github.com blob pages (the repo is private, so raw URLs 404) instead of
# broken relative paths.
#

set -euo pipefail

GREEN='\033[0;32m'
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=_scripts_shared.sh
source "$SCRIPT_DIR/_scripts_shared.sh"

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

for story in "${STORIES[@]}"; do
    IFS="|" read -r epic_dir us_dir story_id title priority sprint epic_label <<< "$story"
    body_file="$SCRIPT_DIR/../dev/${epic_dir}/${us_dir}/README.md"
    issue_title="${story_id}: ${title}"

    if [ ! -f "$body_file" ]; then
        echo -e "  ${RED}❌ File not found:${NC} ${body_file}"
        failed_count=$((failed_count + 1))
        continue
    fi

    issue_number=$(gh issue list --repo "$REPO_NAME" --state all --search "in:title \"${issue_title}\"" --json number,title --jq ".[] | select(.title == \"${issue_title}\") | .number" 2>/dev/null || true)
    if [ -z "$issue_number" ]; then
        echo -e "  ${YELLOW}ℹ️  No existing issue for:${NC} ${issue_title}"
        skipped_count=$((skipped_count + 1))
        continue
    fi

    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[Dry Run]${NC} #{${issue_number}} ${issue_title}"
        echo -e "  ${BLUE}    would set body to:${NC} $(rewrite_body "$body_file" "$epic_dir" "$us_dir" | grep -o 'github.com/IN-HAZ[^)]*' | head -1)"
        continue
    fi

    if gh issue edit "$issue_number" --repo "$REPO_NAME" --body-file <(rewrite_body "$body_file" "$epic_dir" "$us_dir") 2>/tmp/upd_err; then
        echo -e "  ${GREEN}✓ Updated:${NC} #{${issue_number}} ${issue_title}"
        updated_count=$((updated_count + 1))
    else
        echo -e "  ${RED}✗ Failed:${NC} #{${issue_number}} ${issue_title} — $(cat /tmp/upd_err)"
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
