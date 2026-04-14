export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  style: {
    borderRadius: number;
    buttonStyle: "rounded" | "sharp" | "pill";
    cardStyle: "shadow" | "border" | "flat";
    animationStyle: "slide" | "fade" | "none";
  };
  sections: {
    hero: boolean;
    services: boolean;
    map: boolean;
    chat: boolean;
  };
}
