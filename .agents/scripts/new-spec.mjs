// 새 작업 폴더 — node .agents/scripts/new-spec.mjs <이름>  →  .agents/specs/NNNN-이름/ (request.md · plan.md)
import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const name = (process.argv[2] ?? "").trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g, "-").replace(/^-|-$/g, "");
if (!name) { console.error("사용법: npm run spec:new -- <이름>   예) npm run spec:new -- cart-qty"); process.exit(2); }
const specs = join(ROOT, ".agents/specs");
const ids = readdirSync(specs).map((d) => /^(\d{4})-/.exec(d)?.[1]).filter(Boolean).map(Number);
const id = String((ids.length ? Math.max(...ids) : 0) + 1).padStart(4, "0");
const dir = join(specs, `${id}-${name}`);
if (existsSync(dir)) { console.error(`이미 있음: ${dir}`); process.exit(1); }
cpSync(join(specs, "_template"), dir, { recursive: true });
console.log(`만듦: .agents/specs/${id}-${name}/ (request.md · plan.md)\n브랜치: git switch -c task/${id}-${name}`);
