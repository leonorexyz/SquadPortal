"use client";

import { BookOpen, BriefcaseBusiness, FileText, LayoutDashboard, ListTodo, Settings2, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      { label: "Vida story", href: "/stories", icon: FileText },
      { label: "Projects", href: "/projects", icon: BriefcaseBusiness },
      { label: "Tasks", href: "/tasks", icon: ListTodo },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Knowledge base", href: "/knowledge", icon: BookOpen },
      { label: "Tickets", href: "/tickets", icon: Ticket, count: "4" },
      { label: "Team members", href: "/team", icon: Users },
    ],
  },
] as const;

export function portalHref(label: string) {
  switch (label) {
    case "Overview": return "/";
    case "Vida story": return "/stories";
    case "Projects": return "/projects";
    case "Tasks": return "/tasks";
    case "Knowledge base": return "/knowledge";
    case "Tickets": return "/tickets";
    case "Team members": return "/team";
    default: return "/";
  }
}

function isActive(pathname: string, href: string, label: string) {
  if (label === "Overview") return pathname === "/";
  if (label === "Vida story") return pathname.startsWith("/stories");
  if (label === "Projects") return pathname.startsWith("/projects");
  if (label === "Tasks") return pathname.startsWith("/tasks");
  if (label === "Knowledge base") return pathname.startsWith("/knowledge");
  if (label === "Tickets") return pathname.startsWith("/tickets");
  if (label === "Team members") return pathname === "/team" || pathname === "/access";
  return pathname === href;
}

export default function PortalNavigation() {
  const pathname = usePathname();

  return <nav className="project-navigation" aria-label="Primary navigation">
    {navigation.map((group) => <div key={group.label}>
      <p className="nav-label">{group.label}</p>
      <ul className="nav-list">
        {group.items.map((item) => { const Icon = item.icon; return <li key={item.label}><Link className={`nav-item ${isActive(pathname, item.href, item.label) ? "active" : ""}`} href={item.href}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{"count" in item && item.count ? <span className="nav-count">{item.count}</span> : null}</Link></li>; })}
      </ul>
    </div>)}
  </nav>;
}

export function PortalSettingsLink() {
  const pathname = usePathname();
  const active = pathname === "/settings" || pathname === "/integrations";
  return <Link className={`nav-item ${active ? "active" : ""}`} href="/settings"><Settings2 size={16} strokeWidth={1.8} /><span>Settings</span></Link>;
}
