import { Link } from "react-router-dom";
import Icon from "../ui/Icon";

function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function BlogCard({ blog }) {
  return (
    <Link
      to={`/blogs/${blog.id}`}
      className="group bg-surface-container-lowest rounded-3xl overflow-hidden shadow-card hover:shadow-soft transition-all flex flex-col"
    >
      <div className="h-44 bg-surface-container-high overflow-hidden">
        {blog.coverImageUrl ? (
          <img
            src={blog.coverImageUrl}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-fixed to-tertiary-fixed">
            <Icon name="forest" className="text-5xl text-primary opacity-50" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-headline text-lg font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="text-sm text-on-surface-variant line-clamp-2">{blog.excerpt}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Icon name="person" size="14px" />
            {blog.authorName}
          </span>
          <span>{formatDate(blog.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
