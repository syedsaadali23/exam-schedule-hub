import { useState } from "react";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Header from "@/components/layout/Header";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(
    () => localStorage.getItem("examdesk_admin_auth") === "true"
  );

  const handleLogin = () => {
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("examdesk_admin_auth");
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAdminLoggedIn={loggedIn} onAdminLogout={handleLogout} />
      {loggedIn ? <AdminDashboard /> : <AdminLogin onSuccess={handleLogin} />}
    </div>
  );
}
