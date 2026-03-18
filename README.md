# 🪙 Coin Tracker

CoinPaprika API를 활용한 실시간 암호화폐 시세 조회 앱입니다.

---

## 📁 프로젝트 구조

```
src/
├── App.tsx
└── styles/
    └── App.module.css
```

---

## 🔑 핵심 코드 설명

### 1. TypeScript 인터페이스 — 타입 정의

```ts
interface Quote {
    price: number;
    percent_change_24h: number;
    // ...
}

interface Coin {
    id: string;
    name: string;
    symbol: string;
    quotes: {
        USD: Quote;
    };
}
```

API 응답 데이터의 형태를 미리 정의합니다.
`Coin` 안에 `Quote`를 중첩 타입으로 사용해 `coin.quotes.USD.price`처럼 안전하게 접근할 수 있어요.

---

### 2. useState — 상태 관리

```ts
const [loading, setLoading] = useState<boolean>(true);
const [coins, setCoins]     = useState<Coin[]>([]);
```

| 상태 | 타입 | 초기값 | 역할 |
|------|------|--------|------|
| `loading` | `boolean` | `true` | 데이터 로딩 중 여부 |
| `coins` | `Coin[]` | `[]` | 코인 목록 배열 |

제네릭(`<boolean>`, `<Coin[]>`)으로 타입을 명시하면 잘못된 값 할당 시 컴파일 에러가 발생해요.

---

### 3. useEffect + fetch — 데이터 패칭

```ts
useEffect(() => {
    fetch("https://api.coinpaprika.com/v1/tickers")
        .then((response) => response.json())
        .then((json: Coin[]) => {
            setCoins(json);
            setLoading(false);
        });
}, []);   // ← 의존성 배열이 빈 배열이면 컴포넌트 마운트 시 딱 1번만 실행
```

- `useEffect`의 두 번째 인자 `[]`는 **마운트 시 1회만 실행**을 의미해요.
- `response.json()`으로 파싱한 뒤 `Coin[]` 타입으로 단언해 타입 안전성을 확보해요.
- 데이터 수신 완료 후 `setLoading(false)`로 로딩 상태를 해제해요.

---

### 4. 조건부 렌더링

```tsx
{loading
    ? <strong className={styles.loading}>Loading...</strong>
    : <select className={styles.select}>...</select>
}
```

삼항 연산자로 `loading` 상태에 따라 다른 UI를 렌더링해요.
`loading === true`이면 로딩 텍스트, `false`이면 코인 목록 드롭다운을 보여줘요.

---

### 5. Fragment + map — 리스트 렌더링

```tsx
{coins.map((coin) => (
    <Fragment key={coin.id}>
        <option>
            {coin.name} ({coin.symbol}): ${coin.quotes.USD.price.toFixed(4)} USD
        </option>
    </Fragment>
))}
```

- `key`는 React가 리스트 항목을 추적하는 고유 식별자예요. `index` 대신 `coin.id`를 사용하는 게 권장돼요.
- `Fragment`는 DOM에 추가 노드 없이 여러 요소를 감쌀 때 사용해요.
- `.toFixed(4)`로 소수점 4자리까지 표시해요.

---

### 6. CSS Modules — 스타일 적용

```ts
import styles from './styles/App.module.css';
// ✅ 올바른 방식

// ❌ 잘못된 방식 (CSS Modules에서는 동작 안 함)
import './styles/App.module.css';
```

```tsx
<div className={styles.container}>   // ✅ styles.클래스명
<div className={container}>          // ❌ 변수 없음 — ReferenceError
<div className={loading}>            // ❌ loading은 boolean — 타입 오류
```

CSS Modules는 `import styles from ...` 으로 객체를 받아와 `styles.클래스명` 형태로 사용해야 해요.
클래스명이 자동으로 고유하게 변환되어 전역 충돌을 방지해줘요.

---

## 🌐 사용 API

| 항목 | 내용 |
|------|------|
| API | [CoinPaprika](https://api.coinpaprika.com/) |
| 엔드포인트 | `GET /v1/tickers` |
| 응답 | 전체 코인 시세 목록 (USD 기준) |