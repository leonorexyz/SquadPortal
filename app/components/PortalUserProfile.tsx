"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { useAuthSession } from "./AuthSessionProvider";

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: "Admin" | "Editor" | "Viewer";
};

export function usePortalUser(): PortalUser {
  const { session, isReady } = useAuthSession();

  return useMemo(() => {
    if (session?.user) return session.user;

    return {
      id: "workspace-member",
      name: isReady ? "Workspace member" : "Loading profile",
      email: "",
      initials: isReady ? "WM" : "…",
      role: "Viewer",
    };
  }, [isReady, session]);
}

export function PortalUserAvatar({ className = "" }: { className?: string }) {
  const user = usePortalUser();
  return <span className={`avatar ${className}`.trim()}>{user.initials}</span>;
}

export default function PortalUserProfile({ roleLabel = "Workspace member", avatarClassName = "", showChevron = true }: { roleLabel?: string; avatarClassName?: string; showChevron?: boolean }) {
  const user = usePortalUser();

  return (
    <div className="mini-profile">
      <PortalUserAvatar className={avatarClassName} />
      <span>
        <span className="profile-name">{user.name}</span>
        <span className="profile-role">{roleLabel}</span>
      </span>
      {showChevron ? <ChevronDown size={14} color="#a5adbc" style={{ marginLeft: "auto" }} /> : null}
    </div>
  );
}
