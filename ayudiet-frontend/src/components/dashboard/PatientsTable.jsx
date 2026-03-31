import { Link, useNavigate } from "react-router-dom";

function PatientsTable({
  patients,
  onDelete,
  formatTrendLabel,
  getTrendTone,
  getTrendMeta,
}) {
  const navigate = useNavigate();

  console.log("Patients count:", patients?.length || 0);

  if (!patients || patients.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-sm text-neutral-400">No patients found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Patient Intelligence</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Review effectiveness, dominant issue, and trend before opening a case.
        </p>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-neutral-800 text-neutral-300">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Age</th>
            <th className="px-4 py-3 text-left">Effectiveness</th>
            <th className="px-4 py-3 text-left">Primary Issue</th>
            <th className="px-4 py-3 text-left">Trend</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {patients.map((patient) => {
            const score = patient.dashboardIntelligence?.score;
            const primaryIssue = patient.dashboardIntelligence?.primaryIssue || "none";
            const trend = patient.dashboardIntelligence?.trend || "stable";
            const trendMeta = getTrendMeta?.(trend);
            const TrendIcon = trendMeta?.icon;

            return (
              <tr
                key={patient._id}
                className="border-t border-neutral-800 transition hover:bg-neutral-800/50"
              >
                <td className="px-4 py-3 text-white">{patient.name}</td>
                <td className="px-4 py-3 text-neutral-300">{patient.age ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-300">
                  {typeof score === "number" ? score : "-"}
                </td>
                <td className="px-4 py-3 capitalize text-neutral-300">
                  {primaryIssue}
                </td>
                <td className={`px-4 py-3 ${getTrendTone?.(trend) || "text-neutral-300"}`}>
                  <div className="inline-flex items-center gap-2">
                    {TrendIcon ? <TrendIcon className="h-4 w-4" /> : null}
                    <span>{formatTrendLabel?.(trend) || trend}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-4">
                    <Link
                      to={`/dashboard/patients/${patient._id}`}
                      className="text-secondary hover:underline"
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        console.log("Editing patient:", patient);

                        if (!patient?._id) {
                          console.error("Missing patient ID for edit navigation", patient);
                          return;
                        }

                        navigate(`/dashboard/patients/${patient._id}/edit`);
                      }}
                      className="text-blue-400 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(patient._id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PatientsTable;
