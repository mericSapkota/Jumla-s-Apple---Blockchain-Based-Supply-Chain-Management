import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import TopAppBar from "../../components/layout/TopAppBar";
import BlogCard from "../../components/blog/BlogCard";
import Icon from "../../components/ui/Icon";
import { getBlogs } from "../../api/blogApi";
import { useAuth } from "../../auth/AuthContext";

export default function BlogListPage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogs()
      .then((data) => setBlogs(data.content || data))
      .catch(() => toast.error("Could not load blog posts", { id: "blogs-load-error" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface pb-16">
      <TopAppBar title="Jumla Trace" />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-5xl mx-auto space-y-8">
        <section className="flex items-end justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <button
              onClick={() => window.history.back()}
              className="text-sm font-bold block text-primary hover:underline"
            >
              <span class="material-symbols-outlined">arrow_back</span>Go back
            </button>
            <div className="flex items-center gap-2">
              <br></br>
              <span className="w-2 h-2 rounded-full bg-role-accent" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                Stories from the orchard
              </span>
            </div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Jumla Trace Blog</h2>
          </div>
          {user && (
            <Link
              to="/blogs/new"
              className="flex items-center gap-2 bg-primary text-on-primary font-bold rounded-2xl py-3 px-5 text-sm shadow-soft hover:bg-primary-container active:scale-[0.98] transition-all"
            >
              <Icon name="edit" size="18px" />
              Write a post
            </Link>
          )}
        </section>

        {loading ? (
          <div className="bg-surface-container-lowest rounded-3xl shadow-card p-10 text-center text-on-surface-variant text-sm">
            Loading posts…
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl shadow-card p-10 text-center space-y-2">
            <Icon name="auto_stories" className="text-4xl text-outline-variant" />
            <p className="text-sm text-on-surface-variant">No posts yet — be the first to write one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
