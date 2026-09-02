"use client";

import { CheckCircle2, ChevronDown, CircleDot, Clock3, Grid2X2, ListTodo, Search } from "lucide-react";
import { useMemo, useState } from "react";
import PortalNavigation, { PortalSettingsLink } from "../components/PortalNavigation";

type TaskStatus = "todo" | "inprogress" | "done";

type Task = {
  id: string;
  title: string;
  project: string;
  due: string;
  status: TaskStatus;
  assignee: string;
  initials: string;
  color: string;
};

const initialTasks: Task[] = [
  { id: "task-1", title: "Finalize homepage copy", project: "Website Redesign", due: "Today", status: "inprogress", assignee: "Nadia Putri", initials: "NP", color: "purple" },
  { id: "task-2", title: "Review user interview notes", project: "Mobile App v2", due: "Tomorrow", status: "todo", assignee: "Raka Aditya", initials: "RA", color: "green" },
  { id: "task-3", title: "Prepare sprint planning", project: "Team Operations", due: "26 Aug", status: "done", assignee: "Sarah Anderson", initials: "SA", color: "blue" },
  { id: "task-4", title: "Add Q3 campaign references", project: "Q3 Campaign", due: "29 Aug", status: "todo", assignee: "Dimas Pratama", initials: "DP", color: "orange" },
  { id: "task-5", title: "Document research handoff", project: "Research Library", due: "02 Sep", status: "todo", assignee: "Sinta Maheswari", initials: "SM", color: "pink" },
  { id: "task-6", title: "QA onboarding checklist", project: "Onboarding refresh", due: "05 Sep", status: "inprogress", assignee: "Sarah Anderson", initials: "SA", color: "purple" },
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  inprogress: "In progress",
  done: "Done",
};

export default function TasksPage() {
  const [taskList, setTaskList] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All tasks" | TaskStatus>("All tasks");
  const [project, setProject] = useState("All projects");

  const projectOptions = useMemo(() => Array.from(new Set(taskList.map((task) => task.project))), [taskList]);
  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return taskList.filter((task) => {
      const matchesQuery = !normalizedQuery || `${task.title} ${task.project} ${task.assignee}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "All tasks" || task.status === status;
      const matchesProject = project === "All projects" || task.project === project;
      return matchesQuery && matchesStatus && matchesProject;
    });
  }, [project, query, status, taskList]);

  const counts = useMemo(() => ({
    total: taskList.length,
    todo: taskList.filter((task) => task.status === "todo").length,
    inprogress: taskList.filter((task) => task.status === "inprogress").length,
    done: taskList.filter((task) => task.status === "done").length,
  }), [taskList]);

  function toggleTask(taskId: string) {
    setTaskList((current) => current.map((task) => task.id === taskId ? { ...task, status: task.status === "done" ? "todo" : "done" } : task));
  }

  return <div className="dashboard-shell tasks-page">
    <aside className="sidebar" aria-label="Main navigation">
      <TaskBrand />
      <PortalNavigation />
      <div className="sidebar-bottom">
        <PortalSettingsLink />
        <div className="mini-profile"><span className="avatar">SA</span><span><span className="profile-name">Sarah Anderson</span><span className="profile-role">Product lead</span></span><ChevronDown size={14} color="#a5adbc" style={{ marginLeft: "auto" }} /></div>
      </div>
    </aside>

    <main className="main-content">
      <div className="mobile-header"><TaskBrand /><span className="avatar avatar-header">SA</span></div>
      <header className="main-header">
        <div><p className="breadcrumb"><strong>Workspace</strong> <span>/</span> Tasks</p><h1 className="page-title">Tasks</h1><p className="page-subtitle">Keep the work moving with a clear view of what needs attention.</p></div>
        <div className="tasks-header-note"><ListTodo size={15} /> {visibleTasks.length} visible tasks</div>
      </header>

      <section className="tasks-summary" aria-label="Task summary">
        <div><span className="tasks-summary-icon purple"><ListTodo size={15} /></span><span><strong>{counts.total}</strong><small>Total tasks</small></span></div>
        <div><span className="tasks-summary-icon orange"><Clock3 size={15} /></span><span><strong>{counts.todo}</strong><small>To do</small></span></div>
        <div><span className="tasks-summary-icon blue"><CircleDot size={15} /></span><span><strong>{counts.inprogress}</strong><small>In progress</small></span></div>
        <div><span className="tasks-summary-icon green"><CheckCircle2 size={15} /></span><span><strong>{counts.done}</strong><small>Completed</small></span></div>
      </section>

      <div className="tasks-toolbar">
        <div className="search-wrap task-search"><Search size={16} strokeWidth={1.8} aria-hidden="true" /><input className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" /></div>
        <div className="tasks-filter-actions"><select className="select-control" value={status} onChange={(event) => setStatus(event.target.value as "All tasks" | TaskStatus)} aria-label="Filter tasks by status"><option>All tasks</option><option value="todo">To do</option><option value="inprogress">In progress</option><option value="done">Done</option></select><select className="select-control" value={project} onChange={(event) => setProject(event.target.value)} aria-label="Filter tasks by project"><option>All projects</option>{projectOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
      </div>

      <section className="panel tasks-panel" aria-labelledby="task-list-title">
        <div className="panel-heading"><div><h2 className="panel-title" id="task-list-title">All tasks</h2><p className="panel-description">Tasks across the projects you can access.</p></div><span className="tasks-panel-count">{visibleTasks.length} results</span></div>
        <div className="tasks-table" role="table" aria-label="Task list">
          <div className="tasks-table-header" role="row"><span role="columnheader">Task</span><span role="columnheader">Project</span><span role="columnheader">Assignee</span><span role="columnheader">Due date</span><span role="columnheader">Status</span></div>
          {visibleTasks.map((task) => <div className="tasks-table-row" role="row" key={task.id}>
            <div className="task-main" role="cell"><input className="task-checkbox" type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(task.id)} aria-label={`${task.status === "done" ? "Reopen" : "Complete"} ${task.title}`} /><span className={`task-title ${task.status === "done" ? "completed" : ""}`}>{task.title}</span></div>
            <span className="task-project" role="cell">{task.project}</span>
            <span className="task-assignee" role="cell"><span className={`avatar avatar-tiny ${task.color}`}>{task.initials}</span>{task.assignee}</span>
            <span className={`due-date ${task.due === "Today" ? "soon" : ""}`} role="cell">{task.due}</span>
            <span className={`task-status-pill ${task.status}`} role="cell">{statusLabels[task.status]}</span>
          </div>)}
          {visibleTasks.length === 0 && <p className="empty-search">No tasks match your filters.</p>}
        </div>
      </section>
    </main>
  </div>;
}

function TaskBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}
