# 🔮 마법 슈가의 오늘의 부적 (talisman/)

앱인토스 비게임 1호 후보 프로토타입. 390×844 모바일 기준의 단일 페이지 웹 앱이며,
`https://sheeny6-cmyk.github.io/magic-sugar-game/talisman/` 로 배포됩니다.

## 파일 구조

| 파일 | 설명 |
| --- | --- |
| `index.html` | 화면 뼈대 (부적 상점 / 결과 시트 / 광고 모의 / 사용법) |
| `style.css` | 파스텔·별빛 테마, 3D 플립, 파티클·빛줄기 연출 |
| `data.js` | **부적 7종 데이터** — 문구·발레 동작·이미지·영상 슬롯 |
| `app.js` | 뽑기 로직, 하루 1장 제한, 광고 모의, 1080×1920 PNG 생성 |
| `assets/*.webp` | 부적 일러스트 7종 (900×1035, 배경=카드 색 #FDF6EE) |

## 문구·이미지 바꾸기

`data.js`의 배열만 고치면 됩니다.

```js
{
  id: 'stock',                 // 고유 키
  emoji: '📈',
  title: '주식 반등 기원',
  wish: '내 계좌도 그랑 주테처럼 떡상하게 해 주세요',
  dance: '그랑 주테',
  danceFr: 'Grand Jeté',
  effect: '빨간불 계좌에 초록불이 켜져요',
  note: '오늘은 손절 말고 홀딩.',
  stars: 4,                    // 영험도 1~5
  img: 'assets/grandjete.webp',
  video: null,                 // ↓ 루프 영상 슬롯
  tint: '#ffd9a8'
}
```

## Google Flow 루프 영상 넣기

카드에는 이미 자리(`<video id="cardVideo">`)가 잡혀 있습니다.
`talisman/assets/loops/` 폴더를 만들고 mp4를 넣은 뒤, `data.js`의 해당 부적에 경로만 적으면
일러스트 대신 영상이 카드 안에서 자동 재생(무음·반복)됩니다.

```js
video: 'assets/loops/stock.mp4'
```

영상은 세로 3:4 비율(예: 720×960, 3~6초 루프)로 만들면 카드에 꽉 차게 들어갑니다.
`video`가 `null`이면 그대로 일러스트가 보입니다.

## 동작 규칙

- **하루 1장 무료**: `localStorage`의 `sugar-talisman-v1`에 날짜와 함께 저장되고, 날짜가 바뀌면 자동 초기화됩니다.
- **광고 보고 한 장 더**: 프로토타입에서는 2초 로딩 연출 후 1장이 추가됩니다.
  앱인토스 리워드 광고를 붙일 때는 `app.js`의 `playAd(done)` 안쪽만 실제 SDK 호출로 바꾸면 됩니다.
- **이미지 저장**: Canvas로 1080×1920 PNG를 만들어 `sugar-talisman-YYYYMMDD.png`로 내려받습니다.

## 검수 메모

- 외부 폰트·CDN·트래커를 쓰지 않습니다(오프라인에서도 동작, 콘솔 에러 0).
- 일러스트는 배경을 카드 색과 똑같이 맞춰 잘라 썼기 때문에, 카드 안에서 사각형 경계가 보이지 않습니다.
- 카드 안 텍스트는 넘칠 경우 Canvas 쪽에서 글자 크기를 자동으로 줄입니다.
