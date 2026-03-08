import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, Text, View, useWindowDimensions } from "react-native";
import { useAuthSession } from "../src/auth/AuthSessionProvider";
import { decideAppRoute } from "../src/auth/routeGuards";
import { styles } from "../src/ui/appStyles";

type NavItem = {
  label: string;
  href: "/" | "/anniversaries" | "/schedule" | "/settings";
  subtitle: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "홈", href: "/", subtitle: "오늘의 학습과 일정을 한눈에 확인해요" },
  { label: "기념일", href: "/anniversaries", subtitle: "우리만의 중요한 날짜를 관리해요" },
  { label: "일정", href: "/schedule", subtitle: "시험/캘린더 흐름을 확인해요" },
  { label: "설정", href: "/settings", subtitle: "앱 환경과 계정을 관리해요" }
];

function normalizePath(pathname: string): NavItem["href"] {
  if (pathname === "/anniversaries") return "/anniversaries";
  if (pathname === "/schedule") return "/schedule";
  if (pathname === "/settings") return "/settings";
  return "/";
}

function SideMenu({ current, onNavigate }: { current: NavItem["href"]; onNavigate: (href: NavItem["href"]) => void }) {
  return (
    <>
      <Text style={styles.shellBrand}>Nahamzzi</Text>
      <Text style={styles.shellBrandSub}>Study Console</Text>
      <View style={styles.shellNavSection}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === current;
          return (
            <Pressable
              key={item.href}
              style={[styles.shellNavItem, active && styles.shellNavItemActive]}
              onPress={() => onNavigate(item.href)}
            >
              <Text style={[styles.shellNavText, active && styles.shellNavTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export default function AppLayout() {
  const { isBootstrapping, session } = useAuthSession();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const [menuOpen, setMenuOpen] = useState(false);
  const decision = decideAppRoute(isBootstrapping, session);
  const pathname = usePathname();
  const router = useRouter();

  const current = normalizePath(pathname);
  const currentMeta = NAV_ITEMS.find((item) => item.href === current) ?? NAV_ITEMS[0];

  function handleNavigate(href: NavItem["href"]) {
    setMenuOpen(false);
    router.push(href);
  }

  if (decision === "loading") {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.headerCard}>
          <ActivityIndicator size="small" />
        </View>
      </SafeAreaView>
    );
  }

  if (decision === "redirect") {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.shellRoot}>
      <View style={styles.shellContainer}>
        {isDesktop ? (
          <View style={styles.shellSidebar}>
            <SideMenu current={current} onNavigate={handleNavigate} />
          </View>
        ) : null}

        {!isDesktop && menuOpen ? (
          <Pressable style={styles.mobileDrawerOverlay} onPress={() => setMenuOpen(false)}>
            <View style={styles.mobileDrawerPanel}>
              <SideMenu current={current} onNavigate={handleNavigate} />
            </View>
          </Pressable>
        ) : null}

        <View style={styles.shellMain}>
          <View style={styles.shellHeader}>
            <View style={styles.shellHeaderLeft}>
              {!isDesktop ? (
                <Pressable style={styles.mobileMenuButton} onPress={() => setMenuOpen(true)}>
                  <Text style={styles.mobileMenuButtonText}>☰</Text>
                </Pressable>
              ) : null}
              <View>
                <Text style={styles.shellHeaderTitle}>{currentMeta.label}</Text>
                <Text style={styles.shellHeaderSub}>{currentMeta.subtitle}</Text>
              </View>
            </View>
            <View style={styles.shellUserBadge}>
              <Text style={styles.shellUserName}>{session?.user.displayName}</Text>
              <Text style={styles.shellUserId}>{session?.user.loginId}</Text>
            </View>
          </View>
          <View style={styles.shellContent}>
            <Slot />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
