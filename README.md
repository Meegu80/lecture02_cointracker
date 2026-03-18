# 🪙 Crypto Dashboard

CoinLore API를 활용한 실시간 암호화폐 시세 대시보드입니다.
라이트/다크 모드 전환, 60초 자동 갱신, 반응형 테이블을 지원합니다.

---

## 📁 프로젝트 구조

```
src/
├── App.tsx                   # 메인 컴포넌트
├── index.css                 # 전역 스타일 + CSS 변수 (라이트/다크 테마)
├── components/
│   └── IosSpinner.tsx        # 로딩 스피너 컴포넌트
└── styles/
    └── App.module.css        # 컴포넌트 스타일
```

---

## 🚀 시작하기

```bash
npm install
npm run dev
```

---

## 🔑 핵심 코드 설명

### 1. 타입 정의 — `Coin` / `ApiResponse`

```ts
type Coin = {
    id: string;
    symbol: string;
    name: string;
    rank: number;
    price_usd: string;
    market_cap_usd: string;
    volume24: number;
    percent_change_24h: string;
    // ...
};

type ApiResponse = { data: Coin[] };
```

API 응답의 형태를 TypeScript 타입으로 정의합니다.
`ApiResponse`는 `data` 배열을 감싸는 래퍼 타입이에요.

---

### 2. 데이터 패칭 — `fetchCoins`

```ts
const fetchCoins = async (): Promise<Coin[]> => {
    const res = await fetch("https://api.coinlore.net/api/tickers/?limit=100", {
        headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ApiResponse = await res.json();
    return data.data;
};
```

- `async/await`로 비동기 fetch 처리
- `res.ok` 체크로 HTTP 에러를 명시적으로 throw → `useQuery`의 `isError` 가 잡아냄
- `?limit=100` 으로 상위 100개 코인만 요청

---

### 3. useQuery — 데이터 캐싱 & 자동 갱신

```ts
const { data: list, isLoading, isError } = useQuery({
    queryKey: ["coins"],      // 캐시 키
    queryFn: fetchCoins,      // 데이터 fetch 함수
    refetchInterval: 60_000,  // 60초마다 자동 갱신
});
```

| 반환값 | 타입 | 역할 |
|--------|------|------|
| `list` | `Coin[] \| undefined` | 코인 데이터 배열 |
| `isLoading` | `boolean` | 최초 로딩 중 여부 |
| `isError` | `boolean` | 에러 발생 여부 |

`useState + useEffect + fetch` 조합을 `useQuery` 하나로 대체해요.

---

### 4. 다크모드 — CSS 변수 + classList

```ts
const [isDark, setIsDark] = useState(false); // 라이트모드 기본값

useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
}, [isDark]);
```

```css
/* index.css */
:root      { --bg: #f0f2f5; --text-primary: #0f1117; }
:root.dark { --bg: #0d0f14; --text-primary: #e8eaf0; }

body, #root { background-color: var(--bg); transition: background-color 0.3s; }
```

- `isDark` 가 바뀌면 `<html>` 태그에 `.dark` 클래스를 토글
- `:root.dark` 에서 CSS 변수 전체를 덮어씌워 모든 컴포넌트에 자동 반영
- `body` 와 `#root` 에 `background-color: var(--bg)` 필수 — 없으면 배경이 안 바뀜

---

### 5. 가격 포맷 함수

```ts
// 큰 숫자 단위 변환 (시총, 거래량)
const fmt = (n: number, decimals = 2) =>
    n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M`
    : `$${n.toLocaleString(undefined, { maximumFractionDigits: decimals })}`;

// 코인 가격 (소수점 자동 조정)
const fmtPrice = (usd: string) => {
    const n = parseFloat(usd);
    if (n >= 1000) return `$${n.toLocaleString(...)}`;  // 쉼표 포맷
    if (n >= 1)    return `$${n.toFixed(4)}`;           // 소수 4자리
    return         `$${n.toFixed(6)}`;                  // 소수 6자리
};
```

---

### 6. 코인 아이콘 색상 — 해시 기반 분산

```ts
const ICON_PALETTES = [
    { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' }, // indigo
    { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' }, // teal
    // ... 총 8가지 색상
];

const getCoinIconStyle = (id: string) => {
    const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ICON_PALETTES.length;
    return ICON_PALETTES[idx];
};
```

코인 `id` 의 각 문자 charCode 합계를 팔레트 길이로 나눈 나머지로 색상을 결정해요.
같은 코인은 항상 같은 색이 나오고, 8가지 색이 고르게 분산돼요.

---

### 7. 미니 스파크라인 바

```ts
const getBars = (id: string) => {
    const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 7 }, (_, i) => 4 + ((seed * (i + 3)) % 16));
};
```

랜덤이 아닌 **결정론적(deterministic) 값**으로 바 높이를 생성해요.
리렌더링해도 같은 코인은 항상 같은 모양의 바가 나와요.

---

### 8. IosSpinner — `components/IosSpinner.tsx`

```tsx
function IosSpinner({ size = 252, color = '#2563eb' }: IosSpinnerProps) {
    const cx = size / 2;
    const r1 = size * 0.25;  // 안쪽 반지름
    const r2 = size * 0.393; // 바깥쪽 반지름
    const sw = size * 0.079; // strokeWidth

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} ...>
                    <animateTransform type="rotate" dur="0.9s" repeatCount="indefinite" />
                </line>
            ))}
        </svg>
    );
}
```

- 12개 획을 시계 방향으로 균등 배치
- 각 획마다 `opacity` 를 점진적으로 적용해 잔상 효과 구현
- `size` 기준 비율로 계산해서 어떤 크기에서도 정비율 유지
- 라이트/다크에 따라 `color` prop으로 색상 전환

---

## 🌐 사용 API

| 항목 | 내용 |
|------|------|
| API | [CoinLore](https://api.coinlore.net/) |
| 엔드포인트 | `GET /api/tickers/?limit=100` |
| CORS | 허용 (프록시 불필요) |
| 갱신 주기 | 60초 자동 갱신 |

---

## 🛠 기술 스택

| 분류 | 사용 기술 |
|------|-----------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 데이터 패칭 | TanStack Query (React Query) |
| 스타일 | CSS Modules |
| 폰트 | DM Sans, Space Mono |