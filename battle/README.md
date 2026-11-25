# 크리스마스 팝업 카드 — AI 모델 대결

세 회사의 최상위 모델이 **같은 프롬프트, 같은 papercraft 키트**로 **코드만** 써서 크리스마스 팝업 카드를 2개씩 만들었다.
그림 파일·이미지 생성·웹 검색·하위 에이전트는 모두 금지. 카드는 닫힌 채 시작해 3.5초 안에 스스로 열리고, 종이 장치가 움직이며,
받는 사람·메시지·보낸 사람이 종이에 손글씨로 적힌다.

- 갤러리: [`index.html`](index.html) (정적 서버로 열기: `python3 -m http.server` 후 `http://localhost:8000/battle/`)
- 프롬프트: [`../skills/popup-card-battle/prompts/battle.md`](../skills/popup-card-battle/prompts/battle.md)
- 카드마다 오른쪽 아래 **✉ 메시지 쓰기**로 문구를 바꾸고 **링크 복사**로 보낼 수 있다. 메시지는 주소(URL)에만 담기고 어디에도 저장·전송되지 않는다.

## 결과

| 모델 (도구) | design-1 | design-2 | 걸린 시간 | 사용량 |
|---|---|---|---|---|
| **Claude Fable 5.2** (Claude Code, effort xhigh) | [달빛 썰매](fable/design-1/) · 90° | [트리 아래 장난감](fable/design-2/) · 180° | 71.6분 | $34.12 (API 환산), 131턴, 출력 34.1만 토큰 |
| **GPT-6.2 Astra** (Codex CLI, reasoning xhigh) | [호두까기 인형의 성탄극장](astra/design-1/) · 90° | [북극 고래 우편선](astra/design-2/) · 180° | 18.9분 | 입력 467만(캐시 456만) / 출력 4.2만 토큰 |
| **Gemini 4 Carbon** (Antigravity, carbon-high) | [별빛 산타 공방](carbon/design-1/) · 90° | [숲속 호수의 성탄 회전목마](carbon/design-2/) · 180° | 약 50분 | 알 수 없음 (아래 참고) |

**번외편** — 그림은 Codex(이미지 생성)가 17장 그리고(12.9분), 코드는 Fable 5.2가 짰다(42.6분, $21.28, 106턴):
[북극성 우체국의 크리스마스이브](bonus/design-1/) · 90°

**프롬프트 시험** — 본선 전에 Claude Opus 5.5로 프롬프트를 검증했다(61.2분, $20.22, 114턴):
[고요한 밤 마을](opus-test/design-1/) · [숲속의 크리스마스](opus-test/design-2/)

영상(1920×1080, 30fps, 10초)은 [`videos/`](videos/)에 있다. 웹용으로 다시 압축한 사본이다(CRF 27).

## 조건 (공정성)

| 항목 | 내용 |
|---|---|
| 작업 폴더 | 홈 밖의 같은 임시 폴더, 키트는 읽기 전용 |
| 입력 | 같은 프롬프트 파일, 같은 키트(lib·docs·message.js·shot.py) |
| 금지 | 그림 파일, 이미지 생성, 웹 검색, 하위 에이전트 |
| 추론 강도 | 각 도구에서 고를 수 있는 가장 높은 단계 |
| 자기 검사 | 모두 `shot.py`로 자기 카드를 찍어 보고 고칠 수 있었다 |
| 렌더 | 같은 캡처 스크립트로 같은 메시지를 넣어 10초 영상 |

밝혀 둘 차이:

- **Codex(Astra)**: 전역 oh-my-codex 설정이 켜져 있었다(작업 폴더에 `.omx/` 상태 파일이 생겼고 이 저장소에서는 뺐다).
- **Antigravity(Carbon)**: 작업을 마치며 실행 로그(run.log)를 스스로 지워 토큰 사용량을 알 수 없다. 시간은 폴더 수정 시각(10:23–11:13)으로 쟀다.
  design-2 영상은 첫 렌더에서 CDN 연결 오류(ERR_CONNECTION_RESET)가 나서 한 번 다시 찍었다.
- **Claude Code**: 사용자 전역 설정을 빼고(`--setting-sources project,local`, 슬래시 명령 끔) 돌렸다. 비용은 API 가격 환산값이다.
- 사용량 단위가 도구마다 달라(달러 환산 / 토큰) 직접 비교하지 않는다.

## 라이선스와 출처

- papercraft 키트: [xikhar/papercraft](https://github.com/xikhar/papercraft), MIT — [`kit/PAPERCRAFT-LICENSE`](kit/PAPERCRAFT-LICENSE)
- 카드 코드는 각 AI 모델이 썼다. 번외편 그림(`bonus/art/`)은 Codex 이미지 생성으로 만들었다.
