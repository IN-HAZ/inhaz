#!/usr/bin/env bash

set -euo pipefail

GREEN='\033[0;32m'
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# shellcheck source=_scripts_shared.sh
source "$(dirname "$0")/_scripts_shared.sh"

PROJECT_TITLE="${PROJECT_TITLE:-inHaz Platform Backlog}"
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        --dry-run) DRY_RUN=true ;;
    esac
done

echo -e "${PURPLE}====================================================${NC}"
echo -e "${PURPLE}🚀 inHaz GitHub Project & Backlog Setup Script${NC}"
echo -e "${PURPLE}====================================================${NC}"
echo -e "${BLUE}Target Repository:${NC} ${REPO_NAME}"
echo -e "${BLUE}Project Title:${NC}     ${PROJECT_TITLE}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Mode:               DRY RUN (Previewing actions only)${NC}"
fi
echo ""

if ! gh auth status &>/dev/null; then
    echo -e "${RED}❌ gh CLI is not authenticated. Please run 'gh auth login' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ gh CLI authenticated${NC}"

# 1. Labels
echo -e "\n${BLUE}🏷️  Creating GitHub Labels...${NC}"
LABELS=(
    "EPIC-01:7928CA:Core Infra & Auth"
    "EPIC-02:7928CA:Driver Onboarding"
    "EPIC-03:7928CA:Request & Maps"
    "EPIC-04:7928CA:Reverse Bidding"
    "EPIC-05:7928CA:Trip Tracking & Chat"
    "EPIC-06:7928CA:Payments & Commission"
    "EPIC-07:7928CA:Admin Governance"
    "EPIC-08:7928CA:DB Foundation"
    "EPIC-09:7928CA:Legal & App Info"
    "EPIC-10:7928CA:Localisation i18n"
    "P0:D93F0C:Blocker MVP"
    "P1:E68D00:High Priority"
    "P2:0075CA:Medium Priority"
    "Sprint-1:0E8A16:Sprint 1"
    "Sprint-2:0E8A16:Sprint 2"
    "Sprint-3:0E8A16:Sprint 3"
    "Sprint-4:0E8A16:Sprint 4"
    "Sprint-5:0E8A16:Sprint 5"
)

for label_info in "${LABELS[@]}"; do
    IFS=":" read -r name color desc <<< "$label_info"
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[Dry Run]${NC} Would create label: ${name} (${color})"
    else
        if gh label create "$name" --color "$color" --description "$desc" --repo "$REPO_NAME" --force &>/dev/null; then
            echo -e "  ${GREEN}✓ Label:${NC} ${name}"
        else
            echo -e "  ${RED}✗ Label failed:${NC} ${name}"
        fi
    fi
done

# 2. Project
echo -e "\n${BLUE}📊 Creating GitHub Project V2...${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "  ${YELLOW}[Dry Run]${NC} Would create project: ${PROJECT_TITLE}"
else
    OWNER="${REPO_NAME%%/*}"
    if PROJECT_JSON=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json 2>/tmp/proj_err); then
        PROJECT_URL=$(echo "$PROJECT_JSON" | grep -o '"url": *"[^"]*"' | cut -d'"' -f4 || true)
        echo -e "  ${GREEN}✓ Project created:${NC} ${PROJECT_URL:-<created, url unparsed>}"
    else
        echo -e "  ${YELLOW}ℹ️  Project creation failed or already exists:${NC} $(cat /tmp/proj_err)"
    fi
fi

# 3. Issues
echo -e "\n${BLUE}📝 Creating User Story Issues from dev/...${NC}"

STORIES=(
    "epic-01-core-infra-and-auth|us-101-phone-otp-authentication|US-101|Phone OTP Authentication|P0|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-102-sanctum-token-and-session-management|US-102|Sanctum Token & Session Management|P0|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-103-dual-role-switching-client-driver|US-103|Dual-Role Switching (Client / Driver)|P0|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-104-personal-info-screen|US-104|Personal Info & Profile Edit Screen|P1|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-105-profile-configuration-screen|US-105|Profile Configuration & Notification Preferences|P2|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-106-activity-history-screen|US-106|Activity History Screen|P1|Sprint-1|EPIC-01"

    "epic-02-driver-onboarding-and-verification|us-201-driver-document-upload-mobile|US-201|Driver Document Upload (Mobile)|P0|Sprint-2|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-202-driver-pending-validation-screen|US-202|Driver Pending Validation Status Screen|P0|Sprint-2|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-203-admin-document-inspection-and-approval-filament|US-203|Admin Document Inspection & Approval (Filament)|P0|Sprint-2|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-204-driver-dashboard|US-204|Driver Operational Dashboard Screen|P0|Sprint-2|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-205-driver-profile-screen|US-205|Driver Profile Screen (Driver Mode)|P1|Sprint-2|EPIC-02"

    "epic-03-request-creation-and-geospatial|us-301-client-delivery-request-form|US-301|Client Delivery Request Form & Photo Capture|P0|Sprint-2|EPIC-03"
    "epic-03-request-creation-and-geospatial|us-302-google-maps-places-autocomplete-and-geocoding|US-302|Google Maps Integration & Location Picker|P0|Sprint-2|EPIC-03"
    "epic-03-request-creation-and-geospatial|us-303-recommended-price-calculator|US-303|Recommended Price Calculator|P1|Sprint-2|EPIC-03"
    "epic-03-request-creation-and-geospatial|us-304-address-book|US-304|Address Book / Saved Locations Screen|P0|Sprint-2|EPIC-03"

    "epic-04-reverse-bidding-and-negotiation|us-401-driver-nearby-request-feed-and-quick-bidding|US-401|Driver Nearby Request Feed & Quick Bidding|P0|Sprint-3|EPIC-04"
    "epic-04-reverse-bidding-and-negotiation|us-402-client-realtime-offer-stream-and-acceptance-locking|US-402|Client Realtime Offer Stream & Acceptance Locking|P0|Sprint-3|EPIC-04"
    "epic-04-reverse-bidding-and-negotiation|us-403-counter-offer-negotiation-flow|US-403|Counter-Offer Negotiation Flow|P1|Sprint-3|EPIC-04"

    "epic-05-trip-execution-tracking-and-chat|us-501-trip-status-milestone-stepper|US-501|Trip Status Milestone Stepper|P0|Sprint-3|EPIC-05"
    "epic-05-trip-execution-tracking-and-chat|us-502-realtime-driver-gps-tracking-map|US-502|Realtime Driver GPS Tracking Map|P0|Sprint-3|EPIC-05"
    "epic-05-trip-execution-tracking-and-chat|us-503-in-app-trip-chat-and-media|US-503|In-App Trip Chat & Media|P1|Sprint-3|EPIC-05"

    "epic-06-payments-commission-and-ratings|us-601-cash-on-delivery-handshake-and-receipt|US-601|Cash-on-Delivery Handshake & Digital Receipt|P0|Sprint-4|EPIC-06"
    "epic-06-payments-commission-and-ratings|us-602-platform-commission-ledger-and-driver-balance|US-602|Platform Commission Ledger & Driver Balance|P0|Sprint-4|EPIC-06"
    "epic-06-payments-commission-and-ratings|us-603-post-trip-ratings-and-dispute-filing|US-603|Post-Trip Ratings & Dispute Filing|P1|Sprint-4|EPIC-06"
    "epic-06-payments-commission-and-ratings|us-604-payment-method-selection|US-604|Payment Method Selection Screen|P2|Sprint-4|EPIC-06"

    "epic-07-admin-back-office-and-governance|us-701-admin-2fa-login|US-701|Admin 2-Factor Authentication (2FA) Login|P1|Sprint-5|EPIC-07"
    "epic-07-admin-back-office-and-governance|us-702-filament-user-and-driver-management|US-702|Filament User & Driver Management|P1|Sprint-5|EPIC-07"
    "epic-07-admin-back-office-and-governance|us-703-filament-complaint-and-dispute-resolution|US-703|Filament Complaint & Dispute Resolution|P1|Sprint-5|EPIC-07"
    "epic-07-admin-back-office-and-governance|us-704-filament-system-settings-and-pricing-grid|US-704|Filament System Settings & Content Management|P2|Sprint-5|EPIC-07"

    "epic-08-database-foundation-and-integrity|us-801-schema-drift-alignment|US-801|Schema Drift Alignment|P0|Sprint-1|EPIC-08"
    "epic-08-database-foundation-and-integrity|us-802-missing-domain-tables|US-802|Missing Domain Tables & Content Schemas|P0|Sprint-1|EPIC-08"
    "epic-08-database-foundation-and-integrity|us-803-commission-ledger-schema|US-803|Commission Ledger Schema|P0|Sprint-1|EPIC-08"
    "epic-08-database-foundation-and-integrity|us-804-indexes-constraints-performance|US-804|Indexes, Constraints & Performance|P1|Sprint-1|EPIC-08"

    "epic-09-legal-and-app-info|us-901-privacy-policy-screen|US-901|Privacy Policy & Terms Screen|P1|Sprint-4|EPIC-09"
    "epic-09-legal-and-app-info|us-902-about-inhaz-screen|US-902|About inHaz Screen|P2|Sprint-4|EPIC-09"
    "epic-09-legal-and-app-info|us-903-help-centre-screen|US-903|Help Centre & FAQ Screen|P2|Sprint-4|EPIC-09"

    "epic-10-localisation-and-i18n|us-1001-i18n-setup-and-translation-files|US-1001|i18n Setup & Translation Files|P0|Sprint-1|EPIC-10"
    "epic-10-localisation-and-i18n|us-1002-language-region-settings-screen|US-1002|Language & Region Settings Screen|P0|Sprint-1|EPIC-10"
    "epic-10-localisation-and-i18n|us-1003-backend-locale-support|US-1003|Backend Locale Support|P1|Sprint-1|EPIC-10"
)

created_count=0
failed_count=0
skipped_count=0

for story in "${STORIES[@]}"; do
    IFS="|" read -r epic_dir us_dir story_id title priority sprint epic_label <<< "$story"
    body_file="/home/bagi/Notes/dev/in-haz/dev/${epic_dir}/${us_dir}/README.md"
    issue_title="${story_id}: ${title}"

    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[Dry Run]${NC} Would create issue: ${issue_title} (Labels: ${epic_label}, ${priority}, ${sprint})"
        continue
    fi

    if [ ! -f "$body_file" ]; then
        echo -e "  ${RED}❌ File not found:${NC} ${body_file}"
        failed_count=$((failed_count + 1))
        continue
    fi

    # Idempotency: skip if an issue with this exact title already exists
    existing=$(gh issue list --repo "$REPO_NAME" --state all --search "in:title \"${issue_title}\"" --json title --jq ".[] | select(.title == \"${issue_title}\") | .title" 2>/dev/null || true)
    if [ -n "$existing" ]; then
        echo -e "  ${YELLOW}ℹ️  Already exists, skipping:${NC} ${issue_title}"
        skipped_count=$((skipped_count + 1))
        continue
    fi

    if ISSUE_URL=$(gh issue create \
        --repo "$REPO_NAME" \
        --title "$issue_title" \
        --body-file <(rewrite_body "$body_file" "$epic_dir" "$us_dir") \
        --label "${epic_label},${priority},${sprint}" 2>/tmp/issue_err); then
        echo -e "  ${GREEN}✓ Created:${NC} ${issue_title} -> ${ISSUE_URL}"
        created_count=$((created_count + 1))
    else
        echo -e "  ${RED}✗ Failed:${NC} ${issue_title} — $(cat /tmp/issue_err)"
        failed_count=$((failed_count + 1))
    fi
done

echo ""
echo -e "${GREEN}====================================================${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${GREEN}🎉 Dry run complete! Run without --dry-run to push issues to GitHub.${NC}"
else
    echo -e "${GREEN}🎉 Done. Created: ${created_count} | Skipped (existing): ${skipped_count} | Failed: ${failed_count}${NC}"
fi
echo -e "${GREEN}====================================================${NC}"
