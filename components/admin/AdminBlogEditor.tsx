
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Save,
  Send,
  AlertCircle,
} from 'lucide-react';

interface BlogData {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  excerpt?: string;
  content: string;
  tags?: string[];
  isPublished: boolean;
}

interface AdminBlogEditorProps {
  postId?: string;
}

type SaveIntent = 'save' | 'draft' | 'publish';

function generateSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 160)
    .replace(/-+$/, '');
}

export default function AdminBlogEditor({
  postId,
}: AdminBlogEditorProps) {
  const router = useRouter();

  const isEditing = Boolean(postId);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [loadingPost, setLoadingPost] = useState(isEditing);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load an existing article when the editor is in edit mode.
  useEffect(() => {
    if (!postId) {
      setLoadingPost(false);
      return;
    }

    const controller = new AbortController();

    async function loadPost() {
      setLoadingPost(true);
      setLoadFailed(false);
      setError('');

      try {
        const response = await fetch(
          `/api/admin/blogs/${encodeURIComponent(postId!)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load this blog post.'
          );
        }

        const blog = data.blog as BlogData;

        if (!blog || !blog._id) {
          throw new Error('The blog post response was invalid.');
        }

        setTitle(blog.title || '');
        setSlug(blog.slug || '');
        setSlugEdited(true);
        setCoverImage(blog.coverImage || '');
        setExcerpt(blog.excerpt || '');
        setContent(blog.content || '');
        setTagsInput((blog.tags || []).join(', '));
        setIsPublished(Boolean(blog.isPublished));
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === 'AbortError'
        ) {
          return;
        }

        setLoadFailed(true);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load this blog post.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPost(false);
        }
      }
    }

    void loadPost();

    return () => controller.abort();
  }, [postId]);

  async function savePost(intent: SaveIntent) {
    setSaving(true);
    setError('');

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const publish =
      intent === 'publish'
        ? true
        : intent === 'draft'
          ? false
          : isPublished;

    try {
      const response = await fetch(
        isEditing
          ? `/api/admin/blogs/${encodeURIComponent(postId!)}`
          : '/api/blogs',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            slug: slug.trim(),
            coverImage: coverImage.trim(),
            excerpt: excerpt.trim(),
            content: content.trim(),
            tags,
            isPublished: publish,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to save the blog post.'
        );
      }

      router.push('/admin/blogs');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save the blog post.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitter = (
      event.nativeEvent as SubmitEvent
    ).submitter as HTMLButtonElement | null;

    const intent = (submitter?.value || 'save') as SaveIntent;

    void savePost(intent);
  }

  const disableActions = saving || loadingPost || loadFailed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin/blogs"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e63329]"
        >
          <ArrowLeft size={15} />
          Back to blog management
        </Link>

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e63329]">
            <FileText size={15} />
            Administration
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            {isEditing ? 'Edit blog post' : 'Create blog post'}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {isEditing
              ? 'Update your article and publication status.'
              : 'Write an article for the Unboxarts community.'}
          </p>

          {isEditing && !loadingPost && !loadFailed && (
            <p className="mt-2 text-xs text-gray-500">
              Current status:{' '}
              <span
                className={`font-semibold ${
                  isPublished ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </p>
          )}
        </div>

        {loadingPost && (
          <div className="mb-6 border border-gray-200 bg-white p-5 text-sm text-gray-500">
            Loading article...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-5 border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Article details
            </h2>

            <div>
              <label
                htmlFor="blog-title"
                className="mb-2 block text-xs font-semibold text-gray-700"
              >
                Article title *
              </label>

              <input
                id="blog-title"
                type="text"
                required
                maxLength={150}
                value={title}
                onChange={(event) => {
                  const value = event.target.value;
                  setTitle(value);

                  if (!slugEdited) {
                    setSlug(generateSlug(value));
                  }
                }}
                placeholder="Enter your article title"
                disabled={loadingPost || loadFailed}
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329] disabled:bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor="blog-slug"
                className="mb-2 block text-xs font-semibold text-gray-700"
              >
                URL slug *
              </label>

              <input
                id="blog-slug"
                type="text"
                required
                maxLength={160}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugEdited(true);
                }}
                placeholder="your-article-url"
                disabled={loadingPost || loadFailed}
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329] disabled:bg-gray-50"
              />

              <p className="mt-2 text-xs text-gray-400">
                Your article URL will be /blog/{slug || 'your-article-url'}.
                Use lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div>
              <label
                htmlFor="blog-cover"
                className="mb-2 block text-xs font-semibold text-gray-700"
              >
                Cover image URL *
              </label>

              <input
                id="blog-cover"
                type="url"
                required
                value={coverImage}
                onChange={(event) =>
                  setCoverImage(event.target.value)
                }
                placeholder="https://..."
                disabled={loadingPost || loadFailed}
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329] disabled:bg-gray-50"
              />

              <p className="mt-2 text-xs text-gray-400">
                Use a secure HTTPS image URL.
              </p>

              {coverImage.startsWith('https://') && (
                <div className="mt-3 aspect-[16/9] max-h-64 overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={coverImage}
                    src={coverImage}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="blog-excerpt"
                className="mb-2 block text-xs font-semibold text-gray-700"
              >
                Short excerpt
              </label>

              <textarea
                id="blog-excerpt"
                rows={3}
                maxLength={300}
                value={excerpt}
                onChange={(event) =>
                  setExcerpt(event.target.value)
                }
                placeholder="A short introduction to your article..."
                disabled={loadingPost || loadFailed}
                className="w-full resize-y border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329] disabled:bg-gray-50"
              />

              <p className="mt-1 text-right text-[11px] text-gray-400">
                {excerpt.length}/300
              </p>
            </div>

            <div>
              <label
                htmlFor="blog-tags"
                className="mb-2 block text-xs font-semibold text-gray-700"
              >
                Tags
              </label>

              <input
                id="blog-tags"
                type="text"
                value={tagsInput}
                onChange={(event) =>
                  setTagsInput(event.target.value)
                }
                placeholder="Art, Painting, Artists, Inspiration"
                disabled={loadingPost || loadFailed}
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329] disabled:bg-gray-50"
              />

              <p className="mt-1 text-xs text-gray-400">
                Separate tags with commas. Maximum 30 tags.
              </p>
            </div>
          </section>

          <section className="space-y-4 border border-gray-200 bg-white p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Article content
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Write your article below. Paragraphs and line breaks
                will be preserved in the editor.
              </p>
            </div>

            <div>
              <label
                htmlFor="blog-content"
                className="mb-2 block text-xs font-semibold text-gray-700"
              >
                Content *
              </label>

              <textarea
                id="blog-content"
                required
                rows={18}
                maxLength={50000}
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Start writing your article..."
                disabled={loadingPost || loadFailed}
                className="w-full resize-y border border-gray-200 px-3 py-3 text-sm leading-7 outline-none focus:border-[#e63329] disabled:bg-gray-50"
              />

              <p className="mt-1 text-right text-[11px] text-gray-400">
                {content.length}/50000
              </p>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href="/admin/blogs"
              className="inline-flex items-center justify-center border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-gray-500"
            >
              Cancel
            </Link>

            {isEditing && (
              <button
                type="submit"
                name="intent"
                value="save"
                disabled={disableActions}
                className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            )}

            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={disableActions}
              className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save as draft'}
            </button>

            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={disableActions}
              className="inline-flex items-center justify-center gap-2 bg-[#e63329] px-5 py-3 text-sm font-semibold text-white hover:bg-[#c92b22] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={15} />
              {saving ? 'Saving...' : 'Publish now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
