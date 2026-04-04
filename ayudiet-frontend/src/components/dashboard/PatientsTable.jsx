import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function PatientsTable({
  patients,
  onDelete,
  formatTrendLabel,
  getTrendTone,
  getTrendMeta,
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.max(1, Math.ceil((patients?.length || 0) / ITEMS_PER_PAGE));

  const paginatedPatients = useMemo(() => {
    const list = patients || [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  }, [patients, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, patients?.length || 0);

  useEffect(() => {
    setCurrentPage(1);
  }, [patients]);

  console.log("Patients count:", patients?.length || 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="inline-block rounded-md bg-yellow-300 px-3 py-1 text-lg font-semibold text-gray-900">
          Patient Intelligence
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Review effectiveness, dominant issue, and trend before opening a case.
        </p>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="border-r border-gray-200 px-4 py-3 text-left">Name</th>
            <th className="border-r border-gray-200 px-4 py-3 text-left">Age</th>
            <th className="border-r border-gray-200 px-4 py-3 text-left">Effectiveness</th>
            <th className="border-r border-gray-200 px-4 py-3 text-left">Primary Issue</th>
            <th className="border-r border-gray-200 px-4 py-3 text-left">Trend</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {!patients || patients.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-6 text-center text-sm text-gray-600">
                No patients found
              </td>
            </tr>
          ) : (
            paginatedPatients.map((patient) => {
            const score = patient.dashboardIntelligence?.score;
            const primaryIssue = patient.dashboardIntelligence?.primaryIssue || "none";
            const trend = patient.dashboardIntelligence?.trend || "stable";
            const trendMeta = getTrendMeta?.(trend);
            const TrendIcon = trendMeta?.icon;

            return (
              <tr
                key={patient._id}
                className="border-t border-gray-200 transition hover:bg-gray-50"
              >
                <td className="border-r border-gray-200 px-4 py-3 text-gray-900">{patient.name}</td>
                <td className="border-r border-gray-200 px-4 py-3 text-gray-600">{patient.age ?? "-"}</td>
                <td className="border-r border-gray-200 px-4 py-3 text-gray-600">
                  {typeof score === "number" ? score : "-"}
                </td>
                <td className="border-r border-gray-200 px-4 py-3 capitalize text-gray-600">
                  {primaryIssue}
                </td>
                <td className="border-r border-gray-200 px-4 py-3 text-gray-600">
                  <div className="inline-flex items-center gap-2">
                    {TrendIcon ? <TrendIcon className="h-4 w-4" /> : null}
                    <span>{formatTrendLabel?.(trend) || trend}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-4">
                    <Link
                      to={`/dashboard/patients/${patient._id}`}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 transition hover:bg-black hover:text-white"
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
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 transition hover:bg-black hover:text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(patient._id)}
                      className="rounded-md bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
            })
          )}
        </tbody>
      </table>

      <div className="mt-4 border-t border-gray-200 px-4 pb-4 pt-3">
        <div className="flex items-center justify-center gap-6 sm:gap-10">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1 || !patients || patients.length === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-800 transition hover:bg-black hover:text-white disabled:opacity-50"
        >
          Prev
        </button>

        {patients && patients.length > 0 && (
          <p className="text-xs text-gray-600">
            Showing {startIndex + 1}-{endIndex} of {patients.length}
          </p>
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || !patients || patients.length === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-800 transition hover:bg-black hover:text-white disabled:opacity-50"
        >
          Next
        </button>
        </div>
      </div>
    </div>
  );
}

export default PatientsTable;

