export const getTrend = (previous, current) => {
  if (previous == null || current == null) return "stable";

  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
};

export const getTrendLabel = (trend) => {
  if (trend === "up") return "Improving";
  if (trend === "down") return "Declining";
  return "Stable";
};

export const getTrendColor = (trend) => {
  if (trend === "up") return "#16a34a";
  if (trend === "down") return "#dc2626";
  return "#111827";
};
