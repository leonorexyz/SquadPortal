"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightLeft, BookOpen, BriefcaseBusiness, Check, FileText, Globe2, Grid2X2, LayoutDashboard, ListTodo, LockKeyhole, Save, Search, Settings2, ShieldCheck, Ticket, Users, X } from "lucide-react";
import { useState } from "react";

type ResourceKind = "Project" | "Knowledge";
type Visibility = "Internal" | "Public";
type SettingsTab = "General" | "Resource access" | "Notifications" | "Integrations";

type Resource = {
  id: string;
  name: string;
  kind: ResourceKind;
  owner: string;
  initials: string;
  color: "purple" | "green" | "orange" | "blue";
  visibility: Visibility;
  members: number;
};

type GoogleDocument = {
  id: string;
  name: string;
  type: "Sheet" | "Doc";
  updated: string;
};

type GoogleTask = {
  id: string;
  title: string;
  status: "To do" | "In progress" | "Done";
  due: string;
  source: string;
  synced: string;
};

const googleDocuments: GoogleDocument[] = [
  { id: "sheet-q3-planning", name: "Q3 planning tracker", type: "Sheet", updated: "Updated 12 min ago" },
  { id: "sheet-team-roadmap", name: "Team roadmap 2024", type: "Sheet", updated: "Updated yesterday" },
  { id: "doc-project-briefs", name: "Project briefs", type: "Doc", updated: "Updated Aug 20" },
  { id: "doc-team-handbook", name: "Team handbook", type: "Doc", updated: "Updated Aug 17" },
];

const importedTasks: GoogleTask[] = [
  { id: "task-brief", title: "Review campaign brief", status: "In progress", due: "Sep 05", source: "Q3 planning tracker", synced: "2 min ago" },
  { id: "task-research", title: "Share research highlights", status: "To do", due: "Sep 08", source: "Team roadmap 2024", synced: "18 min ago" },
  { id: "task-qa", title: "Prepare launch QA checklist", status: "Done", due: "Aug 28", source: "Project briefs", synced: "Yesterday" },
];

const initialResources: Resource[] = [
  { id: "website-redesign", name: "Website Redesign", kind: "Project", owner: "Nadia Putri", initials: "NP", color: "purple", visibility: "Internal", members: 4 },
  { id: "research-library", name: "Research Library", kind: "Knowledge", owner: "Sinta Maheswari", initials: "SM", color: "green", visibility: "Public", members: 8 },
  { id: "team-operations", name: "Team Operations", kind: "Project", owner: "Sarah Anderson", initials: "SA", color: "blue", visibility: "Internal", members: 6 },
  { id: "writing-better-briefs", name: "Writing better briefs", kind: "Knowledge", owner: "Dimas Pratama", initials: "DP", color: "orange", visibility: "Internal", members: 3 },
  { id: "onboarding-refresh", name: "Onboarding refresh", kind: "Project", owner: "Sarah Anderson", initials: "SA", color: "purple", visibility: "Internal", members: 5 },
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

const accessOptions = [
  { id: "nadia", name: "Nadia Putri", initials: "NP", color: "green" },
  { id: "raka", name: "Raka Aditya", initials: "RA", color: "blue" },
  { id: "dimas", name: "Dimas Pratama", initials: "DP", color: "orange" },
  { id: "sinta", name: "Sinta Maheswari", initials: "SM", color: "purple" },
];

export default function ResourceAccessPage() {
  const pathname = usePathname();
  const [resources, setResources] = useState(initialResources);
  const [filter, setFilter] = useState<"All resources" | ResourceKind>("All resources");
  const [message, setMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState<Resource | null>(null);
  const [projectVisibility, setProjectVisibility] = useState<Visibility>("Internal");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["nadia", "raka"]);
  const [activeTab, setActiveTab] = useState<SettingsTab>(pathname === "/integrations" ? "Integrations" : "Resource access");

  const visibleResources = filter === "All resources" ? resources : resources.filter((resource) => resource.kind === filter);
  const publicCount = resources.filter((resource) => resource.visibility === "Public").length;

  function updateVisibility(id: string, visibility: Visibility) {
    setResources((current) => current.map((resource) => resource.id === id ? { ...resource, visibility } : resource));
    setMessage("Unsaved access changes");
  }

  function saveChanges() {
    setMessage("Access settings saved for this workspace.");
  }

  function openResourceAccess(resource: Resource) {
    setSelectedProject(resource);
    setProjectVisibility(resource.visibility);
    setSelectedMembers(["nadia", "raka"]);
  }

  function toggleMember(memberId: string) {
    setSelectedMembers((current) => current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]);
  }

  function saveProjectAccess() {
    if (!selectedProject) return;
    setResources((current) => current.map((resource) => resource.id === selectedProject.id ? { ...resource, visibility: projectVisibility, members: selectedMembers.length + 1 } : resource));
    setMessage(`${selectedProject.name} access settings saved.`);
    setSelectedProject(null);
  }

  return <div className="dashboard-shell resource-access-page" data-active-tab={activeTab}><aside className="sidebar"><AccessBrand /><nav className="nav-group" aria-label="Primary navigation"><p className="nav-label">Workspace</p><ul className="nav-list">{navigation.map((item) => <li key={item.label}><Link className="nav-item" href={item.href}><item.icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count ? <span className="nav-count">{item.count}</span> : null}</Link></li>)}</ul></nav><div className="sidebar-bottom"><Link className="nav-item active" href="/settings"><Settings2 size={16} strokeWidth={1.8} /><span>Settings</span></Link><div className="mini-profile"><span className="avatar avatar-small purple">SA</span><span><strong className="profile-name">Sarah Anderson</strong><small className="profile-role">Workspace admin</small></span></div></div></aside><main className="main-content"><div className="mobile-header"><AccessBrand /><span className="avatar avatar-header purple">SA</span></div><nav className="settings-tabs" aria-label="Settings sections">{(["General", "Resource access", "Notifications", "Integrations"] as SettingsTab[]).map((tab) => <button className={activeTab === tab ? "active" : ""} type="button" key={tab} onClick={() => { setActiveTab(tab); setMessage(""); }} aria-current={activeTab === tab ? "page" : undefined}>{tab}</button>)}</nav><header className="main-header resource-access-header"><div><p className="breadcrumb">Workspace <span>/</span> <strong>Settings</strong></p><h1 className="page-title">{activeTab}</h1><p className="page-subtitle">{activeTab === "Resource access" ? "Control who can discover and view projects and knowledge." : activeTab === "General" ? "Manage your workspace identity and defaults." : activeTab === "Integrations" ? "Connect the tools your team uses every day." : "Choose which workspace updates you want to receive."}</p></div><button className="primary-button" type="button" onClick={saveChanges}><Save size={14} /> Save changes</button></header><section className="access-overview" aria-label="Access overview"><div><span className="access-overview-icon purple"><ShieldCheck size={16} /></span><span><strong>Workspace permissions</strong><small>Changes apply to resource visibility.</small></span></div><div><strong>{resources.length}</strong><small>Resources</small></div><div><strong>{publicCount}</strong><small>Public</small></div></section><section className="resource-access-panel" aria-labelledby="resource-access-title"><div className="resource-access-heading"><div><span className="eyebrow">Sharing defaults</span><h2 id="resource-access-title">Resource visibility</h2></div><div className="access-filter"><label className="sr-only" htmlFor="resource-kind">Filter resource type</label><select id="resource-kind" className="select-control" value={filter} onChange={(event) => setFilter(event.target.value as "All resources" | ResourceKind)}><option>All resources</option><option>Project</option><option>Knowledge</option></select></div></div><div className="resource-access-list">{visibleResources.map((resource) => <article className="resource-access-row" key={resource.id}><div className={`resource-kind-icon ${resource.color}`}>{resource.kind === "Project" ? <BriefcaseBusiness size={16} /> : <BookOpen size={16} />}</div><div className="resource-access-name"><strong>{resource.name}</strong><span><span className={`avatar avatar-tiny ${resource.color}`}>{resource.initials}</span>Owned by {resource.owner} · {resource.members} members</span></div><span className={`resource-type ${resource.kind.toLowerCase()}`}>{resource.kind}</span><div className="resource-row-actions"><label className="resource-visibility"><span className="sr-only">Visibility for {resource.name}</span><select value={resource.visibility} onChange={(event) => updateVisibility(resource.id, event.target.value as Visibility)}><option value="Internal">Internal</option><option value="Public">Public</option></select>{resource.visibility === "Public" ? <Globe2 size={13} /> : <LockKeyhole size={13} />}</label><button className="resource-access-manage" type="button" onClick={() => openResourceAccess(resource)}><Users size={12} /> Manage</button></div></article>)}</div>{message ? <p className={`access-save-note ${message.startsWith("Unsaved") ? "pending" : ""}`} role="status">{message}</p> : null}</section><SettingsPlaceholder activeTab={activeTab} onSaved={setMessage} /></main>{selectedProject ? <ProjectAccessModal project={selectedProject} visibility={projectVisibility} selectedMembers={selectedMembers} onVisibilityChange={setProjectVisibility} onToggleMember={toggleMember} onClose={() => setSelectedProject(null)} onSave={saveProjectAccess} /> : null}</div>;
}

function AccessBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function SettingsPlaceholder({ activeTab, onSaved }: { activeTab: SettingsTab; onSaved: (message: string) => void }) {
  const [name, setName] = useState("Sarah Anderson");
  const [photoUrl, setPhotoUrl] = useState("");
  const [profileError, setProfileError] = useState("");
  const [notifications, setNotifications] = useState({ ticketReplies: true, projectUpdates: true, weeklySummary: false });

  if (activeTab === "General") return <section className="settings-placeholder settings-profile-panel" aria-labelledby="profile-settings-title"><div className="settings-profile-heading"><span className="access-overview-icon purple"><Users size={16} /></span><div><span className="eyebrow">Profile</span><h2 id="profile-settings-title">Your profile</h2><p>Update how your name and profile photo appear to the team.</p></div></div><form className="profile-settings-form" onSubmit={(event) => { event.preventDefault(); const normalizedName = name.trim(); if (normalizedName.length < 2) { setProfileError("Display name must be at least 2 characters."); return; } setProfileError(""); onSaved("Profile changes saved."); }}><div className="profile-photo-field"><span className="profile-photo-preview">{photoUrl ? <img src={photoUrl} alt="Profile preview" /> : name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><label className="secondary-button profile-upload-button">Choose photo<input type="file" accept="image/png,image/jpeg,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) { setProfileError("Choose a valid image file."); return; } if (file.size > 5 * 1024 * 1024) { setProfileError("Profile photo must be smaller than 5 MB."); return; } setProfileError(""); setPhotoUrl(URL.createObjectURL(file)); }} /></label><small>JPG, PNG, or GIF. Max 5 MB.</small></div><label>Display name<input required minLength={2} value={name} onChange={(event) => { setName(event.target.value); setProfileError(""); }} aria-invalid={Boolean(profileError)} aria-describedby={profileError ? "profile-form-error" : undefined} /></label>{profileError ? <p className="form-error" id="profile-form-error" role="alert">{profileError}</p> : null}<div className="modal-actions"><button className="primary-button" type="submit">Save profile</button></div></form></section>;
  if (activeTab === "Integrations") return <IntegrationSettings onSaved={onSaved} />;
  return <section className="settings-placeholder settings-notification-panel" aria-labelledby="notification-settings-title"><div className="settings-profile-heading"><span className="access-overview-icon purple"><Settings2 size={16} /></span><div><span className="eyebrow">Notifications</span><h2 id="notification-settings-title">Notification preferences</h2><p>Choose the updates you want to receive from your workspace.</p></div></div><div className="notification-options"><NotificationToggle label="Ticket replies" description="When someone responds to a ticket you follow." checked={notifications.ticketReplies} onChange={(checked) => setNotifications({ ...notifications, ticketReplies: checked })} /><NotificationToggle label="Project updates" description="When a project you own changes status or due date." checked={notifications.projectUpdates} onChange={(checked) => setNotifications({ ...notifications, projectUpdates: checked })} /><NotificationToggle label="Weekly summary" description="A Monday overview of your team's activity." checked={notifications.weeklySummary} onChange={(checked) => setNotifications({ ...notifications, weeklySummary: checked })} /></div><div className="modal-actions"><button className="primary-button" type="button" onClick={() => onSaved("Notification preferences saved.")}>Save notifications</button></div></section>;
}

function IntegrationSettings({ onSaved }: { onSaved: (message: string) => void }) {
  const [connections, setConnections] = useState({ sheets: false, docs: false, drive: false });
  const [pickerType, setPickerType] = useState<"Sheet" | "Doc" | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<GoogleDocument | null>(null);
  const [localTasks, setLocalTasks] = useState(importedTasks);
  const [syncState, setSyncState] = useState<"idle" | "running" | "success">("idle");
  const [lastSynced, setLastSynced] = useState("Not synced yet");
  const integrations = [{ key: "sheets", name: "Google Sheets", description: "Import and sync project tasks and status.", color: "green" }, { key: "docs", name: "Google Docs", description: "Keep project notes and documents connected.", color: "blue" }, { key: "drive", name: "Google Drive", description: "Find shared files from one workspace.", color: "orange" }] as const;

  function chooseDocument(type: "Sheet" | "Doc") {
    setPickerType(type);
    setSelectedDocument(null);
  }

  async function runLocalSync() {
    if (syncState === "running") return;
    setSyncState("running");
    await new Promise((resolve) => setTimeout(resolve, 850));
    setLocalTasks((current) => current.map((task, index) => index === 1 ? { ...task, status: "In progress" } : task));
    setLastSynced("Just now");
    setSyncState("success");
    onSaved("Two-way local sync completed.");
  }

  return <section className="settings-placeholder settings-integration-panel" aria-labelledby="integration-settings-title"><div className="settings-profile-heading"><span className="access-overview-icon purple"><Globe2 size={16} /></span><div><span className="eyebrow">Connected tools</span><h2 id="integration-settings-title">Google integrations</h2><p>Connect the tools your team uses every day.</p></div></div><div className="integration-options">{integrations.map((integration) => { const connected = connections[integration.key]; const pickerTypeForIntegration = integration.key === "sheets" ? "Sheet" : integration.key === "docs" ? "Doc" : null; return <article className="integration-row" key={integration.key}><span className={`resource-kind-icon ${integration.color}`}><Globe2 size={16} /></span><span><strong>{integration.name}</strong><small>{integration.description}</small></span><span className={`integration-status ${connected ? "connected" : ""}`}><span />{connected ? "Connected" : "Not connected"}</span>{connected && pickerTypeForIntegration ? <button className="secondary-button integration-pick-button" type="button" onClick={() => chooseDocument(pickerTypeForIntegration)}>Choose document</button> : null}<button className={connected ? "secondary-button" : "primary-button"} type="button" onClick={() => { setConnections({ ...connections, [integration.key]: !connected }); onSaved(`${integration.name} ${connected ? "disconnected" : "connected"}.`); }}>{connected ? "Disconnect" : "Connect"}</button></article>; })}</div>{selectedDocument ? <p className="integration-selection" role="status">{selectedDocument.name} is selected for sync.</p> : null}<section className="google-sync-simulator" aria-labelledby="sync-simulator-title"><div className="google-sync-heading"><div><span className="eyebrow">Local preview</span><h3 id="sync-simulator-title">Two-way sync simulator</h3><p>Preview changes moving between the portal and Google.</p></div><button className="primary-button" type="button" onClick={runLocalSync} disabled={syncState === "running"}>{syncState === "running" ? "Syncing..." : "Run sync"}</button></div><div className="sync-flow"><span>Portal tasks</span><ArrowRightLeft size={16} /><span>Google source</span><span className={`integration-status ${syncState === "success" ? "connected" : ""}`}><span />{syncState === "success" ? "Synced" : syncState === "running" ? "Syncing" : "Ready"}</span></div><small className="sync-last-run">Last sync: {lastSynced}</small></section><section className="google-task-source-panel" aria-labelledby="google-task-title"><div className="google-task-heading"><div><span className="eyebrow">Imported tasks</span><h3 id="google-task-title">Tasks from Google</h3></div><span className="integration-status connected"><span />Synced</span></div><div className="google-task-list">{localTasks.map((task) => <article className="google-task-row" key={task.id}><span className={`task-status-dot ${task.status.toLowerCase().replace(" ", "-")}`} /><span className="google-task-main"><strong>{task.title}</strong><small>Due {task.due}</small></span><span className="google-task-status">{task.status}</span><span className="google-task-source"><strong>{task.source}</strong><small>Synced {task.synced}</small></span></article>)}</div></section>{pickerType ? <GoogleDocumentPicker type={pickerType} selectedDocument={selectedDocument} onSelect={setSelectedDocument} onClose={() => setPickerType(null)} onConfirm={() => { if (!selectedDocument) return; onSaved(`${selectedDocument.name} selected for sync.`); setPickerType(null); }} /> : null}</section>;
}

function GoogleDocumentPicker({ type, selectedDocument, onSelect, onClose, onConfirm }: { type: "Sheet" | "Doc"; selectedDocument: GoogleDocument | null; onSelect: (document: GoogleDocument) => void; onClose: () => void; onConfirm: () => void }) {
  const [query, setQuery] = useState("");
  const documents = googleDocuments.filter((document) => document.type === type && document.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal google-picker-modal" role="dialog" aria-modal="true" aria-labelledby="google-picker-title"><div className="modal-heading"><div><span className="eyebrow">Google {type === "Sheet" ? "Sheets" : "Docs"}</span><h2 id="google-picker-title">Choose a document</h2><p>Select the file to connect for workspace sync.</p></div><button className="modal-close" type="button" aria-label="Close document picker" onClick={onClose}><X size={17} /></button></div><label className="google-picker-search"><Search size={14} /><span className="sr-only">Search Google documents</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${type === "Sheet" ? "Sheets" : "Docs"}...`} /></label><div className="google-picker-list">{documents.map((document) => <button className={`google-picker-item ${selectedDocument?.id === document.id ? "selected" : ""}`} type="button" key={document.id} onClick={() => onSelect(document)}><span className={`resource-kind-icon ${type === "Sheet" ? "green" : "blue"}`}><Globe2 size={15} /></span><span><strong>{document.name}</strong><small>{document.updated}</small></span>{selectedDocument?.id === document.id ? <Check size={15} /> : null}</button>)}{documents.length === 0 ? <p className="empty-search">No Google documents match your search.</p> : null}</div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" disabled={!selectedDocument} onClick={onConfirm}>Use document</button></div></section></div>;
}

function NotificationToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="notification-toggle"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><span /></span></label>;
}

function ProjectAccessModal({ project, visibility, selectedMembers, onVisibilityChange, onToggleMember, onClose, onSave }: { project: Resource; visibility: Visibility; selectedMembers: string[]; onVisibilityChange: (visibility: Visibility) => void; onToggleMember: (memberId: string) => void; onClose: () => void; onSave: () => void }) {
  const resourceLabel = project.kind === "Project" ? "project" : "knowledge document";
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal project-access-modal" role="dialog" aria-modal="true" aria-labelledby="project-access-title"><div className="modal-heading"><div><span className="eyebrow">{project.kind} sharing</span><h2 id="project-access-title">Manage {resourceLabel} access</h2><p>Choose who can discover and view {project.name}.</p></div><button className="modal-close" type="button" aria-label="Close access form" onClick={onClose}><X size={17} /></button></div><label className="role-select-label">Visibility<select value={visibility} onChange={(event) => onVisibilityChange(event.target.value as Visibility)}><option>Internal</option><option>Public</option></select></label><p className="role-help"><strong>{visibility}</strong> {visibility === "Public" ? `allows anyone with the link to view this ${resourceLabel}.` : `keeps this ${resourceLabel} available only to selected workspace members.`}</p><fieldset className="access-member-fieldset"><legend>People with access</legend>{accessOptions.map((member) => <label className="access-member-option" key={member.id}><input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={() => onToggleMember(member.id)} /><span className={`avatar avatar-tiny ${member.color}`}>{member.initials}</span><span><strong>{member.name}</strong><small>{member.id === "nadia" ? "Editor" : "Member"}</small></span>{selectedMembers.includes(member.id) ? <Check size={14} /> : null}</label>)}</fieldset><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" onClick={onSave}>Save access</button></div></section></div>;
}
