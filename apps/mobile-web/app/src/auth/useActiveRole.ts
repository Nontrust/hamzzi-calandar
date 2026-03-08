import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import type { UserRole } from "@nahamzzi/domain";
import { useAuthSession } from "./AuthSessionProvider";

export const ACTIVE_ROLE_KEY = "active-role";

export function useActiveRole() {
  const { session } = useAuthSession();
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  useEffect(() => {
    void initializeRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.userId]);

  async function initializeRole() {
    if (!session) {
      setActiveRole(null);
      return;
    }

    const savedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
    if (savedRole === "A" || savedRole === "B") {
      setActiveRole(savedRole);
      return;
    }

    const fallbackRole = session.user.defaultRole;
    setActiveRole(fallbackRole);
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, fallbackRole);
  }

  async function selectRole(role: UserRole) {
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
  }

  async function clearRole() {
    await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
    setActiveRole(null);
  }

  return { activeRole, selectRole, clearRole };
}
