import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchUsers, deleteUser, verifyUser, approveUser, rejectUser } from "../../api/adminApi";
import AdminTable from "./AdminTable";
import { formatDate } from "../../utils/formatDate";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Icon from "../../components/ui/Icon";

const ROLE_FILTERS = ["ALL", "FARMER", "COOPERATIVE", "TRANSPORTER", "CONSUMER", "SUPERADMIN"];

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchUsers({ role: role === "ALL" ? "" : role, search })
      .then(setUsers)
      .catch(() => toast.error("Could not load users"))
      .finally(() => setLoading(false));
  }, [role, search]);

  // Refetch when the filter changes; debounce the free-text search a little.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleVerify = async (user) => {
    try {
      setLoading(true);
      await verifyUser(user.id);
      toast.success(`${user.fullName} marked as verified`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not verify user");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user) => {
    try {
      setLoading(true);
      await approveUser(user.id);
      toast.success(`${user.fullName} approved, verification email sent`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not approve user");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (user) => {
    if (!window.confirm(`Reject ${user.fullName}'s registration request?`)) return;
    try {
      setLoading(true);
      await rejectUser(user.id);
      toast.success(`${user.fullName}'s request rejected`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not reject user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.fullName} (${user.email})? This cannot be undone.`)) return;
    try {
      setLoading(true);
      await deleteUser(user.id);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete user");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "fullName",
      label: "Name",
      render: (u) => (
        <div>
          <p className="font-bold">{u.fullName}</p>
          <p className="text-xs text-on-surface-variant">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (u) => (
        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
          {u.role}
        </span>
      ),
    },
    {
      key: "emailVerified",
      label: "Verified",
      render: (u) =>
        u.emailVerified ? (
          <span className="inline-flex items-center gap-1 text-primary text-xs font-bold">
            <Icon name="check_circle" size="16px" /> Yes
          </span>
        ) : (
          <span className="text-xs text-on-surface-variant">No</span>
        ),
    },
    {
      key: "approvalStatus",
      label: "Approval",
      render: (u) => {
        const status = u.approvalStatus || "APPROVED";
        const styles = {
          PENDING: "bg-secondary-fixed text-on-secondary-fixed",
          APPROVED: "bg-tertiary-fixed text-on-tertiary-fixed",
          REJECTED: "bg-error-container text-on-error-container",
        };
        return (
          <span
            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              styles[status] || "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    { key: "createdAt", label: "Joined", render: (u) => formatDate(u.createdAt) },
    {
      key: "actions",
      label: "",
      render: (u) =>
        u.role !== "SUPERADMIN" && (
          <div className="flex items-center gap-3 justify-end">
            {u.approvalStatus === "PENDING" ? (
              <>
                <button
                  onClick={() => handleApprove(u)}
                  className="text-xs font-bold text-primary hover:underline whitespace-nowrap"
                >
                  Approve
                </button>
                <button onClick={() => handleReject(u)} className="text-xs font-bold text-error hover:underline">
                  Reject
                </button>
              </>
            ) : (
              <>
                {!u.emailVerified && (
                  <button
                    onClick={() => handleVerify(u)}
                    className="text-xs font-bold text-primary hover:underline whitespace-nowrap"
                  >
                    Verify
                  </button>
                )}
                <button onClick={() => handleDelete(u)} className="text-xs font-bold text-error hover:underline">
                  Delete
                </button>
              </>
            )}
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Superadmin</p>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Users</h1>
      </header>

      <div className="flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-56">
          <Input
            icon="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select options={ROLE_FILTERS} value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="text-on-surface-variant">Loading </p>
      ) : (
        <AdminTable columns={columns} rows={users} emptyMessage="No users match this filter." />
      )}
    </div>
  );
}
