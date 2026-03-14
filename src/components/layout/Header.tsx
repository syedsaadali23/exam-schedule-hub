import { Link, useLocation } from "react-router-dom";
import { GraduationCap, User, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onAdminLogout?: () => void;
  isAdminLoggedIn?: boolean;
}

export default function Header({ onAdminLogout, isAdminLoggedIn }: HeaderProps) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <header className="print-hidden sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">ExamDesk</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button
            variant={!isAdmin ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/">
              <User className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Student View</span>
            </Link>
          </Button>
          <Button
            variant={isAdmin ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin">
              <Shield className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Admin</span>
            </Link>
          </Button>
          {isAdmin && isAdminLoggedIn && (
            <Button variant="ghost" size="sm" onClick={onAdminLogout}>
              <LogOut className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Logout</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
