import { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../dashboard/Topbar";

function DashboardLayout() {
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* TOP NAV */}
      <Topbar search={search} setSearch={setSearch} />

      {/* IMPORTANT PART 👇 */}
      <main className="p-6">
        <Outlet context={{ search }} />
      </main>
    </div>
  );
}

export default DashboardLayout;
