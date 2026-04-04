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
      bg-white border-b border-gray-300"
    >
      {/* LEFT */}
      <h1 className="text-sm text-gray-700">
        Welcome back, Doctor 
      </h1>

      {/* CENTER: SEARCH */}
      <input
        type="text"
        placeholder="Search patients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2
        text-sm text-gray-900 outline-none focus:border-gray-500 w-64"
      />

      {/* RIGHT */}
      <button
        onClick={handleLogout}
        className="text-sm text-gray-700 hover:text-gray-900 transition"
      >
        Logout
      </button>
    </header>
  );
}

export default Topbar;
