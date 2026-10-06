import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({
  label: z.string(),
  href: z.string(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    dates: z.string().optional(),
    event: z.string().optional(),
    summary: z.string(),
    role: z.string(),
    languages: z.array(z.string()).default([]),
    stack: z.array(z.string()),
    figure: z.object({ value: z.string(), label: z.string() }).optional(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    authors: z.string(),
    journal: z.string(),
    year: z.number(),
    volume: z.string().optional(),
    doi: z.string().optional(),
    preprint: link.optional(),
    note: z.string().optional(),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    authors: z.string(),
    event: z.string(),
    place: z.string(),
    date: z.string(),
    award: z.string().optional(),
  }),
});

const teaching = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/teaching' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    group: z.enum(['teaching', 'writing', 'certificates']),
    date: z.string().optional(),
    summary: z.string(),
    links: z.array(link).default([]),
  }),
});

const cv = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cv' }),
  schema: z.object({
    label: z.string(),
    order: z.number(),
    title: z.string(),
    description: z.string(),
    summary: z.string(),
    pdf: z.string().optional(),
  }),
});

export const collections = { projects, publications, talks, teaching, cv };
