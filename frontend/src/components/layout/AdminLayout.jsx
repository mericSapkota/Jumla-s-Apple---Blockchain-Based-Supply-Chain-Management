import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "monitoring" },
  { key: "users", label: "Users", icon: "group" },
  { key: "batches", label: "Batches", icon: "package_2" },
  { key: "blogs", label: "Blogs", icon: "article" },
  { key: "donations", label: "Donations", icon: "volunteer_activism" },
  { key: "chat", label: "AI Chat", icon: "forum" },
];

export default function AdminLayout({ active, onNavigate, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <Logo size={36} />
          <div>
            <p className="font-headline font-bold text-primary leading-tight">Jumla Trace</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Superadmin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                active === item.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <Icon name={item.icon} size="20px" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-outline-variant/20 space-y-3">
          <div>
            <p className="text-sm font-bold text-on-surface truncate">{user?.fullName || "Admin"}</p>
            <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-error hover:underline"
          >
            <Icon name="logout" size="18px" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-x-hidden">{children}</main>
    </div>
  );
}
