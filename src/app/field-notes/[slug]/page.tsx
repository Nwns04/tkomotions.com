import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { posts } from '../../../../.velite';
import { Reveal } from '@/components/animations/Reveal';
import { MDXContent } from '@/components/field-notes/MDXContent';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return posts
    .filter((post) => !post.draft)
    .map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug && !p.draft);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: post.url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function FieldNotePage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug && !p.draft);
  if (!post) notFound();

  const related = posts
    .filter((p) => !p.draft && p.slug !== post.slug)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 2);

  const publishedDate = new Date(post.date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>FIELD NOTE / {post.category}</span>
            <span className="text-right">{publishedDate}</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-4xl text-4xl font-medium leading-[1.05] tracking-[-0.05em] md:text-6xl">
            {post.title}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            {post.description}
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <article className="max-w-3xl">
          <div className="prose-kh">
            <MDXContent code={post.body ?? ''} />
          </div>
        </article>
      </section>

      {related.length > 0 && (
        <section className="kh-container pb-24">
          <Reveal>
            <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
              <span>RELATED</span>
              <Link href="/field-notes" className="text-kh-green">
                ALL FIELD NOTES →
              </Link>
            </p>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-2">
            {related.map((item) => (
              <Reveal key={item.slug}>
                <Link href={item.url} className="group block">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">
                    {item.category}
                  </span>
                  <h3 className="mt-2 text-xl font-medium tracking-[-0.02em] transition-colors group-hover:text-kh-green md:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-kh-muted">
                    {item.description}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="bg-kh-green py-20 text-white">
        <div className="kh-container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-8">
              <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
                HAVE A PROBLEM WORTH TALKING ABOUT?
              </h2>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-lime bg-kh-lime px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-transparent hover:text-kh-lime"
              >
                START A PROJECT
                <span aria-hidden="true" className="text-base">↗</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}