---
name: xmas-popup-card
description: 열리고 움직이는 3D 종이 팝업 크리스마스 카드를 만든다. 90도(뒷벽이 세워지는 카드) 또는 180도(책처럼 펼쳐지는 카드) 템플릿에서 시작해 받는 사람·메시지·장면·색을 바꾸고, 메시지 입력칸과 공유 링크가 있는 웹 카드(HTML)와 원하면 10초 영상(MP4)까지 뽑는다. "크리스마스 카드 만들어줘", "팝업 카드", "움직이는 카드", "카드에 메시지 넣어서 링크로 보내고 싶어", "연말 인사 카드", "christmas pop-up card" 같은 요청에 사용한다.
---

# 크리스마스 팝업 카드 만들기

three.js와 papercraft 키트(MIT, xikhar/papercraft)로 만든 종이 팝업 카드다. 카드가 닫힌 채로 시작해 스스로 열리고,
열리면 종이 장치가 움직인다: 썰매가 하늘을 날고, 스케이터가 미끄러지고, 굴뚝에서 연기가 나고, 눈이 내린다.
메시지는 카드 안 종이판에 손글씨로 적힌다.

| 템플릿 | 모양 | 그림 |
|---|---|---|
| `card-90` | 바닥 + 세워지는 밤하늘 뒷벽. 평행 접기로 마을이 층층이 일어선다. 썰매가 뒷벽의 곡선 홈을 따라 난다 | 오려 붙인 종이 그림(`kit/art/*.webp`) |
| `card-180` | 책처럼 180도로 펼쳐진다. 가운데 V자 접기 트리, 종이 팔에 매달린 썰매, 연못 홈의 스케이터 | 코드로 그린 그림(기본) 또는 `?art=codex`로 종이 그림 |

## 준비물

- 카드 보기·공유: 최신 Chrome·Edge·Safari와 아무 정적 웹 서버. ES 모듈과 importmap을 쓰기 때문에 `file://`로 열면 안 된다.
- 스크린샷·영상(선택): Python 3, `pip install playwright`, 설치된 Google Chrome, `ffmpeg`.

## 절차

1. **물어보기.** 사용자가 말하지 않았으면 짧게 묻는다: 카드 모양(90도·180도, 모르면 90도), 받는 사람, 메시지(90자 이내), 보내는 사람, 바꾸고 싶은 점(분위기·색·넣고 뺄 것).
2. **카드 폴더 만들기.**
   ```bash
   python3 <이 스킬 폴더>/scripts/new_card.py --type 90 --out ./my-card --to "받는 사람" --msg "메시지" --from "보내는 사람"
   ```
   폴더 하나에 카드와 키트(`kit/`)가 다 들어간다. 그대로 웹에 올리면 된다.
3. **바꾸기** (요청이 있을 때만, `card.js`에서):
   - 배치: `pfold(...)`(90도) / `flap(...)`(180도) 줄의 `x`·`d`/`z`·높이. 조각을 빼거나 옮긴다.
   - 하늘·바닥·표지: `wallPaint` / `floorPaint` / `coverPaint`(90도), `snowPage` / `coverPaint`(180도).
   - 메시지판 모양: `signPiece(MSG, { w, h, font, paper, ink, accent })` (`kit/sign.js`).
   - 움직임: `update(dt)` 안의 썰매·스케이터·눈사람 부분. 시간은 고정 간격 시계라 `restart()`·`step()`이 늘 같은 결과를 낸다.
   - 새 조각을 코드로 그리려면 `kit/docs/papercraft/PAPERCRAFT.md`와 `references/`(mechanisms, motion, procedural-art)를 읽는다.
4. **확인.** `python3 kit/tools/shot.py . 0.5 2 4 8`이 `shots/`에 장면을 저장하고 콘솔 오류를 알려 준다. 사진을 직접 보고, 겹침·잘림·글자 넘침이 없을 때까지 고친다. 긴 메시지도 시험한다: `--q "msg=..."`.
5. **영상(원할 때).**
   ```bash
   python3 kit/tools/capture.py . card:video=10,30 --page "index.html?to=받는사람&msg=메시지&from=보낸사람" --size 1080p --out video
   ```
   → `video/card.mp4` (1920x1080, 30fps, 10초). 세로 쇼츠는 `--size 1080x1920`이다. 카메라는 화면이 좁아지면 저절로 뒤로 물러난다.
6. **공유.** 폴더를 GitHub Pages, Netlify, Cloudflare Pages 같은 정적 호스팅에 올린다. 카드 화면 오른쪽 아래 "✉ 메시지 쓰기"에서 문구를 바꾸고 "링크 복사"로 보낸다.

## 지킬 것

- 메시지는 링크(주소)에만 담긴다. 서버로 보내거나 저장하는 코드를 넣지 않는다. 링크를 받은 사람은 메시지를 볼 수 있으니 민감한 내용은 적지 않게 안내한다.
- 외부로 나가는 요청은 three.js CDN(jsDelivr)과 Google Fonts뿐이다. 분석·추적 코드를 넣지 않는다.
- `kit/PAPERCRAFT-LICENSE`(MIT)를 지우지 않는다. 카드를 공개할 때 papercraft 키트 출처를 남긴다.
- 종이 그림(`kit/art/`)은 Codex 이미지 생성으로 만든 것이다. 실존 캐릭터나 상표를 새로 그려 넣지 않는다.
