"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Copy,
  CircleDot,
  Clock3,
  FileText,
  Grid2X2,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  Pencil,
  Plus,
  Download,
  Settings2,
  Share2,
  Ticket,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import PortalNavigation, { PortalSettingsLink, portalHref } from "../../components/PortalNavigation";
import PortalUserProfile, { PortalUserAvatar } from "../../components/PortalUserProfile";

type ProjectTask = {
  title: string;
  status: "Done" | "In progress" | "To do";
  assignee: string;
  initials: string;
  due: string;
};

type ProjectDetail = {
  name: string;
  description: string;
  status: "Ongoing" | "In review" | "On hold" | "Completed";
  statusClass: string;
  visibility: "Internal" | "Public";
  owner: string;
  initials: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  due: string;
  startDate: string;
  color: string;
  members: string[];
  milestones: { label: string; date: string; complete: boolean }[];
  tasks: ProjectTask[];
};

const projectDetails: Record<string, ProjectDetail> = {
  "website-redesign": {
    name: "Website Redesign",
    description: "A clearer, calmer home for the product and the people using it.",
    status: "Ongoing",
    statusClass: "ongoing",
    visibility: "Internal",
    owner: "Nadia Putri",
    initials: "NP",
    progress: 72,
    completedTasks: 13,
    totalTasks: 18,
    due: "September 12, 2026",
    startDate: "August 04, 2026",
    color: "purple",
    members: ["NP", "RA", "SM", "SA"],
    milestones: [
      { label: "Project direction", date: "Aug 08", complete: true },
      { label: "Design exploration", date: "Aug 23", complete: true },
      { label: "Build and review", date: "Sep 05", complete: false },
      { label: "Launch", date: "Sep 12", complete: false },
    ],
    tasks: [
      { title: "Finalize homepage content structure", status: "Done", assignee: "Nadia Putri", initials: "NP", due: "Aug 27" },
      { title: "Review responsive layout with the team", status: "In progress", assignee: "Raka Aditya", initials: "RA", due: "Aug 30" },
      { title: "Prepare accessibility checklist", status: "In progress", assignee: "Sinta Maheswari", initials: "SM", due: "Sep 02" },
      { title: "Add final analytics events", status: "To do", assignee: "Sarah Anderson", initials: "SA", due: "Sep 07" },
    ],
  },
  "mobile-app": {
    name: "Mobile App v2",
    description: "Reworking the core mobile workflow around faster everyday decisions.",
    status: "In review",
    statusClass: "review",
    visibility: "Internal",
    owner: "Raka Aditya",
    initials: "RA",
    progress: 88,
    completedTasks: 21,
    totalTasks: 24,
    due: "September 05, 2026",
    startDate: "July 15, 2026",
    color: "green",
    members: ["RA", "NP", "DP"],
    milestones: [
      { label: "User flows", date: "Jul 24", complete: true },
      { label: "Beta build", date: "Aug 14", complete: true },
      { label: "Team review", date: "Sep 01", complete: false },
    ],
    tasks: [
      { title: "Resolve final beta feedback", status: "In progress", assignee: "Raka Aditya", initials: "RA", due: "Aug 29" },
      { title: "Update release notes", status: "To do", assignee: "Nadia Putri", initials: "NP", due: "Sep 03" },
    ],
  },
};

const fallbackProject = projectDetails["website-redesign"];

type TaskFormState = Pick<ProjectTask, "title" | "status" | "assignee" | "due">;

const emptyTaskForm: TaskFormState = {
  title: "",
  status: "To do",
  assignee: "Sarah Anderson",
  due: "Sep 12",
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

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState("Overview");
  const project = projectDetails[params.projectId] ?? fallbackProject;
  const [tasks, setTasks] = useState(project.tasks);
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTaskForm);
  const [editingTaskTitle, setEditingTaskTitle] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);
  const [taskFilter, setTaskFilter] = useState("All tasks");
  const [projectVisibility, setProjectVisibility] = useState<ProjectDetail["visibility"]>(project.visibility);
  const [shareCopied, setShareCopied] = useState(false);
  const [syncNotice, setSyncNotice] = useState("");

  const visibleTasks = tasks.filter((task) => taskFilter === "All tasks" || task.status === taskFilter);

  function openCreateTask() {
    setEditingTaskTitle(null);
    setTaskForm(emptyTaskForm);
    setIsTaskFormOpen(true);
  }

  function openEditTask(task: ProjectTask) {
    setEditingTaskTitle(task.title);
    setTaskForm({ title: task.title, status: task.status, assignee: task.assignee, due: task.due });
    setIsTaskFormOpen(true);
  }

  function closeTaskForm() {
    setEditingTaskTitle(null);
    setTaskForm(emptyTaskForm);
    setIsTaskFormOpen(false);
  }

  function handleTaskSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = taskForm.title.trim();
    if (!normalizedTitle || !taskForm.assignee.trim() || !taskForm.due.trim()) return;
    const initials = taskForm.assignee.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const nextTask = { ...taskForm, title: normalizedTitle, assignee: taskForm.assignee.trim(), initials };
    if (editingTaskTitle) {
      setTasks((current) => current.map((task) => task.title === editingTaskTitle ? nextTask : task));
    } else {
      setTasks((current) => [...current, nextTask]);
    }
    closeTaskForm();
  }

  function confirmDeleteTask() {
    if (!taskToDelete) return;
    setTasks((current) => current.filter((task) => task.title !== taskToDelete.title));
    setTaskToDelete(null);
  }

  function toggleTaskCompletion(task: ProjectTask) {
    setTasks((current) => current.map((item) => item.title === task.title ? { ...item, status: item.status === "Done" ? "To do" : "Done" } : item));
  }

  function simulateGoogleImport() {
    const importedTask: ProjectTask = { title: "Add imported Google checklist", status: "To do", assignee: "Sarah Anderson", initials: "SA", due: "Sep 15" };
    setTasks((current) => current.some((task) => task.title === importedTask.title) ? current : [...current, importedTask]);
    setSyncNotice("Imported 1 task from Google Sheets · just now");
  }

  function simulateGoogleExport() {
    setSyncNotice(`Exported ${tasks.length} tasks to Google Sheets · just now`);
  }

  async function copyShareLink() {
    const shareUrl = `https://squad.local/projects/${params.projectId}`;
    if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
  }

  return <div className="dashboard-shell">
     <aside className="sidebar" aria-label="Main navigation"><ProjectBrand /> <PortalNavigation /><div className="sidebar-bottom"><PortalSettingsLink /><PortalUserProfile roleLabel="Product lead" /></div></aside>
     <main className="main-content project-detail-page"><div className="mobile-header"><ProjectBrand /><PortalUserAvatar className="avatar-header" /></div>
      <header className="main-header detail-header"><div><p className="breadcrumb"><Link href="/projects"><ArrowLeft size={13} /> Projects</Link> <span>/</span> {project.name}</p><div className="detail-title-row"><h1 className="page-title">{project.name}</h1><span className={`project-status ${project.statusClass}`}>{project.status}</span></div><p className="page-subtitle">{project.description}</p></div><div className="detail-header-actions"><button className="secondary-button" type="button" onClick={copyShareLink}><Share2 size={14} /> {shareCopied ? "Link copied" : "Share"}</button><button className="secondary-button" type="button"><Pencil size={14} /> Edit project</button><button className="task-menu detail-menu" type="button" aria-label="More project options"><MoreHorizontal size={18} /></button></div></header>
      <section className="project-detail-hero"><div className="detail-progress-block"><div className="detail-progress-heading"><div><span className="project-summary-label">Project progress</span><strong>{project.progress}%</strong></div><span>{project.completedTasks} of {project.totalTasks} tasks complete</span></div><div className={`project-progress detail-progress ${project.color}`}><span style={{ width: `${project.progress}%` }} /></div></div><div className="detail-facts"><div><span>Project owner</span><strong><span className={`avatar avatar-tiny ${project.color}`}>{project.initials}</span>{project.owner}</strong></div><div><span>Due date</span><strong><CalendarDays size={14} /> {project.due}</strong></div><div><span>Visibility</span><strong><CircleDot size={13} /> {projectVisibility}</strong></div></div></section>
      <nav className="detail-tabs" aria-label="Project sections">{["Overview", "Tasks", "Activity"].map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => setActiveTab(tab)}>{tab}{tab === "Tasks" && <span>{project.totalTasks}</span>}</button>)}</nav>
      {activeTab === "Overview" && <div className="project-detail-grid"><section className="detail-panel detail-tasks-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Next up</span><h2>Project tasks</h2></div><button className="text-button" type="button" onClick={() => setActiveTab("Tasks")}>View all <ArrowLeft size={13} className="rotate-180" /></button></div><div className="detail-task-list">{tasks.map((task) => <ProjectTaskRow key={task.title} task={task} color={project.color} onEdit={() => openEditTask(task)} onDelete={() => setTaskToDelete(task)} onToggle={() => toggleTaskCompletion(task)} />)}</div></section><aside className="detail-side-stack"><section className="detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Timeline</span><h2>Milestones</h2></div><Clock3 size={16} color="#a5adbc" /></div><div className="milestone-list">{project.milestones.map((milestone) => <div className="milestone" key={milestone.label}><span className={`milestone-dot ${milestone.complete ? "complete" : ""}`}>{milestone.complete && <Check size={11} />}</span><span><strong>{milestone.label}</strong><small>{milestone.date}</small></span></div>)}</div></section><section className="detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">People</span><h2>Project team</h2></div><Users size={16} color="#a5adbc" /></div><div className="detail-team">{project.members.map((member, index) => <span className={`avatar avatar-tiny ${index % 2 === 0 ? project.color : "green"}`} key={`${member}-${index}`}>{member}</span>)}<span className="team-count">{project.members.length} members</span></div><div className="project-date-row"><span>Started</span><strong>{project.startDate}</strong></div></section><section className="detail-panel access-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Sharing</span><h2>Access settings</h2></div><Share2 size={16} color="#a5adbc" /></div><p className="access-description">Choose who can discover and view this project.</p><select className="select-control access-select" value={projectVisibility} onChange={(event) => setProjectVisibility(event.target.value as ProjectDetail["visibility"])} aria-label="Project visibility"><option>Internal</option><option>Public</option></select><div className="share-link-row"><input readOnly value={`https://squad.local/projects/${params.projectId}`} aria-label="Project share link" /><button className="task-menu" type="button" aria-label="Copy project share link" onClick={copyShareLink}>{shareCopied ? <Check size={14} /> : <Copy size={14} />}</button></div><small className="share-note">{shareCopied ? "Share link copied to clipboard." : "Anyone with a public link can view this project."}</small></section></aside></div>}
      {activeTab === "Tasks" && <section className="detail-panel detail-tab-panel"><div className="detail-panel-heading"><div><span className="eyebrow">All work</span><h2>Tasks in {project.name}</h2></div><div className="detail-task-toolbar"><button className="secondary-button" type="button" onClick={simulateGoogleImport}><Upload size={13} /> Import Google</button><button className="secondary-button" type="button" onClick={simulateGoogleExport}><Download size={13} /> Export Google</button><select className="select-control" value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} aria-label="Filter tasks by status"><option>All tasks</option><option>To do</option><option>In progress</option><option>Done</option></select><button className="primary-button" type="button" onClick={openCreateTask}><Plus size={14} /> Add task</button></div></div>{syncNotice && <p className="sync-notice" role="status">{syncNotice}</p>}<div className="detail-task-list">{visibleTasks.map((task) => <ProjectTaskRow key={task.title} task={task} color={project.color} onEdit={() => openEditTask(task)} onDelete={() => setTaskToDelete(task)} onToggle={() => toggleTaskCompletion(task)} />)}{visibleTasks.length === 0 && <p className="empty-search">No tasks match this status.</p>}</div></section>}
      {activeTab === "Activity" && <section className="detail-panel detail-tab-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Recent updates</span><h2>Project activity</h2></div></div><div className="detail-activity-list"><div><span className="avatar avatar-tiny purple">NP</span><p><strong>Nadia Putri</strong> moved “Project direction” to complete.<small>Today, 09:42</small></p></div><div><span className="avatar avatar-tiny green">RA</span><p><strong>Raka Aditya</strong> added a review note to the responsive layout.<small>Yesterday, 16:18</small></p></div><div><span className="avatar avatar-tiny orange">SM</span><p><strong>Sinta Maheswari</strong> joined the project team.<small>Aug 25, 11:05</small></p></div></div></section>}
      {isTaskFormOpen ? <TaskFormModal form={taskForm} editing={editingTaskTitle !== null} onChange={setTaskForm} onClose={closeTaskForm} onSubmit={handleTaskSubmit} /> : null}
      {taskToDelete ? <DeleteTaskModal task={taskToDelete} onCancel={() => setTaskToDelete(null)} onConfirm={confirmDeleteTask} /> : null}
    </main>
  </div>;
}

function ProjectBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function ProjectNavItem({ item, active = false }: { item: (typeof navigation)[number]; active?: boolean }) {
  const Icon = item.icon;
  return <li><Link className={`nav-item ${active ? "active" : ""}`} href={portalHref(item.label)}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</Link></li>;
}

function ProjectTaskRow({ task, color, onEdit, onDelete, onToggle }: { task: ProjectTask; color: string; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return <div className="detail-task-row"><button className={`task-status-toggle task-status-dot ${task.status.toLowerCase().replace(" ", "-")}`} type="button" aria-label={`${task.status === "Done" ? "Mark incomplete" : "Mark complete"}: ${task.title}`} aria-pressed={task.status === "Done"} onClick={onToggle}>{task.status === "Done" && <Check size={10} />}</button><div className="detail-task-copy"><strong>{task.title}</strong><span><span className={`avatar avatar-tiny ${color}`}>{task.initials}</span>{task.assignee}</span></div><span className="detail-task-status">{task.status}</span><span className="detail-task-due">{task.due}</span><div className="detail-task-actions"><button className="task-menu" type="button" aria-label={`Edit ${task.title}`} onClick={onEdit}><Pencil size={13} /></button><button className="task-menu danger-menu" type="button" aria-label={`Delete ${task.title}`} onClick={onDelete}><Trash2 size={13} /></button></div></div>;
}

function TaskFormModal({ form, editing, onChange, onClose, onSubmit }: { form: TaskFormState; editing: boolean; onChange: (form: TaskFormState) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="project-form-modal" role="dialog" aria-modal="true" aria-labelledby="task-form-title"><div className="modal-heading"><div><span className="eyebrow">{editing ? "Task details" : "Project work"}</span><h2 id="task-form-title">{editing ? "Edit task" : "Add a task"}</h2><p>{editing ? "Update the task details and keep everyone aligned." : "Capture the next piece of work for this project."}</p></div><button className="modal-close" type="button" aria-label="Close task form" onClick={onClose}><X size={17} /></button></div><form onSubmit={onSubmit}><label>Task title<input autoFocus required value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="e.g. Review launch checklist" /></label><div className="form-field-grid"><label>Status<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as ProjectTask["status"] })}><option>To do</option><option>In progress</option><option>Done</option></select></label><label>Due date<input required value={form.due} onChange={(event) => onChange({ ...form, due: event.target.value })} placeholder="Sep 12" /></label></div><label>Assignee<input required value={form.assignee} onChange={(event) => onChange({ ...form, assignee: event.target.value })} placeholder="Team member" /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">{editing ? "Save changes" : "Add task"}</button></div></form></section></div>;
}

function DeleteTaskModal({ task, onCancel, onConfirm }: { task: ProjectTask; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="delete-project-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-task-title" aria-describedby="delete-task-description"><div className="delete-project-icon"><Trash2 size={18} /></div><div><h2 id="delete-task-title">Delete this task?</h2><p id="delete-task-description">“{task.title}” will be removed from this project. This action only changes the current mock workspace.</p></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={onCancel}>Keep task</button><button className="danger-button" type="button" onClick={onConfirm}>Delete task</button></div></section></div>;
}
