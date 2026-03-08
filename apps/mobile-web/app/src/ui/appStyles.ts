import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const styles = StyleSheet.create({
  flex1: {
    flex: 1
  },
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  shellRoot: {
    flex: 1,
    backgroundColor: "#eef2f8"
  },
  shellContainer: {
    flex: 1,
    flexDirection: "row"
  },
  shellSidebar: {
    width: 220,
    borderRightWidth: 1,
    borderRightColor: "#dbe3ef",
    backgroundColor: "#f7f9fc",
    padding: 18,
    gap: 16
  },
  shellBrand: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a"
  },
  shellBrandSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600"
  },
  shellNavSection: {
    gap: 8
  },
  shellNavItem: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#eef3fa"
  },
  shellNavItemActive: {
    backgroundColor: "#111827"
  },
  shellNavText: {
    color: "#334155",
    fontWeight: "700"
  },
  shellNavTextActive: {
    color: "#f8fafc"
  },
  shellMain: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  shellHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  shellHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  shellHeaderTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827"
  },
  shellHeaderSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b"
  },
  shellUserBadge: {
    alignItems: "flex-end",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  shellUserName: {
    fontWeight: "800",
    color: "#0f172a"
  },
  shellUserId: {
    fontSize: 12,
    color: "#64748b"
  },
  shellContent: {
    flex: 1
  },
  mobileMenuButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#dbe4ff"
  },
  mobileMenuButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: -1
  },
  mobileDrawerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
    zIndex: 20
  },
  mobileDrawerPanel: {
    width: 240,
    height: "100%",
    backgroundColor: "#f7f9fc",
    borderRightWidth: 1,
    borderRightColor: "#dbe3ef",
    padding: 18,
    gap: 16
  },
  pageScroll: {
    flex: 1
  },
  pageContent: {
    paddingBottom: 24,
    gap: 14
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: 14
  },
  authRoot: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: theme.colors.bgAuth,
    padding: theme.spacing.xl
  },
  authCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: "#e6ebf2"
  },
  authHero: {
    width: "100%",
    height: 128,
    borderRadius: 24,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#FAF8EC",
    borderWidth: 1,
    borderColor: "#F0EAD2"
  },
  authHeroGlowPrimary: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(203,179,117,0.28)",
    top: -70,
    left: -45
  },
  authHeroGlowSecondary: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,214,131,0.22)",
    bottom: -72,
    right: -40
  },
  logoMain: {
    width: 120,
    height: 28,
    alignSelf: "center"
  },
  logoSmall: {
    width: 56,
    height: 56
  },
  emblemBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#dbe4ff"
  },
  authEmblemBadge: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 28
  },
  authLogoMark: {
    width: 64,
    height: 64
  },
  emblemGlowPrimary: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(79,70,229,0.35)",
    top: -30,
    left: -16
  },
  emblemGlowSecondary: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(236,72,153,0.22)",
    bottom: -28,
    right: -14
  },
  biImage: {
    width: "84%",
    height: 84,
    borderRadius: 16,
    alignSelf: "center"
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary
  },
  authSubtitle: {
    color: "#5d6a7d"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4dbe7",
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.primary,
    backgroundColor: "#f8fafc"
  },
  noticeText: {
    color: "#334155",
    fontSize: 13
  },
  demoRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  demoChip: {
    backgroundColor: "#eef2ff",
    color: "#3730a3",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: theme.spacing.xs,
    fontSize: 12,
    fontWeight: "600"
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg
  },
  eyebrow: {
    color: theme.colors.brand,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  eyebrowEmblem: {
    width: 170,
    height: 26
  },
  headerTitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.title,
    fontWeight: "800",
    color: theme.colors.primary
  },
  headerSub: {
    color: "#667085"
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  roleChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: "#e2e8f0"
  },
  roleChipActive: {
    backgroundColor: theme.colors.text
  },
  roleChipText: {
    color: "#334155",
    fontWeight: "700"
  },
  roleChipTextActive: {
    color: "#f8fafc"
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 6
  },
  infoTitle: {
    fontWeight: "700",
    color: theme.colors.primary
  },
  infoBody: {
    color: "#334155"
  },
  infoMeta: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.caption
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md
  },
  statLabel: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.caption
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "800",
    marginTop: theme.spacing.xs
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 10
  },
  sectionTitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: "800",
    color: theme.colors.text
  },
  sectionSub: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.caption
  },
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  calendarMonthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calendarMonthButton: {
    borderWidth: 1,
    borderColor: "#dbe4ef",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  calendarMonthButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155"
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a"
  },
  calendarWeekRow: {
    flexDirection: "row"
  },
  calendarWeekLabel: {
    flex: 1,
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700"
  },
  calendarGrid: {
    gap: 6
  },
  calendarGridRow: {
    flexDirection: "row",
    gap: 6
  },
  calendarCell: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center"
  },
  calendarCellBlank: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  calendarCellActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe"
  },
  calendarCellToday: {
    borderColor: "#0f172a",
    borderWidth: 2
  },
  calendarCellSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#60a5fa"
  },
  calendarDayText: {
    color: "#334155",
    fontWeight: "700"
  },
  calendarDayTextActive: {
    color: "#3730a3"
  },
  calendarDayTextToday: {
    color: "#0f172a",
    fontWeight: "900"
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: "#4f46e5"
  },
  summaryColumns: {
    gap: theme.spacing.sm
  },
  summaryColumn: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    padding: 10,
    gap: 6
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text
  },
  summaryItem: {
    color: "#334155",
    fontSize: 13
  },
  emptyText: {
    color: "#94a3b8"
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    padding: 10
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.pill
  },
  dotAnniversary: {
    backgroundColor: theme.colors.accentAnniversary
  },
  dotExam: {
    backgroundColor: theme.colors.accentExam
  },
  eventTitle: {
    fontWeight: "700",
    color: theme.colors.text
  },
  eventMeta: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.caption
  },
  actionsWrap: {
    gap: theme.spacing.sm
  },
  permissionText: {
    color: "#475569",
    fontSize: theme.typography.caption
  },
  buttonBase: {
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  buttonSecondary: {
    backgroundColor: "#f8fafc",
    borderColor: "#d4dbe7"
  },
  buttonDanger: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.dangerBorder
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }]
  },
  buttonText: {
    fontWeight: "700"
  },
  buttonTextPrimary: {
    color: "#ffffff"
  },
  buttonTextSecondary: {
    color: theme.colors.primary
  }
});
