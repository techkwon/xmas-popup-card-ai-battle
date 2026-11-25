---
name: popup-card-battle
description: 크리스마스(또는 다른 주제) 팝업 카드를 여러 AI 모델이 같은 프롬프트·같은 papercraft 키트로 "코드만" 써서 만들게 하고, 결과를 메시지 입력·공유 링크가 있는 HTML 카드와 16:9 영상으로 뽑아 비교한다. Claude Code(Fable·Opus), Codex(GPT-6.2 Astra), Antigravity(Gemini 4 Carbon)를 헤드리스로 돌린다. "팝업 카드 대결", "AI 모델별 카드 만들기", "페이블 아스트라 카본 비교", "크리스마스 카드 AI 대결", "코드로만 카드 만들기 비교" 같은 요청에 사용한다. 그림을 Codex로 그리고 코드는 Fable이 짜는 번외편은 popup-card-bonus 스킬.
---

# 팝업 카드 AI 대결

같은 지시문(`prompts/battle.md`)과 같은 키트(`kit/`)를 받은 모델들이 각자 자유 디자인 카드 2개를 코드만으로 만든다.
결과물은 모델마다 `design-1/`, `design-2/`(HTML 카드, 메시지 입력칸, 공유 링크)이고, 우리가 영상(10초, 1920x1080, 30fps)으로 뽑는다.

## 공정 조건 (영상·저장소에 그대로 밝힌다)

| 항목 | 모든 모델 공통 |
|---|---|
| 작업 폴더 | `$HOME` 밖(`/private/tmp/...`) — 전역 지침이 섞이지 않게 |
| 지시문 | `prompts/battle.md` 그대로 (모델 이름만 폴더로 구분) |
| 키트 | papercraft 키트(MIT) + 문서 + `message.js`, 읽기 전용 |
| 자기 점검 | `kit/tools/shot.py`로 스크린샷을 찍어 보고 고칠 수 있음 |
| 막은 것 | 하위 에이전트, 웹 검색, 이미지 생성 |
| 강도 | Fable·Opus `--effort xhigh`, Astra `reasoning xhigh`, Carbon `gemini-4-carbon-high` |

남는 차이(예: Codex는 `~/.codex/AGENTS.md`, agy는 `~/.gemini/GEMINI.md`를 읽음, Claude는 `--setting-sources project,local`로 사용자 설정을 뺌)는 결과 발표 때 표로 밝힌다.

## 절차

```bash
B=~/.claude/skills/popup-card-battle/scripts/battle.py
R=/private/tmp/xmas-battle            # 대결 폴더 (홈 밖)
python3 $B setup $R                   # 키트 복사(읽기 전용)
python3 $B run $R opus --dir opus-test --timeout-min 90     # 1) 지시문 시험: Opus로 먼저
python3 $B run $R fable  &            # 2) 확정 후 세 모델 병렬 (각각 백그라운드)
python3 $B run $R astra  &
python3 $B run $R carbon &
python3 $B render $R                  # 3) 모든 design-* 를 영상으로 (videos/<엔진>-design-N.mp4 + .jpg)
python3 $B render $R --to "할머니께" --msg "메리 크리스마스!" --from "손주"   # 메시지를 바꿔 뽑기
python3 $B gallery $R                 # 4) gallery.json (목록·메모·모델)
```

1. **지시문 시험(Opus).** `opus-test`로 한 번 돌려 결과 두 개를 직접 본다: 캡처 계약(`__papercraft`), 메시지 표시, 닫힘→열림, 콘솔 오류, 영상 렌더. 문제가 지시문 탓이면 `prompts/battle.md`를 고치고 다시 시험한다. 통과하면 지시문을 확정하고 이후에는 바꾸지 않는다.
2. **본 대결.** fable·astra·carbon을 같은 확정 지시문으로 돌린다(각 최대 120분). 실행 중에는 `run.log`만 보고 개입하지 않는다.
3. **영상.** `render`가 `kit/tools/capture.py`로 10초 영상을 뽑는다. 렌더가 실패한 디자인은 고치지 않고 "실패"로 기록한다(공정성).
4. **정리.** 저장소로 옮길 때는 `kit/`(PAPERCRAFT-LICENSE 포함), 각 엔진 폴더의 `design-*`, `NOTES.md`, `result.json`(모델·시간·토큰), `videos/`를 함께 둔다. `shots/`·`run.log`는 빼도 된다. 키나 개인정보가 없는지 확인한다.

## 메시지 기능 (kit/message.js)

- 주소 `?to=&msg=&from=`으로 받는 사람·메시지·보내는 사람을 넣는다. 기본값은 한국어 인사.
- 화면 오른쪽 아래 "✉ 메시지 쓰기" → 입력 → "카드에 적기"(주소를 바꿔 다시 그림) / "링크 복사"(공유 링크).
- 메시지는 링크 안에만 있고 어디에도 저장·전송하지 않는다.

## 파일

- `kit/` — 모델에게 주는 키트: `lib/`(papercraft), `message.js`, `art.js`(번외편 그림 로더), `tools/shot.py`(자기 점검), `tools/capture.py`(영상), `docs/papercraft/`(키트 문서), `PAPERCRAFT-LICENSE`
- `prompts/battle.md` — 코드 전용 대결 지시문 (확정본)
- `prompts/bonus.md` — 번외편 지시문 (popup-card-bonus)
- `scripts/battle.py` — setup / run / render / gallery / check
