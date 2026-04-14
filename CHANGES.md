# Changes Made - Central Bolivia

## 1. Fixed Maps Not Showing on Agent Websites
**Problem:** Variable naming collision in `RealtorV1Page.tsx` - `MapInner` was declared twice (once as dynamic import, once used incorrectly)
**Fix:** Renamed dynamic import to `RealtorMap` to avoid collision

## 2. Removed Magic Populate (AI Feature)
**Changes:**
- Deleted `/app/api/magic-property/route.ts` - API endpoint for AI generation
- Deleted `/lib/gemini/client.ts` - Gemini AI client code
- Removed `@google/generative-ai` from package.json dependencies
- Created `/components/forms/SimplePropertyForm.tsx` - New manual property form
- Updated `/app/dashboard/propiedades/nueva/page.tsx` - Uses SimplePropertyForm now

## 3. Added C21 Property Scraper
**New Feature:** Realtors can paste a Century 21 Bolivia URL and auto-fill property data
**Files:**
- `lib/scraper/c21.ts` - Scrapes property data from C21 URLs
- `app/api/scrape-property/route.ts` - API endpoint for scraping
- Updated `SimplePropertyForm.tsx` - Added URL input + image preview

## 4. Updated Landing Page Copy
**Changes:**
- Hero: "descripciones automáticas" → "mapa interactivo"
- Stats: "Tecnología / Descripciones automáticas" → "Mapa / Interactivo"
- Pricing: "Magic Populate (IA)" → "Mapa interactivo"

## Files Modified:
1. `components/themes/realtor-v1/RealtorV1Page.tsx` - Fixed map import
2. `app/page.tsx` - Removed AI references
3. `app/dashboard/propiedades/nueva/page.tsx` - New simple form
4. `components/forms/SimplePropertyForm.tsx` - NEW FILE with C21 scraper
5. `package.json` - Removed Gemini dependency
6. `deploy.bat` - NEW FILE for easy deployment

## Files Deleted:
1. `app/api/magic-property/route.ts`
2. `lib/gemini/client.ts` (entire folder)

---

## Deployment Steps:

**Option 1: Double-click deploy.bat**
Just double-click `deploy.bat` in the central-bolivia folder

**Option 2: Run commands manually:**

```bash
cd "C:\Users\Thrilz\OneDrive\Desktop\skills1\central-bolivia"
npm install
git add .
git commit -m "Add C21 property scraper, fix maps, remove AI"
git push origin main
```

Vercel will auto-deploy from GitHub.
