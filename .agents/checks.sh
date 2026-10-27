#!/usr/bin/env bash
# 게이트 — 이게 PASS여야 "완료". 사람도 에이전트도 같은 명령을 쓴다.
#   bash .agents/checks.sh
#   ALLOW_PROTECTED=1 bash .agents/checks.sh   (사람이 보호 파일 변경을 승인할 때만)
#   SCOPE_STRICT=1    bash .agents/checks.sh   (계획 밖 변경을 경고 대신 실패로)
set -u
cd "$(dirname "$0")/.."
fail=0
run() {
  local name="$1"; shift
  echo ""; echo "▶ $name"
  if "$@"; then echo "  ✅ PASS — $name"; else echo "  ❌ FAIL — $name"; fail=1; fi
}
has_script() { [ -f package.json ] && node -e "process.exit(require('./package.json').scripts?.['$1']?0:1)"; }

# 1) 프로젝트 검사 — package.json 에 있는 것만 돌린다 (없으면 건너뜀). 다른 언어면 여기에 명령을 추가
for s in typecheck lint test; do
  if has_script "$s"; then run "프로젝트 $s" npm run -s "$s"; fi
done

# 2) 하네스
run "하네스 자체 테스트" node --test .agents/scripts/harness.test.mjs
run "작업 기록 (request · plan)" node .agents/scripts/spec-check.mjs
run "보호 파일" node .agents/scripts/protected-check.mjs
run "작업 범위 (경고)" node .agents/scripts/scope-check.mjs

echo ""; echo "════════════════════════════════════════"
if [ "$fail" -eq 0 ]; then echo " 결과: ✅ ALL PASS — 완료라고 말해도 됨"; else echo " 결과: ❌ FAIL — 아직 완료 아님"; fi
echo "════════════════════════════════════════"
exit "$fail"
