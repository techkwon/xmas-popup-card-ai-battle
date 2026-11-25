---
name: popup-card-bonus
description: 팝업 카드 대결의 번외편 — Codex(이미지 생성)가 카드 배경·바닥·표지·팝업 조각 그림을 전부 그리고, Claude Fable 5.2는 그 그림으로 코드만 짜서 열리고 움직이는 3D 종이 팝업 카드(HTML, 메시지 입력·공유 링크)와 16:9 영상을 만든다. "번외편", "코덱스가 그리고 페이블이 코딩", "그림은 AI가 그리고 코드는 페이블", "이미지 생성 + 코드 팝업 카드" 같은 요청에 사용한다. 키트와 스크립트는 popup-card-battle 스킬 것을 쓴다.
---

# 번외편: Codex 그림 + Fable 코드

popup-card-battle 스킬의 키트·스크립트를 그대로 쓴다. 대결 폴더(`$HOME` 밖)에 `bonus/` 폴더를 만든다.

```bash
B=~/.claude/skills/popup-card-battle/scripts/battle.py
R=/private/tmp/xmas-battle
python3 $B setup $R                    # 이미 했으면 생략
python3 $B art $R --dir bonus          # 1) Codex가 그림 세트를 bonus/art/ 에 (배경·바닥·표지 + 투명 조각 12~16장 + manifest.json)
python3 $B run $R fable --prompt bonus --dir bonus --timeout-min 120   # 2) Fable이 코드만 짠다 → bonus/design-1/
python3 $B render $R --only bonus      # 3) 영상 → videos/bonus-design-1.mp4
```

1. **그림 (Codex).** `prompts/bonus-art.md`: 테마는 Codex가 정한다. 그림 사용량은 사용자 ChatGPT 계정 Codex 한도에서 차감되니 시작 전에 한 줄로 알린다. 끝나면 `bonus/art/`를 접촉 시트로 훑어 투명 배경·한 덩어리·글자 없음을 확인한다. 문제 있는 조각만 다시 그리게 한다.
2. **코드 (Fable).** `prompts/bonus.md`: 그림을 고치거나 새로 그리지 않고, `kit/art.js`로 오려 붙여 카드를 짠다. 메시지·캡처 계약은 본 대결과 같다.
3. **영상·정리.** 본 대결과 같이 `render`·`gallery`. 저장소에는 `bonus/art/`(그림), `bonus/design-1/`, `NOTES.md`, `art/STORY.md`, 영상을 함께 올린다.
