"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

/**
 * Client-side companion to proxy.ts's cookie-presence redirect: proxy.ts
 * only checks that a session cookie exists (fast, but not proof it's still
 * valid), so any admin-only page also needs to confirm the session actually
 * works and bounce to /admin/login otherwise. AdminShell does this inline
 * for every page under /admin/*; this hook is the same check for a page
 * that needs admin access but keeps its own layout instead of AdminShell's
 * dashboard chrome — currently just the home/school-directory page, which
 * became admin-only alongside the rest of the site while /register and
 * /checkin/:schoolId stayed open to teachers.
 */
export function useRequireAdmin() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    api
      .get<{ admin: AdminUser }>("/api/admin/auth/me")
      .then((res) => setAdmin(res.admin))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        }
      })
      .finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { admin, checked };
}
