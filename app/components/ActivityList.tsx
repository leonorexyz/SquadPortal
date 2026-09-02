export type Activity = {
  initials: string;
  avatar: string;
  person: string;
  action: string;
  item: string;
  time: string;
  type: "story" | "ticket" | "task" | "knowledge";
  typeLabel: string;
};

export default function ActivityList({ activities }: { activities: Activity[] }) {
  return <div className="activity-list" aria-label="Recent team activity">
    {activities.map((activity) => <div className="activity-row" key={`${activity.person}-${activity.time}`}>
      <span className={`avatar avatar-small ${activity.avatar}`}>{activity.initials}</span>
      <div className="activity-content"><p className="activity-text"><strong>{activity.person}</strong> {activity.action} <strong>{activity.item}</strong></p><span className={`activity-tag ${activity.type}`}>{activity.typeLabel}</span></div>
      <span className="activity-time">{activity.time}</span>
    </div>)}
  </div>;
}
