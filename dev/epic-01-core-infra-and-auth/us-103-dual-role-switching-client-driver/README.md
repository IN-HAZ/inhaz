# User Story: US-103 — Dual-Role Switching (Client / Driver)

**Story ID:** `US-103`
**Epic:** [EPIC-01: Core Infrastructure & Authentication](../overview.md)
**Role:** Client & Driver
**Priority:** P0

---

## 1. User Story Statement
**As a** user who acts as both a customer shipping goods and a driver offering delivery services,  
**I want to** toggle between "Client Mode" and "Driver Mode" within the mobile app menu,  
**So that** I can switch between posting delivery requests and accepting nearby jobs.

---

## 2. Business Rules & Technical Workflow

### 2.1 Role Switch Evaluation Logic
1.  User clicks "Switch Mode" in the profile drawer.
2.  If switching from Client $\rightarrow$ Driver:
    *   API checks `driver_profiles` for the current user.
    *   If no `driver_profiles` exists, user is routed to **Driver Onboarding Flow** (Epic 02).
    *   If `driver_profiles.verification_status != 'approved'`, user is shown a banner: *"Driver verification pending or incomplete."* Access to Driver Mode remains locked.
    *   If `verification_status == 'approved'`, UI layout toggles to Driver Dashboard.

---

## 3. Acceptance Criteria

```gherkin
Scenario: Unverified Driver attempts role switch
  Given I am logged in as Client and my driver documents are pending
  When I tap "Switch to Driver Mode"
  Then I am presented with the document status screen
  And I cannot access the Driver Dashboard

Scenario: Approved Driver switches mode
  Given my driver profile verification_status is "approved"
  When I tap "Switch to Driver Mode"
  Then the app interface changes to the Driver Dashboard
  And I can toggle my "Online/Offline" availability
```
