import { createContext, useContext } from "react";

// Page-level "pause decorative motion" switch shared by all scenes.
export const MotionPausedContext = createContext(false);
export const useMotionPaused = () => useContext(MotionPausedContext);
