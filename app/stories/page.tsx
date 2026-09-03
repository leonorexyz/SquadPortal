"use client";

import {
  BookOpen,
  ChevronDown,
  FileText,
  Flame,
  Grid2X2,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import StoryList, { type Story } from "../components/StoryList";
import PortalNavigation, { PortalSettingsLink, portalHref } from "../components/PortalNavigation";
import PortalUserProfile, { PortalUserAvatar, usePortalUser } from "../components/PortalUserProfile";

const DEFAULT_STORY_DATE = "2026-08-28";

const stories: Story[] = [
  {
    id: "story-1",
    author: "Nadia Putri",
    initials: "NP",
    avatar: "purple",
    storyDate: "2026-08-28",
    date: "Today, 28 Aug",
    time: "09:42",
    title: "Design system audit",
    content: "I mapped the current component usage across the product and found a few opportunities to simplify our shared patterns. Next up: documenting the new spacing scale for the team.",
    tags: ["Design", "Website Redesign"],
    reactions: 6,
    replies: 2,
  },
  {
    id: "story-2",
    author: "Raka Aditya",
    initials: "RA",
    avatar: "green",
    storyDate: "2026-08-28",
    date: "Today, 28 Aug",
    time: "08:18",
    title: "A smooth handoff",
    content: "Finished the responsive states for the new navigation and shared the prototype with engineering. The edge cases around long project names are covered now.",
    tags: ["Product", "Mobile App v2"],
    reactions: 4,
    replies: 1,
  },
  {
    id: "story-3",
    author: "Sinta Maheswari",
    initials: "SM",
    avatar: "orange",
    storyDate: "2026-08-27",
    date: "Yesterday, 27 Aug",
    time: "17:06",
    title: "What I learned from our interviews",
    content: "People understand the core workflow quickly, but they need more confidence about where a task is in the review process. I added that insight to the research summary.",
    tags: ["Research", "Mobile App v2"],
    reactions: 8,
    replies: 4,
  },
  {
    id: "story-4",
    author: "Dimas Pratama",
    initials: "DP",
    avatar: "blue",
    storyDate: "2026-08-27",
    date: "Yesterday, 27 Aug",
    time: "14:30",
    title: "Making briefs easier to scan",
    content: "Published a short guide for writing better briefs. It includes a simple context, decision, and next step structure that we can use in every project.",
    tags: ["Knowledge", "Team Operations"],
    reactions: 5,
    replies: 3,
  },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Vida story", icon: FileText },
  { label: "Projects", icon: Grid2X2 },
  { label: "Tasks", icon: FileText },
  { label: "Knowledge base", icon: BookOpen },
  { label: "Tickets", icon: Ticket, count: "4" },
  { label: "Team members", icon: Users },
];

export default function StoriesPage() {
  const currentUser = usePortalUser();
  const [storyItems, setStoryItems] = useState(stories);
  const [query, setQuery] = useState("");
  const [member, setMember] = useState("All members");
  const [dateRange, setDateRange] = useState("All dates");
  const [composerOpen, setComposerOpen] = useState(false);
  const [storyDate, setStoryDate] = useState(DEFAULT_STORY_DATE);
  const [dateError, setDateError] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);

  const visibleStories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return storyItems.filter((story) => {
      const matchesQuery = !normalizedQuery || `${story.author} ${story.title} ${story.content} ${story.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);
      const matchesMember = member === "All members" || story.author === member;
      const matchesDate = dateRange === "All dates" || (dateRange === "This week" ? story.storyDate >= "2026-08-24" : story.storyDate < "2026-08-24");
      return matchesQuery && matchesMember && matchesDate;
    });
  }, [dateRange, member, query, storyItems]);

  const openNewComposer = () => {
    setEditingStory(null);
    setStoryDate(DEFAULT_STORY_DATE);
    setDateError("");
    setStoryTitle("");
    setStoryContent("");
    setComposerOpen(true);
  };

  const openEditComposer = (story: Story) => {
    setEditingStory(story);
    setStoryDate(story.storyDate);
    setDateError("");
    setStoryTitle(story.title);
    setStoryContent(story.content);
    setComposerOpen(true);
  };

  const handleStorySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = storyContent.trim();
    if (!trimmedContent) return;
    if (!storyDate || storyDate > DEFAULT_STORY_DATE) {
      setDateError("Choose today or an earlier date.");
      return;
    }
    setDateError("");

    const selectedDate = new Date(`${storyDate}T09:00:00`);
    const dateLabel = storyDate === DEFAULT_STORY_DATE ? "Today, 28 Aug" : selectedDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    setStoryItems((currentStories) => editingStory ? currentStories.map((story) => story.id === editingStory.id ? { ...story, storyDate, date: dateLabel, time: "Just now", title: storyTitle.trim() || "Daily check-in", content: trimmedContent } : story) : [{
      id: `story-${Date.now()}`,
      author: currentUser.name,
      initials: currentUser.initials,
      avatar: "purple",
      storyDate,
      date: dateLabel,
      time: "Just now",
      title: storyTitle.trim() || "Daily check-in",
      content: trimmedContent,
      tags: ["Personal"],
      reactions: 0,
      replies: 0,
    }, ...currentStories]);
    setComposerOpen(false);
    setEditingStory(null);
    setStoryTitle("");
    setStoryContent("");
  };

  const confirmDeleteStory = () => {
    if (!storyToDelete) return;
    setStoryItems((currentStories) => currentStories.filter((story) => story.id !== storyToDelete.id));
    if (selectedStory?.id === storyToDelete.id) setSelectedStory(null);
    setStoryToDelete(null);
  };

  return <div className="dashboard-shell">
    <aside className="sidebar" aria-label="Main navigation">
      <StoryBrand /> <PortalNavigation /><div className="sidebar-bottom">
        <PortalSettingsLink />
        <PortalUserProfile roleLabel="Product lead" />
      </div>
    </aside>

    <main className="main-content story-page">
      <div className="mobile-header"><StoryBrand /><div className="header-actions"><PortalUserAvatar className="avatar-header" /></div></div>
      <header className="main-header">
        <div><p className="breadcrumb"><strong>Productivity</strong> <span>/</span> Vida story</p><h1 className="page-title">Vida story</h1><p className="page-subtitle">A little context from the people behind the work.</p></div>
        <button className="primary-button story-write-button" type="button" onClick={openNewComposer}><Plus size={15} strokeWidth={2} /> Write a story</button>
      </header>

      <section className="story-stats" aria-label="Story summary">
        <div className="story-stat"><span className="story-stat-icon purple"><Flame size={16} /></span><span><strong>5 days</strong><small>your current streak</small></span></div>
        <div className="story-stat"><span className="story-stat-icon green"><FileText size={16} /></span><span><strong>4 stories</strong><small>shared this week</small></span></div>
        <div className="story-stat"><span className="story-stat-icon orange"><Users size={16} /></span><span><strong>18 stories</strong><small>from the whole team</small></span></div>
        <div className="story-stat story-stat-tip"><Sparkles size={15} color="#7357f6" /><span><strong>Keep the momentum</strong><small>Small updates make big work visible.</small></span></div>
      </section>

      <div className="story-toolbar">
        <div className="search-wrap story-search"><Search size={16} strokeWidth={1.8} aria-hidden="true" /><input className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories..." aria-label="Search stories" /></div>
        <div className="story-filter-actions"><select className="select-control" value={member} onChange={(event) => setMember(event.target.value)} aria-label="Filter stories by member"><option>All members</option><option>Nadia Putri</option><option>Raka Aditya</option><option>Sinta Maheswari</option><option>Dimas Pratama</option></select><select className="select-control" value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Filter stories by date"><option>All dates</option><option>This week</option><option>Older</option></select><button className="icon-button" type="button" aria-label="More filters"><SlidersHorizontal size={15} /></button></div>
      </div>

      <div className="story-layout">
        <section className="panel story-feed" aria-labelledby="story-feed-heading"><div className="panel-heading"><div><h2 className="panel-title" id="story-feed-heading">Recent stories</h2><p className="panel-description">Updates from your team, in their own words.</p></div><span className="story-count">{visibleStories.length} stories</span></div><StoryList stories={visibleStories} onSelectStory={setSelectedStory} onEditStory={openEditComposer} onDeleteStory={setStoryToDelete} /></section>
        <aside className="story-side-column"><section className="panel week-panel" aria-labelledby="week-heading"><div className="panel-heading"><div><h2 className="panel-title" id="week-heading">Your week</h2><p className="panel-description">A quiet view of your rhythm.</p></div><button className="text-button" type="button">Details <ChevronDown size={12} /></button></div><div className="week-progress"><div className="week-progress-ring"><strong>4</strong><span>stories</span></div><div><strong>Nice rhythm</strong><p>You&apos;re one story away from last week&apos;s total.</p></div></div><div className="week-days"><span className="complete">M</span><span className="complete">T</span><span className="complete">W</span><span className="today">T</span><span>F</span><span>S</span><span>S</span></div><div className="week-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></section><section className="panel story-prompt"><span className="quick-action-icon purple"><MessageCircle size={15} /></span><h2 className="panel-title">What&apos;s on your mind?</h2><p>Share a small win, a question, or something the team should know.</p><button className="primary-button" type="button" onClick={openNewComposer}><Plus size={14} /> Start writing</button></section></aside>
      </div>
      {composerOpen && <div className="composer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposerOpen(false); }}><form className="composer-modal" onSubmit={handleStorySubmit} role="dialog" aria-modal="true" aria-labelledby="composer-heading"><div className="composer-header"><div><p className="breadcrumb"><strong>Vida story</strong> <span>/</span> {editingStory ? "Edit entry" : "New entry"}</p><h2 id="composer-heading">{editingStory ? "Edit story" : "Write a story"}</h2></div><button className="icon-button" type="button" aria-label="Close composer" onClick={() => setComposerOpen(false)}>×</button></div><label className="composer-label" htmlFor="story-date">Date</label><input className="composer-input" id="story-date" type="date" value={storyDate} max={DEFAULT_STORY_DATE} onChange={(event) => { setStoryDate(event.target.value); setDateError(""); }} required />{dateError && <p className="field-error" role="alert">{dateError}</p>}<label className="composer-label" htmlFor="story-title">Headline <span>Optional</span></label><input className="composer-input" id="story-title" type="text" value={storyTitle} onChange={(event) => setStoryTitle(event.target.value)} placeholder="Give this update a short title" maxLength={80} /><label className="composer-label" htmlFor="story-content">What happened?</label><textarea className="composer-textarea" id="story-content" value={storyContent} onChange={(event) => setStoryContent(event.target.value)} placeholder="Share a win, a lesson, or what you&apos;re working through..." minLength={10} maxLength={500} required /><div className="composer-footer"><span>{storyContent.length}/500 characters</span><div><button className="secondary-button" type="button" onClick={() => setComposerOpen(false)}>Cancel</button><button className="primary-button" type="submit">{editingStory ? "Save changes" : "Publish story"}</button></div></div></form></div>}
      {selectedStory && <div className="composer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStory(null); }}><article className="story-detail-modal" role="dialog" aria-modal="true" aria-labelledby="story-detail-heading"><div className="composer-header"><div><p className="breadcrumb"><strong>Vida story</strong> <span>/</span> Story detail</p><h2 id="story-detail-heading">{selectedStory.title}</h2></div><button className="icon-button" type="button" aria-label="Close story detail" onClick={() => setSelectedStory(null)}>×</button></div><div className="story-detail-author"><span className={`avatar ${selectedStory.avatar}`}>{selectedStory.initials}</span><span><strong>{selectedStory.author}</strong><small>{selectedStory.date} · {selectedStory.time}</small></span></div><p className="story-detail-content">{selectedStory.content}</p><div className="story-tags">{selectedStory.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="story-detail-footer"><span><Heart size={14} /> {selectedStory.reactions} reactions</span><span><MessageCircle size={14} /> {selectedStory.replies} replies</span></div></article></div>}
      {storyToDelete && <div className="composer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setStoryToDelete(null); }}><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-story-heading" aria-describedby="delete-story-description"><span className="confirm-icon"><Trash2 size={18} /></span><h2 id="delete-story-heading">Delete this story?</h2><p id="delete-story-description">“{storyToDelete.title}” will be removed from your story list. This action cannot be undone.</p><div className="confirm-actions"><button className="secondary-button" type="button" onClick={() => setStoryToDelete(null)}>Cancel</button><button className="danger-button" type="button" onClick={confirmDeleteStory}>Delete story</button></div></div></div>}
    </main>
  </div>;
}

function StoryBrand() {
  return <div className="brand-mark"><span className="brand-icon"><Grid2X2 size={16} strokeWidth={2.2} /></span><span><span className="brand-name">squad<span style={{ color: "#7357f6" }}>.</span></span><span className="brand-caption">team portal</span></span></div>;
}

function StoryNavItem({ item, active = false }: { item: (typeof navigation)[number]; active?: boolean }) {
  const Icon = item.icon;
  return <li><Link className={`nav-item ${active ? "active" : ""}`} href={portalHref(item.label)}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</Link></li>;
}
