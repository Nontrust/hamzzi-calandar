export const theme = {
  colors: {
    bg: "#f4f7fb",
    bgAuth: "#eff3f9",
    surface: "#ffffff",
    border: "#e5eaf2",
    borderSoft: "#edf2f7",
    text: "#0f172a",
    textSubtle: "#64748b",
    textMuted: "#7f8a9a",
    brand: "#4f46e5",
    primary: "#111827",
    accentExam: "#2563eb",
    accentAnniversary: "#ec4899",
    success: "#166534",
    dangerBg: "#fff1f2",
    dangerBorder: "#fecdd3"
  },
  radius: {
    sm: 10,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20
  },
  typography: {
    title: 24,
    subtitle: 16,
    body: 14,
    caption: 12
  }
} as const;

export type ButtonVariant = "primary" | "secondary" | "danger";
