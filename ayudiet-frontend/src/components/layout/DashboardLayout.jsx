import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

function DashboardLayout() {
  // ✅ SEARCH STATE LIVES HERE
  const [search, setSearch] = useState("");

  return (
    <div className="flex min-h-screen w-full bg-dark text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col bg-dark">
        {/* PASS SEARCH TO TOPBAR */}
        <Topbar search={search} setSearch={setSearch} />

        <main
          className="relative flex-1 w-full bg-cover bg-center px-6 py-8 lg:px-10"
          style={{
            backgroundImage: "url('/src/assets/dashbg1.png')",
          }}
        >
          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/70"></div>

          {/* CONTENT */}
          <div className="relative z-10 w-full">
            {/* 🚨 THIS WAS THE MISSING PART */}
            <Outlet context={{ search }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
