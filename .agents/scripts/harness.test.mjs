// 하네스 스크립트 테스트 — node --test .agents/scripts/
import assert from "node:assert/strict";
import { test } from "node:test";
import { globToRegExp, isTestFile, matchesAny, planSection } from "./lib.mjs";
import { protectedHits } from "./protected-check.mjs";
import { outOfPlan, removedAssertions } from "./scope-check.mjs";
import { emptyTemplate } from "./spec-check.mjs";
import { decide, isOutside, writeTargets } from "./outside-guard.mjs";

test("glob: ** · * · 폴더", () => {
  assert.ok(globToRegExp("src/cart/**").test("src/cart/a/b.ts"));
  assert.ok(globToRegExp("**/*.test.ts").test("src/a.test.ts"));
  assert.ok(globToRegExp("**/*.test.ts").test("a.test.ts"));
  assert.ok(!globToRegExp("src/*.ts").test("src/a/b.ts"));
  assert.ok(globToRegExp("docs/").test("docs/x.md"));
  assert.ok(matchesAny("AGENTS.md", ["AGENTS.md"]));
});

test("보호 파일: 목록에 걸린 것만", () => {
  assert.deepEqual(protectedHits(["src/a.ts", ".agents/checks.sh", "pnpm-lock.yaml"], [".agents/checks.sh", "pnpm-lock.yaml"]), [".agents/checks.sh", "pnpm-lock.yaml"]);
});

test("plan.md 섹션: 주석 · 빈 불릿 · 체크박스 제외, 백틱 제거", () => {
  const plan = "## 파일 계획\n<!-- 설명 -->\n- `src/cart/**`\n- \n- [ ] 이건 아님\n## 계획 밖 변경 이유\n- src/ui/Button.tsx — 공용 버튼 색 버그\n";
  assert.deepEqual(planSection(plan, "파일 계획"), ["src/cart/**"]);
  assert.deepEqual(planSection(plan, "계획 밖 변경 이유"), ["src/ui/Button.tsx — 공용 버튼 색 버그"]);
});

test("범위: 계획 · specs · 이유 적힌 파일은 통과, 나머지는 경고", () => {
  const files = ["src/cart/qty.ts", "src/ui/Button.tsx", "src/ui/Card.tsx", ".agents/specs/0001-x/plan.md"];
  assert.deepEqual(outOfPlan(files, ["src/cart/**"], ["src/ui/Button.tsx — 이유"]), ["src/ui/Card.tsx"]);
});

test("테스트 약화: 지워진 단언 줄만 센다", () => {
  const diff = "--- a/x.test.ts\n+++ b/x.test.ts\n-  expect(a).toBe(1)\n+  expect(a).toBe(2)\n-  const y = 1\n";
  assert.equal(removedAssertions(diff), 1);
  assert.ok(isTestFile("src/a.test.ts") && isTestFile("tests/a.ts") && !isTestFile("src/a.ts"));
});

test("작업 기록: 템플릿 그대로면 빈 것", () => {
  assert.ok(emptyTemplate("# 요청 원문\n\n<!-- 붙여 넣기 -->\n"));
  assert.ok(emptyTemplate("# 계획\n## 무엇을\n-\n- [ ] \n"));
  assert.ok(!emptyTemplate("# 요청 원문\n장바구니 수량 버그 고쳐 줘\n"));
});

test("밖 쓰기: 쓰기 대상만 뽑는다", () => {
  assert.deepEqual(writeTargets("bash x.sh > $HOME/.out 2>&1"), ["$HOME/.out"]);
  assert.deepEqual(writeTargets("cmd | tee -a /tmp/log && rm -f /tmp/a"), ["/tmp/log", "/tmp/a"]);
  assert.deepEqual(writeTargets("cp src/a.ts /tmp/b.ts"), ["/tmp/b.ts"]);
  assert.deepEqual(writeTargets("cat /etc/hosts && echo hi 2>/dev/null"), []); // 2> 는 표준 에러 리다이렉션, /dev 는 어차피 허용
});

test("밖 쓰기: 프로젝트 안 · /dev 는 허용, 밖은 차단", () => {
  const root = "/work/app";
  assert.ok(!isOutside("src/a.ts", root));
  assert.ok(!isOutside(".tmp/log", root));
  assert.ok(!isOutside("/dev/null", root));
  assert.ok(isOutside("/tmp/log", root));
  assert.ok(isOutside("../other/x", root));
  assert.ok(isOutside("~/x", root));
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "cd /work/app && bash g.sh > /tmp/g.log" } }, root));
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "cd /work/app && bash g.sh > .tmp/g.log 2>/dev/null" } }, root), null);
  assert.ok(decide({ tool_name: "Write", tool_input: { file_path: "/Users/me/notes.md" } }, root));
  assert.equal(decide({ tool_name: "Write", tool_input: { file_path: "/work/app/src/a.ts" } }, root), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/etc/hosts" } }, root), null);
});
