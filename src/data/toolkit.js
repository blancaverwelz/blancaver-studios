// Single source of truth for the Toolkit page: tools, groups and scene copy.
// The 3D hardware layout for each scene lives in src/components/toolkit/world/scenes.js.

export const TOOLS = {
  javascript: { name: "JavaScript", role: "Application logic", logo: "javascript" },
  typescript: { name: "TypeScript", role: "Typed application code", logo: "typescript" },
  swift: { name: "Swift", role: "Native app development", logo: "swift" },
  react: { name: "React", role: "Interactive interfaces", logo: "react" },
  nextjs: { name: "Next.js", role: "React application framework", logo: "nextjs" },
  tailwind: { name: "Tailwind CSS", role: "Responsive styling", logo: "tailwind" },
  motion: { name: "Motion", role: "Interface animation", logo: "motion" },
  three: { name: "Three.js", role: "3D experiences", logo: "three" },
  lucide: { name: "Lucide React", role: "Interface icons", logo: "lucide" },
  supabase: { name: "Supabase", role: "Data and authentication", logo: "supabase" },
  cloudinary: { name: "Cloudinary", role: "Image and media delivery", logo: "cloudinary" },
  resend: { name: "Resend", role: "Email delivery", logo: "resend" },
  claude: { name: "Claude", role: "Primary build partner", logo: "claude" },
  chatgpt: { name: "ChatGPT", role: "Rapid iteration", logo: "chatgpt" },
  grok: { name: "Grok Build", role: "Agentic coding tasks", logo: "grok" },
  codex: { name: "Codex", role: "Agentic coding tasks", logo: "codex" },
  gemini: { name: "Gemini", role: "On-demand assistance", logo: "gemini" },
  vscode: { name: "VS Code", role: "Local development", logo: "vscode" },
  stackblitz: { name: "StackBlitz", role: "Browser prototyping", logo: "stackblitz" },
  vite: { name: "Vite", role: "Development server and production builds", logo: "vite" },
  github: { name: "GitHub", role: "Source hosting and version control", logo: "github" },
  vercel: { name: "Vercel", role: "Deployment and hosting", logo: "vercel" },
};

export const SCENES = [
  {
    id: "interface",
    title: "Development & Interface",
    tagline: "Languages, frameworks and the craft of the interface.",
    copySide: "left",
    groups: [
      { label: "Languages", tools: ["javascript", "typescript", "swift"] },
      { label: "Frameworks", tools: ["react", "nextjs"] },
      { label: "Styling, motion & graphics", tools: ["tailwind", "motion", "three", "lucide"] },
    ],
  },
  {
    id: "services",
    title: "Backend & Services",
    tagline: "Reliable infrastructure for seamless experiences.",
    copySide: "right",
    groups: [{ label: "Services", tools: ["supabase", "cloudinary", "resend"] }],
  },
  {
    id: "ai",
    title: "AI Collaborators",
    tagline: "Intelligent tools. Greater possibilities.",
    copySide: "left",
    groups: [{ label: "Assistants", tools: ["claude", "chatgpt", "grok", "codex", "gemini"] }],
  },
  {
    id: "deployment",
    title: "Development & Deployment",
    tagline: "From code to live experience.",
    copySide: "right",
    groups: [
      { label: "Author & prototype", tools: ["vscode", "stackblitz"] },
      { label: "Build", tools: ["vite"] },
      { label: "Version & deliver", tools: ["github", "vercel"] },
    ],
  },
];

export const TOOL_COUNT = Object.keys(TOOLS).length;
