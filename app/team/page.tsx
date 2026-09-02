"use client";

import Link from "next/link";
import {
  BookOpen,
  BriefcaseBusiness,
  FileText,
  Grid2X2,
  LayoutDashboard,
  ListTodo,
  Search,
  Settings2,
  Ticket,
  Users,
  UserX,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type MemberStatus = "Active" | "Inactive";
type MemberRole = "Admin" | "Editor" | "Viewer";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  initials: string;
  color: "purple" | "green" | "orange" | "blue";
  lastActive: string;
};

type InviteFormState = {
  name: string;
  email: string;
  role: MemberRole;
};

const emptyInviteForm: InviteFormState = {
  name: "",
  email: "",
  role: "Editor",
};

const members: TeamMember[] = [
  { id: "sarah-anderson", name: "Sarah Anderson", email: "sarah@squad.team", role: "Admin", status: "Active", initials: "SA", color: "purple", lastActive: "Just now" },
  { id: "nadia-putri", name: "Nadia Putri", email: "nadia@squad.team", role: "Editor", status: "Active", initials: "NP", color: "green", lastActive: "12 min ago" },
  { id: "raka-aditya", name: "Raka Aditya", email: "raka@squad.team", role: "Editor", status: "Active", initials: "RA", color: "blue", lastActive: "Yesterday" },
  { id: "dimas-pratama", name: "Dimas Pratama", email: "dimas@squad.team", role: "Viewer", status: "Inactive", initials: "DP", color: "orange", lastActive: "Aug 18, 2024" },
  { id: "sinta-maheswari", name: "Sinta Maheswari", email: "sinta@squad.team", role: "Viewer", status: "Active", initials: "SM", color: "purple", lastActive: "Aug 21, 2024" },
  { id: "bima-kusuma", name: "Bima Kusuma", email: "bima@squad.team", role: "Editor", status: "Inactive", initials: "BK", color: "green", lastActive: "Aug 09, 2024" },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Vida story", icon: FileText, href: "/stories" },
  { label: "Projects", icon: BriefcaseBusiness, href: "/projects" },
  { label: "Tasks", icon: ListTodo, href: "/tasks" },
  { label: "Knowledge base", icon: BookOpen, href: "/knowledge" },
  { label: "Tickets", icon: Ticket, href: "/tickets", count: "4" },
  { label: "Team members", icon: Users, href: "/team" },
];

export default function TeamPage() {
  const [memberList, setMemberList] = useState(members);
  const [currentRole, setCurrentRole] = useState<MemberRole>("Admin");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All members");
  const [role, setRole] = useState("All roles");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormState>(emptyInviteForm);
  const [inviteError, setInviteError] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [memberForRoleEdit, setMemberForRoleEdit] = useState<TeamMember | null>(null);
  const [roleForm, setRoleForm] = useState<MemberRole>("Editor");
  const [memberToToggle, setMemberToToggle] = useState<TeamMember | null>(null);

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return memberList.filter((member) => {
      const matchesQuery = !normalizedQuery || `${member.name} ${member.email}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "All members" || member.status === status;
      const matchesRole = role === "All roles" || member.role === role;
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [memberList, query, role, status]);

  const activeMembers = memberList.filter((member) => member.status === "Active").length;
  const inactiveMembers = memberList.length - activeMembers;
  const adminCount = memberList.filter((member) => member.role === "Admin").length;
  const visibleNavigation = navigation.filter((item) => {
    if (currentRole === "Admin") return true;
    if (item.label === "Team members") return false;
    return currentRole !== "Viewer" || item.label !== "Tasks";
  });

  function openInvite() {
    setInviteForm(emptyInviteForm);
    setInviteError("");
    setIsInviteOpen(true);
  }

  function closeInvite() {
    setIsInviteOpen(false);
    setInviteError("");
  }

  function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = inviteForm.name.trim();
    const email = inviteForm.email.trim().toLowerCase();
    if (!name || !email) {
      setInviteError("Name and email are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setInviteError("Enter a valid email address.");
      return;
    }
    if (memberList.some((member) => member.email.toLowerCase() === email)) {
      setInviteError("This email is already in the directory.");
      return;
    }

    const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const colors: TeamMember["color"][] = ["purple", "green", "orange", "blue"];
    setMemberList((current) => [...current, { id: email, name, email, role: inviteForm.role, status: "Active", initials, color: colors[current.length % colors.length], lastActive: "Invited just now" }]);
    setInviteMessage(`${name} has been added to the workspace.`);
    closeInvite();
  }

  function openRoleEditor(member: TeamMember) {
    setMemberForRoleEdit(member);
    setRoleForm(member.role);
  }

  function closeRoleEditor() {
    setMemberForRoleEdit(null);
  }

  function saveRole() {
    if (!memberForRoleEdit) return;
    setMemberList((current) => current.map((member) => member.id === memberForRoleEdit.id ? { ...member, role: roleForm } : member));
    setInviteMessage(`${memberForRoleEdit.name}'s role is now ${roleForm}.`);
    closeRoleEditor();
  }

  function confirmStatusChange() {
    if (!memberToToggle) return;
    const nextStatus: MemberStatus = memberToToggle.status === "Active" ? "Inactive" : "Active";
    setMemberList((current) => current.map((member) => member.id === memberToToggle.id ? { ...member, status: nextStatus, lastActive: nextStatus === "Inactive" ? "Access paused just now" : "Reactivated just now" } : member));
    setInviteMessage(`${memberToToggle.name} is now ${nextStatus.toLowerCase()}.`);
    setMemberToToggle(null);
  }

  return (
    <div className="dashboard-shell team-page">
      <aside className="sidebar">
        <TeamBrand />
        <nav className="nav-group" aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          <ul className="nav-list">
            {visibleNavigation.map((item) => <li key={item.label}><Link className={`nav-item ${item.label === "Team members" ? "active" : ""}`} href={item.href}><item.icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count ? <span className="nav-count">{item.count}</span> : null}</Link></li>)}
          </ul>
        </nav>
        <div className="sidebar-bottom">
          {currentRole === "Admin" ? <Link className="nav-item" href="/settings"><Settings2 size={16} strokeWidth={1.8} /><span>Settings</span></Link> : null}
          <label className="role-switcher"><span>Preview menu as</span><select value={currentRole} onChange={(event) => setCurrentRole(event.target.value as MemberRole)} aria-label="Preview menu as role"><option>Admin</option><option>Editor</option><option>Viewer</option></select></label>
          <div className="mini-profile"><span className="avatar avatar-small purple">SA</span><span><strong className="profile-name">Sarah Anderson</strong><small className="profile-role">{currentRole} access</small></span></div>
        </div>
      </aside>

      <main className="main-content">
        <div className="mobile-header"><TeamBrand /><button className="icon-button" type="button" aria-label="Open navigation"><Users size={17} /></button></div>
        <header className="main-header">
          <div><p className="breadcrumb">Workspace <span>/</span> <strong>Team members</strong></p><h1 className="page-title">Team members</h1><p className="page-subtitle">Manage who can access your squad workspace.</p></div>
          <div className="header-actions"><button className="icon-button" type="button" aria-label="Notifications"><span className="notification-dot" /><Users size={17} /></button><span className="avatar avatar-header purple">SA</span></div>
        </header>

        {inviteMessage ? <div className="member-feedback" role="status">{inviteMessage}<button type="button" aria-label="Dismiss notification" onClick={() => setInviteMessage("")}><X size={14} /></button></div> : null}

        <section className="member-summary" aria-label="Member summary">
          <SummaryCard label="Total members" value={memberList.length} detail="Across this workspace" tone="purple" />
          <SummaryCard label="Active members" value={activeMembers} detail="Can access the workspace" tone="green" />
          <SummaryCard label="Inactive members" value={inactiveMembers} detail="Access currently paused" tone="orange" />
          <SummaryCard label="Workspace admins" value={adminCount} detail="Full access and control" tone="blue" />
        </section>

        <section className="member-list-panel" aria-labelledby="member-list-title">
          <div className="member-list-heading"><div><span className="eyebrow">Directory</span><h2 id="member-list-title">All members <span>{visibleMembers.length}</span></h2></div><button className="primary-button" type="button" onClick={openInvite}><Users size={15} /> Invite member</button></div>
          <div className="member-toolbar">
            <label className="search-wrap"><Search size={15} aria-hidden="true" /><span className="sr-only">Search members</span><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email..." /></label>
            <div className="toolbar-actions"><label className="sr-only" htmlFor="member-status">Filter by status</label><select id="member-status" className="select-control" value={status} onChange={(event) => setStatus(event.target.value)}><option>All members</option><option>Active</option><option>Inactive</option></select><label className="sr-only" htmlFor="member-role">Filter by role</label><select id="member-role" className="select-control" value={role} onChange={(event) => setRole(event.target.value)}><option>All roles</option><option>Admin</option><option>Editor</option><option>Viewer</option></select></div>
          </div>

          <div className="member-table-wrap">
            <table className="member-table">
              <thead><tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Last active</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{visibleMembers.map((member) => <tr key={member.id}><td><div className="member-identity"><span className={`avatar ${member.color}`}>{member.initials}</span><span><strong>{member.name}</strong><small>{member.email}</small></span></div></td><td><span className="member-role">{member.role}</span></td><td><span className={`member-status ${member.status.toLowerCase()}`}><span />{member.status}</span></td><td className="member-last-active">{member.lastActive}</td><td><div className="member-row-actions"><button className={`member-status-action ${member.status.toLowerCase()}`} type="button" onClick={() => setMemberToToggle(member)}>{member.status === "Active" ? "Deactivate" : "Activate"}</button><button className="member-more" type="button" aria-label={`Change role for ${member.name}`} onClick={() => openRoleEditor(member)}>•••</button></div></td></tr>)}</tbody>
            </table>
            {visibleMembers.length === 0 ? <p className="empty-search">No members match your filters.</p> : null}
          </div>
        </section>
      </main>
      {isInviteOpen ? <InviteMemberModal form={inviteForm} error={inviteError} onChange={setInviteForm} onClose={closeInvite} onSubmit={handleInviteSubmit} /> : null}
      {memberForRoleEdit ? <ChangeRoleModal member={memberForRoleEdit} role={roleForm} onRoleChange={setRoleForm} onClose={closeRoleEditor} onSave={saveRole} /> : null}
      {memberToToggle ? <StatusChangeModal member={memberToToggle} onClose={() => setMemberToToggle(null)} onConfirm={confirmStatusChange} /> : null}
    </div>
  );
}

function TeamBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function SummaryCard({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return <article className={`member-summary-card ${tone}`}><div className="member-summary-top"><span>{label}</span><span className="member-summary-dot" /></div><strong>{value}</strong><small>{detail}</small></article>;
}

function InviteMemberModal({ form, error, onChange, onClose, onSubmit }: { form: InviteFormState; error: string; onChange: (form: InviteFormState) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal member-invite-modal" role="dialog" aria-modal="true" aria-labelledby="invite-member-title"><div className="modal-heading"><div><span className="eyebrow">Workspace access</span><h2 id="invite-member-title">Add a new member</h2><p>Give a teammate access to the squad workspace.</p></div><button className="modal-close" type="button" aria-label="Close invite form" onClick={onClose}><X size={17} /></button></div><form onSubmit={onSubmit}><label>Full name<input autoFocus required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="e.g. Maya Putri" /></label><label>Email address<input required type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} placeholder="name@company.com" /></label><label>Workspace role<select value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value as MemberRole })}><option>Admin</option><option>Editor</option><option>Viewer</option></select></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">Add member</button></div></form></section></div>;
}

function ChangeRoleModal({ member, role, onRoleChange, onClose, onSave }: { member: TeamMember; role: MemberRole; onRoleChange: (role: MemberRole) => void; onClose: () => void; onSave: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal member-role-modal" role="dialog" aria-modal="true" aria-labelledby="change-role-title"><div className="modal-heading"><div><span className="eyebrow">Member permissions</span><h2 id="change-role-title">Change member role</h2><p>Update the workspace access for {member.name}.</p></div><button className="modal-close" type="button" aria-label="Close role form" onClick={onClose}><X size={17} /></button></div><div className="role-member-preview"><span className={`avatar ${member.color}`}>{member.initials}</span><span><strong>{member.name}</strong><small>{member.email}</small></span></div><label className="role-select-label">Workspace role<select value={role} onChange={(event) => onRoleChange(event.target.value as MemberRole)}><option>Admin</option><option>Editor</option><option>Viewer</option></select></label><p className="role-help"><strong>{role}</strong> {role === "Admin" ? "can manage members, settings, and all workspace content." : role === "Editor" ? "can create and update workspace content." : "has read-only access to shared workspace content."}</p><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" onClick={onSave}>Save role</button></div></section></div>;
}

function StatusChangeModal({ member, onClose, onConfirm }: { member: TeamMember; onClose: () => void; onConfirm: () => void }) {
  const isDeactivating = member.status === "Active";
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="delete-project-modal member-status-modal" role="alertdialog" aria-modal="true" aria-labelledby="member-status-title" aria-describedby="member-status-description"><div className="delete-project-icon"><UserX size={18} /></div><div><h2 id="member-status-title">{isDeactivating ? "Deactivate" : "Activate"} {member.name}?</h2><p id="member-status-description">{isDeactivating ? "This member will lose access to the workspace until you activate them again." : "This member will be able to access the workspace again."}</p></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className={isDeactivating ? "danger-button" : "primary-button"} type="button" onClick={onConfirm}>{isDeactivating ? "Deactivate member" : "Activate member"}</button></div></section></div>;
}
