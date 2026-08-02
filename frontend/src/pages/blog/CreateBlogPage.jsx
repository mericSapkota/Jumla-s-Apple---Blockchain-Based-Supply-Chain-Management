import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import TopAppBar from "../../components/layout/TopAppBar";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { createBlogSchema } from "../../schemas/blogSchemas";
import { createBlog, getBlog, updateBlog } from "../../api/blogApi";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB, matches the backend limit

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only when editing
  const isEditing = Boolean(id);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);

  const fileInputRef = useRef(null);
  const [coverFile, setCoverFile] = useState(null); // newly picked File (if any)
  const [coverPreview, setCoverPreview] = useState(null); // existing path or object URL

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createBlogSchema) });

  useEffect(() => {
    if (!isEditing) return;
    getBlog(id)
      .then((blog) => {
        reset({
          title: blog.title,
          excerpt: blog.excerpt || "",
          content: blog.content,
        });
        if (blog.coverImageUrl) setCoverPreview(blog.coverImageUrl);
      })
      .catch(() => toast.error("Could not load this post for editing"))
      .finally(() => setLoadingExisting(false));
  }, [id, isEditing, reset]);

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5MB or smaller");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateBlog(id, values, coverFile);
        toast.success("Post updated");
        navigate(`/blogs/${id}`);
      } else {
        const created = await createBlog(values, coverFile);
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

            {/* Cover image — direct upload */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                Cover image (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePickImage}
              />
              {coverPreview ? (
                <div className="relative rounded-2xl overflow-hidden group">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-surface text-on-surface text-xs font-bold rounded-full px-4 py-2 shadow"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="bg-error text-on-error text-xs font-bold rounded-full px-4 py-2 shadow"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 rounded-2xl border-2 border-dashed border-outline flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary transition-colors"
                >
                  <Icon name="add_photo_alternate" className="text-4xl" />
                  <span className="text-sm font-medium">Click to upload an image</span>
                  <span className="text-xs text-outline">JPG, PNG or WEBP · up to 5MB</span>
                </button>
              )}
            </div>

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
