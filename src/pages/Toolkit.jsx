import ToolkitContent from "../components/ToolkitContent";
import ToolkitScene from "../components/ToolkitScene";
import "./Toolkit.css";

export default function Toolkit() {
  return (
    <main className="toolkit-page">
      <header className="toolkit-hero">
        <ToolkitScene />
        <div className="toolkit-hero__copy">
          <h1>
            Tool<span>kit</span>
          </h1>
          <p className="toolkit-hero__description">
            The technology behind the craft.
          </p>
          <a className="toolkit-explore" href="#toolkit-equipment">
            Explore the toolkit <span aria-hidden="true">↓</span>
          </a>
        </div>
        <span className="toolkit-hero__signature" aria-hidden="true">
          BLANCAVER STUDIOS - ENGINEERING
        </span>
      </header>
      <ToolkitContent />
      <footer className="site-copyright">
        © {new Date().getFullYear()} Blancaver Studios
      </footer>
    </main>
  );
}
