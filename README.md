# 크리스마스 팝업 카드 — AI로 만드는 움직이는 종이 카드

three.js와 [papercraft 키트](https://github.com/xikhar/papercraft)(MIT)로 만든 3D 종이 팝업 크리스마스 카드.
카드가 닫힌 채 시작해 스스로 열리고, 썰매·스케이터·연기·눈 같은 종이 장치가 움직이며, 메시지가 종이에 손글씨로 적힌다.

**바로 보기 (GitHub Pages)**: https://techkwon.github.io/xmas-popup-card-ai-battle/battle/

## 들어 있는 것

| 폴더·파일 | 내용 |
|---|---|
| [`battle/`](battle/) | **AI 모델 대결** — Claude Fable 5.2 · GPT-6.2 Astra · Gemini 4 Carbon이 같은 프롬프트로 코드만 써서 만든 카드 2개씩 + 번외편(Codex 그림 + Fable 코드). 결과표·조건은 [battle/README.md](battle/README.md) |
| [`card90.html`](card90.html) | 90도 카드(뒷벽이 세워지는 카드), Codex 그림 |
| [`card.html`](card.html) | 180도 카드(책처럼 펼쳐지는 카드), 코드 그림 · `?art=codex`로 Codex 그림 |
| [`skills/xmas-popup-card/`](skills/xmas-popup-card/) | **나만의 카드 만들기 스킬** (Claude Code 등) — 템플릿 복사, 메시지 바꾸기, 영상 뽑기 |
| [`skills/popup-card-battle/`](skills/popup-card-battle/) | 여러 AI 모델 대결을 다시 돌리는 스킬(프롬프트·키트·스크립트) |
| [`skills/popup-card-bonus/`](skills/popup-card-bonus/) | 번외편(그림은 Codex, 코드는 Fable) 스킬 |
| `lib/`, `art.js`, `message.js`, `sign.js` | 키트와 공용 모듈 |
| `codex/art/` | Codex 이미지 생성으로 그린 카드 조각 그림 |

## 메시지 넣어 보내기

카드 오른쪽 아래 **✉ 메시지 쓰기**에서 받는 사람·메시지·보내는 사람을 적고 **링크 복사**를 누르면 된다.
메시지는 링크 주소의 `#` 뒷부분(`#to=&msg=&from=`)에만 담긴다. `#` 뒤는 브라우저가 웹 서버로 보내지 않으므로 GitHub Pages에도 전달되지 않고, 이 코드는 메시지를 어디에도 저장하거나 전송하지 않는다.
링크를 받은 사람은 누구나 메시지를 볼 수 있고 열어 본 기기의 방문 기록에도 남으니, 민감한 내용이나 학생 개인정보(이름·학번 등)는 적지 말 것.

카드는 three.js를 jsDelivr CDN에서, 손글씨 글꼴을 Google Fonts에서 불러온다. 그래서 방문자의 IP 주소가 두 서비스에 전달되고, 학교 기기에서 이 도메인이 막혀 있으면 카드가 뜨지 않는다. 분석·광고·추적 코드는 없다.

## 내 컴퓨터에서 열기

ES 모듈과 importmap을 쓰므로 `file://`로는 열리지 않는다. 폴더에서 정적 서버를 띄운다.

```bash
python3 -m http.server 8000
```

그다음 `http://localhost:8000/card90.html` 또는 `http://localhost:8000/battle/`를 연다.

## 나만의 카드 만들기 (스킬)

`skills/xmas-popup-card` 폴더를 `~/.claude/skills/`에 복사한 뒤 Claude Code에게 "크리스마스 카드 만들어줘"라고 하면 된다. 직접 만들려면:

```bash
python3 skills/xmas-popup-card/scripts/new_card.py --type 90 --out ./my-card --to "받는 사람" --msg "메시지" --from "보내는 사람"
```

## 라이선스와 출처

- papercraft 키트: xikhar/papercraft, MIT ([PAPERCRAFT-LICENSE](PAPERCRAFT-LICENSE))
- 카드 코드는 Claude·GPT·Gemini 모델이 썼고, `codex/art/`와 `battle/bonus/art/` 그림은 Codex 이미지 생성으로 만들었다.
