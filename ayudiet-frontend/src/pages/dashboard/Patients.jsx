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
    <div>
      <h1 className="text-2xl font-bold mb-4 text-white">Patients</h1>

      {patients.length === 0 ? (
        <p className="text-gray-400">No patients found</p>
      ) : (
        patients.map((p) => (
          <div
            key={p._id}
            className="flex justify-between items-center p-4 bg-neutral-800 rounded mb-2"
          >
            <div>
              <p className="font-semibold text-white">{p.name}</p>
              <p className="text-sm text-gray-400">Age: {p.age}</p>
            </div>

            <div className="flex gap-2">
              {/* VIEW BUTTON */}
              <button
                onClick={() => navigate(`/dashboard/patients/${p._id}`)}
                className="px-4 py-2 bg-blue-600 rounded text-white"
              >
                View
              </button>

              {/* EDIT BUTTON */}
              <button
                onClick={() => navigate(`/dashboard/patients/${p._id}/edit`)}
                className="px-4 py-2 bg-green-600 rounded text-white"
              >
                Edit
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Patients;
