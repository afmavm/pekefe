# PEKEFE DESIGN SYSTEM BIBLE v1.0
**VOLUME 03 — USER INTERFACE LANGUAGE & COMPONENT SPECIFICATIONS**  
**STATUS:** OFFICIAL  
**AUTHORITY:** HIGHEST DESIGN AUTHORITY (EVERY PIXEL MUST FOLLOW THIS DOCUMENT)

---

THIS DOCUMENT DEFINES THE ENTIRE USER INTERFACE LANGUAGE OF THE PEKEFE PLATFORM.  
EVERY PIXEL MUST FOLLOW THIS DOCUMENT.

---

## CHAPTER 01: DESIGN PHILOSOPHY

### CURATED & INVISIBLE UI
PEKEFE is not designed. PEKEFE is curated.  
The interface should disappear; the products and craftsmanship must become the focus.  
The customer should remember the food, the story, and the craftsmanship—never the interface.

### DESIGN GOALS
Calm · Elegant · Editorial · Natural · Timeless · Premium · Readable · Minimal · Human.

### FORBIDDEN DESIGN FEELINGS
Design must **never** feel:  
Corporate · Cold · Busy · Template · Marketplace · Startup · AI-Generated · Trendy · Overdesigned.

---

## CHAPTER 02: DESIGN TOKENS

### TOKEN-BASED DESIGN MANDATE
Every single UI value originates from central Design Tokens. Never hardcode ad-hoc values in components.

### TOKEN CATEGORIES
1. **Colors:** Neutral 70%, Primary Burgundy 20%, Dark Slate Typography 8%, Accent Gold 2%.
2. **Typography:** Playfair Display (Editorial), Manrope (UI).
3. **Spacing:** 8px Base Scale (4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 120, 160, 240).
4. **Radius:** Subtle, medium kavis (never oversized).
5. **Shadows & Elevation:** Subtle, max 1 elevation level per container.
6. **Borders:** Thin, single-line outline.
7. **Motion:** Natural easing, 60 FPS, GPU-accelerated (120ms – 480ms).
8. **Opacity:** Soft, muted state transitions.
9. **Containers:** Desktop 1280px max width.
10. **Grid:** 12-Column Desktop, 8-Column Tablet, 4-Column Mobile.
11. **Breakpoints:** Mobile (<768px), Tablet (768px–1024px), Desktop (>1024px).
12. **Layers (z-index):** Controlled stacking contexts.

---

## CHAPTER 03: SPACING SYSTEM

### SPACING AS LUXURY
Spacing creates luxury, not decoration. Breathable whitespace defines premium quality.

*   **Base Unit:** `8px`
*   **Scale:** `4px` | `8px` | `12px` | `16px` | `24px` | `32px` | `40px` | `48px` | `64px` | `80px` | `96px` | `120px` | `160px` | `240px`
*   *Never invent ad-hoc spacing values. Always use spacing tokens.*

---

## CHAPTER 04: GRID SYSTEM

### ALIGNED GRID LAYOUTS
Every page aligns strictly to the grid system. Nothing floats randomly.

*   **Desktop:** 12 Columns, `1280px` Container, `24px` Gutter, `64px` Margin, `120px` Section Gap.
*   **Tablet:** 8 Columns, Breathable Padding.
*   **Mobile:** 4 Columns, `20px` Margin, `64px` Section Gap.

---

## CHAPTER 05: TYPOGRAPHY SYSTEM

### TYPE SCALE
*   **Display XXL:** `96px` (Hero Statements)
*   **Display XL:** `72px` (Section Hero)
*   **Display L:** `56px` (Page Titles)
*   **Headline XL:** `40px` (Editorial Headlines)
*   **Headline L:** `32px` (Sub-headlines)
*   **Headline:** `24px` (Card & Section Titles)
*   **Section:** `20px` (Block Headers)
*   **Body Large:** `18px` (Lead Paragraphs)
*   **Body:** `16px` (Standard Reading Body)
*   **Small:** `14px` (Labels, Metadata)
*   **Caption:** `12px` (Badges, Timestamps)

### READING RULES
*   **Maximum Line Width:** `75 characters` per line for reading comfort.
*   **Minimum Body Size:** `16px` (Never use sub-16px text for core content).

---

## CHAPTER 06: COLOR SYSTEM (70 / 20 / 8 / 2 RULE)

### HIERARCHY OVER DECORATION
Color communicates hierarchy, never ornamentation.

*   **70% Neutral (Warm Cream, Natural Linen, Paper):** Backgrounds, whitespace, and containers.
*   **20% Primary (Heritage Burgundy):** Architectural accents, key buttons, brand frames.
*   **8% Typography (Dark Slate):** Text and high-contrast headlines. *Saf Siyah (`#000000`) is forbidden.*
*   **2% Accent Gold (Warm Gold):** Rare luxury accents. *Gold is earned, never dominant.*

---

## CHAPTER 07: SURFACES & ELEVATION

### SUBTLE SURFACE HIERARCHY
*   **Surface 0 (Background):** Base page background (`Neutral Cream`).
*   **Surface 1 (Cards):** Flat, subtle container cards.
*   **Surface 2 (Elevated):** Popovers, dropdown menus, floating elements.
*   **Surface 3 (Modal):** Overlay modals and system dialogs.

> **Rule:** Surface transitions are subtle and soft, never dramatic or heavy-shadowed.

---

## CHAPTER 08: BUTTON SYSTEM

### ACTION HIERARCHY
*   **Primary Button:** Maximum **one per section** (Solid Burgundy or Gold).
*   **Secondary Button:** Supporting actions (Outlined Burgundy / Dark Slate).
*   **Ghost Button:** Secondary navigation actions.
*   **Text Button:** Low-priority inline actions.
*   **Danger Button:** Administrative actions only (Destructive confirmation).
*   **Required States:** Every button must support `Default`, `Hover`, `Focus`, `Active`, `Loading`, `Disabled`, and `Success` states.

---

## CHAPTER 09: FORM SYSTEM

### ANXIETY-REDUCING FORMS
Forms must reduce user anxiety, never increase it.

### MANDATORY FORM ELEMENTS
Every form field component must support:
*   Label (Clear, descriptive)
*   Helper Text (Instructive, calm)
*   Validation Message (Helpful, non-blaming)
*   States: `Default`, `Focus`, `Success`, `Error`, `Disabled`, `Readonly`, `Required`, `Autocomplete`

---

## CHAPTER 10: CARD SYSTEM

### CARDS AS QUIET CONTAINERS
Cards are structural containers, not decorations.
*   Maximum **1 elevation level**.
*   Maximum **1 subtle border**.
*   Maximum **1 soft shadow**.
*   *Never stack decorative effects or heavy glow filters.*

---

## CHAPTER 11: TABLE SYSTEM

### UNIFIED TABLE COMPONENT
All ERP, CMS, Inventory, and Finance tables share **one unified table component**.
*   Built-in support for: Sorting, Filtering, Search, Pagination, Bulk Selection, and Full Keyboard Navigation (`Tab`, `Arrow Keys`, `Space`).

---

## CHAPTER 12: MODAL SYSTEM

### DISCIPLINED MODALS
Modals interrupt workflow; use strictly when necessary.
*   **Maximum Width:** `960px`
*   **Interactions:** `Escape` key closes, overlay click configurable, focus trapped inside modal, fully keyboard accessible.

---

## CHAPTER 13: DRAWER SYSTEM

### DRAWER SCOPE
Drawers slide in from the screen edge for quick contextual tasks:
*   Used for: Slide-over Filters, Shopping Cart Drawer, Notification Panel, Quick Edit Views, Small Contextual Forms.
*   *Never use Drawers for large, multi-step complex workflows.*

---

## CHAPTER 14: NAVIGATION SYSTEM

### DISAPPEARING NAVIGATION
Navigation should disappear into the background until needed.
*   **Maximum Primary Items:** 7 primary header navigation items. Everything else grouped logically.
*   **Sticky Header:** Shrinks smoothly on scroll.
*   **Mega Menu:** Used only when necessary for complex category browsing.

---

## CHAPTER 15: ICON SYSTEM

### UNIFIED OUTLINE ICONS
*   **One Icon Family:** Single outline icon library (e.g., Lucide / custom outline set).
*   **Stroke & Style:** Consistent line weight, outline style, optical alignment.
*   **Forbidden:** Zero colorful icons, zero mixed icon libraries, zero filled cartoonish icons.

---

## CHAPTER 16: MOTION & ANIMATION SYSTEM

### EXPLANATORY MOTION
Motion explains spatial relationships; motion never decorates.

*   **Duration Tokens:** `120ms` (Instant) | `180ms` (Fast) | `240ms` (Standard) | `320ms` (Slow) | `480ms` (Dramatic Hero)
*   **Easing:** Natural cubic-bezier, GPU-accelerated.
*   **Forbidden:** Zero bounce, zero elastic wobble, zero dramatic spring effects.

---

## CHAPTER 17: RESPONSIVE SYSTEM

### RESPONSIVE ADAPTATION
*   **Architecture:** Desktop-First Architecture.
*   **Implementation:** Mobile-First Implementation.
*   **Rule:** No hidden desktop features on mobile. Responsive design means **reorganized layouts**, not stripped-down features.

---

## CHAPTER 18: ACCESSIBILITY (A11Y) STANDARDS

### WCAG COMPLIANCE
*   **Standard:** WCAG 2.1 AA minimum (AAA preferred for typography contrast).
*   **Requirements:** Full keyboard navigation support, screen reader ARIA landmarks, visible focus rings, proper form labels, high contrast ratios, respected `prefers-reduced-motion`.

---

## CHAPTER 19: COMPONENT LIBRARY ANTHOLOGY

All reusable UI elements exist as centralized components inside `src/components/`:
*   **Inputs & Controls:** Button, Input, Textarea, Checkbox, Radio, Switch, Select
*   **Overlays & Dialogs:** Modal, Drawer, Toast, Tooltip, Popover
*   **Layout & Navigation:** Accordion, Tabs, Breadcrumb, Pagination, Navigation Header, Footer
*   **Display & Data:** Avatar, Badge, Chip, Product Card, Recipe Card, Timeline, Gallery, Media Player, Review, FAQ, Article, Hero Section

> *Every component must be documented in the Design System and fully tested.*

---

## CHAPTER 20: DESIGN CONSTITUTION

### CONSISTENCY OVER ORIGINALITY
*   No screen may introduce new ad-hoc design rules or inline styles.
*   Every screen must reuse existing design patterns and tokens.
*   **Consistency is more valuable than originality.**
*   If a new component resembles an existing one, **extend the existing component**—do not create another duplicate.

> **Final Mandate:** The PEKEFE Design System is a **product**, not a collection of ad-hoc components.

---

## END OF VOLUME 03 — PEKEFE DESIGN SYSTEM BIBLE v1.0

**STATUS:** APPROVED · OFFICIAL · READY FOR IMPLEMENTATION
