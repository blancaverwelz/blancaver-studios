/**
 * Single source of truth for all portfolio projects.
 * Add new projects here only — the homepage gallery and Our Work page import this file.
 *
 * thumbnail paths are relative to `public/` (no leading slash needed).
 * They are resolved with Vite's BASE_URL so GitHub Pages subdirectory deploys work.
 *
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} link
 * @property {string} thumbnail - path under public/, e.g. 'images/foo.jpg'
 * @property {string} [category]
 */

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

/** @type {Project[]} */
export const projects = [
  {
    id: "lumi-studios",
    title: "Lumi Studios",
    link: "https://salon-book-nu.vercel.app/",
    thumbnail: asset("images/lumi-studios-optimized.webp"),
    thumbnailSrcSet: `${asset("images/lumi-studios-optimized-640.webp")} 640w, ${asset("images/lumi-studios-optimized-960.webp")} 960w, ${asset("images/lumi-studios-optimized.webp")} 1536w`,
    category: "Beauty · Salon",
  },
  {
    id: "guestbook",
    title: "Guestbook",
    link: "https://guestbook-mu-blue.vercel.app/events/test-event",
    thumbnail: asset("images/guestbook-featured-optimized.webp"),
    thumbnailSrcSet: `${asset("images/guestbook-featured-optimized-640.webp")} 640w, ${asset("images/guestbook-featured-optimized-960.webp")} 960w, ${asset("images/guestbook-featured-optimized.webp")} 1536w`,
    category: "Events · Guestbook",
  },
  {
    id: "cafe-pos",
    title: "Cafe POS",
    link: "https://blancaverwelz.github.io/cafe-pos/",
    thumbnail: asset("images/cafe-pos-optimized.webp"),
    thumbnailSrcSet: `${asset("images/cafe-pos-optimized-640.webp")} 640w, ${asset("images/cafe-pos-optimized-960.webp")} 960w, ${asset("images/cafe-pos-optimized.webp")} 1536w`,
    category: "Cafe · Store",
  },
  {
    id: "unreal-auto-center",
    title: "UnReal Auto Center",
    link: "https://pms-estimator.vercel.app/",
    thumbnail: asset("images/unreal-auto-optimized.webp"),
    thumbnailSrcSet: `${asset("images/unreal-auto-optimized-640.webp")} 640w, ${asset("images/unreal-auto-optimized-960.webp")} 960w, ${asset("images/unreal-auto-optimized.webp")} 1448w`,
    category: "Automotive · Maintenance",
  },

  {
    id: "procompare",
    title: "ProCompare",
    link: "https://text-comparison-pi.vercel.app/",
    thumbnail: asset("images/procompare-optimized.webp"),
    thumbnailSrcSet: `${asset("images/procompare-optimized-640.webp")} 640w, ${asset("images/procompare-optimized-960.webp")} 960w, ${asset("images/procompare-optimized.webp")} 1672w`,
    category: "Utility · Text Comparison",
  },
  {
    id: "sayso-translator",
    title: "SaySo Translator",
    link: "https://sayso-tawny.vercel.app/",
    thumbnail: asset("images/sayso-translator-optimized.webp"),
    thumbnailSrcSet: `${asset("images/sayso-translator-optimized-640.webp")} 640w, ${asset("images/sayso-translator-optimized-960.webp")} 960w, ${asset("images/sayso-translator-optimized.webp")} 1264w`,
    category: "Translation · App",
  },
  {
    id: "cleave",
    title: "Cleave",
    link: "https://cleave-xi.vercel.app/",
    thumbnail: asset("images/cleave-optimized.webp"),
    thumbnailSrcSet: `${asset("images/cleave-optimized-640.webp")} 640w, ${asset("images/cleave-optimized-960.webp")} 960w, ${asset("images/cleave-optimized.webp")} 1536w`,
    category: "Utility · Image Editing",
  },
];
