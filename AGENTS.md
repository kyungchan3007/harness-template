# AGENTS.md

> 모든 AI 에이전트(Claude Code · Codex 등)의 단일 진입점. **50줄 이내로 유지**하고 상세는 링크로 넘긴다.

## 0. 프로젝트 한 줄
<!-- 예: 장바구니·결제를 제공하는 쇼핑몰 웹 프론트엔드 -->

## 1. 절대 규칙
1. **완료 = 게이트 통과.** `bash .agents/checks.sh` 가 PASS여야 "완료"라고 말한다.
2. **요청 원문을 고정한다.** 작업마다 `.agents/specs/NNNN-이름/request.md` 에 원문 그대로. 요약하지 않는다.
3. **계획한 파일만 바꾼다.** `plan.md` 의 "파일 계획" 밖을 바꾸면 이유를 plan.md에 적는다.
4. **보호 파일은 사람 승인 없이 바꾸지 않는다.** 목록: `.agents/protected.txt`
5. **작업 폴더 밖에 쓰지 않는다.** 임시 파일도 저장소 안(`.tmp/`)에.
<!-- 프로젝트 고유 규칙은 여기 1~2개만. 코드로 확인할 수 있으면 린트·테스트로 옮긴다. -->

## 2. 어디에 무엇이
| 무엇 | 위치 |
| --- | --- |
| 도메인 규칙·불변식 (원본) | [docs/domain/](docs/domain/) |
| 구조·경계 | [docs/architecture.md](docs/architecture.md) |
| 작업 의도 (요청 원문·계획) | [.agents/specs/](.agents/specs/) |
| 게이트 | [.agents/checks.sh](.agents/checks.sh) |

## 3. 작업 루프
`새 작업(npm run spec:new -- 이름) → request.md에 원문 → plan.md(무엇·파일 계획·완료 기준) → 구현 → checks.sh → plan.md "허점"에 기록`

## 4. 명령
```bash
npm run spec:new -- cart-qty   # 작업 폴더 만들기
bash .agents/checks.sh         # 게이트
```
