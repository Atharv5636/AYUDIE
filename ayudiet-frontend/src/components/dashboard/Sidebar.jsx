import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-[] border-r border-neutral-800 p-4 text-white">
      
      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-6">
        <img
          src={logo}
          alt="AyuDiet Logo"
          className="w-20 h-20 object-contain"
        />
        <h1 className="text-xl font-bold">AyuDiet</h1>
      </div>

      <nav className="space-y-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <button
          onClick={() => navigate("/dashboard/patients")}
          className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700"
        >
          <Users size={18} />
          Patients
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-2 w-full p-2 rounded hover:bg-red-600 mt-6"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
