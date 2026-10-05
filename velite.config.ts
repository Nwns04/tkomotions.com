import { defineCollection, defineConfig, s } from 'velite';

const posts = defineCollection({
  name: 'Post',
  pattern: 'field-notes/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(120),
      description: s.string().max(300),
      date: s.isodate(),
      category: s.enum([
        'BUSINESS',
        'TECHNOLOGY',
        'AI',
        'BUILD',
        'AFRICA',
        'INNOVATION',
      ]),
      draft: s.boolean().default(false),
      featured: s.boolean().default(false),
      body: s.mdx(),
    })
    .transform((data) => {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return { ...data, slug, url: `/field-notes/${slug}` };
    }),
});

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    clean: true,
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [],
    remarkPlugins: [],
  },
});