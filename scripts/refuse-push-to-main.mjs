// pre-push hook (simple-git-hooks). main only changes through merged PRs.
// Git passes the refs being pushed on stdin: "<local ref> <local sha> <remote ref> <remote sha>".
import { readFileSync } from "node:fs";

const input = readFileSync(0, "utf8");
const toMain = input.split("\n").some((line) => line.split(" ")[2] === "refs/heads/main");

if (toMain) {
  console.error("Refusing to push to main. Push a branch and open a PR.");
  process.exit(1);
}
