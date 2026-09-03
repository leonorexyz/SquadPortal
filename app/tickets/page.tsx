"use client";

import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDot,
  FileText,
  Grid2X2,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Ticket,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import PortalNavigation, { PortalSettingsLink, portalHref } from "../components/PortalNavigation";
import PortalUserProfile, { PortalUserAvatar, usePortalUser } from "../components/PortalUserProfile";

type SupportTicket = {
  id: string;
  title: string;
  description: string;
  status: "Open" | "In progress" | "Resolved";
  priority: "High" | "Medium" | "Low";
  category: string;
  author: string;
  initials: string;
  assignee: string;
  replies: number;
  updated: string;
};

const tickets: SupportTicket[] = [
  { id: "TKT-1042", title: "How do we request access to the research library?", description: "I can see the collection but cannot open the latest customer interview notes.", status: "Open", priority: "High", category: "Access", author: "Dimas Pratama", initials: "DP", assignee: "Sarah Anderson", replies: 3, updated: "12 min ago" },
  { id: "TKT-1041", title: "Dashboard productivity chart is missing this week", description: "The chart shows an empty state for two team members after yesterday's update.", status: "In progress", priority: "Medium", category: "Bug", author: "Sinta Maheswari", initials: "SM", assignee: "Raka Aditya", replies: 5, updated: "48 min ago" },
  { id: "TKT-1039", title: "Where can I find the Q3 campaign brief?", description: "Looking for the latest version before sharing the direction with our partners.", status: "Open", priority: "Low", category: "Question", author: "Nadia Putri", initials: "NP", assignee: "Unassigned", replies: 1, updated: "2 hr ago" },
  { id: "TKT-1038", title: "Mobile beta feedback has been added to the project", description: "Closing this thread now that the follow-up tasks are assigned in Mobile App v2.", status: "Resolved", priority: "Medium", category: "Product", author: "Raka Aditya", initials: "RA", assignee: "Nadia Putri", replies: 7, updated: "Yesterday" },
  { id: "TKT-1035", title: "Can someone review the release checklist?", description: "I would love a second pair of eyes on the steps for this Friday's release.", status: "Resolved", priority: "Low", category: "Review", author: "Sarah Anderson", initials: "SA", assignee: "Raka Aditya", replies: 4, updated: "Aug 25" },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Vida story", icon: FileText },
  { label: "Projects", icon: BriefcaseBusiness },
  { label: "Tasks", icon: ListTodo },
  { label: "Knowledge base", icon: BookOpen },
  { label: "Tickets", icon: Ticket, count: "4" },
  { label: "Team members", icon: Users },
];

type TicketFormState = Pick<SupportTicket, "title" | "description" | "priority" | "category" | "assignee">;

const emptyTicketForm: TicketFormState = {
  title: "",
  description: "",
  priority: "Medium",
  category: "Question",
  assignee: "Unassigned",
};

export default function TicketsPage() {
  const currentUser = usePortalUser();
  const [ticketList, setTicketList] = useState(tickets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All tickets");
  const [priority, setPriority] = useState("All priorities");
  const [ticketForm, setTicketForm] = useState<TicketFormState>(emptyTicketForm);
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [ticketFormError, setTicketFormError] = useState("");
  const visibleTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ticketList.filter((ticket) => {
      const matchesQuery = !normalizedQuery || `${ticket.id} ${ticket.title} ${ticket.description} ${ticket.category} ${ticket.author}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "All tickets" || ticket.status === status;
      const matchesPriority = priority === "All priorities" || ticket.priority === priority;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [priority, query, status, ticketList]);

  function openTicketForm() {
    setTicketForm(emptyTicketForm);
    setTicketFormError("");
    setIsTicketFormOpen(true);
  }

  function closeTicketForm() {
    setTicketForm(emptyTicketForm);
    setTicketFormError("");
    setIsTicketFormOpen(false);
  }

  function handleTicketSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      setTicketFormError("Title and details are required.");
      return;
    }
    if (ticketForm.title.trim().length < 8) {
      setTicketFormError("Title must be at least 8 characters.");
      return;
    }
    setTicketFormError("");
    const newTicket: SupportTicket = { id: `TKT-${1043 + ticketList.length}`, title: ticketForm.title.trim(), description: ticketForm.description.trim(), status: "Open", priority: ticketForm.priority, category: ticketForm.category, author: currentUser.name, initials: currentUser.initials, assignee: ticketForm.assignee, replies: 0, updated: "just now" };
    setTicketList((current) => [newTicket, ...current]);
    closeTicketForm();
  }

  return <div className="dashboard-shell"><aside className="sidebar" aria-label="Main navigation"><TicketBrand /> <PortalNavigation /><div className="sidebar-bottom"><PortalSettingsLink /><PortalUserProfile roleLabel="Product lead" /></div></aside><main className="main-content tickets-page"><div className="mobile-header"><TicketBrand /><PortalUserAvatar className="avatar-header" /></div><header className="main-header"><div><p className="breadcrumb"><strong>Team</strong> <span>/</span> Tickets</p><h1 className="page-title">Tickets</h1><p className="page-subtitle">Ask questions, share context, and help each other move forward.</p></div><button className="primary-button" type="button" onClick={openTicketForm}><Plus size={15} /> New ticket</button></header><section className="ticket-summary" aria-label="Ticket summary"><div><span>Open tickets</span><strong>04</strong><small>Needs a response</small></div><div><span>In progress</span><strong>03</strong><small>Being looked into</small></div><div><span>Resolved this month</span><strong>18</strong><small>+4 from last month</small></div><div><span>Average response</span><strong>2.4h</strong><small>Healthy this week</small></div></section><div className="ticket-toolbar"><div className="search-wrap ticket-search"><Search size={16} strokeWidth={1.8} aria-hidden="true" /><input className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tickets..." aria-label="Search tickets" /></div><div className="ticket-filters"><select className="select-control" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter tickets by status"><option>All tickets</option><option>Open</option><option>In progress</option><option>Resolved</option></select><select className="select-control" value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter tickets by priority"><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></div></div><section className="ticket-list" aria-label="Ticket list">{visibleTickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}{visibleTickets.length === 0 && <p className="empty-search">No tickets match your filters.</p>}</section>{isTicketFormOpen && <TicketFormModal form={ticketForm} error={ticketFormError} onChange={setTicketForm} onClose={closeTicketForm} onSubmit={handleTicketSubmit} />}</main></div>;
}

function TicketBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function TicketNavItem({ item, active = false }: { item: (typeof navigation)[number]; active?: boolean }) {
  const Icon = item.icon;
  return <li><Link className={`nav-item ${active ? "active" : ""}`} href={portalHref(item.label)}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</Link></li>;
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const StatusIcon = ticket.status === "Resolved" ? CheckCircle2 : ticket.status === "In progress" ? CircleDot : AlertCircle;
  return <article className="ticket-row"><div className={`ticket-status-icon ${ticket.status.toLowerCase().replace(" ", "-")}`}><StatusIcon size={16} /></div><div className="ticket-main"><div className="ticket-title-line"><span className="ticket-id">{ticket.id}</span><h2><Link href={`/tickets/${ticket.id}`}>{ticket.title}</Link></h2></div><p>{ticket.description}</p><div className="ticket-row-meta"><span className={`ticket-status ${ticket.status.toLowerCase().replace(" ", "-")}`}>{ticket.status}</span><span className={`ticket-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority} priority</span><span>{ticket.category}</span></div></div><div className="ticket-assignee"><span className={`avatar avatar-tiny ${ticket.priority.toLowerCase() === "high" ? "orange" : "purple"}`}>{ticket.initials}</span><span><strong>{ticket.author}</strong><small>Assigned to {ticket.assignee}</small></span></div><div className="ticket-row-footer"><span><MessageCircle size={13} /> {ticket.replies}</span><span>{ticket.updated}</span></div></article>;
}

function TicketFormModal({ form, error, onChange, onClose, onSubmit }: { form: TicketFormState; error: string; onChange: (form: TicketFormState) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal ticket-form-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-form-title"><div className="modal-heading"><div><span className="eyebrow">Team support</span><h2 id="ticket-form-title">Create a ticket</h2><p>Ask a clear question so the right teammate can help.</p></div><button className="modal-close" type="button" aria-label="Close ticket form" onClick={onClose}><X size={17} /></button></div><form onSubmit={onSubmit}><label>Title<input autoFocus required value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="What do you need help with?" /></label><label>Details<textarea required value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="Add the context someone needs to answer..." rows={4} /></label>{error && <p className="field-error" role="alert">{error}</p>}<div className="form-field-grid"><label>Category<select value={form.category} onChange={(event) => onChange({ ...form, category: event.target.value })}><option>Question</option><option>Access</option><option>Bug</option><option>Product</option><option>Review</option></select></label><label>Priority<select value={form.priority} onChange={(event) => onChange({ ...form, priority: event.target.value as SupportTicket["priority"] })}><option>High</option><option>Medium</option><option>Low</option></select></label></div><label>Assign to<select value={form.assignee} onChange={(event) => onChange({ ...form, assignee: event.target.value })}><option>Unassigned</option><option>Sarah Anderson</option><option>Nadia Putri</option><option>Raka Aditya</option><option>Sinta Maheswari</option></select></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">Create ticket</button></div></form></section></div>;
}
