import type { LucideIcon } from "lucide-react";

export type QuickAction = {
  title: string;
  caption: string;
  color: string;
  icon: LucideIcon;
};

export default function QuickActions({ actions, onSelect }: { actions: QuickAction[]; onSelect: (title: string) => void }) {
  return <div className="quick-action-grid" aria-label="Quick navigation">
    {actions.map((action) => {
      const Icon = action.icon;
      return <button className="quick-action-card" type="button" key={action.title} onClick={() => onSelect(action.title)}>
        <span className={`quick-action-icon ${action.color}`}><Icon size={15} strokeWidth={1.9} /></span>
        <span className="quick-action-title">{action.title}</span>
        <span className="quick-action-caption">{action.caption}</span>
      </button>;
    })}
  </div>;
}
