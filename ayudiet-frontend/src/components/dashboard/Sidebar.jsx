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
    <aside className="w-64 border-r border-gray-300 bg-white p-4 text-gray-900">
        {/* Logo Section */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src={logo}
            alt="AyuDiet Logo"
            className="h-20 w-20 object-contain"
          />
          <h1 className="text-xl font-bold">AyuDiet</h1>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex w-full items-center gap-2 rounded p-2 hover:bg-gray-100"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => navigate("/dashboard/patients")}
            className="flex w-full items-center gap-2 rounded p-2 hover:bg-gray-100"
          >
            <Users size={18} />
            Patients
          </button>

          <button
            onClick={logout}
            className="mt-6 flex w-full items-center gap-2 rounded p-2 hover:bg-gray-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
    </aside>
  );
}

export default Sidebar;
