# Venderra POS — UI/UX Design Spec
**Theme: Google I/O inspired · Blue & White · Clean · Professional**

---

## 1. Design Philosophy

Inspired by Google I/O 2023–2024 product design:
- **Material You** sensibility — surfaces, not shadows
- Clean white backgrounds with deep navy/blue accents
- Type-driven hierarchy — weight and size do the work, not color noise
- Purposeful icons — every icon earns its place, no decorative filler
- Generous whitespace, tight component density
- **No gradients on UI chrome** — gradients only for illustrations/hero
- **No rounded-2xl everything** — intentional radius per component type

---

## 2. Color Tokens

### Primary (Google Blue family)
| Token        | Hex       | Use                                      |
|--------------|-----------|------------------------------------------|
| `blue-600`   | `#1a73e8` | Primary CTA buttons, active nav, links   |
| `blue-700`   | `#1557b0` | Button hover states                      |
| `blue-50`    | `#e8f0fe` | Icon backgrounds, selected row tint      |
| `blue-100`   | `#d2e3fc` | Badge backgrounds, input focus ring      |

### Neutrals
| Token        | Hex       | Use                                      |
|--------------|-----------|------------------------------------------|
| `gray-950`   | `#09090b` | Sidebar background                       |
| `gray-900`   | `#111827` | Page headings                            |
| `gray-700`   | `#374151` | Body text                                |
| `gray-500`   | `#6b7280` | Secondary text, labels                   |
| `gray-400`   | `#9ca3af` | Placeholder, disabled text               |
| `gray-200`   | `#e5e7eb` | Borders, dividers                        |
| `gray-100`   | `#f3f4f6` | Table header bg, hover states            |
| `gray-50`    | `#f9fafb` | Page background, input bg                |
| `white`      | `#ffffff` | Card backgrounds, sidebar active item    |

### Semantic
| Token     | Hex       | Use                         |
|-----------|-----------|-----------------------------|
| `green`   | `#137333` / `#e6f4ea` | Success, online status |
| `red`     | `#c5221f` / `#fce8e6` | Error, danger, out-of-stock |
| `amber`   | `#b45309` / `#fff8e1` | Warning, low stock          |
| `indigo`  | `#3730a3` / `#eef2ff` | Info, reports               |

---

## 3. Typography

Font: **Inter** (already loaded)

| Role          | Size  | Weight | Color      |
|---------------|-------|--------|------------|
| Page title    | 20px  | 700    | gray-900   |
| Section title | 15px  | 600    | gray-800   |
| Card title    | 13px  | 600    | gray-700   |
| Body          | 13px  | 400    | gray-700   |
| Label/Caption | 11px  | 600    | gray-500   |
| Micro label   | 10px  | 700    | gray-400   |
| Table header  | 11px  | 600 uppercase | gray-400 |
| Table body    | 13px  | 400    | gray-700   |
| Mono (sale #) | 13px  | 500 mono | gray-600 |

---

## 4. Spacing & Layout

- **Sidebar width:** 240px fixed
- **Topbar height:** 56px (h-14)
- **Page padding:** `p-6` (24px)
- **Card padding:** `p-5` (20px) or `p-4` for compact
- **Grid gap:** `gap-4` standard, `gap-5` for wider cards
- **Border radius:**
  - Buttons: `rounded-md` (6px)
  - Cards: `rounded-lg` (8px)
  - Modals: `rounded-xl` (12px)
  - Pills/badges: `rounded-full`
  - Icon containers: `rounded-md` (6px)
  - Inputs: `rounded-md` (6px)

---

## 5. Component Specs

### Sidebar
- Background: `#09090b` (near black, not pure black)
- Logo area: 56px tall, bottom border `white/[0.06]`
- Nav groups: 10px ALL-CAPS section labels in `white/25`
- Nav items:
  - Default: `text-white/45`, no background
  - Hover: `bg-white/[0.05]`, `text-white/70`
  - Active: `bg-white/10`, `text-white`, icon in `blue-400`
- Icon size: 16px, strokeWidth 1.8 (default) / 2.2 (active)
- User card at bottom: initials avatar in `blue-600`, hover reveals logout

### Topbar
- Background: pure `white`, 1px `gray-200` bottom border
- Business name: 14px semibold gray-800
- Branch switcher: small pill, gray-100 bg
- Online indicator: emerald pill (green-50 bg, green-700 text, green-200 border)
- Offline indicator: red-50 bg, red-700 text
- Sign out: ghost button, gray border

### Buttons
```
Primary:    bg-blue-600  hover:bg-blue-700  text-white  rounded-md
Secondary:  bg-white  border-gray-200  hover:bg-gray-50  text-gray-700  rounded-md
Ghost:      transparent  hover:bg-gray-100  text-gray-600  rounded-md
Danger:     bg-white  border-red-200  text-red-600  hover:bg-red-50  rounded-md
```
- Height: `py-2` (32px) standard, `py-2.5` (36px) for forms
- Icon in button: 14px–15px, same color as text

### Cards
- Background: white
- Border: 1px `gray-200`
- Border radius: `rounded-lg` (8px)
- No box shadow by default — border is enough
- Hover (interactive cards only): `hover:border-gray-300`

### Inputs
- Background: `gray-50`
- Border: 1px `gray-200`
- Radius: `rounded-md`
- Focus: `border-blue-500` + `ring-2 ring-blue-500/10`
- Height: `py-2` (32px) compact, `py-2.5` (36px) forms
- Icon: 15px, `gray-400`, left-padded

### Badges / Pills
```
blue:   bg-blue-50   text-blue-700   (default/info)
green:  bg-green-50  text-green-700  (success/online)
red:    bg-red-50    text-red-700    (error/danger)
amber:  bg-amber-50  text-amber-700  (warning)
gray:   bg-gray-100  text-gray-600   (neutral)
```
- Padding: `px-2 py-0.5`
- Font: 11px, semibold, uppercase, tracking-wide
- Radius: `rounded-md` for status, `rounded-full` for counts/online

### Tables
- Header: `bg-gray-50`, 11px uppercase semibold `gray-400`, `py-2.5 px-4`
- Row: `border-b border-gray-100`, `hover:bg-gray-50/60`
- Cell: 13px, `gray-700`, `py-3 px-4`
- Numeric cells: `tabular-nums`, right-aligned

### Stat Cards
- Icon container: 36px × 36px, `rounded-md`, `blue-50` bg + `blue-600` icon (default)
- Value: 22px bold gray-900
- Label: 12px gray-400
- No hover effect — static information

### Modals
- Overlay: `bg-black/40`
- Modal: white, `rounded-xl`, `border border-gray-200`
- Max width: 480px (small), 600px (medium), 760px (large)
- Header: `px-5 py-4`, 15px bold, bottom border `gray-100`
- Body: `px-5 py-5`
- Footer: `px-5 py-4`, `bg-gray-50`, top border `gray-100`, actions right-aligned

---

## 6. Icon Usage Rules

**Library:** Lucide React (already installed)
- **Never use icons decoratively** — every icon must clarify meaning
- Size: 16px in nav, 15px in buttons, 18px in stat cards, 14px in table actions
- strokeWidth: 1.8 default, 2 for emphasis, 2.5 for small sizes (≤12px)
- Color: always inherit from parent text color or explicitly set — never `text-gray-400` on a primary icon

### Icon → Meaning map (use consistently)
| Icon             | Meaning                  |
|------------------|--------------------------|
| `LayoutDashboard`| Dashboard                |
| `ShoppingCart`   | POS / Cart               |
| `Package`        | Products                 |
| `Warehouse`      | Stock / Inventory        |
| `Receipt`        | Sales / Receipts         |
| `Users`          | Customers                |
| `UserCog`        | Employees / Staff        |
| `FileText`       | Quotations / Documents   |
| `ShoppingBag`    | Purchases                |
| `BarChart3`      | Reports / Analytics      |
| `Factory`        | Manufacturing            |
| `Truck`          | Field Sales / Delivery   |
| `Settings`       | Settings                 |
| `Bell`           | Notifications            |
| `LogOut`         | Sign out                 |
| `Building2`      | Branch / Location        |
| `Search`         | Search                   |
| `Plus`           | Add / Create             |
| `Pencil`         | Edit                     |
| `Trash2`         | Delete                   |
| `X`              | Close / Cancel           |
| `Check`          | Confirm / Success        |
| `AlertTriangle`  | Warning / Low stock      |
| `AlertCircle`    | Error                    |
| `ArrowUpRight`   | External link / View all |
| `ChevronDown`    | Dropdown toggle          |
| `Download`       | Export / Download        |
| `Upload`         | Import / Upload          |
| `RefreshCw`      | Sync / Refresh           |
| `Wifi` / `WifiOff` | Online / Offline status|
| `Eye`            | View / Preview           |
| `Copy`           | Duplicate                |
| `Filter`         | Filter                   |
| `SlidersHorizontal` | Advanced filters      |
| `Calendar`       | Date picker              |
| `Tag`            | Category / Label         |
| `Barcode`        | Barcode                  |
| `Printer`        | Print                    |
| `Mail`           | Email                    |
| `Phone`          | Phone                    |
| `MapPin`         | Address / Location       |
| `CreditCard`     | Payment / Card           |
| `Banknote`       | Cash                     |
| `Smartphone`     | Mobile Money             |
| `TrendingUp`     | Growth / Revenue up      |
| `TrendingDown`   | Loss / Revenue down      |

---

## 7. Page Layouts

### App pages (inside Layout)
```
<div class="space-y-5 animate-fade-in">
  <!-- Page header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="page-title">Page Name</h1>
      <p class="page-subtitle">Description</p>
    </div>
    <button class="btn btn-primary">
      <Plus size={15} /> Add Item
    </button>
  </div>

  <!-- Filters bar (optional) -->
  <div class="card p-3 flex items-center gap-3">
    <Search input />
    <Select filters />
    <Export button />
  </div>

  <!-- Main content -->
  <div class="card">
    <table class="table">...</table>
  </div>
</div>
```

### POS page — split layout
```
Left (flex-1):  Product search + grid
Right (w-96):   Cart + payment panel — sticky, full height
Background: gray-50
```

---

## 8. Landing Page

### Nav
- White bg, `gray-100` bottom border, sticky
- Logo left, Sign in (ghost) + Get started (blue primary) right
- Height: 56px

### Hero
- White bg, centered, max-w-4xl
- Badge: text-only pill, `blue-50` bg, `blue-700` text, `blue-200` border — NO icon
- H1: black, heavy weight, `text-[52px]` lg — accent word in `blue-600` (not gradient)
- CTA: blue primary button + ghost text link

### Feature cards
- `gray-50` section bg
- White cards, `gray-200` border, `hover:border-blue-200` 
- Icon: `blue-50` bg + `blue-600` icon (16px) — inline with title

### Pricing
- White bg
- Cards: white + `gray-200` border
- Popular card: `blue-600` border + `blue-50` tint
- Popular badge: `blue-600` bg, white text, `rounded-full`
- CTA: blue primary (popular) / gray secondary (others)

### Footer — 3 columns
```
Col 1: Logo + tagline + social icons (Twitter/X, LinkedIn, Facebook)
Col 2: Product links (Features, Pricing, Changelog, Status)  
Col 3: Company links (About, Blog, Careers, Contact, Privacy, Terms)
Bottom bar: copyright + "Made in Uganda 🇺🇬"
```
- Background: `gray-950`
- Text: `white/50`, links `white/70` hover `white`
- Top border: `white/[0.08]`

---

## 9. What to avoid

| ❌ Don't                              | ✅ Do instead                        |
|---------------------------------------|--------------------------------------|
| `bg-gradient-to-r from-x to-y`       | Flat solid color                     |
| `bg-clip-text text-transparent`      | Solid color accent                   |
| Blur orb divs (`blur-3xl opacity-50`)| Nothing — whitespace is enough       |
| `rounded-2xl` on everything          | `rounded-md` cards, `rounded-lg` modals |
| `shadow-xl shadow-orange-500/25`     | Border-only, or `shadow-sm` max      |
| Icons purely for decoration          | Remove them                          |
| `animate-pulse` logo loaders         | CSS border-spin spinner              |
| `ring-1 ring-*-100/50` stacking      | Single `border` is enough            |
| 5+ utility classes for one spacing   | Use the `.card`, `.btn` etc classes  |
| Mixing blue + orange randomly        | Blue for interactive, gray for static |
