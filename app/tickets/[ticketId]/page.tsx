"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FileText,
  Grid2X2,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Settings2,
  Tag,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import PortalNavigation, { PortalSettingsLink, portalHref } from "../../components/PortalNavigation";

type TicketReply = { author: string; initials: string; color: string; time: string; body: string };
type TicketDetail = { id: string; title: string; description: string; status: "Open" | "In progress" | "Resolved"; priority: "High" | "Medium" | "Low"; category: string; author: string; initials: string; color: string; assignee: string; updated: string; replies: TicketReply[] };

const ticketDetails: Record<string, TicketDetail> = {
  "TKT-1042": { id: "TKT-1042", title: "How do we request access to the research library?", description: "I can see the collection but cannot open the latest customer interview notes. Is there a request flow I should follow, or can someone help me get access?", status: "Open", priority: "High", category: "Access", author: "Dimas Pratama", initials: "DP", color: "orange", assignee: "Sarah Anderson", updated: "12 min ago", replies: [{ author: "Sarah Anderson", initials: "SA", color: "purple", time: "8 min ago", body: "Thanks for flagging this. I am checking the collection permissions now and will update the access group." }, { author: "Sinta Maheswari", initials: "SM", color: "green", time: "4 min ago", body: "The notes are currently team-only. Sarah, I can add Dimas to the research group once the request is confirmed." }, { author: "Dimas Pratama", initials: "DP", color: "orange", time: "2 min ago", body: "That would be great, thank you!" }] },
  "TKT-1041": { id: "TKT-1041", title: "Dashboard productivity chart is missing this week", description: "The chart shows an empty state for two team members after yesterday's update. The summary cards still show the right totals.", status: "In progress", priority: "Medium", category: "Bug", author: "Sinta Maheswari", initials: "SM", color: "green", assignee: "Raka Aditya", updated: "48 min ago", replies: [{ author: "Raka Aditya", initials: "RA", color: "purple", time: "32 min ago", body: "I found a missing aggregate in the mock response. I am patching the fallback while the API contract is finalized." }, { author: "Sinta Maheswari", initials: "SM", color: "green", time: "18 min ago", body: "Perfect, the two empty states are the ones I saw." }] },
};

const fallbackTicket = ticketDetails["TKT-1042"];
const navigation = [{ label: "Overview", icon: LayoutDashboard }, { label: "Vida story", icon: FileText }, { label: "Projects", icon: BriefcaseBusiness }, { label: "Tasks", icon: ListTodo }, { label: "Knowledge base", icon: BookOpen }, { label: "Tickets", icon: Ticket, count: "4" }, { label: "Team members", icon: Users }];

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const ticket = ticketDetails[params.ticketId] ?? fallbackTicket;
  const [replyList, setReplyList] = useState(ticket.replies);
  const [replyBody, setReplyBody] = useState("");
  const [replyPosted, setReplyPosted] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<TicketReply | null>(null);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);
  const [statusChanged, setStatusChanged] = useState(false);
  const StatusIcon = ticketStatus === "Resolved" ? CheckCircle2 : ticketStatus === "In progress" ? CircleDot : AlertCircle;
  function postReply() {
    const body = replyBody.trim();
    if (!body) return;
    setReplyList((current) => [...current, { author: "Sarah Anderson", initials: "SA", color: "purple", time: "just now", body }]);
    setReplyBody("");
    setReplyPosted(true);
  }

  function confirmDeleteReply() {
    if (!replyToDelete) return;
    setReplyList((current) => current.filter((reply) => !(reply.author === replyToDelete.author && reply.time === replyToDelete.time)));
    setReplyToDelete(null);
  }
  return <div className="dashboard-shell"><aside className="sidebar" aria-label="Main navigation"><TicketDetailBrand /> <PortalNavigation /><div className="sidebar-bottom"><PortalSettingsLink /><div className="mini-profile"><span className="avatar">SA</span><span><span className="profile-name">Sarah Anderson</span><span className="profile-role">Product lead</span></span><ChevronDown size={14} color="#a5adbc" style={{ marginLeft: "auto" }} /></div></div></aside><main className="main-content ticket-detail-page"><div className="mobile-header"><TicketDetailBrand /><span className="avatar avatar-header">SA</span></div><header className="main-header detail-header"><div><p className="breadcrumb"><Link href="/tickets"><ArrowLeft size={13} /> Tickets</Link> <span>/</span> {ticket.id}</p><div className="ticket-detail-title-row"><span className={`ticket-status-icon ${ticketStatus.toLowerCase().replace(" ", "-")}`}><StatusIcon size={16} /></span><h1 className="page-title">{ticket.title}</h1></div><div className="ticket-detail-meta"><span>{ticket.id}</span><span><CalendarDays size={12} /> Updated {ticket.updated}</span><span><Tag size={12} /> {ticket.category}</span></div></div><div className="detail-header-actions"><button className="secondary-button" type="button"><Pencil size={14} /> Edit ticket</button><button className="task-menu detail-menu" type="button" aria-label="More ticket options"><MoreHorizontal size={18} /></button></div></header><div className="ticket-detail-layout"><section className="ticket-thread"><article className="ticket-question"><div className="ticket-thread-author"><span className={`avatar avatar-tiny ${ticket.color}`}>{ticket.initials}</span><span><strong>{ticket.author}</strong><small>Asked the team · {ticket.updated}</small></span></div><p>{ticket.description}</p><div className="ticket-row-meta"><span className={`ticket-status ${ticketStatus.toLowerCase().replace(" ", "-")}`}>{ticketStatus}</span><span className={`ticket-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority} priority</span></div></article><div className="thread-heading"><div><span className="eyebrow">Conversation</span><h2>{replyList.length} replies</h2></div><MessageCircle size={17} color="#a5adbc" /></div><div className="ticket-replies">{replyList.map((reply) => <article className="ticket-reply" key={`${reply.author}-${reply.time}`}><span className={`avatar avatar-tiny ${reply.color}`}>{reply.initials}</span><div className="ticket-reply-body"><div className="ticket-reply-header"><strong>{reply.author}</strong><small>{reply.time}</small><button className="task-menu danger-menu" type="button" aria-label={`Delete reply by ${reply.author}`} onClick={() => setReplyToDelete(reply)}><Trash2 size={13} /></button></div><p>{reply.body}</p></div></article>)}</div></section><aside className="ticket-detail-sidebar"><section className="detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Ticket status</span><h2>At a glance</h2></div><StatusIcon size={16} color="#a5adbc" /></div><div className="ticket-info-list"><div><span>Status</span><select className={`ticket-status-select ${ticketStatus.toLowerCase().replace(" ", "-")}`} value={ticketStatus} onChange={(event) => { setTicketStatus(event.target.value as TicketDetail["status"]); setStatusChanged(true); }} aria-label="Change ticket status"><option>Open</option><option>In progress</option><option>Resolved</option></select></div><div><span>Priority</span><strong className={`ticket-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</strong></div><div><span>Assigned to</span><strong>{ticket.assignee}</strong></div></div>{statusChanged && <p className="status-change-notice" role="status">Ticket status updated to {ticketStatus}.</p>}</section><section className="detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Your turn</span><h2>Reply to the team</h2></div></div><textarea className="ticket-reply-input" placeholder="Add a helpful response..." rows={5} aria-label="Reply to ticket" value={replyBody} onChange={(event) => { setReplyBody(event.target.value); setReplyPosted(false); }} /><button className="primary-button full-width-button" type="button" onClick={postReply} disabled={!replyBody.trim()}>Post reply</button>{replyPosted && <p className="reply-status" role="status">Your reply was added to the conversation.</p>}</section></aside></div>{replyToDelete && <DeleteReplyModal reply={replyToDelete} onCancel={() => setReplyToDelete(null)} onConfirm={confirmDeleteReply} />}</main></div>;
}

function TicketDetailBrand() { return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>; }
function TicketDetailNavItem({ item, active = false }: { item: (typeof navigation)[number]; active?: boolean }) { const Icon = item.icon; return <li><Link className={`nav-item ${active ? "active" : ""}`} href={portalHref(item.label)}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</Link></li>; }

function DeleteReplyModal({ reply, onCancel, onConfirm }: { reply: TicketReply; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="delete-project-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-reply-title" aria-describedby="delete-reply-description"><div className="delete-project-icon"><Trash2 size={18} /></div><div><h2 id="delete-reply-title">Delete this reply?</h2><p id="delete-reply-description">The reply from {reply.author} will be removed from this mock conversation.</p></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onCancel}>Keep reply</button><button className="danger-button" type="button" onClick={onConfirm}>Delete reply</button></div></section></div>;
}
