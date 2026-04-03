import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJson } from "../../services/api";

function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const token = localStorage.getItem("token");
        const data = await fetchJson("/patients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPatients(data.patients);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    }

    fetchPatients();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Patients</h1>

      {patients.length === 0 ? (
        <p className="text-gray-600">No patients found</p>
      ) : (
        <div className="rounded-2xl bg-[#c8d6b7] p-4">
          <div className="space-y-3">
            {patients.map((p) => (
              <div
                key={p._id}
                className="w-full rounded-xl border border-gray-300/60 bg-[#F7F7F5] p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-600">Age: {p.age}</p>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start sm:self-center">
                    {/* VIEW BUTTON */}
                    <button
                      onClick={() => navigate(`/dashboard/patients/${p._id}`)}
                      className="min-w-[84px] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 transition-all duration-200 hover:bg-gray-900 hover:text-white"
                    >
                      View
                    </button>

                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => navigate(`/dashboard/patients/${p._id}/edit`)}
                      className="min-w-[84px] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 transition-all duration-200 hover:bg-gray-900 hover:text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
