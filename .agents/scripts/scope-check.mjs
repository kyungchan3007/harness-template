// 범위 검사 — plan.md "파일 계획" 밖 변경과 기존 테스트 약화를 경고(차단 아님, SCOPE_STRICT=1 이면 실패)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, baseRef, changedFiles, currentSpec, git, isTestFile, matchesAny, planSection } from "./lib.mjs";

const ALWAYS_OK = [".agents/specs/**"];

export function outOfPlan(files, planGlobs, explained) {
  return files.filter((f) => !matchesAny(f, [...planGlobs, ...ALWAYS_OK]) && !explained.some((e) => e.startsWith(f)));
}

/** 기존 테스트에서 지워진 단언 줄 수 (새 파일은 제외) */
export function removedAssertions(diffText) {
  return diffText.split("\n").filter((l) => /^-(?!--)/.test(l) && /\b(expect|assert|should)\b|toBe|toEqual|toMatch/.test(l)).length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec = currentSpec();
  const files = changedFiles();
  const warns = [];
  if (!spec.id) {
    console.log(`브랜치 "${spec.branch}"에 작업 번호(NNNN)가 없어 범위 검사를 건너뜁니다`);
  } else if (!spec.dir || !existsSync(join(ROOT, spec.dir, "plan.md"))) {
    warns.push(`작업 ${spec.id}의 .agents/specs/${spec.id}-*/plan.md 가 없습니다`);
  } else {
    const plan = readFileSync(join(ROOT, spec.dir, "plan.md"), "utf8");
    const globs = planSection(plan, "파일 계획");
    const explained = planSection(plan, "계획 밖 변경 이유");
    if (globs.length === 0) warns.push(`${spec.dir}/plan.md "파일 계획"이 비어 있습니다`);
    const out = outOfPlan(files, globs, explained);
    if (out.length) warns.push(`계획 밖 변경 ${out.length}개 — plan.md "계획 밖 변경 이유"에 적거나 되돌리세요:\n${out.map((f) => `    - ${f}`).join("\n")}`);
  }
  const base = baseRef();
  for (const f of files.filter(isTestFile)) {
    if (!base || !git(["cat-file", "-e", `${base}:${f}`])) continue; // 새 테스트는 자유
    const n = removedAssertions(git(["diff", base, "--", f]));
    if (n) warns.push(`기존 테스트 단언 ${n}줄 삭제·변경: ${f} — 테스트를 맞추려고 고친 게 아닌지 확인하세요`);
  }
  if (warns.length === 0) { console.log("범위 문제 없음"); process.exit(0); }
  console.log(warns.map((w) => `⚠️  ${w}`).join("\n"));
  process.exit(process.env.SCOPE_STRICT === "1" ? 1 : 0);
}
