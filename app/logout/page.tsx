"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/lib/auth/client/useUserAuth";

export default function LogoutPage() {
  const router = useRouter();
  const [, { signOut }] = useUserAuth();

  useEffect(() => {
    (async () => {
      try {
        await signOut();
      } finally {
        router.replace("/");
      }
    })();
  }, [router, signOut]);

  return null;
}
