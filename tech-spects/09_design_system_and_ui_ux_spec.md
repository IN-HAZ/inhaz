# inHaz — Deep Dive: 09 Design System & UI/UX Technical Specifications

**Document Scope:** Detailed visual design system specs, Tailwind/NativeWind color tokens, typography scales, layout blueprints, component design patterns, micro-interactions, dark mode rules, and accessibility standards for the inHaz platform.

---

## 1. Visual Identity & Brand Identity Matrix

The visual identity of inHaz is defined as **Electric Purple High-Contrast Utility**, inspired by modern urban mobility platforms (like inDrive and Uber) but tailored for heavy urban freight and logistics in Morocco.

### 1.1 Color Palette & Token Architecture

```
+-------------------------------------------------------------------+
| BRAND COLORS                                                      |
| Primary Brand / Interactive CTA:  #7928CA (Electric Purple)       |
| Primary Hover / Active Pressed:   #631DA8                         |
| Muted Light Mode Accent:          #F2E8FD                         |
| Muted Dark Mode Accent:           #24143D                         |
+-------------------------------------------------------------------+
| BACKGROUND & SURFACES                                             |
| Light Surface (Canvas):           #F7F6FA (Soft Purple-Tinted Gray)|
| Light Card Background:            #FFFFFF                         |
| Dark Surface (Obsidian):          #100D14 (Deep Dark Canvas)      |
| Dark Card Surface:                #18141F                         |
| Dark Inputs & Borders:            #221C2B                         |
+-------------------------------------------------------------------+
```

### 1.2 Status Chip Color Matrix

| Request / Trip Status | Text Color | Background Tint | Border Color | Visual Meaning |
| :--- | :--- | :--- | :--- | :--- |
| `open` | `#0066FF` (Blue) | `#EBF3FF` | `#B3D4FF` | Request active, waiting for driver bids |
| `negotiating` | `#7928CA` (Purple) | `#F2E8FD` | `#D6B5F7` | Drivers are submitting counter-offers |
| `in_progress` / `in_transit` | `#FF8800` (Orange) | `#FFF4E5` | `#FFCD99` | Cargo collected, driver en route |
| `delivered` / `completed` | `#00C853` (Green) | `#E6F9EE` | `#99E8B8` | Goods delivered, cash payment complete |
| `cancelled` / `rejected` | `#E53935` (Red) | `#FDECEA` | `#F7A8A3` | Request or bid cancelled/declined |

---

## 2. Typography Scale & Layout Foundations

### 2.1 Typography Hierarchy

*   **Display (32px / 38px, Bold 700):** Used for live bidding counters, trip price confirmation numbers, and major statistics.
*   **H1 (24px / 30px, Bold 700):** Used for bottom sheet titles, role selection screens, and main headers.
*   **H2 (18px / 24px, SemiBold 600):** Used for card headers, vehicle category titles, and modal titles.
*   **Body Large (16px / 22px, Medium 500):** Used for pickup/dropoff addresses, input fields, and driver names.
*   **Body Default (14px / 20px, Regular 400):** Used for package descriptions, historical metadata, and instructions.
*   **Caption (12px / 16px, SemiBold 600):** Used for status chips, vehicle capacity badges, and timestamps.
*   **Monospace Font (`JetBrainsMono`):** Mandated for tabular numbers (prices, distance counters, OTP digit entry, and countdown timers) to prevent layout shifting during real-time updates.

---

## 3. Core Mobile Component Architecture

### 3.1 Reverse-Bidding Bottom Sheet (Client View)
*   **Structure:** Uses an expandable bottom sheet (24px top border radius) sliding smoothly over the full-screen Google Maps view.
*   **Elements:**
    *   Pickup (Green marker indicator) & Dropoff (Red marker indicator) address pills.
    *   Vehicle selection chips (`Triporteur`, `Van`, `Truck`) with capacity icons.
    *   Price Stepper component with `-10` and `+10` quick modifier buttons flanking a large monospace price display.
    *   "Publish Request" full-width CTA button using Electric Purple (`#7928CA`).

### 3.2 Incoming Offers Card Stack (Client View)
*   As bids stream in via WebSockets, incoming offer cards stack dynamically above the map.
*   Each offer card displays:
    *   Driver Avatar, Name, Star Rating (e.g. `4.9 ⭐`), and total trips count.
    *   Driver Vehicle type badge and ETA minutes.
    *   Bidded Price in prominent bold typography.
    *   Dual CTA buttons: `[ Counter ]` (Opens counter-offer modal) and `[ ACCEPT ]` (Electric Purple primary button).

### 3.3 Driver Dashboard & One-Handed Quick Bidding (Driver View)
*   Designed specifically for rapid, safe operation while parked.
*   Top Status Header: Large toggle button for `● ONLINE` vs `● OFFLINE`, showing today's earnings tally and commission balance.
*   Nearby Request Card: Shows distance to pickup, package description, client proposed price, and **Quick Counter Buttons**:
    *   `[ Accept Proposed Price ]`
    *   `[ +10% ]`
    *   `[ +20% ]`
    *   `[ Custom Price Input ]`

---

## 4. Micro-Interactions, Haptics & Accessibility

### 4.1 Micro-Interactions & Feedback
*   **Haptic Feedback:** Integrates Expo Haptics (`Haptics.impactAsync`):
    *   *Medium Impact:* Triggered when a new bid arrives or when client clicks "Accept Offer".
    *   *Light Impact:* Triggered on stepper button increments (`-10` / `+10`).
    *   *Notification Success:* Triggered when delivery completes.
*   **Countdown Progress Timer:** Active bids feature a circular progress indicator (60 seconds countdown) to maintain bid freshness and signal urgency.
*   **Cash Handshake Floating Banner:** During active delivery and completion, a high-contrast banner (`#00C853` green border) floats at top of screen: *"💵 Payment: [Price] MAD Cash to Driver upon Delivery"*.

### 4.2 Dark Mode Support
*   Automatically adapts to device system preferences (`Appearance.getColorScheme()`).
*   In Dark Mode, the canvas switches to Deep Obsidian (`#100D14`), cards switch to `#18141F`, text shifts to high-contrast white/light gray (`#F7F6FA`), and map styling switches to dark vector JSON map tiles.
