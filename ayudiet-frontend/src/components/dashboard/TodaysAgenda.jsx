import { useState } from "react";
import { useNavigate } from "react-router-dom";
import agendaFrame from "../../assets/agenda-botanical-frame.png";

const initialForm = {
  patientId: "",
  time: "",
  type: "",
  status: "upcoming",
};

const formatTime = (time) => {
  if (!time) return "";

  const parsedDate = new Date(`1970-01-01T${time}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return time;
  }

  return parsedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function TodaysAgenda({
  agenda = [],
  patients = [],
  nextAgendaId,
  onAdd,
  onDelete,
}) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const selectedPatient = patients.find(
      (patient) => patient._id === form.patientId
    );

    if (!selectedPatient || !form.time || !form.type || !form.status) {
      setError("Patient, time, type, and status are required");
      return;
    }

    onAdd({
      id: `agenda-${Date.now()}`,
      patientId: selectedPatient._id,
      name: selectedPatient.name,
      time: form.time,
      type: form.type.trim(),
      status: form.status,
    });

    setForm(initialForm);
    setError("");
    setShowForm(false);
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border-[2px] border-black p-6 shadow-sm"
      style={{
        backgroundImage: `url(${agendaFrame})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="inline-block rounded-md bg-yellow-300 px-3 py-1 text-lg font-semibold text-gray-900">
            Today's Agenda
          </h2>
          <p className="mt-2 inline-block rounded bg-white/90 px-2 py-0.5 text-sm text-gray-800">
            Focus on the next visit and track what is already done.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="shrink-0 whitespace-nowrap rounded bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-800 transition hover:bg-white hover:text-gray-900"
        >
          {showForm ? "Close" : "+ Add New"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 space-y-4 rounded-lg border-[2px] border-gray-200 bg-gray-50 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Patient</span>
              <select
                name="patientId"
                value={form.patientId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-600 outline-none"
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Time</span>
              <input
                name="time"
                type="time"
                value={form.time}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-600 outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Type</span>
              <input
                name="type"
                value={form.type}
                onChange={handleChange}
                placeholder="Consultation"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-600 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-600 outline-none"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
            >
              Add Agenda Item
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setError("");
                setShowForm(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {agenda.length === 0 ? (
          <div className="rounded-lg border-[2px] border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600">
            No agenda items yet. Add one to schedule the next patient interaction.
          </div>
        ) : null}

        {agenda.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border-[2px] border-gray-200 bg-[#FFFDF8] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.id === nextAgendaId && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                      Next
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{item.type}</p>
              </div>

              <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                {item.status === "completed" ? "Completed" : "Upcoming"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <p className="text-gray-600">{formatTime(item.time)}</p>

              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={!item.patientId}
                  onClick={() => {
                    if (!item.patientId) {
                      console.error("Missing patientId for agenda edit", item);
                      return;
                    }

                    console.log("Editing agenda patient:", item);
                    navigate(`/dashboard/patients/${item.patientId}/edit`);
                  }}
                  className="text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  Edit
                </button>

                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TodaysAgenda;

