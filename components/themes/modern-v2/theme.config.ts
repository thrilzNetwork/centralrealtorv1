import type { ThemeConfig } from "../types";

export const config: ThemeConfig = {
  name: "Modern V2",
  colors: {
    primary: "#0066FF",      // Blue accent
    secondary: "#00D4AA",    // Teal accent
    background: "#ffffff",   // Light mode
    surface: "#f8f9fa",
    text: "#1a1a1a",
    textMuted: "#666666",
  },
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  style: {
    borderRadius: 12,
    buttonStyle: 'rounded',
    cardStyle: 'shadow',
    animationStyle: 'slide',
  },
  sections: {
    hero: true,
    services: true,
    map: true,
    chat: true,
  },
};
