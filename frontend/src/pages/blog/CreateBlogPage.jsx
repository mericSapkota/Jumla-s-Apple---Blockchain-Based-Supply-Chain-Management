import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import TopAppBar from "../../components/layout/TopAppBar";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { createBlogSchema } from "../../schemas/blogSchemas";
import { createBlog, getBlog, updateBlog } from "../../api/blogApi";

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only when editing
  const isEditing = Boolean(id);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createBlogSchema) });

  useEffect(() => {
    if (!isEditing) return;
    getBlog(id)
      .then((blog) =>
        reset({
          title: blog.title,
          coverImageUrl: blog.coverImageUrl || "",
          excerpt: blog.excerpt || "",
          content: blog.content,
        })
      )
      .catch(() => toast.error("Could not load this post for editing"))
      .finally(() => setLoadingExisting(false));
  }, [id, isEditing, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateBlog(id, values);
        toast.success("Post updated");
        navigate(`/blogs/${id}`);
      } else {
        const created = await createBlog(values);
        toast.success("Post published");
        navigate(`/blogs/${created.id}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save post");
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <TopAppBar title="Jumla Trace" />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-2xl mx-auto space-y-6">
        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
          {isEditing ? "Edit post" : "Write a new post"}
        </h2>

        {loadingExisting ? (
          <div className="bg-surface-container-lowest rounded-3xl shadow-card p-10 text-center text-on-surface-variant text-sm">
            Loading…
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-surface-container-lowest rounded-3xl shadow-card p-6 sm:p-8 space-y-5"
          >
            <Input
              label="Title"
              placeholder="What's this post about?"
              error={errors.title?.message}
              {...register("title")}
            />
            <Input
              label="Cover image URL (optional)"
              icon="image"
              placeholder="https://..."
              error={errors.coverImageUrl?.message}
              {...register("coverImageUrl")}
            />
            <Input
              label="Short excerpt (optional)"
              placeholder="One or two sentences for the blog list preview"
              error={errors.excerpt?.message}
              {...register("excerpt")}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                Content
              </label>
              <textarea
                rows={10}
                placeholder="Tell the story…"
                className={`w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-fixed outline-none transition-all ${
                  errors.content ? "ring-2 ring-error/50" : ""
                }`}
                {...register("content")}
              />
              {errors.content && (
                <p className="text-xs text-error px-1">{errors.content.message}</p>
              )}
            </div>

            <Button type="submit" icon="publish" loading={isSubmitting} className="w-full">
              {isEditing ? "Save changes" : "Publish post"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
