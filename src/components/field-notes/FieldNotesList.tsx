'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Post = {
  slug: string;
  url: string;
  title?: string;
  description?: string;
  date?: string;
  category?: string;
};

const categories = ['ALL', 'BUSINESS', 'TECHNOLOGY', 'AI', 'BUILD', 'AFRICA', 'INNOVATION'] as const;

export function FieldNotesList({ posts }: { posts: Post[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [listRef] = useAutoAnimate({ duration: 250 });

  const filtered = useMemo(() => {
    if (activeCategory === 'ALL') return posts;
    return posts.filter((post) => post.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <>
      <div className="mb-12 flex flex-wrap gap-x-5 gap-y-3 border-b border-kh-rule pb-5">
        {categories.map((cat) => {
          const count = cat === 'ALL' ? posts.length : posts.filter((post) => post.category === cat).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`font-mono text-[9px] tracking-[0.055em] transition-colors ${
                activeCategory === cat ? 'text-kh-green' : 'text-kh-muted hover:text-kh-green'
              }`}
            >
              {cat}
              <span className="ml-1.5 text-[7px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border-t border-kh-rule py-16 text-center">
          <p className="font-mono text-[10px] tracking-[0.055em] text-kh-muted">
            NO NOTES IN THIS CATEGORY YET.
          </p>
        </div>
      ) : (
        <ul ref={listRef} className="border-t border-kh-rule">
          {filtered.map((post, index) => (
            <li key={post.slug} className="border-b border-kh-rule">
              <Link
                href={post.url}
                className="group grid gap-3 py-8 transition-colors md:grid-cols-[80px_180px_1fr_40px] md:items-center md:gap-6"
              >
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">
                  {String(index + 1).padStart(3, '0')}
                </span>
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">
                  {post.category ?? 'GENERAL'}
                </span>
                <div>
                  <h2 className="text-xl font-medium tracking-[-0.02em] transition-colors group-hover:text-kh-green md:text-2xl">
                    {post.title ?? 'Untitled note'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-kh-muted">
                    {post.description ?? 'No summary provided.'}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="hidden text-lg text-kh-green transition-transform group-hover:translate-x-1 md:block"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
