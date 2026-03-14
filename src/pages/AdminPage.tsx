import { useState } from "react";
import { isAdminLoggedIn, setAdminLoggedIn } from "@/lib/store";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Header from "@/components/layout/Header";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(isAdminLoggedIn());

  const handleLogin = () => {
    setAdminLoggedIn(true);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setAdminLoggedIn(false);
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAdminLoggedIn={loggedIn} onAdminLogout={handleLogout} />
      {loggedIn ? <AdminDashboard /> : <AdminLogin onSuccess={handleLogin} />}
    </div>
  );
}
