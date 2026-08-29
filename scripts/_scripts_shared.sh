#
# Shared config for the GitHub project/backlog scripts.
# Sourced by setup_github_project.sh and update_issue_bodies.sh.
#

set -euo pipefail

REPO_NAME="${REPO_NAME:-IN-HAZ/inhaz}"
# Images are served from the develop branch (post this PR).
RAW_BASE="${RAW_BASE:-https://raw.githubusercontent.com/IN-HAZ/inhaz/develop}"

# Rewrite markdown image refs from relative `](assets/x.png)` to absolute
# raw.githubusercontent URLs so GitHub can render them in issue bodies.
# $1 = README path  $2 = epic_dir  $3 = us_dir
rewrite_body() {
    sed -E "s#\]\(assets/([^)]+)\)#](${RAW_BASE}/${2}/${3}/assets/\1)#g" "$1"
}

# user stories: epic_dir|us_dir|story_id|title|priority|sprint|epic_label
STORIES=(
    "epic-01-core-infra-and-auth|us-101-phone-otp-authentication|US-101|Phone OTP Authentication|P0|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-103-dual-role-switching-client-driver|US-103|Dual Role Switching Client/Driver|P1|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-104-personal-info-screen|US-104|Personal Info Screen|P1|Sprint-1|EPIC-01"
    "epic-01-core-infra-and-auth|us-105-profile-configuration-screen|US-105|Profile Configuration Screen|P2|Sprint-2|EPIC-01"
    "epic-01-core-infra-and-auth|us-106-activity-history-screen|US-106|Activity History Screen|P2|Sprint-2|EPIC-01"

    "epic-02-driver-onboarding-and-verification|us-201-driver-document-upload-mobile|US-201|Driver Document Upload (Mobile)|P0|Sprint-1|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-202-driver-pending-validation-screen|US-202|Driver Pending Validation Screen|P1|Sprint-1|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-203-driver-verification-policy|US-203|Driver Verification Policy & KYC Workflow|P0|Sprint-1|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-204-driver-dashboard|US-204|Driver Dashboard|P1|Sprint-2|EPIC-02"
    "epic-02-driver-onboarding-and-verification|us-205-driver-profile-screen|US-205|Driver Profile Screen|P2|Sprint-2|EPIC-02"

    "epic-03-request-creation-and-geospatial|us-301-client-delivery-request-form|US-301|Client Delivery Request Form|P0|Sprint-2|EPIC-03"
    "epic-03-request-creation-and-geospatial|us-302-google-maps-places-autocomplete-and-geocoding|US-302|Google Maps Places Autocomplete & Geocoding|P0|Sprint-2|EPIC-03"
    "epic-03-request-creation-and-geospatial|us-303-geocoded-address-validation|US-303|Geocoded Address Validation|P1|Sprint-2|EPIC-03"
    "epic-03-request-creation-and-geospatial|us-304-address-book|US-304|Address Book / Saved Locations|P2|Sprint-3|EPIC-03"

    "epic-04-reverse-bidding-and-negotiation|us-401-driver-nearby-request-feed-and-quick-bidding|US-401|Driver Nearby Request Feed & Quick Bidding|P0|Sprint-3|EPIC-04"
    "epic-04-reverse-bidding-and-negotiation|us-402-client-realtime-offer-stream-and-acceptance-locking|US-402|Client Realtime Offer Stream & Acceptance Locking|P0|Sprint-3|EPIC-04"
    "epic-04-reverse-bidding-and-negotiation|us-403-counter-offer-negotiation-flow|US-403|Counter-Offer Negotiation Flow|P1|Sprint-3|EPIC-04"

    "epic-05-trip-execution-tracking-and-chat|us-501-trip-status-milestone-stepper|US-501|Trip Status Milestone Stepper|P0|Sprint-3|EPIC-05"
    "epic-05-trip-execution-tracking-and-chat|us-502-realtime-driver-gps-tracking-map|US-502|Realtime Driver GPS Tracking Map|P0|Sprint-3|EPIC-05"
    "epic-05-trip-execution-tracking-and-chat|us-503-in-app-trip-chat-and-media|US-503|In-App Trip Chat & Media|P1|Sprint-4|EPIC-05"

    "epic-06-payments-commission-and-ratings|us-601-cash-on-delivery-handshake-and-receipt|US-601|Cash on Delivery Handshake & Receipt|P0|Sprint-4|EPIC-06"
    "epic-06-payments-commission-and-ratings|us-602-platform-commission-ledger-and-driver-balance|US-602|Platform Commission Ledger & Driver Balance|P1|Sprint-4|EPIC-06"
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
