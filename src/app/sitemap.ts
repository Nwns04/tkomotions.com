import type { MetadataRoute } from 'next';
import { useCases } from '@/lib/use-cases';
const existingPaths = [
  "/",
  "/about",
  "/capabilities",
  "/process",
  "/products",
  "/careers",
  "/partners",
  "/future-innovators",
  "/faq",
  "/contact",
  "/work",
  "/work/lead-system",
  "/work/tko-motions",
  "/work/taxbot-naija",
  "/field-notes",
  "/field-notes/what-should-a-small-business-actually-automate",
  "/field-notes/why-business-software-often-starts-with-the-wrong-question",
  "/field-notes/from-idea-to-working-system",
  "/solutions/ai"
];
export default function sitemap(): MetadataRoute.Sitemap {
  return [...existingPaths, '/use-cases', ...useCases.map(item => '/use-cases/' + item.slug)].map(path => ({ url: 'https://tkomotions.com' + path }));
}
