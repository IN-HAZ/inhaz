# User Story: US-704 — Filament System Settings & Content Management

**Story ID:** `US-704`
**Epic:** [EPIC-07: Admin Back-Office & Governance](../README.md)
**Role:** Admin
**Priority:** P2

---

## 1. User Story Statement
**As a** platform administrator,  
**I want to** manage platform pricing grids, base price floors, commission rates, allowed vehicle types, active cities, CMS content pages, and FAQs via Filament v5,  
**So that** business parameters, pricing models, and mobile legal/help content can be updated dynamically without code redeployments.

---

## 2. Implementation Status
* **Backend:** NOT STARTED — `SystemSettingResource`, `ContentPageResource`, and `FaqItemResource` Filament v5 resources and API content endpoints (`GET /api/v1/content/*`) to be created in Laravel 13.
* **Mobile:** NOT APPLICABLE — Web Admin interface.

---

## 3. Design System & UI Specs
Per `tech-spects/design_system.md` and Filament v5 Admin Design Theme:
* Background: `#100D14` dark panel surface with crisp purple accents (`#7928CA`).
* Form Tabs: Organized Filament settings page tabs:
  1. **Financial & Pricing Settings**: Min Price (MAD), Commission Rate (%), Debt Ceiling (MAD).
  2. **Pricing Grid & Vehicles**: Repeater table for vehicle types (`Triporteur`, `Pick-up`, `Camionnette`, `Petit Camion`) with base fare, per-km rate, and per-kg rate inputs.
  3. **Operational Cities**: Tag input or multi-select of active Moroccan cities (Casablanca, Rabat, Marrakech, Tangier, Agadir, etc.).
  4. **Content Management (CMS)**: Markdown editor for legal policies (`privacy`, `about`) and structured FAQ accordion editor (`faq_items`).

---

## 4. Business Rules & Technical Requirements
### 4.1 System Settings Key Contracts
* `min_price`: Mandatory base price floor (default `20.00 MAD`). Price calculator algorithm enforces `MAX(calculated_fare, min_price)`.
* `commission_rate`: Global platform fee percentage (default `12.5%`). Updates apply only to new trips created after saving.
* `max_driver_debt`: Debt ceiling threshold (default `200.00 MAD`).
* `pricing_grid`: Configurable rates per vehicle category.

### 4.2 Content Management (CMS Pages & FAQs)
* `content_pages` table stores key-value content (`slug`, `title`, `body_markdown`, `updated_at`). Slugs include `privacy` and `about`.
* `faq_items` table stores categorized FAQ items (`category`, `question`, `answer_markdown`, `display_order`, `is_published`).
* Endpoints `GET /api/v1/content/privacy`, `GET /api/v1/content/about`, and `GET /api/v1/content/faqs` expose published records to mobile apps.

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Scenario: Admin updates minimum base price and commission rate in Filament
  Given minimum price floor is currently 15 MAD and commission rate is 10%
  When admin opens System Settings in Filament panel
  And updates minimum base price to "20 MAD" and commission rate to "12.5%" and clicks Save
  Then future trip fare estimations automatically enforce the 20 MAD price floor
  And new completed trips calculate commission at 12.5%

Scenario: Admin edits Privacy Policy content via Filament CMS editor
  Given admin is on the CMS Content Pages tab in Filament
  When admin updates the markdown body for slug "privacy" and clicks "Publish Page"
  Then mobile API GET /api/v1/content/privacy immediately returns updated markdown content
```
