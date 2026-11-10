const base = import.meta.env.BASE_URL;

export default function ToolLogo({ tool }) {
  return (
    <img
      className="tk-logo"
      src={`${base}images/toolkit/${tool.logo}.svg`}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
    />
  );
}
