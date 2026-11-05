import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const ordered = { order: z.number().int() };

const settings = defineCollection({
  loader: file('src/content/settings.json'),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    city: z.string(),
    country: z.string(),
    contacts: z.object({
      whatsapp: z.string().regex(/^\d*$/, 'Só dígitos, com indicativo (ex.: 351912345678)'),
      email: z.union([z.email(), z.literal('')]),
      phoneDisplay: z.string(),
    }),
    social: z.object({
      instagram: z.union([z.url(), z.literal('')]),
      linkedin: z.union([z.url(), z.literal('')]),
    }),
    whatsappMessage: z.string(),
  }),
});

const section = z.object({
  label: z.string().optional(),
  title: z.string(),
  titleAccent: z.string().optional(),
  lead: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  endLabel: z.string().optional(),
  quote: z.string().optional(),
  fromText: z.string().optional(),
  formTitle: z.string().optional(),
  consent: z.string().optional(),
});

const home = defineCollection({ loader: file('src/content/home.json'), schema: section });

const problems = defineCollection({
  loader: file('src/content/problems.json'),
  schema: z.object({
    ...ordered,
    icons: z.array(z.enum(['paper', 'clock', 'sheet', 'chat', 'browser-question', 'mail', 'phone'])).min(1).max(3),
    problem: z.string(),
    solution: z.string(),
  }),
});

const services = defineCollection({
  loader: file('src/content/services.json'),
  schema: z.object({
    ...ordered,
    title: z.string(),
    text: z.string(),
    example: z.string(),
    preview: z.enum(['website', 'app', 'dashboard', 'automation', 'integration', 'support']),
  }),
});

const steps = defineCollection({
  loader: file('src/content/steps.json'),
  schema: z.object({ ...ordered, title: z.string(), text: z.string(), badge: z.string().optional() }),
});

const commitments = defineCollection({
  loader: file('src/content/commitments.json'),
  schema: z.object({
    ...ordered,
    icon: z.enum(['document', 'key', 'shield', 'clock']),
    title: z.string(),
    text: z.string(),
    practice: z.string().optional(),
  }),
});

const faq = defineCollection({
  loader: file('src/content/faq.json'),
  schema: z.object({ ...ordered, question: z.string(), answer: z.string() }),
});

const founders = defineCollection({
  loader: file('src/content/founders.json'),
  schema: z.object({
    ...ordered,
    name: z.string(),
    initials: z.string().max(3),
    bio: z.string(),
    // Nome do ficheiro em src/assets/team/ (ex.: "lourenco.jpg"). Vazio: mostra as iniciais.
    photo: z.string(),
  }),
});

const cases = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/cases' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      sector: z.string(),
      isDemo: z.boolean(),
      order: z.number().int(),
      tags: z.array(z.enum(['website', 'app', 'sistema', 'automatizacao'])).min(1),
      device: z.enum(['phone', 'laptop']),
      mockup: z.enum(['clinic', 'bakery', 'garage', 'gym', 'image']),
      image: image().optional(),
      logo: image().optional(),
      toast: z.string(),
      problem: z.string(),
      solution: z.string(),
      result: z.string(),
      testimonial: z.object({ quote: z.string(), author: z.string() }).optional(),
      demoUrl: z.union([z.url(), z.literal('')]),
    }),
});

export const collections = { settings, home, problems, services, steps, commitments, faq, founders, cases };
