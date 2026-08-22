# inHaz Design System & UI/UX Technical Specification

**Version:** 1.0.0-MVP

**Stack Alignment:** Expo (React Native) + NativeWind (Tailwind CSS) | React Admin Dashboard | Supabase Backend

**Identity Anchor:** Electric Purple High-Contrast Utility (inDrive-style reverse bidding adapted for urban freight & logistics)

---

## 1. Brand Tokens & Identity Matrix

### 1.1 Color Palette (NativeWind / Tailwind Configuration)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        inhaz: {
          purple: {
            DEFAULT: '#7928CA',      // Primary Brand / Interactive CTA
            hover: '#631DA8',        // Active & pressed states
            light: '#9047E0',        // Focus rings, active chips, badges
            muted: '#F2E8FD',        // Light mode selection background
            darkMuted: '#24143D',    // Dark mode selection background
          },
          dark: {
            DEFAULT: '#100D14',      // Deep Obsidian background
            card: '#18141F',         // Dark mode card surface
            subtle: '#221C2B',       // Dark mode inputs & borders
            border: '#2E273A',
          },
          surface: {
            light: '#FFFFFF',
            subtle: '#F7F6FA',       // Canvas background with soft purple tint
            border: '#E5E4E8',
          },
          text: {
            primary: '#100D14',
            secondary: '#696375',
            tertiary: '#A099AD',
            inverse: '#FFFFFF',
            darkPrimary: '#F7F6FA',
            darkSecondary: '#A099AD',
          },
          logistics: {
            triporteur: '#0066FF',   // Light urban vehicle / 3-wheeler
            van: '#FF8800',          // Medium freight / Van
            truck: '#7928CA',        // Large freight / Pickup
            fragile: '#FF3B30',      // Handling warning
            cash: '#00C853',         // Cash payment on delivery
          },
          status: {
            open: '#0066FF',
            negotiating: '#7928CA',
            in_transit: '#FF8800',
            delivered: '#00C853',
            cancelled: '#E53935',
          },
        },
      },
      borderRadius: {
        'control': '12px',
        'card': '16px',
        'sheet': '24px',
        'badge': '6px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrainsMono', 'monospace'], // For tabular prices, timers & OTP
      },
    },
  },
};

```

---

### 1.2 Typography Hierarchy

| Token | Size / Line Height | Weight | Application |
| --- | --- | --- | --- |
| **Display** | 32px / 38px | Bold (700) | Live bidding counters, trip price confirmation |
| **H1** | 24px / 30px | Bold (700) | Bottom sheet titles, role-selection screens |
| **H2** | 18px / 24px | SemiBold (600) | Modal headers, vehicle category titles |
| **Body Large** | 16px / 22px | Medium (500) | Addresses, inputs, driver names |
| **Body Default** | 14px / 20px | Regular (400) | Package descriptions, trip history metadata |
| **Caption** | 12px / 16px | SemiBold (600) | Status badges, vehicle capacity tags, RLS metadata |
| **Price / Stat** | 28px / 32px | Bold (700) / Mono | In-counter offers, earnings tally (`tabular-nums`) |

---

## 2. Core Functional Screen Layouts & Component Patterns

### 2.1 Client Flow: The Reverse-Bidding Bottom Sheet

Adapted directly from peer-to-peer ride-hailing mechanics for logistics items (e.g., furniture, appliances, bulk boxes).

```
+-------------------------------------------------------------+
|  📍 Map Interface (Google Maps Fullscreen)                   |
|  [ 🛵 Triporteur: 2 min ]    [ 🚐 Camionnette: 5 min ]      |
+-------------------------------------------------------------+
|  ▲ NEW LOGISTICS REQUEST (Bottom Sheet - 24px Radius)       |
|                                                             |
|  🟢 Pickup: Av. Mohammed V, Agadir                          |
|  🔴 Dropoff: Hay Salam, Agadir (Optional: + Waypoint)       |
|                                                             |
|  📦 Cargo: "Machine à laver + 2 chaises" (📷 Photo Attached)|
|  Vehicle Needed: [ Triporteur ] [ 🚐 Camionnette ]*         |
|                                                             |
|  Propose Your Price (MAD):                                  |
|  [ -10 ]             80 MAD               [ +10 ]           |
|  Estimated fair market rate: 70 - 90 MAD                    |
|                                                             |
|  [         PUBLISH REQUEST (NOTIFY DRIVERS)       ]         |
+-------------------------------------------------------------+

```

---

### 2.2 Client Flow: Live Incoming Bids Matrix

As bids stream via Supabase Realtime, offers stack dynamically above the map.

```
+-------------------------------------------------------------+
|  Incoming Offers (3 Drivers Responding)                     |
|                                                             |
|  +-------------------------------------------------------+  |
|  | 👤 Karim T. ⭐ 4.9 (142 courses)   | 🛵 Triporteur     |  |
|  | 1.2 km away • ETA 4 mins           | Cap: Up to 250kg |  |
|  |-------------------------------------------------------|  |
|  | Price: 80 MAD (Matched)       [ Counter ] [ ACCEPT ]  |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | 👤 Hassan M. ⭐ 4.8 (89 courses)   | 🚐 Citroën Berlingo |
|  | 2.5 km away • ETA 8 mins           | Cap: Up to 600kg |  |
|  |-------------------------------------------------------|  |
|  | Price: 100 MAD (+20 MAD)      [ Counter ] [ ACCEPT ]  |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+

```

---

### 2.3 Driver Flow: Dashboard & Quick Counter Actions

Optimized for one-handed operation while parked or awaiting loads.

```
+-------------------------------------------------------------+
|  STATUS: ● ONLINE                                           |
|  Today's Gross: 420 MAD | Trips: 5 | Commission Due: 42 MAD |
+-------------------------------------------------------------+
|  NEW NEARBY REQUEST (1.8 km away)                           |
|  Pickup: Dcheira El Jihadia ➔ Dropoff: Inezgane             |
|  Item: "Frigo 2 portes" (Photo available)                   |
|  Client Offer: 60 MAD                                       |
|                                                             |
|  Quick Counter Options:                                     |
|  [ Accept 60 MAD ]  [ +10% (66 MAD) ]  [ +20% (72 MAD) ]    |
|                                                             |
|  [ Custom Counter Price: [ 75 ] MAD ] ➔ [ Send Counter ]    |
+-------------------------------------------------------------+

```

---

## 3. UI/UX Interaction States & Component Specs

### 3.1 Status Chip Mapping

Status indicators use saturated background tints with solid borders for rapid scanning:

* `open`: Text `#0066FF`, Background `#EBF3FF`, Border `#B3D4FF`
* `negotiating`: Text `#7928CA`, Background `#F2E8FD`, Border `#D6B5F7`
* `in_progress` / `in_transit`: Text `#FF8800`, Background `#FFF4E5`, Border `#FFCD99`
* `delivered` / `completed`: Text `#00C853`, Background `#E6F9EE`, Border `#99E8B8`
* `cancelled` / `rejected`: Text `#E53935`, Background `#FDECEA`, Border `#F7A8A3`

---

### 3.2 Realtime Dynamic Elements

* **Active Negotiation Timer:** 60-second circular progress countdown around incoming bids to maintain bid freshness and driver commitment.
* **Cash Handshake Banner:** During `in_transit` and `delivered` states, render a permanent floating status card:
```
[ 💵 Payment: 80 MAD Cash to Driver upon Delivery ]

```


* **Realtime Chat Floating Pill:** Unread indicator badge using `#7928CA` with sound/haptic feedback trigger via Expo Haptics (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`).

---

## 4. Design System Component Library (NativeWind Code)

### 4.1 Primary CTA Button (`src/components/ui/Button.tsx`)

```tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'counter' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-inhaz-purple hover:bg-inhaz-purple-hover text-white';
      case 'secondary':
        return 'bg-inhaz-purple-muted dark:bg-inhaz-dark-subtle text-inhaz-purple border border-inhaz-purple-light';
      case 'counter':
        return 'bg-inhaz-dark text-white dark:bg-inhaz-surface-subtle dark:text-inhaz-dark';
      case 'danger':
        return 'bg-inhaz-status-cancelled text-white';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      className={`w-full py-4 px-6 rounded-control flex-row justify-center items-center ${getVariantStyles()} ${
        disabled ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#7928CA'} />
      ) : (
        <Text className={`font-sans font-bold text-base ${variant === 'primary' ? 'text-white' : 'text-inhaz-purple'}`}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

```

---

### 4.2 Stepper Input (`src/components/ui/PriceStepper.tsx`)

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface PriceStepperProps {
  price: number;
  step?: number;
  currency?: string;
  onPriceChange: (newPrice: number) => void;
  minPrice?: number;
}

export const PriceStepper: React.FC<PriceStepperProps> = ({
  price,
  step = 10,
  currency = 'MAD',
  onPriceChange,
  minPrice = 20,
}) => {
  return (
    <View className="bg-inhaz-surface-subtle dark:bg-inhaz-dark-card p-4 rounded-card border border-inhaz-surface-border dark:border-inhaz-dark-border">
      <Text className="text-inhaz-text-secondary dark:text-inhaz-text-darkSecondary text-xs font-semibold uppercase tracking-wider mb-2 text-center">
        Votre Proposition de Prix
      </Text>
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onPriceChange(Math.max(minPrice, price - step))}
          className="w-12 h-12 bg-white dark:bg-inhaz-dark-subtle rounded-control items-center justify-center border border-inhaz-surface-border dark:border-inhaz-dark-border active:scale-95"
        >
          <Text className="text-inhaz-purple text-xl font-bold">-{step}</Text>
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-3xl font-mono font-bold text-inhaz-text-primary dark:text-inhaz-text-darkPrimary">
            {price} <Text className="text-lg font-sans text-inhaz-purple">{currency}</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onPriceChange(price + step)}
          className="w-12 h-12 bg-inhaz-purple rounded-control items-center justify-center active:scale-95"
        >
          <Text className="text-white text-xl font-bold">+{step}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

```

---

## 5. Web Admin Dashboard Design Language

* **Layout Structure:** Collapsible left sidebar (240px wide) with dark surface `#100D14`, crisp purple active indicators (`#7928CA`), and high-density data tables.
* **Document Verification Gallery:** Side-by-side inspection view featuring CIN, vehicle registration (Carte Grise), and insurance papers with single-click approval (`#00C853`) or rejection (`#E53935`) workflows.
* **Commission Reconciliation Table:** Visual audit logs calculating the 10–15% cut on cash payouts with individual status toggles for courier balances.
