// 작업 기록 검사 — 작업 브랜치면 request.md(원문) · plan.md 가 채워져 있어야 한다
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, currentSpec } from "./lib.mjs";

export function emptyTemplate(text) {
  return text.replace(/<!--[\s\S]*?-->/g, "").replace(/^#.*$/gm, "").replace(/^\s*[-*]\s*(\[[ x]\])?\s*$/gm, "").trim().length === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec = currentSpec();
  if (!spec.id) { console.log("작업 브랜치 아님 — 건너뜀"); process.exit(0); }
  const problems = [];
  if (!spec.dir) problems.push(`.agents/specs/${spec.id}-*/ 폴더가 없습니다 (npm run spec:new -- 이름)`);
  else for (const f of ["request.md", "plan.md"]) {
    const p = join(ROOT, spec.dir, f);
    if (!existsSync(p)) problems.push(`${spec.dir}/${f} 없음`);
    else if (emptyTemplate(readFileSync(p, "utf8"))) problems.push(`${spec.dir}/${f} 가 비어 있습니다`);
  }
  if (problems.length === 0) { console.log(`작업 ${spec.id} 기록 있음`); process.exit(0); }
  console.log(problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
