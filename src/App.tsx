import { Fragment, useEffect, useState } from 'react';
import styles from './styles/App.module.css';

interface Quote {
    price: number;
    volume_24h: number;
    market_cap: number;
    percent_change_1h: number;
    percent_change_24h: number;
    percent_change_7d: number;
    percent_change_30d: number;
    percent_change_1y: number;
    ath_price: number;
    ath_date: string;
    percent_from_price_ath: number;
}

interface Coin {
    id: string;
    name: string;
    symbol: string;
    rank: number;
    total_supply: number;
    max_supply: number;
    beta_value: number;
    first_data_at: string;
    last_updated: string;
    quotes: {
        USD: Quote;
    };
}

function App() {
    const [loading, setLoading] = useState<boolean>(true);
    const [coins, setCoins] = useState<Coin[]>([]);

    useEffect(() => {
        fetch("https://api.coinpaprika.com/v1/tickers")
            .then((response) => response.json())
            .then((json: Coin[]) => {
                setCoins(json);
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                The Coins! {loading ? "" : `(${coins.length})`}
            </h1>
            {loading
                ? <strong className={styles.loading}>Loading...</strong>
                : <select className={styles.select}>
                    {coins.map((coin) => (
                        <Fragment key={coin.id}>
                            <option>
                                {coin.name} ({coin.symbol}): ${coin.quotes.USD.price.toFixed(4)} USD
                            </option>
                        </Fragment>
                    ))}
                </select>
            }
        </div>
    );
}

export default App;