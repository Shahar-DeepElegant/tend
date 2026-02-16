<!-- The Garden - PRD -->

# Friendly Reminder

## Product Overview

**The Pitch:** A relationship maintenance tool that treats your social circle like a living garden. It helps you nurture connections through gentle nudges rather than stressful to-do lists, ensuring no important bond withers away.

**For:** Busy professionals and thoughtful introverts who want to maintain meaningful relationships but struggle with the mental load of remembering when they last spoke to someone.

**Device:** Mobile (iOS/Android)

**Design Direction:** "The Garden." Organic, calming, and tactile. Visuals leverage soft earth tones (sage, terracotta, cream) and elegant serif typography. Interfaces avoid rigid grids in favor of floating clusters and rounded, pebble-like shapes.

**Inspired by:** _Notion_ (clean, structured serenity), _Headspace_ (soft shapes, calming palette), _Fabric_ (visual organization).

---

## Screens

- **The Garden (Home):** Visual overview of social circles as organic clusters; at-a-glance health check of relationships.
- **Up Next (Reminders):** A chronological stream of friends who need "watering" (contact).
- **Seedling (Add Contact):** Import flow to plant new relationships into specific circles.
- **Leaf (Profile):** Detailed view of a single contact with history and preferences.
- **Watering (Log Interaction):** Quick capture form for logging calls, texts, or hangouts.

---

## Key Flows

**Flow: Water a Plant (Log Interaction)**

1.  User sees "Needs Water" indicator on **The Garden** or a card on **Up Next**.
2.  User taps "Water" button -> overlay opens **Watering** modal.
3.  User selects type (Call, Coffee, Text), adds short note, resets timer.
4.  Result: Contact avatar glows briefly, moves to "Thriving" state; timer resets.

**Flow: Plant a Seed (Add Contact)**

1.  User is on **The Garden** -> taps floating FAB (+).
2.  User selects "Import from Contacts" -> picks specific people.
3.  User assigns "Circle" (e.g., Inner Circle - Weekly).
4.  Result: New avatars appear in the garden cluster; initial reminder set.

---

<details>
<summary>Design System</summary>

## Color Palette

- **Primary:** `#5A7D58` - Sage Green (Primary actions, active states)
- **Background:** `#F9F7F2` - Warm Cream (App background, paper texture feel)
- **Surface:** `#FFFFFF` - Cards, modals (95% opacity)
- **Text:** `#2C362B` - Deep Forest (Primary text, high contrast)
- **Muted:** `#8B968D` - Stone Grey (Secondary text, timestamps)
- **Accent:** `#D97C56` - Terracotta (Alerts, "Needs Water" indicators, CTAs)
- **Highlight:** `#E6D6A8` - Soft Pollen (Selection states, backgrounds for specific circles)

## Typography

Fonts chosen to evoke a classic field guide or botanical journal.

- **Headings:** _Young Serif_, 600, 24-32px (Elegant, human)
- **Body:** _Sentient_ or _Source Serif Pro_, 400, 16px (Readable, warm)
- **Small text:** _Karla_, 500, 12px (Sans-serif utility for UI labels/dates only)
- **Buttons:** _Karla_, 700, 14px (Clean, actionable caps)

**Style notes:**

- **Border Radius:** Heavy rounding. 24px for cards, 50% (circle) for buttons/avatars.
- **Shadows:** Soft, diffuse shadows (`0px 4px 20px rgba(90, 125, 88, 0.1)`) – feels like sunlight filtering through leaves.
- **Borders:** Thin, organic borders (`1px solid #EBE7DD`) on cards.

## Design Tokens

```css
:root {
  --color-sage: #5a7d58;
  --color-cream: #f9f7f2;
  --color-white: #ffffff;
  --color-forest: #2c362b;
  --color-stone: #8b968d;
  --color-terracotta: #d97c56;
  --font-display: "Young Serif", serif;
  --font-body: "Source Serif Pro", serif;
  --font-ui: "Karla", sans-serif;
  --radius-card: 24px;
  --radius-pill: 999px;
  --spacing-base: 16px;
}
```

</details>

---

<details>
<summary>Screen Specifications</summary>

### 1. The Garden (Home)

**Purpose:** Provide a holistic, stress-free view of relationship health.

**Layout:**

- **Header:** "My Garden" title (left), Settings/Search icons (right).
- **Body:** Physics-based canvas. Avatars float in loose clusters based on their "Circle" (Inner, Mid, Outer).
- **Bottom:** Floating Navigation Bar (Garden | Up Next | +).

**Key Elements:**

- **Circle Clusters:** 3 visual zones.
  - _Inner Circle:_ Large avatars (64px), center top.
  - _Mid Circle:_ Medium avatars (48px), scattered below.
  - _Outer Circle:_ Small dots/mini-avatars (32px), periphery.
- **Health Indicators:**
  - _Thriving:_ Normal avatar.
  - _Wilting (Overdue):_ Avatar has a terracotta ring and slight desaturation.
- **Fab (+):** Fixed bottom right, Sage Green, 56px circle.

**Interactions:**

- **Pan/Zoom:** User can pan around the canvas.
- **Tap Avatar:** Expands to mini-profile card overlay.
- **Long Press:** Drag to move between circles (re-categorize).

### 2. Up Next (Reminders)

**Purpose:** Linear, actionable view of who needs attention now.

**Layout:** Vertical scroll. "Today," "This Week," "Later" section headers.

**Key Elements:**

- **Reminder Card:** 80px height, full width minus padding.
  - Left: Avatar (56px).
  - Center: Name (Serif bold), "Last spoke: [Time]" (Sans grey).
  - Right: "Water" Action Button (Icon only: Watering Can).
- **Snooze Action:** Swipe card left reveals "Snooze" (Clock icon, yellow background).
- **Skip Action:** Swipe card right reveals "Mark Done" (Check icon, green background).

**States:**

- **Empty:** Illustration of a blooming plant. Copy: "Everything is watered and growing."
- **Overdue:** Top section. Cards have subtle Terracotta background tint.

### 3. Leaf (Profile)

**Purpose:** Deep dive into a specific person’s history and settings.

**Layout:**

- **Cover:** Top 30% is a soft gradient (Sage to Cream). Large Avatar overlaps bottom edge.
- **Info Sheet:** Slides up from bottom, covers 70%.

**Key Elements:**

- **Identity Block:** Name (H1 Serif), Relation Tag (e.g., "College Friend").
- **Cadence Control:** "Water every [X] weeks." Tapping opens picker.
- **The Soil (Notes):** Text area for persistent notes (kids' names, allergies).
- **Growth Rings (History):** Timeline of past logs. Vertical line connecting nodes.
  - Node: Date, Type Icon (Phone/Coffee), Short note.

**Interactions:**

- **Scroll:** Cover photo blurs as Info Sheet moves up.
- **Edit:** Tap pencil icon top right to edit contact details.

### 4. Watering (Log Interaction)

**Purpose:** Quickest possible way to record a connection.

**Layout:** Modal / Bottom Sheet (height: auto).

**Key Elements:**

- **Header:** "Watering [Name]"
- **Interaction Type:** Horizontal row of large circular toggles:
  - ☕️ Coffee
  - 📞 Call
  - 💬 Text
  - 💌 Email
- **Notes Input:** "What did you talk about?" (Multi-line text area, minimal border).
- **Next Date:** "Remind me again in [2 weeks]?" (Clickable to change).
- **Submit:** "Nurture" Button (Full width, Sage Green, Bottom).

### 5. Seedling (Add/Import)

**Purpose:** Onboard new contacts and assign frequency.

**Layout:** Stepper flow.

**Key Elements:**

- **Step 1 (Select):** List of system contacts with checkboxes. Search bar at top.
- **Step 2 (Plant):** Selected contacts appear as stack of cards.
- **Frequency Slider:** "How close are you?"
  - _Close (Inner):_ Every 1-2 weeks.
  - _Casual (Mid):_ Every month.
  - _Distant (Outer):_ Every 3-6 months.
- **Confirmation:** "Added [X] seeds to your garden."

</details>

---

<details>
<summary>Build Guide</summary>

**Stack:** React Native (Expo) or PWA (React + Tailwind CSS v3)
_Note: Physics engine (like `react-spring` or `matter.js`) required for The Garden view._

**Build Order:**

1.  **Design System:** Set up Tailwind config with specific colors (`sage`, `terracotta`) and font families (`Young Serif`).
2.  **Data Model:** Define schema for Contacts (id, name, interval, lastContactDate, circleID).
3.  **Up Next (Screen 2):** Build the linear list first. It's the core utility. Implement "Mark Done" logic.
4.  **Leaf (Screen 3):** Detail view + Edit capabilities.
5.  **Watering (Screen 4):** The mutation flow (updating `lastContactDate`).
6.  **The Garden (Screen 1):** The complex UI layer. Connect physics/canvas to the data model established in step 2.

</details>

<!-- The Garden (Home) -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>The Garden - Relationship Manager</title>
<!-- Google Fonts: Newsreader for Display, Noto Sans for UI -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&amp;family=Noto+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Theme Config -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#5A7D58", // Modified to match the "Sage Green" requested in PRD, reconciling with system structure
                        "primary-content": "#FFFFFF",
                        "primary-light": "#E8F3E7",
                        "background-light": "#F9F7F2", // Warm Cream
                        "background-dark": "#112210",
                        "terracotta": "#D97C56",
                        "stone": "#8B968D",
                        "forest": "#2C362B",
                    },
                    fontFamily: {
                        "display": ["Newsreader", "serif"],
                        "body": ["Noto Sans", "sans-serif"],
                    },
                    borderRadius: {"DEFAULT": "1rem", "lg": "1.5rem", "xl": "2rem", "2xl": "3rem", "full": "9999px"},
                    boxShadow: {
                        'soft': '0 4px 20px rgba(90, 125, 88, 0.15)',
                        'float': '0 10px 30px rgba(90, 125, 88, 0.2)',
                    }
                },
            },
        }
    </script>
<style>
        /* Custom animations for the floating effect */
        @keyframes float-slow {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(5px, -8px); }
        }
        @keyframes float-medium {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-4px, 6px); }
        }
        @keyframes float-fast {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(3px, 3px); }
        }

        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 5s ease-in-out infinite; }

        /* Hide scrollbar for cleaner look */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>

<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark min-h-screen text-forest font-display overflow-hidden relative selection:bg-primary selection:text-white">
<!-- Top Header -->
<header class="fixed top-0 left-0 w-full z-40 px-6 pt-12 pb-4 bg-gradient-to-b from-background-light via-background-light/90 to-transparent dark:from-background-dark dark:via-background-dark/90 pointer-events-none">
<div class="flex items-center justify-between pointer-events-auto">
<h1 class="text-3xl font-display font-semibold tracking-tight text-forest dark:text-white">My Garden</h1>
<div class="flex gap-3">
<button class="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-stone/20 text-forest dark:text-white hover:bg-white transition-colors shadow-sm">
<span class="material-symbols-outlined text-xl">search</span>
</button>
<button class="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-stone/20 text-forest dark:text-white hover:bg-white transition-colors shadow-sm">
<span class="material-symbols-outlined text-xl">settings</span>
</button>
</div>
</div>
<!-- Filter Tabs (Optional Context) -->
<div class="flex gap-4 mt-6 overflow-x-auto no-scrollbar pb-2 pointer-events-auto">
<button class="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium shadow-soft">All Circles</button>
<button class="px-4 py-1.5 bg-white dark:bg-white/10 text-stone border border-stone/20 rounded-full text-sm font-medium hover:border-primary/50 transition-colors">Inner</button>
<button class="px-4 py-1.5 bg-white dark:bg-white/10 text-stone border border-stone/20 rounded-full text-sm font-medium hover:border-primary/50 transition-colors">Outer</button>
<button class="px-4 py-1.5 bg-white dark:bg-white/10 text-stone border border-stone/20 rounded-full text-sm font-medium hover:border-primary/50 transition-colors">Family</button>
</div>
</header>
<!-- Main Canvas / Garden View -->
<main class="relative w-full h-screen overflow-hidden cursor-grab active:cursor-grabbing">
<!-- Canvas Background Pattern -->
<div class="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#5A7D58 1px, transparent 1px); background-size: 32px 32px;">
</div>
<!--
           The Garden Nodes
           Positioned absolutely to simulate the "Physics Canvas".
           Using animations to simulate "floating".
        -->
<div class="absolute inset-0 z-10 w-[120%] h-[120%] -left-[10%] -top-[10%]">
<!-- INNER CIRCLE (Center, Large) -->
<!-- Node 1: Healthy -->
<div class="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 animate-float-slow group cursor-pointer">
<div class="relative w-20 h-20">
<img alt="Smiling woman portrait" class="w-full h-full rounded-full object-cover border-4 border-white shadow-soft group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA5nzh2JyuEvIz4E_-uTAPPcgBD1Kedn0H40lqccvLiRWwecQx0bluc-90orlfcb41FLfZUGNS6zmXypSUhX-GpruqTMVvU8et-5aIrwUPBsaMa1TgZhR9CU32TO0AWscxOaypN_Ob99HDyMSCj1ryEB-zVpqfDnaR6ie2BbDiRHl5-2U_hC01GqwXj6z78ay65-SPVU4emhhkVLH5R9eNQNamlYoPdJevEGu0WD32RSl9A1Bfn0OJdLWWFpvL5RWtOcqpV5-8w3dm"/>
<div class="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-white flex items-center justify-center">
<span class="material-symbols-outlined text-white text-[14px]">favorite</span>
</div>
</div>
<p class="text-center mt-2 font-display font-medium text-forest dark:text-white bg-white/80 dark:bg-black/50 backdrop-blur-sm px-3 py-0.5 rounded-full text-sm shadow-sm inline-block whitespace-nowrap absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">Sarah</p>
</div>
<!-- Node 2: Healthy -->
<div class="absolute top-[35%] left-[35%] animate-float-medium group cursor-pointer">
<div class="relative w-16 h-16">
<img alt="Man looking sideways portrait" class="w-full h-full rounded-full object-cover border-4 border-white shadow-soft group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYJzdg9qYyVoSljCEnU4DAyriFyN57vLzNS2-3XOmK8vHdtSLnn9S1gEaqkA7AiIFg_3fIshyo48VPVEc8D9xPCL67_nfj_Or_9mBiTOZq_N0OFplhaFiv7BuvYGhBSsHsvixdfGMhXxL1waHV03dyPF8rn1imkFuFblilY5ziGS22vtsA2ZIUAblnwl-A9T7cHj1YB06u69luebLy4zYWK5zGe2f9QBotNrSAYdKtb8teV6hphGocQ5D-fp6s1E0C5O5NkUHOhKhb"/>
</div>
<p class="text-center mt-2 font-display font-medium text-forest dark:text-white bg-white/80 dark:bg-black/50 backdrop-blur-sm px-3 py-0.5 rounded-full text-sm shadow-sm inline-block whitespace-nowrap absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">David</p>
</div>
<!-- Node 3: Wilting (Needs Water) -->
<div class="absolute top-[45%] left-[60%] animate-float-fast group cursor-pointer">
<div class="relative w-18 h-18">
<div class="absolute -inset-1 rounded-full border-2 border-terracotta border-dashed animate-[spin_10s_linear_infinite]"></div>
<img alt="Woman with curly hair portrait" class="w-full h-full rounded-full object-cover border-2 border-white shadow-soft grayscale-[0.3] group-hover:grayscale-0 transition-all duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfrFFAjVOZsAUdseXiyE1ZuMMSGW6vUVe5svLpJwyDKEarioNYba2xp0XhC1CkQ-Gu_bJHlai7uzfFZbynO_SJdRrsFMguqEHzB5lsPosUUKx7TtblqicGWZeJQ8gIP3SjW3rZrcRm6DLf8ISh36YP8ra8JxLfg5kx66J3bS8PwbF_3TMY9BJsa50yn3WIA4eSBxvdA5PqNFjQIO2zuWhEvhlhgQ6zVh30Z-dNC-CMqfbTi7GWLJyKhVVyIu0gsJTBuKbJRZ2sTtr2"/>
<div class="absolute -top-2 -right-2 w-7 h-7 bg-terracotta rounded-full border-2 border-white flex items-center justify-center shadow-sm animate-bounce">
<span class="material-symbols-outlined text-white text-[16px]">water_drop</span>
</div>
</div>
<p class="text-center mt-2 font-display font-medium text-terracotta bg-white/90 dark:bg-black/50 backdrop-blur-sm px-3 py-0.5 rounded-full text-sm shadow-sm inline-block whitespace-nowrap absolute left-1/2 -translate-x-1/2">Mom</p>
</div>
<!-- MID CIRCLE (Scattered, Medium) -->
<div class="absolute top-[20%] left-[45%] animate-float-slow group cursor-pointer">
<div class="w-12 h-12 rounded-full border-2 border-white/80 shadow-sm overflow-hidden bg-primary/10">
<img alt="Man smiling portrait" class="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg4cQ-DVb_bav4TLpvc26zSwYYQVu63EXZ-Yl4u8MNOXpP0hdZrJHExOg3cnu5UtkHIRaxC8lAnskEGgt2HqOyaOV7DPLuFhLnEw_r-ZJRQf6xrG7J2XSwuREnzav7WHM47YPBLu7QW8BmgO_scJjLzGzOWzvhWjah_o-TGrRFPPVucEmyhJRUgvki2ckBJKn0AeknCoJ-rxPc_DBVZu-aF9XuE36Q1MrDF1AjEcYBKc9Q3rdbylzApMyA3bLSOYC_1Jvaf8Z_ejcM"/>
</div>
</div>
<div class="absolute top-[60%] left-[25%] animate-float-medium group cursor-pointer">
<div class="w-12 h-12 rounded-full border-2 border-white/80 shadow-sm overflow-hidden bg-primary/10">
<img alt="Woman casual portrait" class="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdFHYrIuNC7e3IXkk__WCIzrKWz3cRWty679AVt_ZmnRBeSAXo_I30re2jP6nStWpDaCLzCD66fXZISoFCZh5Lb81n0DwmTBTaLi7FgmHh2X0wrm07rZCN0Kf66-GEkzhGeheZrcpZNUwC1ZsAPvuPRNVJEILxSoFqwHSB7f7eM0J5tR7zY47BfInaKW6EatwrUqvlFiveWp1J4Hc19f10maffFJKeKJXjrlXKGxChvC9V375_WbiK2-dshpy_Y01bVzzTAE48kjfH"/>
</div>
</div>
<div class="absolute top-[55%] left-[70%] animate-float-fast group cursor-pointer">
<div class="w-12 h-12 rounded-full border-2 border-white/80 shadow-sm overflow-hidden bg-primary/10 relative">
<div class="absolute inset-0 bg-terracotta/20 z-10"></div>
<img alt="Man serious portrait" class="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgxK7I6iD2tJ58WZhkJGt0t29kn528F_yUTdbWq9R70csGbBzS6uqjQd_qCh1Jsm-AGt-1PawcH_JoMcqLLnsx2189aAbrjJg3xdB7bKqUcCv0rAbm7vMM1BZ4EJSDJCpL-DaXOQvI1-m8D1PcazCG4dTfNjnsFQtSZpx77EFTGPSgsb4q_Tr2RVkkwvq5fg5IkqcoTiFWavFzL_lRzBDyysn-PyCEGdsjNQL2clgFbKK8nQrH_HWI8p3PiWV7GBfZwfTS6SDTzMOs"/>
</div>
<!-- Mini warning dot -->
<div class="absolute -top-1 -right-1 w-3 h-3 bg-terracotta rounded-full border border-white"></div>
</div>
<div class="absolute top-[25%] left-[65%] animate-float-slow group cursor-pointer">
<div class="w-12 h-12 rounded-full border-2 border-white/80 shadow-sm overflow-hidden bg-primary/10">
<div class="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-sm">JD</div>
</div>
</div>
<!-- OUTER CIRCLE (Periphery, Small) -->
<div class="absolute top-[15%] left-[15%] opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
<div class="w-8 h-8 rounded-full bg-stone/30 border border-stone/20 flex items-center justify-center overflow-hidden">
<img alt="Blurry portrait woman" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHzwnpFsz0cE_kI2Tae9GY7ZHf9tE18NbgwG-N7g6CHDt4glQN5I967xdcdU2IURvBkCGsvweXWfcE-_MhVAGeohLqo-7igKnh7i2Q0ISEFGhrBq5QhmKn3i5E14np5qBxwL-k9yW67SQd9phVRGoPwhmKdeA9lEDwoGIOA4jFaqAiiLu96J1FWPlf122JQpUuuuDhZFei54uwNLKwvTKHIKyhZ0F95AmP5g3219XzuSTrDA_0WiSbKSot-6xJFXNRWq1otqlDEK64"/>
</div>
</div>
<div class="absolute bottom-[20%] right-[15%] opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
<div class="w-8 h-8 rounded-full bg-stone/30 border border-stone/20 flex items-center justify-center text-[10px] text-stone font-bold">
                    AK
                </div>
</div>
<div class="absolute top-[10%] right-[30%] opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
<div class="w-8 h-8 rounded-full bg-stone/30 border border-stone/20 flex items-center justify-center overflow-hidden">
<img alt="Blurry portrait man" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI0HGVe9bRkZ1NNZVPf_rWo3sPkKEKLeao9m8MqJTk_YZYVchAf8CV3tgoVSaOBxdQD4yKhcOEClYRhKXS5N6cJJ_SfdM5WaifehHoyGhDEPs_fM9uKZ3kTAhn0WV5BiP5R1IUlWuqoa0ul1j9poJR9hZvhhTzoloGL6GRPYcQMqGB3O9GNgNJVE3g6UA8YCuWauZOWXiT4d9llpZXAayOMbvPcDJmvDo8aDHm3kQCq5d6QlSg2b6bxT59SEzAFwnPqSlXsqf2o1ey"/>
</div>
</div>
<div class="absolute bottom-[15%] left-[40%] opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
<div class="w-8 h-8 rounded-full bg-stone/30 border border-stone/20 flex items-center justify-center overflow-hidden">
<img alt="Blurry portrait woman" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANJZR0fqJCe_L5ea68UXRqi7sUaFQueQkjieFneWWQK4XXEf-m2yxQQdvILBahqMOTfKgOa_P17pN1QANZ5vb7U3v_gTAFQNHvw8ZQ4EEBcqZ1-nvfYVZCNE_KuvurQxKZohihHHBmin9Rx9woVFrbqNipf6PgmPOa-cCr9cENT10TnCEmfyDgGPXG-yqaD5yjj0Oye4clf67kQyezPl4Lxo3_WmskumU1m-WstF7YGgq88peerRAYvf8sICcdllOmlPAj_RIMfDw2"/>
</div>
</div>
</div>
<!-- Mini Profile Overlay (Simulated Active State) -->
<!-- Positioned near the main active node (Mom) for demonstration -->
<div class="absolute top-[45%] left-[60%] mt-12 ml-6 z-30 transform transition-all duration-300 origin-top-left hidden">
<div class="bg-white dark:bg-background-dark p-4 rounded-2xl shadow-float w-48 border border-stone/10">
<div class="flex flex-col gap-2">
<div>
<h3 class="text-lg font-bold leading-tight text-forest dark:text-white">Mom</h3>
<p class="text-xs text-terracotta font-medium">Last spoke: 3 weeks ago</p>
</div>
<button class="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors">
<span class="material-symbols-outlined text-lg">water_drop</span>
<span class="text-sm font-bold">Water</span>
</button>
</div>
</div>
</div>
</main>
<!-- FAB: Plant Seed -->
<div class="fixed bottom-24 right-6 z-40">
<button class="w-14 h-14 bg-primary text-white rounded-full shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group relative">
<span class="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">add</span>
<span class="sr-only">Plant Seed</span>
<!-- Tooltip hint -->
<span class="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-forest text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Add contact
             </span>
</button>
</div>
<!-- Bottom Navigation -->
<nav class="fixed bottom-0 left-0 w-full z-50 px-6 pb-6 pt-2 pointer-events-none">
<div class="pointer-events-auto mx-auto max-w-sm bg-white/90 dark:bg-background-dark/90 backdrop-blur-md rounded-full shadow-float border border-white/50 dark:border-white/5 p-1.5 flex items-center justify-between">
<!-- Tab 1: Garden (Active) -->
<a class="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full bg-primary/10 text-primary transition-all" href="#">
<span class="material-symbols-outlined fill-current text-2xl" style="font-variation-settings: 'FILL' 1, 'wght' 400;">yard</span>
<span class="text-[10px] font-bold tracking-wide">Garden</span>
</a>
<!-- Tab 2: Up Next -->
<a class="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full text-stone hover:text-forest dark:hover:text-white transition-all group" href="#">
<span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">calendar_today</span>
<span class="text-[10px] font-medium tracking-wide">Up Next</span>
</a>
<!-- Tab 3: Profile -->
<a class="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full text-stone hover:text-forest dark:hover:text-white transition-all group" href="#">
<span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">account_circle</span>
<span class="text-[10px] font-medium tracking-wide">Me</span>
</a>
</div>
</nav>
<!-- Background texture overlay for paper feel -->
<div class="fixed inset-0 pointer-events-none z-50 opacity-[0.4] mix-blend-multiply" style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiLz4KPC9zdmc+');">
</div>
</body></html>
