# Blancaver Studios

Personal portfolio site for **Blancaver Studios** — React + Vite, Tailwind CSS, plain JavaScript
(no TypeScript), Lucide icons, Three.js for the animated emblem.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — animated cyberpunk hero, brand banner, About/Unique Solutions/Why Choose Us sections (with the 3D emblem), featured projects slider |
| `/projects` | All Projects — banner + full project grid |
| `/toolkit` | Toolkit — the stack, backend/services, AI collaborators, and dev/ship tools behind every project |
| `/contact` | Contact — hero, process breakdown, services, and contact form |

## Key components

- `src/components/EmblemScene.jsx` — procedural Three.js emblem (ring + glyph built from
  `src/assets/emblem/glyph_contour.json`, normal-mapped with `emblem_normal_map.png`). Plays a
  spin → charge/spark → settled-glow sequence on scroll into view via `IntersectionObserver`,
  resets on scroll-out, and respects `prefers-reduced-motion`. Rendered inside `WhyChooseUs.jsx`.
- `src/components/ToolkitContent.jsx` — data + markup for the `/toolkit` page (core stack marquee,
  backend/services flow diagram, AI collaborator cards, develop/ship tabs).
- `src/data/projects.js` — single source of truth for both the Home slider and the All Projects
  grid.

## Adding a project

Edit **only** `src/data/projects.js`:

```js
{
  id: 'my-project',
  title: 'My Project',
  link: 'https://example.com',
  thumbnail: '/images/my-project.jpg',  // drop file in public/images/
  category: 'Brand · Photography',      // optional
}
```

Both the Home slider and All Projects grid pick it up automatically.

## Develop

```bash
npm install
npm run dev
```

**http://localhost:5173/**

## Lint

```bash
npm run lint
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

Deployment is fully automatic. Vercel is connected to this repo and watches the
`main` branch — every push triggers a build and redeploy on its own, usually
live within ~30 seconds. No manual build step, no local `npm run build`, no
committing a `docs/` folder.

Build settings live in `vercel.json` (output directory + SPA rewrites) and
`vite.config.js` — don't need to touch either unless the build setup changes.

Live site: **https://blancaver-studios.vercel.app/**
