import { copy } from "./copy";
import { DevStates } from "./dev/DevStates";

export function App() {
  // React Router arrives with the nav shell (task 5); until then, one dev route by hand.
  const page =
    window.location.pathname === "/dev/states" ? (
      <DevStates />
    ) : (
      <main className="app-page">
        <h1 className="t-title-lg">{copy.app.name}</h1>
        <p className="t-body">{copy.scaffold.placeholder}</p>
      </main>
    );

  // The bundle's styles are scoped to .db (DESIGN.md §2).
  return <div className="db">{page}</div>;
}
