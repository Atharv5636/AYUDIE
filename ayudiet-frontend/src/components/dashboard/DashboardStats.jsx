import StatCard from "./StatCard";

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard
        title="Happy Patients"
        value="1,248"
        subtitle="Active patients this month"
        trend="+12%"
      />

      <StatCard
        title="New Patients"
        value="256"
        subtitle="Patients added this month"
        trend="+8%"
      />

      <StatCard
        title="Appointments"
        value="342"
        subtitle="Scheduled this month"
        trend="-5%"
        trendType="down"
      />

      <StatCard
        title="Recoveries"
        value="1,102"
        subtitle="Patients recovered"
        trend="+15%"
      />
    </div>
  );
}
