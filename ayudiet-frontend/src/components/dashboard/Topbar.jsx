import { useNavigate } from "react-router-dom";

function Topbar({ search, setSearch }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header
      className="h-16 px-6 flex items-center justify-between
      bg-black border-b border-neutral-800"
    >
      {/* LEFT */}
      <h1 className="text-sm text-neutral-300">
        Welcome back, Doctor 
      </h1>

      {/* CENTER: SEARCH */}
      <input
        type="text"
        placeholder="Search patients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2
        text-sm text-white outline-none focus:border-neutral-500 w-64"
      />

      {/* RIGHT */}
      <button
        onClick={handleLogout}
        className="text-sm text-neutral-300 hover:text-white transition"
      >
        Logout
      </button>
    </header>
  );
}

export default Topbar;
