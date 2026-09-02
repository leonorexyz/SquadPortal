export type ProductivityMember = {
  name: string;
  value: number;
  color: string;
};

function getChartBackground(members: ProductivityMember[]) {
  return `conic-gradient(${members
    .map((member, index) => {
      const start = members.slice(0, index).reduce((total, current) => total + current.value, 0);
      return `${member.color} ${start}% ${start + member.value}%`;
    })
    .join(", ")})`;
}

export default function ProductivityPieChart({ members, period }: { members: ProductivityMember[]; period: string }) {
  const summary = members.map((member) => `${member.name}: ${member.value}%`).join(", ");

  return <div className="productivity-content">
    <div className="productivity-chart" style={{ background: getChartBackground(members) }} role="img" aria-label={`Team activity distribution for ${period.toLowerCase()}. ${summary}.`}>
      <div className="chart-center"><span className="chart-total">100%</span><span className="chart-label">team activity</span></div>
    </div>
    <div className="member-list" aria-label="Productivity by team member">
      {members.map((member) => (
        <div className="member-row" key={member.name}>
          <span className="member-dot" style={{ background: member.color }} />
          <span className="member-name">{member.name}</span>
          <span className="member-value">{member.value}%</span>
          <div className="member-progress" aria-hidden="true"><span style={{ width: `${member.value * 3.125}%`, background: member.color }} /></div>
        </div>
      ))}
    </div>
  </div>;
}
