"use client";

import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  FileText,
  Grid2X2,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PortalNavigation, { PortalSettingsLink } from "../components/PortalNavigation";
import PortalUserProfile, { PortalUserAvatar, usePortalUser } from "../components/PortalUserProfile";

type ProjectStatus = "Preparation" | "Development" | "SIT" | "UAT" | "Go-live" | "Support" | "Implementation";

type Project = {
  id: string;
  name: string;
  description: string;
  client: string | null;
  status: ProjectStatus;
  statusClass: string;
  visibility: "Internal" | "Public";
  owner: string;
  initials: string;
  tasks: number;
  completedTasks: number;
  due: string | null;
  color: string;
};

type ApiProject = {
  id: string;
  name: string;
  description: string;
  client: string | null;
  status: "preparation" | "development" | "sit" | "uat" | "go-live" | "support" | "implementation";
  visibility: "internal" | "public";
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
};

function statusClassFor(status: Project["status"]) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

const projects: Project[] = [
  { id: "website-redesign", name: "Website Redesign", description: "A clearer, calmer home for the product and the people using it.", client: "Nexa Labs", status: "Development", statusClass: "development", visibility: "Internal", owner: "Nadia Putri", initials: "NP", tasks: 18, completedTasks: 13, due: "2026-09-12", color: "purple" },
  { id: "mobile-app", name: "Mobile App v2", description: "Reworking the core mobile workflow around faster everyday decisions.", client: "IFabula", status: "SIT", statusClass: "sit", visibility: "Internal", owner: "Raka Aditya", initials: "RA", tasks: 24, completedTasks: 21, due: "2026-09-05", color: "green" },
  { id: "q3-campaign", name: "Q3 Campaign", description: "A focused campaign to help more teams discover the new workspace.", client: null, status: "UAT", statusClass: "uat", visibility: "Public", owner: "Dimas Pratama", initials: "DP", tasks: 13, completedTasks: 6, due: "2026-09-27", color: "orange" },
  { id: "team-ops", name: "Team Operations", description: "Small systems that make planning, handoffs, and collaboration easier.", client: "Leonore Kingdom", status: "Implementation", statusClass: "implementation", visibility: "Internal", owner: "Sarah Anderson", initials: "SA", tasks: 16, completedTasks: 10, due: "2026-09-19", color: "blue" },
  { id: "research-library", name: "Research Library", description: "Organizing the insights that help us make better product decisions.", client: "Northstar", status: "Go-live", statusClass: "go-live", visibility: "Public", owner: "Sinta Maheshwari", initials: "SM", tasks: 11, completedTasks: 11, due: null, color: "purple" },
  { id: "onboarding-refresh", name: "Onboarding refresh", description: "A welcoming first week for every new member joining the squad.", client: "Leonore Kingdom", status: "Preparation", statusClass: "preparation", visibility: "Internal", owner: "Sarah Anderson", initials: "SA", tasks: 9, completedTasks: 3, due: "2026-10-02", color: "pink" },
];

const staticProjectById = new Map(projects.map((project) => [project.id, project]));
const projectColors = ["purple", "green", "orange", "blue", "pink"];
const displayStatusMap: Record<ApiProject["status"], ProjectStatus> = {
  preparation: "Preparation",
  development: "Development",
  sit: "SIT",
  uat: "UAT",
  "go-live": "Go-live",
  support: "Support",
  implementation: "Implementation",
};

function displayStatus(status: ApiProject["status"]): ProjectStatus {
  return displayStatusMap[status];
}

function displayVisibility(visibility: ApiProject["visibility"]): Project["visibility"] {
  return visibility === "public" ? "Public" : "Internal";
}

function formatDueDate(due: string | null) {
  if (!due) return null;
  const date = new Date(`${due}T00:00:00`);
  return Number.isNaN(date.getTime()) ? due : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function responseError(response: Response) {
  try { const body = await response.json() as { error?: string }; return body.error ?? `Request failed (${response.status})`; } catch { return `Request failed (${response.status})`; }
}

function mapApiProject(project: ApiProject, index: number, currentUser: { id: string; name: string }): Project {
  const staticProject = staticProjectById.get(project.id);
  const owner = staticProject?.owner ?? (project.ownerId === currentUser.id ? currentUser.name : project.ownerId);
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    client: project.client,
    status: displayStatus(project.status),
    statusClass: statusClassFor(displayStatus(project.status)),
    visibility: displayVisibility(project.visibility),
    owner,
    initials: owner.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    tasks: staticProject?.tasks ?? 0,
    completedTasks: staticProject?.completedTasks ?? 0,
    due: project.dueDate,
    color: staticProject?.color ?? projectColors[index % projectColors.length],
  };
}

async function fetchProjects(requestUserId: string, signal?: AbortSignal) {
  const response = await fetch("/api/projects", { signal, cache: "no-store", headers: { Accept: "application/json", "x-user-id": requestUserId } });
  if (!response.ok) throw new Error(await responseError(response));
  const body = await response.json() as { data?: ApiProject[] };
  return body.data ?? [];
}

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Vida story", icon: FileText },
  { label: "Projects", icon: BriefcaseBusiness },
  { label: "Tasks", icon: ListTodo },
  { label: "Knowledge base", icon: BookOpen },
  { label: "Tickets", icon: Ticket, count: "4" },
  { label: "Team members", icon: Users },
];

type ProjectFormState = Pick<Project, "name" | "description" | "client" | "status" | "visibility" | "owner" | "due">;

const emptyProjectForm: ProjectFormState = {
  name: "",
  description: "",
  client: "",
  status: "Preparation",
  visibility: "Internal",
  owner: "Sarah Anderson",
  due: null,
};

export default function ProjectsPage() {
  const [projectList, setProjectList] = useState(projects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All projects");
  const [projectForm, setProjectForm] = useState<ProjectFormState>(emptyProjectForm);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const currentUser = usePortalUser();
  const isMockAuth = process.env.NEXT_PUBLIC_AUTH_MOCK !== "false";
  const requestUserId = isMockAuth ? "demo-user" : currentUser.id;

  useEffect(() => {
    if (!isMockAuth && currentUser.id === "workspace-member") return;
    const controller = new AbortController();
    setIsLoading(true);
    setRequestError("");
    void fetchProjects(requestUserId, controller.signal)
      .then((data) => setProjectList(data.map((project, index) => mapApiProject(project, index, currentUser))))
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setRequestError(error instanceof Error ? error.message : "Unable to load projects");
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [currentUser.id, currentUser.name, isMockAuth, requestUserId]);

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projectList.filter((project) => {
      const matchesQuery = !normalizedQuery || `${project.name} ${project.description} ${project.client ?? ""} ${project.owner}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "All projects" || project.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [projectList, query, status]);

  function openCreateProject() {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    setRequestError("");
    setIsProjectFormOpen(true);
  }

  function openEditProject(project: Project) {
    setEditingProjectId(project.id);
    setProjectForm({ name: project.name, description: project.description, client: project.client, status: project.status, visibility: project.visibility, owner: project.owner, due: project.due });
    setIsProjectFormOpen(true);
  }

  function closeProjectForm() {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    setIsProjectFormOpen(false);
  }

  async function handleProjectSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = projectForm.name.trim();
    const normalizedDescription = projectForm.description.trim();
    if (!normalizedName || !normalizedDescription) return;

    setIsSubmitting(true);
    setRequestError("");
    setSaveMessage("");
    try {
      const payload = {
        name: normalizedName,
        description: normalizedDescription,
        client: projectForm.client?.trim() || null,
        status: projectForm.status.toLowerCase() as ApiProject["status"],
        visibility: projectForm.visibility.toLowerCase() as ApiProject["visibility"],
        dueDate: projectForm.due || null,
      };
      const url = editingProjectId ? `/api/projects/${editingProjectId}` : "/api/projects";
      const response = await fetch(url, { method: editingProjectId ? "PATCH" : "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "x-user-id": requestUserId }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(await responseError(response));
      await response.json() as ApiProject;
      const refreshedProjects = await fetchProjects(requestUserId);
      setProjectList(refreshedProjects.map((project, index) => mapApiProject(project, index, currentUser)));
      setSaveMessage(editingProjectId ? "Project changes saved." : "Project created and saved.");
      closeProjectForm();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to save project");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteProject() {
    if (!projectToDelete) return;
    setIsSubmitting(true);
    setRequestError("");
    setSaveMessage("");
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, { method: "DELETE", headers: { Accept: "application/json", "x-user-id": requestUserId } });
      if (!response.ok) throw new Error(await responseError(response));
      setProjectList((current) => current.filter((project) => project.id !== projectToDelete.id));
      setProjectToDelete(null);
      setSaveMessage("Project deleted and removed from the workspace.");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to delete project");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="dashboard-shell">
     <aside className="sidebar" aria-label="Main navigation"><ProjectBrand /><PortalNavigation /><div className="sidebar-bottom"><PortalSettingsLink /><PortalUserProfile roleLabel="Product lead" /></div></aside>
     <main className="main-content projects-page"><div className="mobile-header"><ProjectBrand /><PortalUserAvatar className="avatar-header" /></div><header className="main-header"><div><p className="breadcrumb"><strong>Workspace</strong> <span>/</span> Projects</p><h1 className="page-title">Projects</h1><p className="page-subtitle">A shared view of everything the team is moving forward.</p></div><button className="primary-button project-create-button" type="button" onClick={openCreateProject}><Plus size={15} strokeWidth={2} /> New project</button></header>
      <section className="project-summary-grid" aria-label="Project summary"><div><span className="project-summary-label">All projects</span><strong>{projectList.length.toString().padStart(2, "0")}</strong><small>{isLoading ? "Loading workspace" : "Saved in the workspace"}</small></div><div><span className="project-summary-label">In progress</span><strong>{projectList.filter((project) => !["Preparation", "Go-live", "Support"].includes(project.status)).length.toString().padStart(2, "0")}</strong><small>Across active workstreams</small></div><div><span className="project-summary-label">Completed</span><strong>{projectList.filter((project) => ["Go-live", "Support"].includes(project.status)).length.toString().padStart(2, "0")}</strong><small>Lifecycle complete or supported</small></div><div><span className="project-summary-label">Team capacity</span><strong>78%</strong><small>Healthy this week</small></div></section>
      {requestError && <p className="field-error" role="alert">{requestError}</p>}
      {saveMessage && <p className="sync-notice" role="status">{saveMessage}</p>}
      <div className="project-toolbar"><div className="search-wrap project-search"><Search size={16} strokeWidth={1.8} aria-hidden="true" /><input className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." aria-label="Search projects" /></div><div className="project-filter-actions"><select className="select-control" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter projects by status"><option>All projects</option><option>Preparation</option><option>Development</option><option>SIT</option><option>UAT</option><option>Go-live</option><option>Support</option><option>Implementation</option></select><button className="secondary-button" type="button"><CalendarDays size={14} /> Sort: Recent <ChevronDown size={13} /></button></div></div>
      {isLoading ? <p className="empty-search" role="status">Loading projects...</p> : <section className="project-card-grid" aria-label="Project list">{visibleProjects.map((project) => <ProjectCard key={project.id} project={project} onEdit={() => openEditProject(project)} onDelete={() => setProjectToDelete(project)} />)}{visibleProjects.length === 0 && <p className="empty-search">No projects match your filters.</p>}</section>}
      {isProjectFormOpen ? <ProjectFormModal form={projectForm} editing={editingProjectId !== null} submitting={isSubmitting} onChange={setProjectForm} onClose={closeProjectForm} onSubmit={handleProjectSubmit} /> : null}
      {projectToDelete ? <DeleteProjectModal project={projectToDelete} busy={isSubmitting} onCancel={() => setProjectToDelete(null)} onConfirm={confirmDeleteProject} /> : null}
    </main>
  </div>;
}

function ProjectBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function ProjectNavItem({ item, active = false }: { item: (typeof navigation)[number]; active?: boolean }) {
  const Icon = item.icon;
  return <li><button className={`nav-item ${active ? "active" : ""}`} type="button"><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</button></li>;
}

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  const due = formatDueDate(project.due);
  return <article className="project-card"><div className={`project-accent ${project.color}`} /><div className="project-card-top"><span className={`project-status ${project.statusClass}`}>{project.status}</span><div className="project-card-actions"><button className="task-menu" type="button" aria-label={`Edit ${project.name}`} onClick={onEdit}><MoreHorizontal size={16} /></button><button className="task-menu danger-menu" type="button" aria-label={`Delete ${project.name}`} onClick={onDelete}><Trash2 size={14} /></button></div></div><Link className="project-card-content" href={`/projects/${project.id}`}><h2>{project.name}</h2><p>{project.description}</p><div className="project-card-meta"><span><span className={`avatar avatar-tiny ${project.color}`}>{project.initials}</span>{project.owner}</span><span className="project-card-client">{project.client ?? "No client"}</span></div><div className="project-card-footer"><span>{project.completedTasks}/{project.tasks} tasks</span><span>{due ? `Due ${due}` : "No due date"}</span></div></Link></article>;
}

function ProjectFormModal({ form, editing, submitting, onChange, onClose, onSubmit }: { form: ProjectFormState; editing: boolean; submitting: boolean; onChange: (form: ProjectFormState) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}><section className="project-form-modal" role="dialog" aria-modal="true" aria-labelledby="project-form-title"><div className="modal-heading"><div><span className="eyebrow">Workspace</span><h2 id="project-form-title">{editing ? "Edit project" : "Create a new project"}</h2><p>{editing ? "Keep the project details up to date for the team." : "Set up a shared space for a new workstream."}</p></div><button className="modal-close" type="button" aria-label="Close project form" onClick={onClose} disabled={submitting}><X size={17} /></button></div><form onSubmit={onSubmit}><label>Project name<input autoFocus required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="e.g. Website Redesign" /></label><label>Description<textarea required value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="What is this project about?" rows={3} /></label><div className="form-field-grid"><label>Status<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as Project["status"] })}><option>Preparation</option><option>Development</option><option>SIT</option><option>UAT</option><option>Go-live</option><option>Support</option><option>Implementation</option></select></label><label>Visibility<select value={form.visibility} onChange={(event) => onChange({ ...form, visibility: event.target.value as Project["visibility"] })}><option>Internal</option><option>Public</option></select></label></div><div className="form-field-grid"><label>Client (optional)<input value={form.client ?? ""} onChange={(event) => onChange({ ...form, client: event.target.value })} placeholder="e.g. Nexa Labs" /></label><label>Owner<input required value={form.owner} onChange={(event) => onChange({ ...form, owner: event.target.value })} /></label></div><label>Due date (optional)<input type="date" value={form.due ?? ""} onChange={(event) => onChange({ ...form, due: event.target.value || null })} /> </label><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Saving..." : editing ? "Save changes" : "Create project"}</button></div></form></section></div>;
}

function DeleteProjectModal({ project, busy, onCancel, onConfirm }: { project: Project; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}><section className="delete-project-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title" aria-describedby="delete-project-description"><div className="delete-project-icon"><Trash2 size={18} /></div><div><h2 id="delete-project-title">Delete {project.name}?</h2><p id="delete-project-description">This will remove the project from your workspace. Tasks and activity attached to it will no longer be visible.</p></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>Keep project</button><button className="danger-button" type="button" onClick={onConfirm} disabled={busy}>{busy ? "Deleting..." : "Delete project"}</button></div></section></div>;
}
