import { useState } from "react";
import { Link } from "react-router-dom";
import { SCENES, TOOL_COUNT } from "../data/toolkit";
import ToolScene from "./toolkit/ToolScene";
import { MotionPausedContext } from "./toolkit/motionContext";
import "./toolkit/toolkit.css";

export default function ToolkitContent() {
  const [paused, setPaused] = useState(false);
  return (
    <MotionPausedContext.Provider value={paused}>
      <div className="toolkit-content" id="toolkit-equipment">
        <header className="toolkit-intro">
          <p className="toolkit-eyebrow">Behind the build</p>
          <h2>The tools behind our work.</h2>
          <p className="toolkit-intro__count">
            {TOOL_COUNT} tools across four disciplines.
          </p>
          <button
            type="button"
            className="toolkit-pause"
            aria-pressed={paused}
            onClick={() => setPaused((v) => !v)}
          >
            {paused ? "Resume scene motion" : "Pause Motion"}
          </button>
        </header>

        {SCENES.map((scene, i) => (
          <ToolScene key={scene.id} scene={scene} index={i} />
        ))}

        <section
          className="toolkit-closing"
          aria-labelledby="toolkit-closing-title"
        >
          <p className="toolkit-eyebrow">Built around your business</p>
          <h2 id="toolkit-closing-title">
            The right tools.
            <br />
            <span>Your next chapter.</span>
          </h2>
          <Link className="toolkit-cta" to="/contact">
            Let’s Talk
          </Link>
        </section>
      </div>
    </MotionPausedContext.Provider>
  );
}
