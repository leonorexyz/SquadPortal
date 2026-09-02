import { ArrowUpRight, Heart, MessageCircle, MoreHorizontal, Trash2 } from "lucide-react";

export type Story = {
  id: string;
  author: string;
  initials: string;
  avatar: string;
  date: string;
  storyDate: string;
  time: string;
  title: string;
  content: string;
  tags: string[];
  reactions: number;
  replies: number;
};

export default function StoryList({ stories, onSelectStory, onEditStory, onDeleteStory }: { stories: Story[]; onSelectStory?: (story: Story) => void; onEditStory?: (story: Story) => void; onDeleteStory?: (story: Story) => void }) {
  if (stories.length === 0) return <p className="empty-search">No stories match your filters.</p>;

  return <div className="story-list">
    {stories.map((story) => <StoryCard key={story.id} story={story} onSelect={onSelectStory} onEdit={onEditStory} onDelete={onDeleteStory} />)}
  </div>;
}

function StoryCard({ story, onSelect, onEdit, onDelete }: { story: Story; onSelect?: (story: Story) => void; onEdit?: (story: Story) => void; onDelete?: (story: Story) => void }) {
  return <article className="story-card"><div className="story-card-header"><span className={`avatar avatar-small ${story.avatar}`}>{story.initials}</span><div><strong>{story.author}</strong><span>{story.date} · {story.time}</span></div><div className="story-card-actions"><button className="task-menu" type="button" aria-label={`Edit ${story.title}`} onClick={() => onEdit?.(story)}><MoreHorizontal size={16} /></button>{onDelete && <button className="task-menu danger" type="button" aria-label={`Delete ${story.title}`} onClick={() => onDelete(story)}><Trash2 size={14} /></button>}</div></div><h3>{story.title}</h3><p className="story-card-content">{story.content}</p><div className="story-card-footer"><div className="story-tags">{story.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="story-reactions"><button type="button" aria-label={`Like story from ${story.author}`}><Heart size={13} /> {story.reactions}</button><button type="button" aria-label={`${story.replies} replies`}><MessageCircle size={13} /> {story.replies}</button></div>{onSelect && <button className="story-read-more" type="button" onClick={() => onSelect(story)}>Read full story <ArrowUpRight size={12} /></button>}</div></article>;
}
