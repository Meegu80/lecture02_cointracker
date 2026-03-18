import { useState, useEffect } from 'react';
import styles from './styles/App.module.css';
import { useQuery } from "@tanstack/react-query";
import IosSpinner from './components/IosSpinner';

type Coin = {
    id: string;
    symbol: string;
    name: string;
    nameid: string;
    rank: number;
    percent_change_24h: string;
    percent_change_1h: string;
    percent_change_7d: string;
    price_usd: string;
    price_btc: string;
    market_cap_usd: string;
    volume24: number;
    csupply: string;
    tsupply: string;
    msupply: string;
};

type ApiResponse = { data: Coin[] };

const fetchCoins = async (): Promise<Coin[]> => {
    const res = await fetch("https://api.coinlore.net/api/tickers/?limit=100", {
        headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ApiResponse = await res.json();
    return data.data;
};

const fmt = (n: number, decimals = 2) =>
    n >= 1e9
        ? `$${(n / 1e9).toFixed(1)}B`
        : n >= 1e6
            ? `$${(n / 1e6).toFixed(1)}M`
            : `$${n.toLocaleString(undefined, { maximumFractionDigits: decimals })}`;

const fmtPrice = (usd: string) => {
    const n = parseFloat(usd);
    if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (n >= 1)    return `$${n.toFixed(4)}`;
    return `$${n.toFixed(6)}`;
};

const getBars = (id: string) => {
    const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 7 }, (_, i) => 4 + ((seed * (i + 3)) % 16));
};

const ICON_PALETTES = [
    { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
    { bg: 'rgba(20,184,166,0.12)',  color: '#14b8a6' },
    { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
    { bg: 'rgba(168,85,247,0.12)',  color: '#a855f7' },
    { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    { bg: 'rgba(249,115,22,0.12)',  color: '#f97316' },
];

const getCoinIconStyle = (id: string) => {
    const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ICON_PALETTES.length;
    return ICON_PALETTES[idx];
};

function App() {
    const [isDark, setIsDark] = useState(false); // 라이트모드 기본값

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const { data: list, isLoading, isError } = useQuery({
        queryKey: ["coins"],
        queryFn: fetchCoins,
        refetchInterval: 60_000,
    });

    const totalMcap = list?.reduce((acc, c) => acc + parseFloat(c.market_cap_usd || '0'), 0) ?? 0;
    const gainers   = list?.filter(c => parseFloat(c.percent_change_24h) > 0).length ?? 0;
    const losers    = list?.filter(c => parseFloat(c.percent_change_24h) < 0).length ?? 0;

    const spinnerColor = isDark ? '#60a5fa' : '#2563eb';

    const renderBody = () => {
        if (isLoading) {
            return (
                <div className={styles.loading}>
                    <IosSpinner color={spinnerColor} />
                    Fetching market data…
                </div>
            );
        }

        if (isError || !list || list.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📡</div>
                    <div className={styles.emptyTitle}>데이터를 불러올 수 없어요</div>
                    <div className={styles.emptyDesc}>잠시 후 자동으로 다시 시도합니다</div>
                </div>
            );
        }

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <colgroup>
                        <col className={styles.colRank} />
                        <col className={styles.colAsset} />
                        <col className={`${styles.colSymbol} ${styles.hideOnMobile}`} />
                        <col className={styles.colPrice} />
                        <col className={`${styles.colMcap} ${styles.hideOnMobile}`} />
                        <col className={`${styles.colVol} ${styles.hideOnMobile}`} />
                        <col className={styles.colChange} />
                    </colgroup>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Asset</th>
                        <th className={styles.hideOnMobile}>Symbol</th>
                        <th className={styles.right}>Price</th>
                        <th className={`${styles.right} ${styles.hideOnMobile}`}>Market Cap</th>
                        <th className={`${styles.right} ${styles.hideOnMobile}`}>24h Vol</th>
                        <th className={styles.right}>24h %</th>
                    </tr>
                    </thead>
                    <tbody>
                    {list.map((coin) => {
                        const change    = parseFloat(coin.percent_change_24h);
                        const isPos     = change >= 0;
                        const bars      = getBars(coin.id);
                        const barColor  = isPos ? 'var(--positive)' : 'var(--negative)';
                        const iconStyle = getCoinIconStyle(coin.id);

                        return (
                            <tr key={coin.id}>
                                <td><span className={styles.rank}>{coin.rank}</span></td>

                                <td>
                                    <div className={styles.nameCell}>
                                        <div
                                            className={styles.coinIcon}
                                            style={{ background: iconStyle.bg, color: iconStyle.color }}
                                        >
                                            {coin.symbol.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className={styles.coinName}>{coin.name}</div>
                                            <div className={styles.coinId}>{coin.nameid}</div>
                                        </div>
                                    </div>
                                </td>

                                <td className={styles.hideOnMobile}>
                                    <span className={styles.symbol}>{coin.symbol}</span>
                                </td>

                                <td className={styles.right}>
                                    <span className={styles.price}>{fmtPrice(coin.price_usd)}</span>
                                </td>

                                <td className={`${styles.right} ${styles.hideOnMobile}`}>
                                        <span className={styles.marketCap}>
                                            {fmt(parseFloat(coin.market_cap_usd))}
                                        </span>
                                </td>

                                <td className={`${styles.right} ${styles.hideOnMobile}`}>
                                    <span className={styles.volume}>{fmt(coin.volume24)}</span>
                                </td>

                                <td className={styles.right}>
                                    <div className={styles.changeCell}>
                                        <div className={styles.miniBar}>
                                            {bars.map((h, i) => (
                                                <span key={i} style={{ height: h, background: barColor }} />
                                            ))}
                                        </div>
                                        <span className={`${styles.changeBadge} ${isPos ? styles.positive : styles.negative}`}>
                                                {isPos ? '+' : ''}{change.toFixed(2)}%
                                            </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <span className={styles.eyebrow}>Live Market</span>
                    <h1 className={styles.title}>Crypto <span>Dashboard</span></h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.meta}>AUTO-REFRESH · 60s</span>
                    <button
                        className={styles.themeToggle}
                        onClick={() => setIsDark(d => !d)}
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            {!isLoading && list && list.length > 0 && (
                <div className={styles.statsStrip}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Listed</div>
                        <div className={styles.statValue}>{list.length}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Total Market Cap</div>
                        <div className={styles.statValue}>{fmt(totalMcap, 0)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Gainers 24h</div>
                        <div className={`${styles.statValue} ${styles.positive}`}>{gainers}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Losers 24h</div>
                        <div className={`${styles.statValue} ${styles.negative}`}>{losers}</div>
                    </div>
                </div>
            )}

            {renderBody()}
        </div>
    );
}

export default App;