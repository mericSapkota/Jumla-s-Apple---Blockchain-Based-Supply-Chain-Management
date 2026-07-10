import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchAllBlogs, deleteBlog } from "../../api/adminApi";
import AdminTable from "./AdminTable";
import { formatDate } from "../../utils/formatDate";

export default function BlogsTab() {
  const [blogs, setBlogs] = useState(null);

  const load = useCallback(() => {
    fetchAllBlogs()
      .then(setBlogs)
      .catch(() => toast.error("Could not load blogs"));
  }, []);

  useEffect(load, [load]);

  const handleDelete = async (blog) => {
    if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      await deleteBlog(blog.id);
      toast.success("Blog post deleted");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete blog post");
    }
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (b) => (
        <Link to={`/blogs/${b.id}`} className="font-bold text-primary hover:underline">
          {b.title}
        </Link>
      ),
    },
    {
      key: "authorName",
      label: "Author",
      render: (b) => (
        <div>
          <p>{b.authorName || "—"}</p>
          <p className="text-xs text-on-surface-variant">{b.authorEmail}</p>
        </div>
      ),
    },
    { key: "createdAt", label: "Published", render: (b) => formatDate(b.createdAt) },
    {
      key: "actions",
      label: "",
      render: (b) => (
        <button onClick={() => handleDelete(b)} className="text-xs font-bold text-error hover:underline">
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Superadmin</p>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Blogs</h1>
      </header>

      {blogs === null ? (
        <p className="text-on-surface-variant">Loading blogs…</p>
      ) : (
        <AdminTable columns={columns} rows={blogs} emptyMessage="No blog posts yet." />
      )}
    </div>
  );
}
