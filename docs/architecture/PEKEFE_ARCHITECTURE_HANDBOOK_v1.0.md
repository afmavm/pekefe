# PEKEFE ARCHITECTURE HANDBOOK v1.0
**VOLUME 02 — TECHNICAL ARCHITECTURE STANDARDS**  
**STATUS:** OFFICIAL  
**AUTHORITY:** HIGHEST ARCHITECTURAL AUTHORITY (SUPERCEDES INDIVIDUAL IMPLEMENTATION PREFERENCES)

---

THIS DOCUMENT DEFINES THE TECHNICAL ARCHITECTURE OF THE PEKEFE PLATFORM.  
NO FEATURE MAY BE IMPLEMENTED WITHOUT FOLLOWING THIS ARCHITECTURE.

---

## CHAPTER 01: ARCHITECTURAL PHILOSOPHY

### PURPOSE & LONGEVITY MANDATE
Architecture exists to maximize longevity. The platform is expected to evolve continuously for at least the next ten years.  
Every architectural decision must reduce future complexity rather than optimize for short-term development speed.  
The architecture must remain understandable, modular, observable, and replaceable.

### PRIMARY GOALS
1. Scalability
2. Maintainability
3. Predictability
4. Consistency
5. Performance
6. Security
7. Testability
8. Replaceability
9. AI Readiness
10. Developer Experience

### THE GOLDEN RULE
> **Business Rules must never depend on Frameworks.**  
> Frameworks may change. Business rules must survive.

---

## CHAPTER 02: PLATFORM DOMAINS

### DOMAIN OWNERSHIP & ISOLATION
The PEKEFE Platform consists of independent business domains.  
Each domain owns its own:
*   Business rules
*   Validation
*   Services
*   Documentation
*   Tests

Domains communicate **only through clearly defined interfaces**.  
**No domain may directly manipulate another domain's internal state.**

### CORE DOMAINS
*   **Commerce:** Catalog, Products, Inventory, Orders, Checkout, Cart, Payments, Shipping, Customers.
*   **Production & Gastronomy:** Recipes, Manufacturing, Procurement, Batch Tracking, Quality.
*   **B2B & Enterprise:** Dealers (B2B), CRM, Finance, Accounting, Warehouse, Reports.
*   **Content & Assets:** Content (CMS), Media (DAM), Search, Notifications.
*   **Platform & AI:** Authentication, Authorization, Settings, Analytics, Artificial Intelligence.

---

## CHAPTER 03: FEATURE FIRST ARCHITECTURE

### FEATURE MODULES (`src/features/[feature-name]/`)
Every business capability becomes a self-contained Feature module.  
Examples: `products`, `orders`, `checkout`, `cart`, `recipes`, `cms`, `search`, `crm`, `erp`, `warehouse`, `production`, `dealer`, `finance`, `analytics`.

### MANDATORY FEATURE LAYOUT
```text
features/[feature-name]/
├── components/   # UI components owned by feature
├── actions/      # Next.js Server Actions
├── services/     # Application & domain services
├── schemas/      # Zod validation schemas
├── types/        # TypeScript interfaces & types
├── hooks/        # Custom React hooks
├── tests/        # Unit & component test suites
└── README.md     # Feature documentation
```

### INTER-FEATURE COMMUNICATION
No feature may become dependent on another feature's internal implementation. Communication occurs through **public interfaces and event buses only**.

---

## CHAPTER 04: SERVER FIRST ARCHITECTURE

### SERVER-FIRST MANDATE
Everything is Server-First by default.
*   **Server Components (RSC):** Default component model.
*   **Server Actions:** Preferred mutation mechanism.
*   **Database Access:** Exists ONLY on the server.
*   **Authentication & Permissions:** Handled ONLY on the server.
*   **Business Logic:** Executes ONLY on the server.

### CLIENT COMPONENT RESTRICTIONS
Client Components (`'use client'`) are allowed **only for**:
1. Interactive Animations (Framer Motion)
2. Interactive Form Inputs & Immediate Field Validation
3. Browser API Integrations (`window`, `localStorage`, `IntersectionObserver`)
4. Interactive Maps & Geolocation
5. Data Visualization Charts & Graphs
6. Custom Media Players
7. Complex Client-Side UI State Management

---

## CHAPTER 05: STATE MANAGEMENT HIERARCHY

### STATE PRIORITY (HIGHEST TO LOWEST)
1. **Server State** (Next.js Cache, Server Components, React `use` / Server Actions)
2. **URL State** (Search params, route parameters, hash state)
3. **Form State** (React Hook Form / Zod local form states)
4. **Local Component State** (`useState`, `useReducer`)
5. **React Context** (Global UI themes, modals, toast notifications)
6. **External Store** (Global state managers — strictly limited)

### STATE ANTI-PATTERNS (FORBIDDEN)
*   Never store duplicated data across state layers.
*   Never mirror server state on the client unnecessarily.
*   Never create giant global React contexts.

---

## CHAPTER 06: UNIFIED DATA FLOW PIPELINE

### THE SINGLE MANDATORY REQUEST PATH
Every user request or data mutation must strictly follow this single flow path:

$$\text{Browser} \longrightarrow \text{Server Action} \longrightarrow \text{Application Service} \longrightarrow \text{Domain Service} \longrightarrow \text{Repository} \longrightarrow \text{Database}$$

### THE SINGLE MANDATORY RESPONSE PATH
$$\text{Database} \longrightarrow \text{Repository} \longrightarrow \text{Domain Service} \longrightarrow \text{Application Service} \longrightarrow \text{Server Component} \longrightarrow \text{Browser}$$

> ⚠️ **NO SHORTCUTS:** Direct database calls from components or direct repository calls from Server Actions are strictly forbidden.

---

## CHAPTER 07: DEPENDENCY RULES & ARCHITECTURAL LAYERS

### ALLOWED DEPENDENCY DIRECTION (STRICT TOP-DOWN)
$$\text{UI / Presentation} \longrightarrow \text{Application Layer} \longrightarrow \text{Domain Layer} \longrightarrow \text{Infrastructure Layer}$$

### FORBIDDEN DEPENDENCY RELATIONSHIPS
*   ❌ Infrastructure $\longrightarrow$ UI
*   ❌ Repository $\longrightarrow$ React Component
*   ❌ Database $\longrightarrow$ React Component
*   ❌ External API $\longrightarrow$ Presentation Layer

---

## CHAPTER 08: REPOSITORY STANDARD

### SINGLE RESPONSIBILITY OF REPOSITORIES
Repositories are the **only layer allowed to communicate directly with the database or data persistence layer**.

### REPOSITORY RULES
*   Repositories **never contain business rules or validation logic**.
*   Repositories handle strictly CRUD operations: **Read, Write, Update, Delete**.
*   All business decisions and rule evaluations belong exclusively to **Domain Services**.

---

## CHAPTER 09: SERVICE LAYER TAXONOMY

### THE THREE SERVICE TYPES
1. **Application Service:** Coordinates workflows, orchestrates multiple domain services, and handles transaction boundaries.
2. **Domain Service:** Encapsulates core business rules, calculations, and domain entity logic.
3. **Infrastructure Service:** Communicates with external third-party systems (payment gateways, shipping providers, email services, SMS gateways).

> **Rule:** No service may span multiple service responsibilities.

---

## CHAPTER 10: SCHEMA VALIDATION STANDARDS

### UNIVERSAL VALIDATION MANDATE
*   Every input must be validated via **Zod** schemas.
*   Every output/response must be validated via **Zod** schemas.
*   Every internal and external API payload must be validated.
*   Every form submission must be validated.
*   Validation occurs **before business logic execution**.
*   *Never trust browser input.*

---

## CHAPTER 11: AUTHENTICATION & AUTHORIZATION SEPARATION

### DECOUPLED SECURITY PATTERN
*   **Authentication (Identity):** Verifies *who* the user is.
*   **Authorization (Permissions, Roles, Policies):** Determines *what* the authenticated identity can do.

> **Rules:**  
> Authentication never decides permissions.  
> Permissions never decide identity.  
> Security checks must remain independent and decoupled from business feature implementation.

---

## CHAPTER 12: FILE STORAGE & MEDIA ARCHITECTURE

### MEDIA ABSTRACTED PATTERN
Media files (Images, Videos, PDFs, Laboratory Certificates, Invoices, Compliance Documents) **must never live inside business logic or static code paths**.

*   All file operations must be abstracted through **Media Services**.
*   Never hardcode file paths or cloud storage URLs directly in UI or domain components.

---

## CHAPTER 13: EVENT ARCHITECTURE & DECOUPLING

### EXPLICIT BUSINESS EVENTS
Business domains emit explicit, immutable events for key state changes:
*   `OrderCreated`, `OrderPaid`, `StockUpdated`, `RecipePublished`, `DealerApproved`, `PaymentReceived`, `ShipmentCreated`.

Events decouple business domains and enable future integrations without modifying existing feature source code.

---

## CHAPTER 14: CACHE STRATEGY

### CACHE TIER DEFINITIONS
*   **Product Catalog:** Long Cache (revalidated on catalog changes).
*   **CMS & Storytelling:** Medium Cache (revalidated on content publishing).
*   **Dashboard & Analytics:** Short Cache (revalidated every few minutes).
*   **Payments & Checkout:** **No Cache** (strictly real-time execution).
*   **Inventory & Stock:** **Realtime** (strictly live database queries).

---

## CHAPTER 15: SEARCH ARCHITECTURE

### SEARCH AS A PLATFORM SERVICE
Search is a centralized **Platform Service**, not a page-specific feature.  
The search infrastructure must index and serve:
*   Products & Catalog
*   Gastronomy Recipes
*   Blog & CMS Articles
*   Product Categories & Tags
*   FAQ & Knowledge Base
*   B2B Dealer Portals
*   Admin & ERP Resources
*   Media Assets & Digital Assets
*   Future AI Conversational Search

---

## CHAPTER 16: SEO ARCHITECTURE

### AUTOMATED PLATFORM SEO
SEO metadata is automatically generated by the platform metadata pipeline, never constructed manually per page:
*   Metadata Tags (Title, Description, Keywords)
*   OpenGraph & Twitter Cards
*   JSON-LD Schema.org Structured Data (Product, Recipe, Organization, Breadcrumb)
*   Canonical URLs & Multilingual Hreflang Tags
*   Dynamic Breadcrumbs
*   Automated `robots.txt` and `sitemap.xml` generation

---

## CHAPTER 17: ARTIFICIAL INTELLIGENCE ARCHITECTURE

### AI AS A PLATFORM CAPABILITY
Artificial Intelligence is built as a core **Platform Capability**, not an isolated page feature.  
All AI capabilities plug into the platform via standardized **AI Services**:
*   Gastronomy Recipe Assistant
*   Personalized Product Recommendation Engine
*   Automated Content & Copy Generation
*   Conversational Internal Search
*   Customer Support & Concierge
*   Inventory & Stock Demand Prediction
*   Sales & Revenue Forecasting
*   Automated Image Tagging & Visual Categorization
*   Multilingual Translation & Localization
*   Quality Analysis & Recipe Compliance Checking

---

## CHAPTER 18: ERP ARCHITECTURE

### ERP AS A CORE DOMAIN
ERP is a **Core Domain**, not an Admin dashboard extension.  
The ERP Domain manages:
*   Accounting & Financial Ledgers
*   Real-time Inventory & Stock Levels
*   Gastronomy Production & Batch Execution
*   Warehouse Logistics & Storage Nodes
*   Purchasing & Supplier Procurement
*   Customer Relationship Management (CRM)
*   B2B Dealer Operations & Pricing Tiers
*   Financial Reporting & Audit Trails

> **Rule:** ERP modules communicate with e-commerce features **strictly via business events**, never through direct database state mutation.

---

## CHAPTER 19: OBSERVABILITY & METRICS

### UNIVERSAL OBSERVABILITY MANDATE
Everything critical must be measurable and observable:
*   Application Errors & Exceptions
*   Performance Metrics & Core Web Vitals
*   Database Query Durations
*   Payment Gateway Transactions
*   Search Engine Response Times
*   Media CDN Upload/Download Metrics
*   Authentication & Security Events
*   Server Action Execution Durations

> *If it cannot be measured, it cannot be improved.*

---

## CHAPTER 20: ARCHITECTURE CONSTITUTION

### THE 8 MANDATORY ARCHITECTURAL QUESTIONS
Before implementing any new feature, the engineering team must answer:
1. *Which domain owns this?*
2. *Which service executes this?*
3. *Which repository stores this?*
4. *Which event is emitted?*
5. *Which permissions protect it?*
6. *Which validation secures it?*
7. *Which tests verify it?*
8. *Which documentation explains it?*

> **REJECTION DIRECTIVE:** If these 8 questions cannot be answered clearly, the feature is **architecturally incomplete** and work cannot proceed.

---

## END OF VOLUME 02 — PEKEFE ARCHITECTURE HANDBOOK v1.0

**STATUS:** APPROVED · OFFICIAL · READY FOR IMPLEMENTATION

---

## FINAL DIRECTIVE FOR ALL SYSTEM AGENTS

PEKEFE is a decade-scale digital gastronomy platform. Every line of code, folder structure, service layer, data flow path, and event emitter must comply strictly with **Volume 02 Architecture Handbook**.
