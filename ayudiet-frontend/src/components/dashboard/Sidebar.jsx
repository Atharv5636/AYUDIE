import { LayoutDashboard, Users, Table2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/sidebar-logo.png";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white p-4 text-gray-900 shadow-sm transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
            onClick={() => {
              navigate("/dashboard");
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => {
              navigate("/dashboard/patients");
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <Users size={18} />
            Patients
          </button>

          <button
            onClick={() => {
              navigate("/dashboard/patients-table");
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <Table2 size={18} />
            Patients Table
          </button>

          <button
            onClick={logout}
            className="mt-6 flex w-full items-center gap-2 rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
