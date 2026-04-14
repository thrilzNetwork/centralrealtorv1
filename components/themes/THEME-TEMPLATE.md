# Central Bolivia - Theme System

**Created:** April 11, 2026
**For:** Creating multiple theme variations with same tech stack

---

## 🛠️ Tech Stack (Same for All Themes)

| Layer | Tool |
|-------|------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Inline styles + Tailwind utilities |
| **Animations** | Framer Motion (`motion/react`) |
| **Icons** | Lucide React |
| **Maps** | Leaflet (dynamic import) |
| **State** | React Context (TenantContext) |
| **Data** | Supabase (via API routes) |

---

## 📁 Theme Structure

```
components/themes/
├── [theme-name]/
│   ├── [ThemeName]Page.tsx    # Main theme component
│   ├── MapInner.tsx           # Map component (optional)
│   ├── ChatWidget.tsx         # WhatsApp chat widget
│   └── theme.config.ts        # Theme configuration
├── TenantContext.tsx          # Shared context (DON'T EDIT)
└── README.md                  # This file
```

---

## 🎨 Core Components (Copy from RealtorV1)

### 1. **Property Card**
- Image with hover zoom
- Status badge (activo/inactivo)
- Heart button (favorites)
- Property details (price, beds, baths, area)
- Link to property detail page

### 2. **Contact Form**
- Name, email, message
- Sends to `/api/leads`
- Success state
- Styled with theme colors

### 3. **Navigation**
- Logo + agent name
- Desktop links (Inicio, Inmuebles, Mapa, Contacto)
- WhatsApp CTA button
- Shrinks on scroll

### 4. **Hero Section**
- Crossfade image slider
- Title + headline + subtitle
- CTA buttons (WhatsApp + Ver Propiedades)
- Stats (total properties, available)

### 5. **Services Bar**
- 6 icons with labels
- Grid layout (3 cols mobile, 6 cols desktop)
- Hover effects

### 6. **Listings Grid**
- Filter chips (property types)
- Responsive grid (auto-fill, minmax)
- Empty state
- Framer Motion stagger animation

### 7. **Map Section**
- Leaflet map with property markers
- Only shows if properties have coords
- Height: responsive (360px - 520px)

### 8. **Contact Section**
- Contact info (WhatsApp, email, city)
- Contact form
- Grid layout (1 col mobile, 2 cols desktop)

### 9. **Footer**
- Agent name + city
- Navigation links
- "Powered by Central Bolivia" credit

### 10. **Chat Widget**
- Floating WhatsApp button
- Opens chat on click
- Configurable name + phone

---

## 🎭 Theme Configuration

### `theme.config.ts` Template

```typescript
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;      // Main brand color (e.g., "#FF7F11")
    secondary?: string;   // Accent color (optional)
    background: string;   // Main bg (e.g., "#1e1e1e")
    surface: string;      // Card bg (e.g., "#1a1a1a")
    text: string;         // Main text (e.g., "#ffffff")
    textMuted: string;    // Muted text (e.g., "#555555")
  };
  fonts: {
    heading: string;      // Serif for headings (e.g., "'Noto Serif', Georgia, serif")
    body: string;         // Sans for body (e.g., "'Manrope', system-ui, sans-serif")
  };
  style: {
    borderRadius: number; // px (e.g., 2 for sharp, 8 for rounded)
    buttonStyle: 'sharp' | 'rounded' | 'pill';
    cardStyle: 'minimal' | 'bordered' | 'shadow';
    animationStyle: 'fade' | 'slide' | 'scale';
  };
  sections: {
    hero: boolean;        // Show/hide hero
    services: boolean;    // Show/hide services bar
    map: boolean;         // Show/hide map section
    chat: boolean;        // Show/hide chat widget
  };
}

export const defaultConfig: ThemeConfig = {
  name: "Realtor V1",
  colors: {
    primary: "#FF7F11",
    background: "#1e1e1e",
    surface: "#1a1a1a",
    text: "#ffffff",
    textMuted: "#555555",
  },
  fonts: {
    heading: "'Noto Serif', Georgia, serif",
    body: "'Manrope', system-ui, sans-serif",
  },
  style: {
    borderRadius: 2,
    buttonStyle: 'sharp',
    cardStyle: 'minimal',
    animationStyle: 'fade',
  },
  sections: {
    hero: true,
    services: true,
    map: true,
    chat: true,
  },
};
```

---

## 📋 How to Create a New Theme

### Step 1: Copy the Template

```bash
cd components/themes
cp -r realtor-v1 [theme-name]
```

### Step 2: Rename Files

```
[theme-name]/
├── [ThemeName]Page.tsx    # e.g., ModernV2Page.tsx
├── MapInner.tsx           # Keep or customize
├── ChatWidget.tsx         # Keep or customize
└── theme.config.ts        # Create new config
```

### Step 3: Update Config

Edit `theme.config.ts`:
- Change colors
- Change fonts
- Adjust style (border radius, buttons, cards)
- Enable/disable sections

### Step 4: Customize Design

In `[ThemeName]Page.tsx`:
- Update colors (use config or hardcode)
- Change layouts (grid, spacing)
- Modify animations
- Add/remove sections

### Step 5: Test

```bash
npm run dev
# Visit: http://localhost:3000?theme=[theme-name]
```

---

## 🎨 Theme Ideas

### 1. **Modern V2** (Clean, Minimal)
- Colors: White, black, blue accent
- Fonts: Inter (heading + body)
- Style: Rounded corners, soft shadows
- Vibe: Tech startup, modern

### 2. **Luxury** (Premium, High-End)
- Colors: Gold, black, cream
- Fonts: Playfair Display (heading), Lato (body)
- Style: Sharp corners, gold accents
- Vibe: Luxury real estate, exclusive

### 3. **Friendly** (Warm, Approachable)
- Colors: Green, beige, warm gray
- Fonts: Nunito (rounded sans)
- Style: Pill buttons, rounded cards
- Vibe: Family-friendly, neighborhood

### 4. **Corporate** (Professional, Trust)
- Colors: Navy, white, gray
- Fonts: Merriweather (heading), Open Sans (body)
- Style: Bordered cards, conservative
- Vibe: Established agency, trustworthy

### 5. **Bold** (Vibrant, Eye-Catching)
- Colors: Red, black, white
- Fonts: Oswald (heading), Roboto (body)
- Style: Large typography, high contrast
- Vibe: Disruptor, modern agency

---

## 🔧 Customization Examples

### Change Colors

```typescript
// In theme.config.ts
colors: {
  primary: "#0066FF",      // Blue instead of orange
  background: "#ffffff",   // Light mode
  surface: "#f5f5f5",
  text: "#1a1a1a",
  textMuted: "#666666",
}
```

### Change Fonts

```typescript
fonts: {
  heading: "'Playfair Display', serif",
  body: "'Inter', sans-serif",
}
```

### Change Border Radius

```typescript
style: {
  borderRadius: 8,         // More rounded
  buttonStyle: 'pill',     // Pill-shaped buttons
  cardStyle: 'shadow',     // Shadow instead of border
}
```

### Disable Sections

```typescript
sections: {
  hero: false,             // No hero section
  services: true,
  map: false,              // No map
  chat: true,
}
```

---

## 📊 TenantContext (Shared)

**DON'T EDIT:** `TenantContext.tsx`

This file provides:
- `profile` - Agent/realtor info (name, logo, colors, etc.)
- `listings` - Property data
- `theme` - Current theme config

All themes use the same context - only the visual layer changes.

---

## 🚀 Deploy New Theme

1. Test locally: `npm run dev`
2. Commit: `git add components/themes/[theme-name]`
3. Push: `git push`
4. Vercel auto-deploys

---

## 📝 Checklist for New Themes

- [ ] Copy `realtor-v1` folder
- [ ] Rename component file
- [ ] Create `theme.config.ts`
- [ ] Update colors
- [ ] Update fonts
- [ ] Adjust style (radius, buttons, cards)
- [ ] Test all sections (hero, listings, map, contact)
- [ ] Test mobile responsiveness
- [ ] Test dark/light mode (if applicable)
- [ ] Commit + push

---

**Last Updated:** April 11, 2026
**Maintained By:** Alejandro Soria + Thrilz (AI)
