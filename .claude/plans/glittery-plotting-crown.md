# Plan: Mobile-First Optimization for realtor-v1 Theme

## Context
The current implementation of the `realtor-v1` theme feels like a "web version" on mobile devices. While the grids and basic layouts are responsive, the typography and spacing are hard-coded using inline styles or fixed Tailwind classes that don't scale down for smaller screens. This leads to oversized headers, awkward text wrapping, and hidden interaction elements (hover states) on touch devices.

The goal is to transition the theme to a truly mobile-first experience by replacing fixed sizes with responsive scales and optimizing the layout for touch interactions.

## Implementation Strategy

### 1. Typography Refactor (Removal of Inline Styles)
The most critical issue is the use of `style={{ fontSize: "..." }}` which bypasses responsive design. I will replace these with Tailwind's responsive typography system.

- **Main Page Heading (`RealtorV1Page.tsx`)**:
  - Change `style={{ fontSize: "2.5rem" }}` $\to$ `className="text-3xl sm:text-4xl lg:text-5xl"`.
- **Property Card Titles (`PropertyCard.tsx`)**:
  - Change `style={{ fontSize: "1.1rem" }}` $\to$ `className="text-base sm:text-lg"`.

### 2. Spacing and Layout Adjustments
Optimize vertical rhythm to improve the "above the fold" content on mobile.

- **Page Padding (`RealtorV1Page.tsx`)**:
  - Change `py-12` $\to$ `py-6 sm:py-12`.
  - Adjust `mb-10` on headings to `mb-6 sm:mb-10`.
- **Property Card Specs (`PropertyCard.tsx`)**:
  - Change `flex items-center gap-4` $\to$ `flex flex-wrap items-center gap-y-2 gap-x-4` to prevent overflow on very narrow screens.

### 3. Touch Interaction Optimization
Convert hover-only interactions to be persistent on mobile.

- **Card "Ver detalle" Link (`PropertyCard.tsx`)**:
  - Change `opacity-0 group-hover:opacity-100` $\to$ `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`. This ensures mobile users can see the call-to-action without needing a hover event.

### 4. Header Responsiveness (`RealtorV1Header.tsx`)
Ensure the header doesn't cause horizontal overflow and that navigation elements are touch-friendly. (I will verify the current implementation and add `overflow-x-auto` or a mobile-specific layout if needed).

## Critical Files to Modify
- `components/themes/realtor-v1/RealtorV1Page.tsx`
- `components/themes/realtor-v1/PropertyCard.tsx`
- `components/themes/realtor-v1/RealtorV1Header.tsx`
- `components/themes/realtor-v1/PropertiesGrid.tsx`

## Verification Plan
1. **Chrome DevTools**: Use the Device Mode to test the site on "iPhone SE" and "Pixel 7" resolutions.
2. **Check for Overflow**: Ensure no horizontal scrollbars appear on the property list or detail pages.
3. **Typography Audit**: Verify that headings scale down naturally and do not dominate the viewport on mobile.
4. **Interaction Test**: Verify that the "Ver detalle" and "Filter" buttons are easily tappable and visible on touch devices.
