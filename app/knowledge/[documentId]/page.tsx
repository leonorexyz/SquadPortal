"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  FileText,
  Globe2,
  Grid2X2,
  LayoutDashboard,
  ListTodo,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Settings2,
  Share2,
  Tag,
  Ticket,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import PortalNavigation, { PortalSettingsLink, portalHref } from "../../components/PortalNavigation";

type DocumentDetail = {
  title: string;
  category: string;
  type: string;
  updated: string;
  author: string;
  initials: string;
  color: string;
  access: "Private" | "Team" | "Public";
  readTime: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

const documentDetails: Record<string, DocumentDetail> = {
  "design-principles": {
    title: "Our product design principles",
    category: "Design",
    type: "Guide",
    updated: "Today at 09:20",
    author: "Nadia Putri",
    initials: "NP",
    color: "purple",
    access: "Team",
    readTime: "6 min read",
    intro: "Good product design helps people feel oriented, capable, and cared for. These principles give us a shared starting point when we make decisions together.",
    sections: [
      { heading: "Make the next step obvious", body: "Every screen should help someone understand where they are and what they can do next. Reduce competing actions, use familiar language, and let important moments breathe." },
      { heading: "Earn attention, do not demand it", body: "Use hierarchy and motion with intention. A quiet interface is not empty; it gives people space to focus on the work that matters." },
      { heading: "Design for the edges", body: "Consider the first visit, the busy day, the slow connection, and the person using assistive technology. Strong defaults make the everyday path feel effortless." },
    ],
  },
  "release-process": {
    title: "Release process and checklist",
    category: "Engineering",
    type: "Playbook",
    updated: "Yesterday at 16:45",
    author: "Raka Aditya",
    initials: "RA",
    color: "green",
    access: "Team",
    readTime: "8 min read",
    intro: "A lightweight checklist for preparing, reviewing, and shipping changes while keeping the team informed.",
    sections: [
      { heading: "Before review", body: "Confirm the acceptance criteria, add coverage for the important path, and include screenshots or a short recording when the change is visual." },
      { heading: "Before release", body: "Check the migration plan, review the release notes, and make sure the owner and rollback path are clear." },
      { heading: "After release", body: "Watch the first signals, share the outcome in the team channel, and capture any follow-up work while the context is fresh." },
    ],
  },
};

const fallbackDocument = documentDetails["design-principles"];

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Vida story", icon: FileText },
  { label: "Projects", icon: BriefcaseBusiness },
  { label: "Tasks", icon: ListTodo },
  { label: "Knowledge base", icon: BookOpen },
  { label: "Tickets", icon: Ticket, count: "4" },
  { label: "Team members", icon: Users },
];

export default function KnowledgeDetailPage() {
  const params = useParams<{ documentId: string }>();
  const document = documentDetails[params.documentId] ?? fallbackDocument;

  return <div className="dashboard-shell"><aside className="sidebar" aria-label="Main navigation"><KnowledgeDetailBrand /> <PortalNavigation /><div className="sidebar-bottom"><PortalSettingsLink /><div className="mini-profile"><span className="avatar">SA</span><span><span className="profile-name">Sarah Anderson</span><span className="profile-role">Product lead</span></span><ChevronDown size={14} color="#a5adbc" style={{ marginLeft: "auto" }} /></div></div></aside><main className="main-content knowledge-detail-page"><div className="mobile-header"><KnowledgeDetailBrand /><span className="avatar avatar-header">SA</span></div><header className="main-header knowledge-detail-header"><div><p className="breadcrumb"><Link href="/knowledge"><ArrowLeft size={13} /> Knowledge base</Link> <span>/</span> {document.title}</p><div className="knowledge-detail-title-row"><span className={`knowledge-type ${document.color}`}><BookOpen size={12} /> {document.type}</span><h1 className="page-title">{document.title}</h1></div><div className="knowledge-detail-meta"><span><span className={`avatar avatar-tiny ${document.color}`}>{document.initials}</span>{document.author}</span><span><CalendarDays size={12} /> Updated {document.updated}</span><span>{document.readTime}</span></div></div><div className="detail-header-actions"><button className="secondary-button" type="button"><Share2 size={14} /> Share</button><button className="secondary-button" type="button"><Pencil size={14} /> Edit</button><button className="task-menu detail-menu" type="button" aria-label="More document options"><MoreHorizontal size={18} /></button></div></header><div className="knowledge-detail-layout"><article className="knowledge-article"><p className="knowledge-article-intro">{document.intro}</p>{document.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></section>)}<div className="knowledge-article-footer"><CircleCheck size={15} /><span>This guide was last reviewed by the team today.</span></div></article><aside className="knowledge-detail-sidebar"><section className="detail-panel knowledge-status-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Access status</span><h2>Who can view it</h2></div>{document.access === "Public" ? <Globe2 size={16} color="#a5adbc" /> : document.access === "Private" ? <LockKeyhole size={16} color="#a5adbc" /> : <Users size={16} color="#a5adbc" />}</div><div className="knowledge-access-status"><span className={`knowledge-access-pill ${document.access.toLowerCase()}`}>{document.access}</span><p>{document.access === "Public" ? "Anyone with the link can view this document." : document.access === "Private" ? "Only you can view this document." : "Everyone in the squad can view this document."}</p></div><button className="secondary-button full-width-button" type="button"><Share2 size={13} /> Manage access</button></section><section className="detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Details</span><h2>Document info</h2></div><Tag size={15} color="#a5adbc" /></div><div className="document-info-list"><div><span>Category</span><strong>{document.category}</strong></div><div><span>Document type</span><strong>{document.type}</strong></div><div><span>Last updated</span><strong>{document.updated}</strong></div></div></section></aside></div></main></div>;
}

function KnowledgeDetailBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function KnowledgeDetailNavItem({ item, active = false }: { item: (typeof navigation)[number]; active?: boolean }) {
  const Icon = item.icon;
  return <li><Link className={`nav-item ${active ? "active" : ""}`} href={portalHref(item.label)}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</Link></li>;
}
