"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";

interface LogoutButtonProps {
  variant?: ButtonProps["variant"];
  fullWidth?: boolean;
  label?: string;
}

export function LogoutButton({
  variant = "outline",
  fullWidth = false,
  label = "Log out",
}: LogoutButtonProps) {
  const router = useRouter();
  const logout = useAppStore((state) => state.logout);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleLogout() {
    logout();
    setConfirmOpen(false);
    router.replace("/");
  }

  return (
    <>
      <Button variant={variant} fullWidth={fullWidth} onClick={() => setConfirmOpen(true)}>
        <Icon name="logout" size={18} />
        {label}
      </Button>
      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Log out of Artha?"
        description="This demo has no account, so logging out simply ends this visit."
        footer={
          <div className="flex gap-2">
            <Button variant="danger" fullWidth onClick={handleLogout}>
              Log out
            </Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Stay here
            </Button>
          </div>
        }
      >
        <p className="font-body text-body-md text-on-surface-variant">
          Your saved demo workspace stays in this browser. Next time you open Artha you can choose
          setup or the demo workspace again.
        </p>
      </Sheet>
    </>
  );
}
