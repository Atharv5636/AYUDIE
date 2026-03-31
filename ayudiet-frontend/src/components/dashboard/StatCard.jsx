export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendType = "up", // "up" | "down"
}) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md p-6 border border-white/20">
      <p className="text-sm text-purple-300">{title}</p>

      <div className="flex items-end gap-3 mt-2">
        <h2 className="text-3xl font-semibold text-white">{value}</h2>

        {trend && (
          <span
            className={`text-sm ${
              trendType === "up" ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
