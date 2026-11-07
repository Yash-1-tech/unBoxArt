'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Save,
  Send,
  AlertCircle,
} from 'lucide-react';

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

export default function AdminBlogEditor() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function savePost(publish: boolean) {
    setSaving(true);
    setError('');

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
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
      });

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitter = (
      event.nativeEvent as SubmitEvent
    ).submitter as HTMLButtonElement | null;

    void savePost(submitter?.value === 'publish');
  }

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
            Create blog post
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Write an article for the Unboxarts community.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
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
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329]"
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
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329]"
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
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329]"
              />

              <p className="mt-2 text-xs text-gray-400">
                Use a secure HTTPS image URL.
              </p>

              {coverImage.startsWith('https://') && (
                <div className="mt-3 aspect-[16/9] max-h-64 overflow-hidden bg-gray-100">
                  <img
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
                className="w-full resize-y border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329]"
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
                className="w-full border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#e63329]"
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
                className="w-full resize-y border border-gray-200 px-3 py-3 text-sm leading-7 outline-none focus:border-[#e63329]"
              />

              <p className="mt-1 text-right text-[11px] text-gray-400">
                {content.length}/50000
              </p>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/blogs"
              className="inline-flex items-center justify-center border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-gray-500"
            >
              Cancel
            </Link>

            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save as draft'}
            </button>

            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={saving}
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
