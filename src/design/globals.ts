// design/components/bundle.js reads window.React on its first line, so React
// has to be on window before that file runs. ES imports are hoisted and run in
// order, so this lives in its own module that daybook.ts imports first
// (DESIGN.md §2 amended, plan D12).
import React from "react";
import ReactDOM from "react-dom";

declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
  }
}

window.React = React;
window.ReactDOM = ReactDOM;
