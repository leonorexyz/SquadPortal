"use client";

import { BookOpen, BriefcaseBusiness, FileText, Globe2, Grid2X2, LockKeyhole, LayoutDashboard, ListTodo, Search, ShieldCheck, Settings2, Tag, Ticket, Trash2, Upload, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import PortalNavigation, { PortalSettingsLink, portalHref } from "../components/PortalNavigation";
import PortalUserProfile, { PortalUserAvatar } from "../components/PortalUserProfile";

type KnowledgeDocument = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  type: "Guide" | "Playbook" | "Reference" | "Decision log";
  updated: string;
  author: string;
  initials: string;
  color: string;
  readTime: string;
  visibility: "internal" | "public";
  fileName: string | null;
};

type ApiKnowledgeArticle = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  visibility: "internal" | "public";
  authorId: string;
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
};

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Vida story", icon: FileText },
  { label: "Projects", icon: BriefcaseBusiness },
  { label: "Tasks", icon: ListTodo },
  { label: "Knowledge base", icon: BookOpen },
  { label: "Tickets", icon: Ticket, count: "4" },
  { label: "Team members", icon: Users },
];

type DocumentFormState = { title: string; excerpt: string; category: string; type: "Guide" | "Playbook" | "Reference" | "Decision log"; fileName: string; file: File | null };
type AccessLevel = "Private" | "Team" | "Public";

const emptyDocumentForm: DocumentFormState = { title: "", excerpt: "", category: "Design", type: "Guide", fileName: "", file: null };
const authorNames: Record<string, string> = { "demo-user": "Sarah Anderson" };
const colors = ["purple", "green", "orange", "blue", "pink"];

function mapArticle(article: ApiKnowledgeArticle, index: number): KnowledgeDocument {
  const author = authorNames[article.authorId] ?? article.authorId;
  const extension = article.fileName?.split(".").pop()?.toLowerCase();
  const type = extension === "pdf" || extension === "doc" || extension === "docx" ? "Reference" : extension === "md" ? "Guide" : "Reference";
  return { id: article.id, title: article.title, excerpt: article.content.slice(0, 150) || "No summary yet.", category: article.category ?? "Uncategorized", type, updated: new Date(article.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), author, initials: author.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), color: colors[index % colors.length], readTime: article.fileName ? "Attached file" : "Document", visibility: article.visibility, fileName: article.fileName };
}

function accessLevelFor(document: KnowledgeDocument): AccessLevel { return document.visibility === "public" ? "Public" : "Team"; }

async function responseError(response: Response) {
  try { const body = await response.json() as { error?: string }; return body.error ?? `Request failed (${response.status})`; } catch { return `Request failed (${response.status})`; }
}

export default function KnowledgePage() {
  const [documentList, setDocumentList] = useState<KnowledgeDocument[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(emptyDocumentForm);
  const [isDocumentFormOpen, setIsDocumentFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<KnowledgeDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocument | null>(null);
  const [documentAccess, setDocumentAccess] = useState<Record<string, AccessLevel>>({});
  const [selectedAccessDocument, setSelectedAccessDocument] = useState<KnowledgeDocument | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("Team");
  const [accessMembers, setAccessMembers] = useState(["Sarah Anderson", "Nadia Putri", "Raka Aditya"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadDocuments = async () => {
      setIsLoading(true); setRequestError("");
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (category !== "All categories") params.set("category", category);
      try {
        const response = await fetch(`/api/knowledge?${params.toString()}`, { signal: controller.signal, headers: { "x-user-id": "demo-user" } });
        if (!response.ok) throw new Error(await responseError(response));
        const body = await response.json() as { data: ApiKnowledgeArticle[] };
        const mapped = body.data.map(mapArticle);
        setDocumentList(mapped);
        setDocumentAccess((current) => Object.fromEntries(mapped.map((document) => [document.id, current[document.id] ?? accessLevelFor(document)])));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setRequestError(error instanceof Error ? error.message : "Unable to load knowledge documents");
      } finally { if (!controller.signal.aborted) setIsLoading(false); }
    };
    void loadDocuments();
    return () => controller.abort();
  }, [category, query]);

  function openDocumentForm() { setEditingDocument(null); setDocumentForm(emptyDocumentForm); setRequestError(""); setIsDocumentFormOpen(true); }
  function closeDocumentForm() { if (isSubmitting) return; setEditingDocument(null); setDocumentForm(emptyDocumentForm); setIsDocumentFormOpen(false); }

  async function handleDocumentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentForm.title.trim() || !documentForm.excerpt.trim() || (!editingDocument && !documentForm.file)) return;
    setIsSubmitting(true); setRequestError("");
    try {
      const url = editingDocument ? `/api/knowledge/${editingDocument.id}` : "/api/knowledge";
      const headers: Record<string, string> = { "x-user-id": "demo-user" };
      let body: BodyInit;
      if (documentForm.file) {
        const form = new FormData();
        form.set("title", documentForm.title.trim()); form.set("content", documentForm.excerpt.trim()); form.set("category", documentForm.category); form.set("visibility", "internal"); form.set("file", documentForm.file); body = form;
      } else {
        headers["content-type"] = "application/json";
        body = JSON.stringify({ title: documentForm.title.trim(), content: documentForm.excerpt.trim(), category: documentForm.category });
      }
      const response = await fetch(url, { method: editingDocument ? "PATCH" : "POST", headers, body });
      if (!response.ok) throw new Error(await responseError(response));
      setIsDocumentFormOpen(false); setEditingDocument(null); setDocumentForm(emptyDocumentForm);
      const refreshParams = category === "All categories" ? "" : `?category=${encodeURIComponent(category)}`;
      const refresh = await fetch(`/api/knowledge${refreshParams}`, { headers: { "x-user-id": "demo-user" } });
      if (refresh.ok) { const refreshBody = await refresh.json() as { data: ApiKnowledgeArticle[] }; setDocumentList(refreshBody.data.map(mapArticle)); }
    } catch (error) { setRequestError(error instanceof Error ? error.message : "Unable to save knowledge document"); } finally { setIsSubmitting(false); }
  }

  function openEditDocument(document: KnowledgeDocument) { setEditingDocument(document); setDocumentForm({ title: document.title, excerpt: document.excerpt, category: document.category === "Uncategorized" ? "Design" : document.category, type: document.type, fileName: document.fileName ?? "", file: null }); setRequestError(""); setIsDocumentFormOpen(true); }

  async function confirmDeleteDocument() {
    if (!documentToDelete) return;
    setIsSubmitting(true); setRequestError("");
    try { const response = await fetch(`/api/knowledge/${documentToDelete.id}`, { method: "DELETE", headers: { "x-user-id": "demo-user" } }); if (!response.ok) throw new Error(await responseError(response)); setDocumentList((current) => current.filter((document) => document.id !== documentToDelete.id)); setDocumentToDelete(null); } catch (error) { setRequestError(error instanceof Error ? error.message : "Unable to delete knowledge document"); } finally { setIsSubmitting(false); }
  }

  function openAccessPanel(document: KnowledgeDocument) { setSelectedAccessDocument(document); setAccessLevel(documentAccess[document.id] ?? accessLevelFor(document)); }
  function saveDocumentAccess() { if (!selectedAccessDocument) return; setDocumentAccess((current) => ({ ...current, [selectedAccessDocument.id]: accessLevel })); setSelectedAccessDocument(null); }
  function toggleAccessMember(member: string) { setAccessMembers((current) => current.includes(member) ? current.filter((item) => item !== member) : [...current, member]); }

  return <div className="dashboard-shell"><aside className="sidebar" aria-label="Main navigation"><KnowledgeBrand /> <PortalNavigation /><div className="sidebar-bottom"><PortalSettingsLink /><PortalUserProfile roleLabel="Product lead" /></div></aside><main className="main-content knowledge-page"><div className="mobile-header"><KnowledgeBrand /><PortalUserAvatar className="avatar-header" /></div><header className="main-header"><div><p className="breadcrumb"><strong>Workspace</strong> <span>/</span> Knowledge base</p><h1 className="page-title">Knowledge base</h1><p className="page-subtitle">The team context, decisions, and guides you can come back to.</p></div><button className="primary-button" type="button" onClick={openDocumentForm}>+ New document</button></header><section className="knowledge-summary" aria-label="Knowledge base summary"><div><span>All documents</span><strong>{documentList.length}</strong><small>Loaded from the workspace</small></div><div><span>Updated this week</span><strong>{documentList.length}</strong><small>Keep the context fresh</small></div><div><span>Most represented</span><strong>{documentList[0]?.category ?? "—"}</strong><small>From current results</small></div></section><div className="knowledge-toolbar"><div className="search-wrap knowledge-search"><Search size={16} strokeWidth={1.8} aria-hidden="true" /><input className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the knowledge base..." aria-label="Search knowledge base" /></div><select className="select-control" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter documents by category"><option>All categories</option><option>Design</option><option>Engineering</option><option>Research</option><option>Team</option><option>Product</option><option>Operations</option></select></div>{requestError && <p className="field-error" role="alert">{requestError}</p>}{isLoading ? <p className="empty-search" role="status">Loading documents...</p> : <section className="knowledge-card-grid" aria-label="Knowledge documents">{documentList.map((document) => <KnowledgeCard key={document.id} document={document} accessLevel={documentAccess[document.id] ?? accessLevelFor(document)} onAccess={() => openAccessPanel(document)} onEdit={() => openEditDocument(document)} onDelete={() => setDocumentToDelete(document)} />)}{documentList.length === 0 && <p className="empty-search">No documents match your search.</p>}</section>}{isDocumentFormOpen && <DocumentFormModal form={documentForm} editing={editingDocument !== null} submitting={isSubmitting} onChange={setDocumentForm} onClose={closeDocumentForm} onSubmit={handleDocumentSubmit} />}{selectedAccessDocument && <AccessPanel document={selectedAccessDocument} level={accessLevel} members={accessMembers} onLevelChange={setAccessLevel} onToggleMember={toggleAccessMember} onClose={() => setSelectedAccessDocument(null)} onSave={saveDocumentAccess} />}{documentToDelete && <DeleteDocumentModal document={documentToDelete} busy={isSubmitting} onCancel={() => setDocumentToDelete(null)} onConfirm={confirmDeleteDocument} />}</main></div>;
}

function KnowledgeBrand() { return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>; }
function KnowledgeNavItem({ item, active = false }: { item: (typeof navigation)[number]; active?: boolean }) { const Icon = item.icon; return <li><Link className={`nav-item ${active ? "active" : ""}`} href={portalHref(item.label)}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</Link></li>; }
function KnowledgeCard({ document, accessLevel, onAccess, onEdit, onDelete }: { document: KnowledgeDocument; accessLevel: AccessLevel; onAccess: () => void; onEdit: () => void; onDelete: () => void }) { return <article className="knowledge-card"><div className={`knowledge-card-accent ${document.color}`} /><div className="knowledge-card-heading"><span className={`knowledge-type ${document.color}`}><BookOpen size={12} /> {document.type}</span><div className="knowledge-card-actions"><button className="task-menu" type="button" aria-label={`Edit ${document.title}`} onClick={onEdit}>•••</button><button className="task-menu danger-menu" type="button" aria-label={`Delete ${document.title}`} onClick={onDelete}><Trash2 size={13} /></button></div></div><h2><Link href={`/knowledge/${document.id}`}>{document.title}</Link></h2><p>{document.excerpt}</p><div className="knowledge-card-meta"><span className="knowledge-category"><Tag size={11} /> {document.category}</span><span>{document.readTime}</span></div><div className="knowledge-card-footer"><span><span className={`avatar avatar-tiny ${document.color}`}>{document.initials}</span>{document.author}</span><button className="knowledge-access-button" type="button" onClick={onAccess}>{accessLevel === "Public" ? <Globe2 size={11} /> : accessLevel === "Private" ? <LockKeyhole size={11} /> : <ShieldCheck size={11} />}{accessLevel}</button></div></article>; }
function DocumentFormModal({ form, editing, submitting, onChange, onClose, onSubmit }: { form: DocumentFormState; editing: boolean; submitting: boolean; onChange: (form: DocumentFormState) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal knowledge-form-modal" role="dialog" aria-modal="true" aria-labelledby="document-form-title"><div className="modal-heading"><div><span className="eyebrow">Knowledge base</span><h2 id="document-form-title">{editing ? "Edit document" : "Add a document"}</h2><p>{editing ? "Keep this team context accurate and easy to find." : "Give your team a clear path back to useful context."}</p></div><button className="modal-close" type="button" aria-label="Close document form" onClick={onClose}><X size={17} /></button></div><form onSubmit={onSubmit}><label>Document title<input autoFocus required value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="e.g. Incident response guide" /></label><label>Summary<textarea required value={form.excerpt} onChange={(event) => onChange({ ...form, excerpt: event.target.value })} placeholder="What will teammates find here?" rows={3} /></label><div className="form-field-grid"><label>Category<select value={form.category} onChange={(event) => onChange({ ...form, category: event.target.value })}><option>Design</option><option>Engineering</option><option>Research</option><option>Team</option><option>Product</option><option>Operations</option></select></label><label>Document type<select value={form.type} onChange={(event) => onChange({ ...form, type: event.target.value as DocumentFormState["type"] })}><option>Guide</option><option>Playbook</option><option>Reference</option><option>Decision log</option></select></label></div><label className="file-upload-label">{editing ? "Replace file (optional)" : "Upload file"}<span className="file-dropzone"><Upload size={17} /><span><strong>{form.fileName || "Choose a PDF, DOCX, or Markdown file"}</strong><small>Maximum file size 10 MB</small></span><input required={!editing} type="file" accept=".pdf,.doc,.docx,.md" onChange={(event) => { const file = event.target.files?.[0] ?? null; onChange({ ...form, file, fileName: file?.name ?? "" }); }} /></span></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Saving..." : editing ? "Save changes" : "Add document"}</button></div></form></section></div>; }
function AccessPanel({ document, level, members, onLevelChange, onToggleMember, onClose, onSave }: { document: KnowledgeDocument; level: AccessLevel; members: string[]; onLevelChange: (level: AccessLevel) => void; onToggleMember: (member: string) => void; onClose: () => void; onSave: () => void }) { const memberOptions = ["Sarah Anderson", "Nadia Putri", "Raka Aditya", "Sinta Maheswari"]; return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal access-form-modal" role="dialog" aria-modal="true" aria-labelledby="access-panel-title"><div className="modal-heading"><div><span className="eyebrow">Sharing</span><h2 id="access-panel-title">Who can view this document?</h2><p>{document.title}</p></div><button className="modal-close" type="button" aria-label="Close access panel" onClick={onClose}><X size={17} /></button></div><div className="access-level-options">{(["Private", "Team", "Public"] as AccessLevel[]).map((option) => <button className={`access-level-option ${level === option ? "selected" : ""}`} key={option} type="button" onClick={() => onLevelChange(option)}>{option === "Public" ? <Globe2 size={17} /> : option === "Private" ? <LockKeyhole size={17} /> : <ShieldCheck size={17} />}<span><strong>{option}</strong><small>{option === "Private" ? "Only you can view it" : option === "Team" ? "Everyone in the squad can view it" : "Anyone with the link can view it"}</small></span></button>)}</div><div className="access-member-heading"><span>Team members</span><small>{level === "Team" ? `${members.length} selected` : "Optional for this access level"}</small></div><div className="access-member-list">{memberOptions.map((member) => <label key={member}><input type="checkbox" checked={members.includes(member)} onChange={() => onToggleMember(member)} /><span>{member}</span></label>)}</div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" onClick={onSave}>Save access</button></div></section></div>; }
function DeleteDocumentModal({ document, busy, onCancel, onConfirm }: { document: KnowledgeDocument; busy: boolean; onCancel: () => void; onConfirm: () => void }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="delete-project-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-document-title" aria-describedby="delete-document-description"><div className="delete-project-icon"><Trash2 size={18} /></div><div><h2 id="delete-document-title">Delete this document?</h2><p id="delete-document-description">“{document.title}” will be removed from the knowledge base.</p></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>Keep document</button><button className="danger-button" type="button" onClick={onConfirm} disabled={busy}>{busy ? "Deleting..." : "Delete document"}</button></div></section></div>; }
