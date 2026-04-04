import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJson } from "../../services/api";

function AddPatient() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    conditions: "",
    medications: "",
    allergies: "",
    dosha: "",
    dietType: "",
    activityLevel: 3,
    preferences: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.age || !form.gender) {
      setError("Name, age and gender are required");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      await fetchJson("/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          age: Number(form.age),
          gender: form.gender,

          height: form.height ? Number(form.height) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,

          healthConditions: form.conditions,
          medications: form.medications,
          allergies: form.allergies,

          dosha: form.dosha,
          dietType: form.dietType,
          activityLevel: Number(form.activityLevel),

          preferences: form.preferences
            ? form.preferences.split(",").map((p) => p.trim())
            : [],
        }),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm transition-all duration-200 hover:shadow-md">
        <h1 className="mb-10 text-center text-2xl font-semibold text-gray-900">
          Patient Ayurvedic Assessment
        </h1>

        <form onSubmit={handleSubmit} className="space-y-10">

          <Section title="Patient Profile">
            <Input label="Patient Name" name="name" value={form.name} onChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Age" type="number" name="age" value={form.age} onChange={handleChange} />
              <Select label="Gender" name="gender" value={form.gender} onChange={handleChange}
                options={["male", "female", "other"]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Height (cm)" name="height" value={form.height} onChange={handleChange} />
              <Input label="Weight (kg)" name="weight" value={form.weight} onChange={handleChange} />
            </div>
          </Section>

          <Section title="Medical Essentials">
            <Input label="Health Conditions" name="conditions" value={form.conditions} onChange={handleChange} />
            <Input label="Current Medications" name="medications" value={form.medications} onChange={handleChange} />
            <Input label="Known Allergies" name="allergies" value={form.allergies} onChange={handleChange} />
          </Section>

          <Section title="Prakriti Assessment">
            <Select label="Dominant Dosha" name="dosha" value={form.dosha} onChange={handleChange}
              options={["Vata", "Pitta", "Kapha"]}
            />
          </Section>

          <Section title="Lifestyle & Preferences">
            <Select label="Diet Type" name="dietType" value={form.dietType} onChange={handleChange}
              options={["Vegetarian", "Non-Vegetarian", "Vegan"]}
            />

            <Input
              label="Activity Level (1–5)"
              type="number"
              min="1"
              max="5"
              name="activityLevel"
              value={form.activityLevel}
              onChange={handleChange}
            />

            <Input
              label="Preferences"
              name="preferences"
              placeholder="Quick meals, Loves cooking"
              value={form.preferences}
              onChange={handleChange}
            />
          </Section>

          {error && <p className="text-sm text-gray-600">{error}</p>}

          <div className="text-center">
            <button
              disabled={loading}
              className="rounded-md bg-yellow-400 px-4 py-2 font-semibold text-black transition hover:bg-yellow-500"
            >
              {loading ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPatient;

/* ---------------- UI HELPERS ---------------- */

function Section({ title, children }) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <h2 className="text-gray-900 font-semibold">
        {title}
      </h2>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2
        text-sm text-gray-600 placeholder:text-gray-400
        outline-none focus:border-gray-400"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">
        {label}
      </label>

      <select
        {...props}
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2
        text-sm text-gray-600 outline-none focus:border-gray-400"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
