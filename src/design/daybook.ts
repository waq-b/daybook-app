// The Daybook design system, mounted as shipped (DESIGN.md §2). Nothing under
// design/ is edited; a missing prop is fixed in the design system, not here.
import "./globals";
import "../../design/tokens.css";
import "../../design/components/bundle.css";
import "../../design/components/bundle.js";
import type * as DaybookComponents from "../../design/components/index";

declare global {
  interface Window {
    Daybook: typeof DaybookComponents;
  }
}

export const Daybook = window.Daybook;
export type { Difficulty, IconName, PracticeType } from "../../design/components/index";
