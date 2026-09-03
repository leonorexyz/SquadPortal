"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Grid2X2,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MoreHorizontal,
  Search,
  Settings2,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import ActivityList, { type Activity } from "./components/ActivityList";
import ProductivityPieChart, { type ProductivityMember } from "./components/ProductivityPieChart";
import PortalNavigation, { PortalSettingsLink } from "./components/PortalNavigation";
import QuickActions, { type QuickAction } from "./components/QuickActions";
import { useAuthSession } from "./components/AuthSessionProvider";
import PortalUserProfile, { usePortalUser } from "./components/PortalUserProfile";

type IconComponent = typeof LayoutDashboard;
type TrendDirection = "up" | "down" | "neutral";
type DataSource = "demo" | "loading" | "live" | "fallback";

type ProjectHealth = {
  name: string;
  status: string;
  statusClass: string;
  progress: number;
  color: string;
};

type FocusTask = {
  title: string;
  project: string;
  due: string;
  soon: boolean;
};

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendDirection: TrendDirection;
  color: string;
  icon: IconComponent;
};

type SearchResource = {
  type: string;
  title: string;
};

type DashboardData = {
  productivity: ProductivityMember[];
  projects: ProjectHealth[];
  activities: Activity[];
  focusTasks: FocusTask[];
  summaryCards: SummaryCard[];
  searchableResources: SearchResource[];
};

const productivity: ProductivityMember[] = [
  { name: "Nadia Putri", value: 32, color: "#7357f6" },
  { name: "Raka Aditya", value: 25, color: "#61c9a0" },
  { name: "Sinta Maheswari", value: 20, color: "#f6b84e" },
  { name: "Dimas Pratama", value: 23, color: "#e98282" },
];

const projects: ProjectHealth[] = [
  { name: "Website Redesign", status: "Ongoing", statusClass: "ongoing", progress: 72, color: "" },
  { name: "Mobile App v2", status: "In review", statusClass: "review", progress: 88, color: "green" },
  { name: "Q3 Campaign", status: "On hold", statusClass: "onhold", progress: 46, color: "orange" },
];

const activities: Activity[] = [
  { initials: "NP", avatar: "purple", person: "Nadia Putri", action: "added a new daily story", item: "Design system audit", time: "12 min ago", type: "story", typeLabel: "Vida story" },
  { initials: "RA", avatar: "green", person: "Raka Aditya", action: "completed a task in", item: "Website Redesign", time: "46 min ago", type: "task", typeLabel: "Task completed" },
  { initials: "SM", avatar: "orange", person: "Sinta Maheswari", action: "replied to ticket", item: "#104 — Analytics access", time: "2 hrs ago", type: "ticket", typeLabel: "Ticket reply" },
  { initials: "DP", avatar: "blue", person: "Dimas Pratama", action: "shared a knowledge article", item: "Writing better briefs", time: "Yesterday", type: "story", typeLabel: "Knowledge base" },
];

const focusTasks: FocusTask[] = [
  { title: "Finalize homepage copy", project: "Website Redesign", due: "Today", soon: true },
  { title: "Review user interview notes", project: "Mobile App v2", due: "Tomorrow", soon: false },
  { title: "Prepare sprint planning", project: "Team Operations", due: "26 Aug", soon: false },
  { title: "Add Q3 campaign references", project: "Q3 Campaign", due: "29 Aug", soon: false },
];

const quickActions: QuickAction[] = [
  { title: "Write a story", caption: "Share your daily progress", color: "purple", icon: FileText },
  { title: "New project", caption: "Start something together", color: "green", icon: BriefcaseBusiness },
  { title: "Add knowledge", caption: "Keep the team learning", color: "orange", icon: BookOpen },
  { title: "Ask a question", caption: "Open a team ticket", color: "blue", icon: CircleHelp },
];

function pagePath(label: string) {
  switch (label) {
    case "Vida story":
    case "Write a story": return "/stories";
    case "Projects":
    case "New project":
    case "Task":
    case "Tasks": return "/tasks";
    case "Project": return "/projects";
    case "Knowledge base":
    case "Add knowledge":
    case "Knowledge": return "/knowledge";
    case "Tickets":
    case "Ask a question":
    case "Ticket": return "/tickets";
    case "Team members": return "/team";
    case "Settings": return "/settings";
    default: return "/";
  }
}

const searchableResources: SearchResource[] = [
  { type: "Project", title: "Website Redesign" },
  { type: "Task", title: "Finalize homepage copy" },
  { type: "Knowledge", title: "Writing better briefs" },
  { type: "Ticket", title: "#104 — Analytics access" },
];

const summaryCards: SummaryCard[] = [
  { label: "Active projects", value: "08", detail: "2 added this month", trend: "+2", trendDirection: "up", color: "purple", icon: BriefcaseBusiness },
  { label: "Tasks completed", value: "42", detail: "from last week", trend: "16%", trendDirection: "up", color: "green", icon: ClipboardCheck },
  { label: "Pending tasks", value: "12", detail: "4 due this week", trend: "Needs focus", trendDirection: "down", color: "orange", icon: ListTodo },
  { label: "Team members", value: "16", detail: "3 members online", trend: "Live", trendDirection: "neutral", color: "blue", icon: Users },
];

const mockDashboardData: DashboardData = {
  productivity,
  projects,
  activities,
  focusTasks,
  summaryCards,
  searchableResources,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeDashboardData(payload: unknown): DashboardData {
  if (!isRecord(payload)) throw new Error("Dashboard API returned an invalid payload");

  return {
    productivity: Array.isArray(payload.productivity) ? payload.productivity as ProductivityMember[] : mockDashboardData.productivity,
    projects: Array.isArray(payload.projects) ? payload.projects as ProjectHealth[] : mockDashboardData.projects,
    activities: Array.isArray(payload.activities) ? payload.activities as Activity[] : mockDashboardData.activities,
    focusTasks: Array.isArray(payload.focusTasks) ? payload.focusTasks as FocusTask[] : mockDashboardData.focusTasks,
    summaryCards: Array.isArray(payload.summaryCards) ? payload.summaryCards as SummaryCard[] : mockDashboardData.summaryCards,
    searchableResources: Array.isArray(payload.searchableResources) ? payload.searchableResources as SearchResource[] : mockDashboardData.searchableResources,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { signOut } = useAuthSession();
  const currentUser = usePortalUser();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("This week");
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);
  const [dataSource, setDataSource] = useState<DataSource>("demo");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function navigateToPage(label: string) {
    router.push(pagePath(label));
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      if (process.env.NEXT_PUBLIC_AUTH_MOCK === "false") await authClient.signOut();
      signOut();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  useEffect(() => {
    // The same-origin route is the default contract; deployments can override it for a separate API.
    const apiUrl = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || "/api/dashboard";

    let isCurrent = true;
    setDataSource("loading");

    fetch(apiUrl, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
        return normalizeDashboardData(await response.json());
      })
      .then((data) => {
        if (!isCurrent) return;
        setDashboardData(data);
        setDataSource("live");
      })
      .catch(() => {
        if (!isCurrent) return;
        setDashboardData(mockDashboardData);
        setDataSource("fallback");
      });

    return () => { isCurrent = false; };
  }, []);

  return <DashboardShell>
        <div className="mobile-header">
          <Brand />
          <div className="header-actions">
            <button className="icon-button" aria-label="Notifications" type="button">
              <Bell size={17} strokeWidth={1.8} />
              <span className="notification-dot" />
            </button>
            <LogoutButton isLoggingOut={isLoggingOut} onLogout={handleLogout} />
            <span className="avatar avatar-header">{currentUser.initials}</span>
          </div>
        </div>

        <header className="main-header">
          <div>
            <p className="breadcrumb"><strong>Workspace</strong> <span>/</span> Overview</p>
            <h1 className="page-title">Good morning, {currentUser.name.split(" ")[0]} <span aria-hidden="true">✦</span></h1>
            <p className="page-subtitle">Here&apos;s what&apos;s happening across your team today.</p>
          </div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Notifications" type="button">
              <Bell size={17} strokeWidth={1.8} />
              <span className="notification-dot" />
            </button>
            <LogoutButton isLoggingOut={isLoggingOut} onLogout={handleLogout} />
            <span className="avatar avatar-header">{currentUser.initials}</span>
          </div>
        </header>

        <div className="dashboard-toolbar">
          <QuickSearch resources={dashboardData.searchableResources} query={query} onQueryChange={setQuery} onSelectResource={navigateToPage} />
          <div className="toolbar-actions">
            <select className="select-control" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Select dashboard period">
              <option>This week</option>
              <option>Last week</option>
              <option>This month</option>
            </select>
            <button className="secondary-button" type="button"><ArrowUpRight size={14} strokeWidth={1.8} /> Export report</button>
            <span className={`data-source-note ${dataSource === "live" ? "connected" : ""}`} aria-live="polite">{dataSource === "loading" ? "Loading data" : dataSource === "live" ? "Live data" : dataSource === "fallback" ? "Demo data · API unavailable" : "Demo data"}</span>
          </div>
        </div>

        <SummaryCards cards={dashboardData.summaryCards} />

        <div className="dashboard-grid first-row">
          <section className="panel" aria-labelledby="productivity-heading">
            <PanelHeading id="productivity-heading" title="Team productivity" description={`Activity distribution · ${period.toLowerCase()}`} action="View details" />
            <ProductivityPieChart members={dashboardData.productivity} period={period} />
          </section>

          <section className="panel quick-actions-panel" aria-labelledby="quick-actions-heading">
            <PanelHeading id="quick-actions-heading" title="Quick actions" description="Keep the team moving forward" />
            <QuickActions actions={quickActions} onSelect={navigateToPage} />
          </section>
        </div>

        <div className="dashboard-grid second-row">
          <section className="panel" aria-labelledby="projects-heading">
            <PanelHeading id="projects-heading" title="Project health" description="Progress across active projects" action="All projects" />
            <div className="project-list">
              {dashboardData.projects.map((project) => <div key={project.name}>
                <div className="project-row">
                  <div className="project-row-top"><span className="project-name">{project.name}</span><span className={`project-status ${project.statusClass}`}>{project.status}</span></div>
                  <div className={`project-progress ${project.color}`}><span style={{ width: `${project.progress}%` }} /></div>
                  <span className="project-percent">{project.progress}%</span>
                </div>
              </div>)}
            </div>
            <div className="project-footer"><span>8 active projects</span><button className="text-button" type="button" onClick={() => navigateToPage("Projects")}>Manage projects <ArrowUpRight size={12} /></button></div>
          </section>

          <section className="panel" aria-labelledby="activity-heading">
            <PanelHeading id="activity-heading" title="Recent activity" description="The latest updates from your team" action="View all" />
            <ActivityList activities={dashboardData.activities} />
          </section>
        </div>

        <section className="panel focus-panel" aria-labelledby="focus-heading">
          <PanelHeading id="focus-heading" title="Your focus" description="A quick view of the tasks that need your attention" action="View all tasks" />
          <div className="focus-table">
            <div className="focus-table-header"><span>Task</span><span>Project</span><span>Due date</span><span /></div>
            {dashboardData.focusTasks.map((task) => <div className="focus-task-row" key={task.title}>
              <div className="task-main"><input className="task-checkbox" type="checkbox" aria-label={`Mark ${task.title} complete`} /><span className="task-title">{task.title}</span></div>
              <span className="task-project">{task.project}</span>
              <span className={`due-date ${task.soon ? "soon" : ""}`}>{task.due}</span>
              <button className="task-menu" type="button" aria-label={`More options for ${task.title}`}><MoreHorizontal size={16} /></button>
            </div>)}
          </div>
        </section>
  </DashboardShell>;
}

function Brand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function LogoutButton({ isLoggingOut, onLogout }: { isLoggingOut: boolean; onLogout: () => void }) {
  return <button className="header-logout-button" type="button" onClick={onLogout} disabled={isLoggingOut} aria-label="Log out"> <LogOut size={15} /> <span>{isLoggingOut ? "Signing out" : "Log out"}</span></button>;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-shell">
    <aside className="sidebar" aria-label="Main navigation">
      <Brand />
      <PortalNavigation />
      <div className="sidebar-bottom">
        <PortalSettingsLink />
        <PortalUserProfile roleLabel="Product lead" />
      </div>
    </aside>
    <main className="main-content">{children}</main>
  </div>;
}

function QuickSearch({ resources, query, onQueryChange, onSelectResource }: { resources: SearchResource[]; query: string; onQueryChange: (value: string) => void; onSelectResource: (resourceType: string) => void }) {
  const [dismissed, setDismissed] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredResources = useMemo(() => {
    if (!normalizedQuery) return [];
    return resources.filter((resource) => `${resource.type} ${resource.title}`.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, resources]);
  const showResults = normalizedQuery.length > 0 && !dismissed;

  const selectResource = (resource: SearchResource) => {
    onSelectResource(resource.type);
    setDismissed(true);
  };

  return <div className="search-wrap">
    <Search size={16} strokeWidth={1.8} aria-hidden="true" />
    <input
      className="search-input"
      type="search"
      value={query}
      onChange={(event) => { onQueryChange(event.target.value); setDismissed(false); }}
      onKeyDown={(event) => { if (event.key === "Enter" && filteredResources[0]) selectResource(filteredResources[0]); }}
      placeholder="Search projects, tasks, docs..."
      aria-label="Search projects, tasks, and documents"
      aria-expanded={showResults}
      aria-controls="quick-search-results"
    />
    {showResults && (
      <div className="search-results" id="quick-search-results" role="listbox" aria-label="Search results">
        {filteredResources.length > 0 ? filteredResources.map((resource) => (
          <button className="search-result" key={`${resource.type}-${resource.title}`} type="button" onClick={() => selectResource(resource)}>
            <Search size={14} color="#7357f6" strokeWidth={1.8} />
            <span>
              <span className="search-result-type">{resource.type}</span>
              <span className="search-result-title">{resource.title}</span>
            </span>
          </button>
        )) : (
          <div className="search-result">
            <Search size={14} color="#a5adbc" strokeWidth={1.8} />
            <span className="search-result-title">No matching resources yet</span>
            <button type="button" className="task-menu" aria-label="Close search results" onClick={() => setDismissed(true)}><X size={14} /></button>
          </div>
        )}
      </div>
    )}
  </div>;
}

function PanelHeading({ id, title, description, action }: { id: string; title: string; description: string; action?: string }) {
  return <div className="panel-heading"><div><h2 className="panel-title" id={id}>{title}</h2><p className="panel-description">{description}</p></div>{action && <button className="text-button" type="button">{action} <ArrowUpRight size={12} /></button>}</div>;
}

function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return <section className="stats-grid" aria-label="Team summary">
    {cards.map((card) => <StatCard key={card.label} {...card} />)}
  </section>;
}

function StatCard({ label, value, detail, trend, trendDirection, color, icon: Icon }: SummaryCard) {
  const TrendIcon = trendDirection === "down" ? ArrowDownRight : trendDirection === "up" ? ArrowUpRight : null;
  return <article className="stat-card"><div className="stat-card-top"><span className="stat-label">{label}</span><span className={`stat-icon ${color}`}><Icon size={15} strokeWidth={1.9} /></span></div><div className="stat-number">{value}</div><div className="stat-foot">{TrendIcon ? <TrendIcon size={12} color={trendDirection === "down" ? "#e76868" : "#2eb67d"} /> : <span style={{ background: "#5595ef", borderRadius: "50%", height: 5, width: 5 }} />}<span className={trendDirection === "up" ? "positive" : ""}>{trend}</span><span>{detail}</span></div></article>;
}
