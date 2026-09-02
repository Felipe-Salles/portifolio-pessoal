// Content Layer collection definitions.
//
// Critical: this file MUST live at `src/content.config.ts` (the root of `src/`),
// NOT at the legacy `src/content/config.ts` path — Astro 6+ does not read that
// location at all, and the failure mode is silent (`getCollection('projects')`
// returns an empty array with no error). See 01-RESEARCH.md Pitfall 1.
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  // Critical: `schema` must be a function that destructures `{ image }` from
  // the object Astro injects — a plain `z.object({...})` form throws
  // `ReferenceError: image is not defined` because `image` is only in scope
  // inside this injected-function form. See 01-RESEARCH.md Pitfall 6.
  schema: ({ image }) =>
    z.object({
      // PROJ-02: card name.
      title: z.string(),
      // PROJ-02: card description.
      description: z.string(),
      // PROJ-02: tech tags.
      tags: z.array(z.string()),
      // PROJ-02: independently optional — prototype's card 2 has repo only,
      // card 3 has live only.
      liveUrl: z.string().url().optional(),
      repoUrl: z.string().url().optional(),
      // D-05: optional, typed via the image() schema helper from Phase 1
      // onward so PROJ-04's astro:assets optimization needs no later schema
      // change. Cards without a coverImage fall back to a generic cyan
      // gradient visual in Phase 3.
      coverImage: image().optional(),
      // D-04: lets Phase 3 decide card hierarchy without a later migration.
      featured: z.boolean().optional(),
      // D-04: manual display ordering, independent of filename/alphabetical
      // sort.
      order: z.number().optional(),
    }),
});

export const collections = { projects };
