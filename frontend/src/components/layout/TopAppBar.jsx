import { Link, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";
import { useAuth, roleHomePath } from "../../auth/AuthContext";

function NavLink({ to, icon, children, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
        active
          ? "bg-primary-fixed text-black"
          : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
      }`}
    >
      <Icon name={icon} size="18px" />
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}

export default function TopAppBar({ title = "Jumla Trace" }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const goToLandingPage = () => {
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#fcf9f3]/95 backdrop-blur-xl shadow-card flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
      <div onClick={goToLandingPage} className="flex items-center gap-3 shrink-0 cursor-pointer">
        <Logo className="h-7 w-7 md:h-9 md:w-9" />
        <h1 className="font-headline text-sm md:text-3xl font-bold tracking-tight text-primary">{title}</h1>
      </div>

      {user && (
        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink to={roleHomePath(user.role)} icon="dashboard" active={location.pathname === roleHomePath(user.role)}>
            Dashboard
          </NavLink>
          <NavLink to="/batches/history" icon="receipt_long" active={location.pathname === "/batches/history"}>
            History
          </NavLink>
          <NavLink to="/blogs" icon="auto_stories" active={location.pathname.startsWith("/blogs")}>
            Blog
          </NavLink>
          <NavLink to="/profile" icon="person" active={location.pathname === "/profile"}>
            Profile
          </NavLink>
        </nav>
      )}

      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <>
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-xs font-bold text-on-surface">{user.fullName || user.email}</span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-error active:scale-95 transition-all"
              aria-label="Log out"
              title="Log out"
            >
              <Icon name="logout" />
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm font-bold text-primary hover:underline">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
