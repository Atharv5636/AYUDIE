import { useState } from "react";
import { fetchJson } from "../../services/api";

function PatientsSection() {
  const [patients, setPatients] = useState([]);
  const [message, setMessage] = useState("");

  const fetchPatients = async () => {
    const token = localStorage.getItem("token");

    try {
      const data = await fetchJson("/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPatients(data.patients);
    } catch (error) {
      setMessage(error.message || "Error fetching patients");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Patients</h2>

      <div className="flex gap-3">
        <button
          onClick={fetchPatients}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Fetch Patients
        </button>

        <button
          onClick={handleLogout}
          className="px-4 py-2 border rounded-md"
        >
          Logout
        </button>
      </div>
    </div>

    {message && (
      <p className="text-sm text-muted-foreground">{message}</p>
    )}

    {/* Patients Grid */}
    {patients.length === 0 ? (
      <div className="text-muted-foreground">
        No patients found
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((p) => (
          <div
            key={p._id}
            className="rounded-lg border bg-background p-4 shadow-sm"
          >
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-muted-foreground">
              Age: {p.age}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

}

export default PatientsSection;
