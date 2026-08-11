# PEKEFE ENGINEERING HANDBOOK v1.0
**VOLUME 01 — SOFTWARE ENGINEERING STANDARDS**  
**STATUS:** OFFICIAL  
**AUTHORITY:** HIGHEST TECHNICAL AUTHORITY

---

THIS DOCUMENT DEFINES THE SOFTWARE ENGINEERING STANDARDS OF THE PEKEFE PLATFORM.  
EVERY LINE OF CODE MUST FOLLOW THIS DOCUMENT.

---

## CHAPTER 01: ENGINEERING PHILOSOPHY

### PURPOSE & CORE PHILOSOPHY
Software is not built for today. Software is built for the next ten years.  
Never optimize for short-term speed at the expense of long-term quality.

Every architectural decision must optimize for:
1. Maintainability
2. Scalability
3. Readability
4. Performance
5. Reliability
6. Security
7. Extensibility
8. Developer Experience

### THE PEKEFE ENGINEERING VALUES
*   Write less code.
*   Design more.
*   Think before coding.
*   Reuse before creating.
*   Measure before optimizing.
*   Delete before adding.
*   Document before implementing.
*   Review before merging.

### NON-NEGOTIABLE ENGINEERING PRINCIPLES
*   **Readable code** over clever code.
*   **Explicit** over implicit.
*   **Composition** over inheritance.
*   **Server Components** over Client Components.
*   **Static rendering** over dynamic rendering.
*   **Performance** over visual effects.
*   **Accessibility** over aesthetics.
*   **Consistency** over personal preference.

### WHAT WE NEVER DO
*   Never duplicate business logic.
*   Never hardcode values.
*   Never ignore TypeScript errors.
*   Never disable ESLint rules arbitrarily.
*   Never disable accessibility warnings.
*   Never commit commented-out code.
*   Never commit `console.log`.
*   Never ship experimental/untested code to production.
*   Never ignore Lighthouse performance scores.
*   Never ignore SEO best practices.
*   Never ignore Core Web Vitals (LCP, FID/INP, CLS).

### THE ENGINEERING GOAL
A new developer should understand any module within **15 minutes**. If not, the architecture is wrong.

### IMPLEMENTATION DIRECTIVE
Before writing code, always ask: *"Can this be simpler?"* If yes, simplify.

---

## CHAPTER 03: PROJECT STRUCTURE

### PURPOSE & PHILOSOPHY
The project structure must communicate architecture. Folders are documentation.

### STANDARD SYSTEM STRUCTURE
```text
src/
├── app/          # Next.js App Router pages, layouts, and route handlers
├── features/     # Feature-driven self-contained business modules
├── components/   # Shared presentation components (UI/Design System)
├── shared/       # Shared utilities across multiple domains
├── lib/          # Third-party library initializations & configurations
├── services/     # External API and database data abstraction services
├── actions/      # Next.js Server Actions for mutation workflows
├── types/        # Global TypeScript type definitions and interfaces
├── schemas/      # Zod validation schemas (forms, APIs, environment)
├── hooks/        # Shared custom React hooks
├── config/       # Global application configuration & site metadata
├── styles/       # Design system CSS tokens, Tailwind / Vanilla CSS rules
├── constants/    # Immutable application constants and enums
├── providers/    # React context providers and layout wrappers
├── emails/       # Transactional email templates (React Email)
├── tests/        # E2E (Playwright) and Integration test suites
└── docs/         # System documentation, handbooks, and architecture specs
```

### FEATURE MODULE STRUCTURE
Each business domain inside `src/features/[feature-name]/` must follow this layout:
```text
features/[feature-name]/
├── components/   # Feature-specific UI components
├── actions/      # Feature-specific Server Actions
├── hooks/        # Feature-specific custom React hooks
├── schemas/      # Feature-specific Zod validation schemas
├── types/        # Feature-specific TypeScript interfaces
├── services/     # Feature-specific API/data fetchers
├── utils/        # Feature-specific helper functions
├── tests/        # Unit & component test suites
└── README.md     # Module documentation (architecture, state, APIs)
```

### MODULE SIZE LIMITATION
**No feature module may exceed 5,000 lines of code** without being divided into sub-features or shared components.

### IMPLEMENTATION DIRECTIVE
Every folder must have **one single responsibility**.

---

## CHAPTER 04: TYPESCRIPT STANDARD

### PURPOSE & STRICTNESS MANDATE
TypeScript Strict Mode is **mandatory** across the entire codebase.

### TYPE SAFETY RULES
*   **Zero `any`:** The use of `any` is strictly prohibited.
*   **No Unsafe Type Casting:** Do not cast with `as unknown as Type` or forced type assertions unless guarded by Zod/type predicates.
*   **No Implicit `any`:** All function arguments, return types, and variables must be explicitly typed if not inferred by TypeScript.
*   **No Disabled Strict Mode:** Disabling strict flags in `tsconfig.json` or adding `@ts-ignore` without formal review is forbidden.
*   **Object Types:** Prefer `interface` for object contracts and extensible data structures.
*   **Union Types:** Prefer `type` for unions, primitives, tuples, and function signatures.
*   **Immutability:** Use `readonly` arrays, tuples, and properties whenever possible.
*   **Enum Prohibition:** Avoid TypeScript `enum`s (they emit bloated JS code). Use `const` object assertions (`as const`) and literal union types instead.
*   **Literal Types:** Prefer string/number literal types for fixed state values.

### DATA VALIDATION MANDATE
*   **Never trust client or external data:** Every API response, Server Action input, URL search param, local storage item, and form submission must be validated using **Zod** schemas.
*   Validate every input before business execution.

### IMPLEMENTATION DIRECTIVE
If TypeScript cannot guarantee correctness, **improve the types**. Never bypass them.

---

## CHAPTER 05: NEXT.JS STANDARD

### FRAMEWORK MANDATE
The platform architecture is built on the **Next.js App Router**.

### DEFAULT ARCHITECTURAL PATTERNS
*   **Server Components (RSC):** Default component paradigm across all pages and layouts.
*   **Server Actions:** Default mutation and data modification mechanism.
*   **Streaming & Suspense:** Granular UI streaming boundaries for fast Time-To-First-Byte (TTFB) and progressive page hydration.
*   **Metadata API:** Built-in static/dynamic SEO and OpenGraph metadata generation.
*   **Image Optimization:** Mandatory use of Next.js `<Image />` with state-based fallback boundaries. Zero raw `<img>` tags.
*   **Font Optimization:** Zero layout shift font loading via `next/font`.
*   **Partial Prerendering (PPR):** Enabled when stable for instant shell loads with dynamic stream holes.

### CLIENT COMPONENTS ('use client') GUIDELINES
Mark components with `'use client'` **only when strictly necessary**.  
Valid reasons for Client Components:
1. Accessing Browser APIs (`window`, `localStorage`, `IntersectionObserver`, custom DOM events).
2. Complex client-side animations requiring Framer Motion or direct DOM refs.
3. Managing interactive local UI state (`useState`, `useReducer`, `useContext`).
4. Direct user event listeners (`onClick`, `onChange`, `onKeyDown`) requiring instant UI updates.
*Nothing else justifies `'use client'`.*

### ROUTE ARCHITECTURE
*   **Small & Composable:** Break routes into focused, composable layout and page units.
*   **Static by Default:** Static rendering (`ISR` / Static Export) whenever possible.
*   **Dynamic Only When Necessary:** Dynamic rendering (`force-dynamic` / request time headers) only for personalized real-time user states.

### IMPLEMENTATION DIRECTIVE
Every new page must **first be attempted as a Server Component**.

---

## CHAPTER 06: REACT STANDARD

### CORE PHILOSOPHY
React is a **rendering library**, not a state management solution.

### COMPONENT RULES
*   **Pure Components:** Components must render deterministically based on props and state without mutating global scope.
*   **Small & Focused:** Every component should do one thing exceptionally well.
*   **Reusable UI:** Extract common visual patterns into design system components in `src/components/`.
*   **Single Responsibility:** Separate rendering logic from complex data fetching and business calculations.
*   **Zero Render Side-Effects:** Render functions must be free of side effects (no API calls, state setters, or DOM mutations inside render body; use `useEffect` or event handlers).
*   **Measured Optimization:** Use `useMemo` and `useCallback` only when measured performance profiling proves re-render bottlenecks. Avoid premature optimization clutter.
*   **Context Discipline:** Use React Context only for globally shared UI states (theme, modal manager, toast system). Never use Context as a general-purpose database or cache.

### CUSTOM HOOKS
Custom React hooks inside `src/hooks/` or feature directories must be:
*   Reusable
*   Small
*   Focused
*   Predictable (deterministic state flow)

### COMPONENT SIZE LIMITS
*   **Target Size:** 200 lines of code.
*   **Maximum Hard Limit:** **400 lines of code**.
*   *If any component exceeds 400 lines, it MUST be split into smaller sub-components.*

### IMPLEMENTATION DIRECTIVE
Every component must clearly answer: *"What is my single responsibility?"*

---

## CHAPTER 07: TAILWIND STANDARD

### PURPOSE & DESIGN SYSTEM RELATIONSHIP
Tailwind CSS is our **design implementation layer**, not our design system.  
The design system tokens are defined in the Brand Book (Volume 00) and theme configurations.

### RULES & FORBIDDEN PATTERNS
*   **Mandatory Design Tokens:** Always use predefined design system token utility classes (e.g., `bg-burgundy-500`, `text-slate-900`, `bg-cream-100`, `text-gold-400`).
*   **Zero Arbitrary Color Values:** Hardcoded/arbitrary color values like `bg-[#800020]`, `text-[#1e293b]`, or `border-[#d4af37]` are **strictly prohibited**.
*   **Zero Arbitrary Spacing:** Do not use arbitrary pixel values like `p-[13px]`, `m-[7px]`, or `gap-[19px]`. Use theme spacing scales.
*   **No Duplicated Utility String Clutter:** Extract frequently repeated utility combinations into CSS components or design system utility tokens.
*   **Zero Inline Styles:** Never use React `style={{ ... }}` objects for visual styling.

### THEME AUTHORIZATION
Every visual styling decision must originate directly from the central theme configuration (`tailwind.config.ts` / Design System tokens):
*   Colors
*   Spacing
*   Border Radius
*   Typography (Playfair Display, Manrope)
*   Shadows
*   Animations & Easing Functions

### IMPLEMENTATION DIRECTIVE
If a visual style value repeats across two or more components, **promote it into the design system**.

---

## CHAPTER 08: CODE QUALITY

### PURPOSE & MERGE CRITERIA
Every Pull Request / code merge must satisfy all 9 quality dimensions before being merged into production:
1. **TypeScript:** Strict type check passes without warnings, zero `any`.
2. **ESLint:** Linter passes with 0 errors and 0 warnings.
3. **Formatting:** Code adheres to global Prettier/formatting rules.
4. **Accessibility (a11y):** Keyboard navigable, appropriate ARIA roles, verified contrast.
5. **Performance:** Meets Core Web Vitals, 60 FPS animations, zero layout shifts.
6. **Security:** Zod schema validation on all inputs, XSS/injection protection, zero exposed secrets.
7. **SEO:** Semantic HTML5, metadata generation, alt attributes on all optimized images.
8. **Tests:** Unit, component, or integration tests pass.
9. **Documentation:** Code documented inline / README updated.

### THE 6 CODE REVIEW QUESTIONS
Before merging, every implementation must be evaluated against these questions:
1. *Can this code be simpler?*
2. *Can it be reused?*
3. *Can it be tested?*
4. *Can it be documented?*
5. *Can it scale?*
6. *Will another developer understand it within 15 minutes?*

### IMPLEMENTATION DIRECTIVE
Code is complete **only after code review**, not after compilation.

---

## CHAPTER 09: DOCUMENTATION STANDARD

### PURPOSE & MANDATE
Every business feature module inside `src/features/[feature-name]/` **requires dedicated documentation**. Undocumented features will not be merged into production.

### MANDATORY FEATURE DOCUMENTATION STRUCTURE (`README.md`)
Each feature module's `README.md` must include:
1. **Overview & Purpose:** Summary of the business domain, goals, and user value.
2. **Architecture & Component Tree:** Component layout, Server vs Client boundary breakdown.
3. **Data Flow & User Journey:** Step-by-step user interaction flow and API request pipelines.
4. **Dependencies:** Internal packages, external APIs, Zod schemas, database models used.
5. **Future Improvements:** Known backlog items and potential architectural refactors.
6. **Known Limitations:** Edge cases, performance boundaries, or temporary technical trade-offs.
7. **Examples & Usage Snippets:** Code snippets demonstrating component imports and Server Action invocations.

### IMPLEMENTATION DIRECTIVE
Undocumented code is **incomplete code**.

---

## CHAPTER 10: ENGINEERING CONSTITUTION

### SUPREME AUTHORITY
No engineer, AI assistant, agency, or contributor may intentionally violate these standards.

### MANDATORY ARCHITECTURAL QUALITY DIMENSIONS
Every architectural decision and code change must protect and improve:
1. Maintainability
2. Scalability
3. Performance
4. Security
5. Readability
6. Developer Experience
7. Accessibility

### CONFLICT DIRECTIVE
If a requested implementation conflicts with this handbook, **the implementation MUST be redesigned**.

### SPEED VS QUALITY MANDATE
Never lower engineering quality to complete a task faster.

### THE DECADE RESPONSIBILITY
The PEKEFE platform is expected to evolve for the next decade. Every line of code must respect that responsibility.

---

## END OF VOLUME 01 — PEKEFE ENGINEERING HANDBOOK v1.0

**STATUS:** APPROVED · OFFICIAL · READY FOR IMPLEMENTATION

---

## FINAL DECLARATION & IMPLEMENTATION DIRECTIVE FOR TECHNICAL AGENTS

PEKEFE is a premium digital gastronomy platform. Every software module, API, veritabanı şeması, Server Action, UI bileşeni veya altyapı kararı bu teknik anayasaya uymak zorundadır.

### Directives for AI Engineering Agents:
1. Treat this Engineering Handbook as the supreme technical authority of PEKEFE.
2. Validate every implementation against **Chapters 01–10** before generating code.
3. Enforce **TypeScript Strict Mode**, zero `any`, and mandatory **Zod** schema validation across all inputs and API data boundaries.
4. Enforce **Server Components First** strategy; use `'use client'` only when strictly justified by Browser APIs, local state, or client animations.
5. Enforce **Design Token discipline** in Tailwind styling; zero arbitrary Hex colors or pixel gaps.
6. Enforce **Component and Module Limits**: Max 400 lines per component, max 5,000 lines per feature module.
7. Verify all 9 PR Quality Dimensions (TypeScript, ESLint, Formatting, a11y, Performance 60 FPS, Security, SEO, Tests, Docs) before declaring completion.
8. Never sacrifice software quality or maintainability for temporary speed.








