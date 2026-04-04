import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

function DashboardLayout() {
  const [search, setSearch] = useState("");

  return (
    <div className="flex min-h-screen w-full bg-[#E0E6C7] text-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col bg-[#E0E6C7]">
        <Topbar search={search} setSearch={setSearch} />

        <main className="flex-1 w-full bg-[#E0E6C7] px-6 py-8 lg:px-10">
          <div className="w-full">
            <Outlet context={{ search }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
