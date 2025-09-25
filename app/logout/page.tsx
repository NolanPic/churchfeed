"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuthedUser();

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
