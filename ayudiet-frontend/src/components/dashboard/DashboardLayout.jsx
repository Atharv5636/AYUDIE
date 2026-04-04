import { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../dashboard/Topbar";

function DashboardLayout() {
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-gray-900">
      <Topbar search={search} setSearch={setSearch} />
      <main className="p-6">
        <Outlet context={{ search }} />
      </main>
    </div>
  );
}

export default DashboardLayout;
