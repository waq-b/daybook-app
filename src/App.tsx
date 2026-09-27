import { copy } from "./copy";

export function App() {
  return (
    <main>
      <h1>{copy.app.name}</h1>
      <p>{copy.scaffold.placeholder}</p>
    </main>
  );
}
