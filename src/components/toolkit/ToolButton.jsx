import ToolLogo from "./ToolLogo";

// Accessible label for a 3D module. The button sits over the module's front face;
// its position/size come from projecting the 3D face to the screen (see ToolScene).
export default function ToolButton({ id, tool, selected, onSelect, onHover }) {
  return (
    <li className="tk-tool" data-tool={id}>
      <button
        type="button"
        className="tk-tool__button"
        aria-pressed={selected}
        onClick={() => onSelect(id)}
        onPointerEnter={() => onHover(id)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(id)}
        onBlur={() => onHover(null)}
      >
        <ToolLogo tool={tool} />
        <span className="tk-tool__name">{tool.name}</span>
        <span className="tk-sr">{`: ${tool.role}`}</span>
      </button>
    </li>
  );
}
