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
import { useMemo, useState } from "react";
import PortalNavigation, { PortalSettingsLink } from "../components/PortalNavigation";
import PortalUserProfile, { PortalUserAvatar } from "../components/PortalUserProfile";

type Project = {
  id: string;
  name: string;
  description: string;
  client: string | null;
  status: "Preparation" | "Development" | "SIT" | "UAT" | "Go-live" | "Support" | "Implementation";
  statusClass: string;
  visibility: "Internal" | "Public";
  owner: string;
  initials: string;
  tasks: number;
  completedTasks: number;
  due: string | null;
  color: string;
};

function statusClassFor(status: Project["status"]) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

const projects: Project[] = [
  { id: "website-redesign", name: "Website Redesign", description: "A clearer, calmer home for the product and the people using it.", client: "Nexa Labs", status: "Development", statusClass: "development", visibility: "Internal", owner: "Nadia Putri", initials: "NP", tasks: 18, completedTasks: 13, due: "Sep 12", color: "purple" },
  { id: "mobile-app", name: "Mobile App v2", description: "Reworking the core mobile workflow around faster everyday decisions.", client: "IFabula", status: "SIT", statusClass: "sit", visibility: "Internal", owner: "Raka Aditya", initials: "RA", tasks: 24, completedTasks: 21, due: "Sep 05", color: "green" },
  { id: "q3-campaign", name: "Q3 Campaign", description: "A focused campaign to help more teams discover the new workspace.", client: null, status: "UAT", statusClass: "uat", visibility: "Public", owner: "Dimas Pratama", initials: "DP", tasks: 13, completedTasks: 6, due: "Sep 27", color: "orange" },
  { id: "team-ops", name: "Team Operations", description: "Small systems that make planning, handoffs, and collaboration easier.", client: "Leonore Kingdom", status: "Implementation", statusClass: "implementation", visibility: "Internal", owner: "Sarah Anderson", initials: "SA", tasks: 16, completedTasks: 10, due: "Sep 19", color: "blue" },
  { id: "research-library", name: "Research Library", description: "Organizing the insights that help us make better product decisions.", client: "Northstar", status: "Go-live", statusClass: "go-live", visibility: "Public", owner: "Sinta Maheswari", initials: "SM", tasks: 11, completedTasks: 11, due: null, color: "purple" },
  { id: "onboarding-refresh", name: "Onboarding refresh", description: "A welcoming first week for every new member joining the squad.", client: "Leonore Kingdom", status: "Preparation", statusClass: "preparation", visibility: "Internal", owner: "Sarah Anderson", initials: "SA", tasks: 9, completedTasks: 3, due: "Oct 02", color: "pink" },
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

  function handleProjectSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = projectForm.name.trim();
    const normalizedDescription = projectForm.description.trim();
    if (!normalizedName || !normalizedDescription) return;

    if (editingProjectId) {
      setProjectList((current) => current.map((project) => project.id === editingProjectId ? { ...project, ...projectForm, statusClass: statusClassFor(projectForm.status) } : project));
    } else {
      const newProject: Project = { id: `${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, ...projectForm, name: normalizedName, description: normalizedDescription, client: projectForm.client?.trim() || null, initials: projectForm.owner.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), tasks: 0, completedTasks: 0, color: "purple", statusClass: statusClassFor(projectForm.status) };
      setProjectList((current) => [newProject, ...current]);
    }
    closeProjectForm();
  }

  function confirmDeleteProject() {
    if (!projectToDelete) return;
    setProjectList((current) => current.filter((project) => project.id !== projectToDelete.id));
    setProjectToDelete(null);
  }

  return <div className="dashboard-shell">
     <aside className="sidebar" aria-label="Main navigation"><ProjectBrand /><PortalNavigation /><div className="sidebar-bottom"><PortalSettingsLink /><PortalUserProfile roleLabel="Product lead" /></div></aside>
     <main className="main-content projects-page"><div className="mobile-header"><ProjectBrand /><PortalUserAvatar className="avatar-header" /></div><header className="main-header"><div><p className="breadcrumb"><strong>Workspace</strong> <span>/</span> Projects</p><h1 className="page-title">Projects</h1><p className="page-subtitle">A shared view of everything the team is moving forward.</p></div><button className="primary-button project-create-button" type="button" onClick={openCreateProject}><Plus size={15} strokeWidth={2} /> New project</button></header>
      <section className="project-summary-grid" aria-label="Project summary"><div><span className="project-summary-label">All projects</span><strong>08</strong><small>2 added this month</small></div><div><span className="project-summary-label">In progress</span><strong>05</strong><small>Across 3 workstreams</small></div><div><span className="project-summary-label">Completed</span><strong>03</strong><small>+1 from last month</small></div><div><span className="project-summary-label">Team capacity</span><strong>78%</strong><small>Healthy this week</small></div></section>
      <div className="project-toolbar"><div className="search-wrap project-search"><Search size={16} strokeWidth={1.8} aria-hidden="true" /><input className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." aria-label="Search projects" /></div><div className="project-filter-actions"><select className="select-control" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter projects by status"><option>All projects</option><option>Preparation</option><option>Development</option><option>SIT</option><option>UAT</option><option>Go-live</option><option>Support</option><option>Implementation</option></select><button className="secondary-button" type="button"><CalendarDays size={14} /> Sort: Recent <ChevronDown size={13} /></button></div></div>
      <section className="project-card-grid" aria-label="Project list">{visibleProjects.map((project) => <ProjectCard key={project.id} project={project} onEdit={() => openEditProject(project)} onDelete={() => setProjectToDelete(project)} />)}{visibleProjects.length === 0 && <p className="empty-search">No projects match your filters.</p>}</section>
      {isProjectFormOpen ? <ProjectFormModal form={projectForm} editing={editingProjectId !== null} onChange={setProjectForm} onClose={closeProjectForm} onSubmit={handleProjectSubmit} /> : null}
      {projectToDelete ? <DeleteProjectModal project={projectToDelete} onCancel={() => setProjectToDelete(null)} onConfirm={confirmDeleteProject} /> : null}
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
  return <article className="project-card"><div className={`project-accent ${project.color}`} /><div className="project-card-top"><span className={`project-status ${project.statusClass}`}>{project.status}</span><div className="project-card-actions"><button className="task-menu" type="button" aria-label={`Edit ${project.name}`} onClick={onEdit}><MoreHorizontal size={16} /></button><button className="task-menu danger-menu" type="button" aria-label={`Delete ${project.name}`} onClick={onDelete}><Trash2 size={14} /></button></div></div><Link className="project-card-content" href={`/projects/${project.id}`}><h2>{project.name}</h2><p>{project.description}</p><div className="project-card-meta"><span><span className={`avatar avatar-tiny ${project.color}`}>{project.initials}</span>{project.owner}</span><span className="project-card-client">{project.client ?? "No client"}</span></div><div className="project-card-footer"><span>{project.completedTasks}/{project.tasks} tasks</span><span>{project.due ? `Due ${project.due}` : "No due date"}</span></div></Link></article>;
}

function ProjectFormModal({ form, editing, onChange, onClose, onSubmit }: { form: ProjectFormState; editing: boolean; onChange: (form: ProjectFormState) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal" role="dialog" aria-modal="true" aria-labelledby="project-form-title"><div className="modal-heading"><div><span className="eyebrow">Workspace</span><h2 id="project-form-title">{editing ? "Edit project" : "Create a new project"}</h2><p>{editing ? "Keep the project details up to date for the team." : "Set up a shared space for a new workstream."}</p></div><button className="modal-close" type="button" aria-label="Close project form" onClick={onClose}><X size={17} /></button></div><form onSubmit={onSubmit}><label>Project name<input autoFocus required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="e.g. Website Redesign" /></label><label>Description<textarea required value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="What is this project about?" rows={3} /></label><div className="form-field-grid"><label>Status<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as Project["status"] })}><option>Preparation</option><option>Development</option><option>SIT</option><option>UAT</option><option>Go-live</option><option>Support</option><option>Implementation</option></select></label><label>Visibility<select value={form.visibility} onChange={(event) => onChange({ ...form, visibility: event.target.value as Project["visibility"] })}><option>Internal</option><option>Public</option></select></label></div><div className="form-field-grid"><label>Client (optional)<input value={form.client ?? ""} onChange={(event) => onChange({ ...form, client: event.target.value })} placeholder="e.g. Nexa Labs" /></label><label>Owner<input required value={form.owner} onChange={(event) => onChange({ ...form, owner: event.target.value })} /></label></div><label>Due date (optional)<input value={form.due ?? ""} onChange={(event) => onChange({ ...form, due: event.target.value || null })} placeholder="Leave blank if undecided" /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">{editing ? "Save changes" : "Create project"}</button></div></form></section></div>;
}

function DeleteProjectModal({ project, onCancel, onConfirm }: { project: Project; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="delete-project-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title" aria-describedby="delete-project-description"><div className="delete-project-icon"><Trash2 size={18} /></div><div><h2 id="delete-project-title">Delete {project.name}?</h2><p id="delete-project-description">This will remove the project from your workspace. Tasks and activity attached to it will no longer be visible.</p></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onCancel}>Keep project</button><button className="danger-button" type="button" onClick={onConfirm}>Delete project</button></div></section></div>;
}
