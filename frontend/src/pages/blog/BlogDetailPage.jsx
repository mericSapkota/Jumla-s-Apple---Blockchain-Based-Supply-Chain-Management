import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import TopAppBar from "../../components/layout/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { getBlog, deleteBlog } from "../../api/blogApi";
import { useAuth } from "../../auth/AuthContext";

function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getBlog(id)
      .then(setBlog)
      .catch(() => toast.error("Could not load this post", { id: "blog-detail-error" }))
      .finally(() => setLoading(false));
  }, [id]);

  const isAuthor = blog && user && blog.authorEmail === user.email;

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteBlog(id);
      toast.success("Post deleted");
      navigate("/blogs");
    } catch {
      toast.error("Could not delete post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <TopAppBar title="Jumla Trace" />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-2xl mx-auto space-y-6">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <Icon name="arrow_back" size="18px" />
          Back to all posts
        </Link>

        {loading ? (
          <div className="bg-surface-container-lowest rounded-3xl shadow-card p-10 text-center text-on-surface-variant text-sm">
            Loading post…
          </div>
        ) : !blog ? (
          <div className="bg-surface-container-lowest rounded-3xl shadow-card p-10 text-center text-on-surface-variant text-sm">
            Post not found.
          </div>
        ) : (
          <article className="bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden">
            {blog.coverImageUrl && (
              <img src={blog.coverImageUrl} alt={blog.title} className="w-full h-64 object-cover" />
            )}
            <div className="p-6 sm:p-8 space-y-6">
              <header className="space-y-3">
                <h1 className="font-headline text-3xl font-bold text-on-surface leading-tight">{blog.title}</h1>
                <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <Icon name="person" size="16px" />
                    {blog.authorName}
                    <span className="mx-1">·</span>
                    {formatDate(blog.createdAt)}
                  </span>
                  {isAuthor && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/blogs/${blog.id}/edit`}
                        className="flex items-center gap-1.5 text-primary font-bold hover:underline"
                      >
                        <Icon name="edit" size="16px" />
                        Edit
                      </Link>
                      <Button
                        variant="danger"
                        icon="delete"
                        loading={deleting}
                        onClick={handleDelete}
                        className="!py-1.5 !px-3 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </header>

              <div className="prose prose-sm max-w-none text-on-surface whitespace-pre-wrap leading-relaxed">
                {blog.content}
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
