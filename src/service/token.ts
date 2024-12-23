import {
  DexScreenerData,
  DexScreenerPair,
  HolderData,
  ProcessedTokenData,
  TokenSecurityData,
  TokenTradeData,
  Prices,
  RugcheckData,
} from "@/app/types/token";
import BigNumber from "bignumber.js";
import { formatNumber, formatNumberWithDots } from "@/lib/utils";

const BN = BigNumber;

// Helper function to create new BigNumber instances
function toBN(value: string | number | BigNumber): BigNumber {
  return new BN(value);
}

const PROVIDER_CONFIG = {
  BIRDEYE_API: "https://public-api.birdeye.so",
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  DEFAULT_RPC: "https://api.mainnet-beta.solana.com",
  TOKEN_ADDRESSES: {
    SOL: "So11111111111111111111111111111111111111112",
    BTC: "qfnqNqs3nCAHjnyCgLRDbBtq4p2MtHZxw8YjSyYhPoL",
    ETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    Example: "A8LCx85weSxU4ubQS16twdSdYphbAEDdMd9GkZq5pump",
  },
  TOKEN_SECURITY_ENDPOINT: "/defi/token_security?address=",
  TOKEN_TRADE_DATA_ENDPOINT: "/defi/v3/token/trade-data/single?address=",
  TOKEN_HOLDERS_ENDPOINT: "/defi/v3/token/holder?address=",
  DEX_SCREENER_API: "https://api.dexscreener.com/latest/dex/tokens",
  RUG_CHECK_API: "https://api.rugcheck.xyz/v1",
  MAIN_WALLET: "DQg7hy9Ne4CwpYL1v1YsyC6ryRk3gDLbgLixx3SayXQ2",
};

export class TokenProvider {
  private NETWORK_ID = 1399811149;
  private GRAPHQL_ENDPOINT = "https://graph.codex.io/graphql";

  constructor(
    //  private connection: Connection,
    private tokenAddress: string
  ) {}

  private async fetchWithRetry(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            Accept: "application/json",
            "x-chain": "solana",
            "X-API-KEY": process.env.BIRDEYE_API_KEY || "",
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        lastError = error as Error;
        if (i < PROVIDER_CONFIG.MAX_RETRIES - 1) {
          const delay = PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, i);
          console.log(`Waiting ${delay}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    console.error("All attempts failed. Throwing the last error:", lastError);
    throw lastError;
  }

  async fetchPrices(): Promise<Prices> {
    try {
      const cacheKey = "prices";

      const { SOL, BTC, ETH } = PROVIDER_CONFIG.TOKEN_ADDRESSES;
      const tokens = [SOL, BTC, ETH];
      const prices: Prices = {
        solana: { usd: "0" },
        bitcoin: { usd: "0" },
        ethereum: { usd: "0" },
      };

      for (const token of tokens) {
        const response = await this.fetchWithRetry(
          `${PROVIDER_CONFIG.BIRDEYE_API}/defi/price?address=${token}`,
          {
            headers: {
              "x-chain": "solana",
            },
          }
        );

        if (response?.data?.value) {
          const price = response.data.value.toString();
          prices[
            token === SOL ? "solana" : token === BTC ? "bitcoin" : "ethereum"
          ].usd = price;
        } else {
          console.warn(`No price data available for token: ${token}`);
        }
      }
      return prices;
    } catch (error) {
      console.error("Error fetching prices:", error);
      throw error;
    }
  }

  async fetchTokenSecurity(): Promise<TokenSecurityData> {
    const cacheKey = `tokenSecurity_${this.tokenAddress}`;

    const url = `${PROVIDER_CONFIG.BIRDEYE_API}${PROVIDER_CONFIG.TOKEN_SECURITY_ENDPOINT}${this.tokenAddress}`;
    const data = await this.fetchWithRetry(url);

    if (!data?.success || !data?.data) {
      throw new Error("No token security data available");
    }

    const security: TokenSecurityData = {
      ownerBalance: data.data.ownerBalance,
      creatorBalance: data.data.creatorBalance,
      ownerPercentage: data.data.ownerPercentage * 100,
      creatorPercentage: data.data.creatorPercentage * 100,
      top10HolderBalance: data.data.top10UserBalance,
      top10HolderPercent: data.data.top10UserPercent * 100,
      totalSupply: data.data.totalSupply,
    };

    return security;
  }

  async fetchRugCheck(): Promise<RugcheckData> {
    const cacheKey = `rugcheck_${this.tokenAddress}`;

    const url = `${PROVIDER_CONFIG.RUG_CHECK_API}/tokens/${this.tokenAddress}/report/summary`;
    console.log(`Fetching rugcheck data url: ${url}`);
    const data = (await this.fetchWithRetry(url)) as RugcheckData;
    if (!data) {
      throw new Error("No rugcheck data available");
    }

    return data;
  }

  async fetchTokenTradeData(): Promise<TokenTradeData> {
    const cacheKey = `tokenTradeData_${this.tokenAddress}`;
    const url = `${PROVIDER_CONFIG.BIRDEYE_API}${PROVIDER_CONFIG.TOKEN_TRADE_DATA_ENDPOINT}${this.tokenAddress}`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-KEY": process.env.BIRDEYE_API_KEY || "",
      },
    };

    const data = (await fetch(url, options)
      .then((res) => res.json())
      .catch((err) => console.error(err))) as any;

    if (!data?.success || !data?.data) {
      throw new Error("No token trade data available");
    }

    const tradeData: TokenTradeData = {
      address: data.data.address,
      holder: data.data.holder,
      market: data.data.market,
      last_trade_unix_time: data.data.last_trade_unix_time,
      last_trade_human_time: data.data.last_trade_human_time,
      price: data.data.price,
      history_30m_price: data.data.history_30m_price,
      price_change_30m_percent: data.data.price_change_30m_percent,
      history_1h_price: data.data.history_1h_price,
      price_change_1h_percent: data.data.price_change_1h_percent,
      history_2h_price: data.data.history_2h_price,
      price_change_2h_percent: data.data.price_change_2h_percent,
      history_4h_price: data.data.history_4h_price,
      price_change_4h_percent: data.data.price_change_4h_percent,
      history_6h_price: data.data.history_6h_price,
      price_change_6h_percent: data.data.price_change_6h_percent,
      history_8h_price: data.data.history_8h_price,
      price_change_8h_percent: data.data.price_change_8h_percent,
      history_12h_price: data.data.history_12h_price,
      price_change_12h_percent: data.data.price_change_12h_percent,
      history_24h_price: data.data.history_24h_price,
      price_change_24h_percent: data.data.price_change_24h_percent,
      unique_wallet_30m: data.data.unique_wallet_30m,
      unique_wallet_history_30m: data.data.unique_wallet_history_30m,
      unique_wallet_30m_change_percent:
        data.data.unique_wallet_30m_change_percent,
      unique_wallet_1h: data.data.unique_wallet_1h,
      unique_wallet_history_1h: data.data.unique_wallet_history_1h,
      unique_wallet_1h_change_percent:
        data.data.unique_wallet_1h_change_percent,
      unique_wallet_2h: data.data.unique_wallet_2h,
      unique_wallet_history_2h: data.data.unique_wallet_history_2h,
      unique_wallet_2h_change_percent:
        data.data.unique_wallet_2h_change_percent,
      unique_wallet_4h: data.data.unique_wallet_4h,
      unique_wallet_history_4h: data.data.unique_wallet_history_4h,
      unique_wallet_4h_change_percent:
        data.data.unique_wallet_4h_change_percent,
      unique_wallet_8h: data.data.unique_wallet_8h,
      unique_wallet_history_8h: data.data.unique_wallet_history_8h,
      unique_wallet_8h_change_percent:
        data.data.unique_wallet_8h_change_percent,
      unique_wallet_24h: data.data.unique_wallet_24h,
      unique_wallet_history_24h: data.data.unique_wallet_history_24h,
      unique_wallet_24h_change_percent:
        data.data.unique_wallet_24h_change_percent,
      trade_30m: data.data.trade_30m,
      trade_history_30m: data.data.trade_history_30m,
      trade_30m_change_percent: data.data.trade_30m_change_percent,
      sell_30m: data.data.sell_30m,
      sell_history_30m: data.data.sell_history_30m,
      sell_30m_change_percent: data.data.sell_30m_change_percent,
      buy_30m: data.data.buy_30m,
      buy_history_30m: data.data.buy_history_30m,
      buy_30m_change_percent: data.data.buy_30m_change_percent,
      volume_30m: data.data.volume_30m,
      volume_30m_usd: data.data.volume_30m_usd,
      volume_history_30m: data.data.volume_history_30m,
      volume_history_30m_usd: data.data.volume_history_30m_usd,
      volume_30m_change_percent: data.data.volume_30m_change_percent,
      volume_buy_30m: data.data.volume_buy_30m,
      volume_buy_30m_usd: data.data.volume_buy_30m_usd,
      volume_buy_history_30m: data.data.volume_buy_history_30m,
      volume_buy_history_30m_usd: data.data.volume_buy_history_30m_usd,
      volume_buy_30m_change_percent: data.data.volume_buy_30m_change_percent,
      volume_sell_30m: data.data.volume_sell_30m,
      volume_sell_30m_usd: data.data.volume_sell_30m_usd,
      volume_sell_history_30m: data.data.volume_sell_history_30m,
      volume_sell_history_30m_usd: data.data.volume_sell_history_30m_usd,
      volume_sell_30m_change_percent: data.data.volume_sell_30m_change_percent,
      trade_1h: data.data.trade_1h,
      trade_history_1h: data.data.trade_history_1h,
      trade_1h_change_percent: data.data.trade_1h_change_percent,
      sell_1h: data.data.sell_1h,
      sell_history_1h: data.data.sell_history_1h,
      sell_1h_change_percent: data.data.sell_1h_change_percent,
      buy_1h: data.data.buy_1h,
      buy_history_1h: data.data.buy_history_1h,
      buy_1h_change_percent: data.data.buy_1h_change_percent,
      volume_1h: data.data.volume_1h,
      volume_1h_usd: data.data.volume_1h_usd,
      volume_history_1h: data.data.volume_history_1h,
      volume_history_1h_usd: data.data.volume_history_1h_usd,
      volume_1h_change_percent: data.data.volume_1h_change_percent,
      volume_buy_1h: data.data.volume_buy_1h,
      volume_buy_1h_usd: data.data.volume_buy_1h_usd,
      volume_buy_history_1h: data.data.volume_buy_history_1h,
      volume_buy_history_1h_usd: data.data.volume_buy_history_1h_usd,
      volume_buy_1h_change_percent: data.data.volume_buy_1h_change_percent,
      volume_sell_1h: data.data.volume_sell_1h,
      volume_sell_1h_usd: data.data.volume_sell_1h_usd,
      volume_sell_history_1h: data.data.volume_sell_history_1h,
      volume_sell_history_1h_usd: data.data.volume_sell_history_1h_usd,
      volume_sell_1h_change_percent: data.data.volume_sell_1h_change_percent,
      trade_2h: data.data.trade_2h,
      trade_history_2h: data.data.trade_history_2h,
      trade_2h_change_percent: data.data.trade_2h_change_percent,
      sell_2h: data.data.sell_2h,
      sell_history_2h: data.data.sell_history_2h,
      sell_2h_change_percent: data.data.sell_2h_change_percent,
      buy_2h: data.data.buy_2h,
      buy_history_2h: data.data.buy_history_2h,
      buy_2h_change_percent: data.data.buy_2h_change_percent,
      volume_2h: data.data.volume_2h,
      volume_2h_usd: data.data.volume_2h_usd,
      volume_history_2h: data.data.volume_history_2h,
      volume_history_2h_usd: data.data.volume_history_2h_usd,
      volume_2h_change_percent: data.data.volume_2h_change_percent,
      volume_buy_2h: data.data.volume_buy_2h,
      volume_buy_2h_usd: data.data.volume_buy_2h_usd,
      volume_buy_history_2h: data.data.volume_buy_history_2h,
      volume_buy_history_2h_usd: data.data.volume_buy_history_2h_usd,
      volume_buy_2h_change_percent: data.data.volume_buy_2h_change_percent,
      volume_sell_2h: data.data.volume_sell_2h,
      volume_sell_2h_usd: data.data.volume_sell_2h_usd,
      volume_sell_history_2h: data.data.volume_sell_history_2h,
      volume_sell_history_2h_usd: data.data.volume_sell_history_2h_usd,
      volume_sell_2h_change_percent: data.data.volume_sell_2h_change_percent,
      trade_4h: data.data.trade_4h,
      trade_history_4h: data.data.trade_history_4h,
      trade_4h_change_percent: data.data.trade_4h_change_percent,
      sell_4h: data.data.sell_4h,
      sell_history_4h: data.data.sell_history_4h,
      sell_4h_change_percent: data.data.sell_4h_change_percent,
      buy_4h: data.data.buy_4h,
      buy_history_4h: data.data.buy_history_4h,
      buy_4h_change_percent: data.data.buy_4h_change_percent,
      volume_4h: data.data.volume_4h,
      volume_4h_usd: data.data.volume_4h_usd,
      volume_history_4h: data.data.volume_history_4h,
      volume_history_4h_usd: data.data.volume_history_4h_usd,
      volume_4h_change_percent: data.data.volume_4h_change_percent,
      volume_buy_4h: data.data.volume_buy_4h,
      volume_buy_4h_usd: data.data.volume_buy_4h_usd,
      volume_buy_history_4h: data.data.volume_buy_history_4h,
      volume_buy_history_4h_usd: data.data.volume_buy_history_4h_usd,
      volume_buy_4h_change_percent: data.data.volume_buy_4h_change_percent,
      volume_sell_4h: data.data.volume_sell_4h,
      volume_sell_4h_usd: data.data.volume_sell_4h_usd,
      volume_sell_history_4h: data.data.volume_sell_history_4h,
      volume_sell_history_4h_usd: data.data.volume_sell_history_4h_usd,
      volume_sell_4h_change_percent: data.data.volume_sell_4h_change_percent,
      trade_8h: data.data.trade_8h,
      trade_history_8h: data.data.trade_history_8h,
      trade_8h_change_percent: data.data.trade_8h_change_percent,
      sell_8h: data.data.sell_8h,
      sell_history_8h: data.data.sell_history_8h,
      sell_8h_change_percent: data.data.sell_8h_change_percent,
      buy_8h: data.data.buy_8h,
      buy_history_8h: data.data.buy_history_8h,
      buy_8h_change_percent: data.data.buy_8h_change_percent,
      volume_8h: data.data.volume_8h,
      volume_8h_usd: data.data.volume_8h_usd,
      volume_history_8h: data.data.volume_history_8h,
      volume_history_8h_usd: data.data.volume_history_8h_usd,
      volume_8h_change_percent: data.data.volume_8h_change_percent,
      volume_buy_8h: data.data.volume_buy_8h,
      volume_buy_8h_usd: data.data.volume_buy_8h_usd,
      volume_buy_history_8h: data.data.volume_buy_history_8h,
      volume_buy_history_8h_usd: data.data.volume_buy_history_8h_usd,
      volume_buy_8h_change_percent: data.data.volume_buy_8h_change_percent,
      volume_sell_8h: data.data.volume_sell_8h,
      volume_sell_8h_usd: data.data.volume_sell_8h_usd,
      volume_sell_history_8h: data.data.volume_sell_history_8h,
      volume_sell_history_8h_usd: data.data.volume_sell_history_8h_usd,
      volume_sell_8h_change_percent: data.data.volume_sell_8h_change_percent,
      trade_24h: data.data.trade_24h,
      trade_history_24h: data.data.trade_history_24h,
      trade_24h_change_percent: data.data.trade_24h_change_percent,
      sell_24h: data.data.sell_24h,
      sell_history_24h: data.data.sell_history_24h,
      sell_24h_change_percent: data.data.sell_24h_change_percent,
      buy_24h: data.data.buy_24h,
      buy_history_24h: data.data.buy_history_24h,
      buy_24h_change_percent: data.data.buy_24h_change_percent,
      volume_24h: data.data.volume_24h,
      volume_24h_usd: data.data.volume_24h_usd,
      volume_history_24h: data.data.volume_history_24h,
      volume_history_24h_usd: data.data.volume_history_24h_usd,
      volume_24h_change_percent: data.data.volume_24h_change_percent,
      volume_buy_24h: data.data.volume_buy_24h,
      volume_buy_24h_usd: data.data.volume_buy_24h_usd,
      volume_buy_history_24h: data.data.volume_buy_history_24h,
      volume_buy_history_24h_usd: data.data.volume_buy_history_24h_usd,
      volume_buy_24h_change_percent: data.data.volume_buy_24h_change_percent,
      volume_sell_24h: data.data.volume_sell_24h,
      volume_sell_24h_usd: data.data.volume_sell_24h_usd,
      volume_sell_history_24h: data.data.volume_sell_history_24h,
      volume_sell_history_24h_usd: data.data.volume_sell_history_24h_usd,
      volume_sell_24h_change_percent: data.data.volume_sell_24h_change_percent,
    };
    return tradeData;
  }

  async fetchDexScreenerData(): Promise<DexScreenerData> {
    const cacheKey = `dexScreenerData_${this.tokenAddress}`;

    const url = `https://api.dexscreener.com/latest/dex/search?q=${this.tokenAddress}`;
    try {
      console.log(`Fetching DexScreener data for token: ${this.tokenAddress}`);
      const data = (await fetch(url)
        .then((res) => res.json())
        .catch((err) => {
          console.error(err);
        })) as any;

      if (!data || !data.pairs) {
        throw new Error("No DexScreener data available");
      }

      const dexData: DexScreenerData = {
        schemaVersion: data.schemaVersion,
        pairs: data.pairs,
      };

      // Cache the result

      return dexData;
    } catch (error) {
      console.error(`Error fetching DexScreener data:`, error);
      return {
        schemaVersion: "1.0.0",
        pairs: [],
      };
    }
  }

  async searchDexScreenerData(symbol: string): Promise<DexScreenerPair | null> {
    const cacheKey = `dexScreenerData_search_${symbol}`;

    const url = `https://api.dexscreener.com/latest/dex/search?q=${symbol}`;
    try {
      console.log(`Fetching DexScreener data for symbol: ${symbol}`);
      const data = (await fetch(url)
        .then((res) => res.json())
        .catch((err) => {
          console.error(err);
          return null;
        })) as any;

      if (!data || !data.pairs || data.pairs.length === 0) {
        throw new Error("No DexScreener data available");
      }

      const dexData: DexScreenerData = {
        schemaVersion: data.schemaVersion,
        pairs: data.pairs,
      };

      // Return the pair with the highest liquidity and market cap
      return this.getHighestLiquidityPair(dexData);
    } catch (error) {
      console.error(`Error fetching DexScreener data:`, error);
      return null;
    }
  }
  getHighestLiquidityPair(dexData: DexScreenerData): DexScreenerPair | null {
    if (dexData.pairs.length === 0) {
      return null;
    }

    // Sort pairs by both liquidity and market cap to get the highest one
    return dexData.pairs.sort((a, b) => {
      const liquidityDiff = b.liquidity.usd - a.liquidity.usd;
      if (liquidityDiff !== 0) {
        return liquidityDiff; // Higher liquidity comes first
      }
      return b.marketCap - a.marketCap; // If liquidity is equal, higher market cap comes first
    })[0];
  }

  async analyzeHolderDistribution(tradeData: TokenTradeData): Promise<string> {
    // Define the time intervals to consider (e.g., 30m, 1h, 2h)
    const intervals = [
      {
        period: "30m",
        change: tradeData.unique_wallet_30m_change_percent,
      },
      { period: "1h", change: tradeData.unique_wallet_1h_change_percent },
      { period: "2h", change: tradeData.unique_wallet_2h_change_percent },
      { period: "4h", change: tradeData.unique_wallet_4h_change_percent },
      { period: "8h", change: tradeData.unique_wallet_8h_change_percent },
      {
        period: "24h",
        change: tradeData.unique_wallet_24h_change_percent,
      },
    ];

    // Calculate the average change percentage
    const validChanges = intervals
      .map((interval) => interval.change)
      .filter((change) => change !== null && change !== undefined) as number[];

    if (validChanges.length === 0) {
      return "stable";
    }

    const averageChange =
      validChanges.reduce((acc, curr) => acc + curr, 0) / validChanges.length;

    const increaseThreshold = 10; // e.g., average change > 10%
    const decreaseThreshold = -10; // e.g., average change < -10%

    if (averageChange > increaseThreshold) {
      return "increasing";
    } else if (averageChange < decreaseThreshold) {
      return "decreasing";
    } else {
      return "stable";
    }
  }

  async fetchHolderList(): Promise<HolderData[]> {
    const cacheKey = `holderList_${this.tokenAddress}`;

    //HELIOUS_API_KEY needs to be added
    const url = `${PROVIDER_CONFIG.BIRDEYE_API}${PROVIDER_CONFIG.TOKEN_HOLDERS_ENDPOINT}${this.tokenAddress}`;
    try {
      const data = await this.fetchWithRetry(url);
      if (!data?.success || !data?.data) {
        throw new Error("No token holder data available");
      }

      const holders = data.data.items.map((holder: any) => {
        return {
          address: holder.owner,
          balance: holder.ui_amount,
        };
      });

      // Cache the result

      return holders;
    } catch (error) {
      console.error("Error fetching holder list from Helius:", error);
      throw new Error("Failed to fetch holder list from Helius.");
    }
  }

  async filterHighValueHolders(
    tradeData: TokenTradeData
  ): Promise<Array<{ holderAddress: string; balanceUsd: string }>> {
    const holdersData = await this.fetchHolderList();

    const tokenPriceUsd = toBN(tradeData.price);

    const highValueHolders = holdersData
      .filter((holder) => {
        const balanceUsd = toBN(holder.balance).multipliedBy(tokenPriceUsd);
        return balanceUsd.isGreaterThan(5);
      })
      .map((holder) => ({
        holderAddress: holder.address,
        balanceUsd: toBN(holder.balance).multipliedBy(tokenPriceUsd).toFixed(2),
      }));

    return highValueHolders;
  }

  async checkRecentTrades(tradeData: TokenTradeData): Promise<boolean> {
    return toBN(tradeData.volume_24h_usd).isGreaterThan(0);
  }

  async countHighSupplyHolders(
    securityData: TokenSecurityData
  ): Promise<number> {
    try {
      const totalSupply = securityData.totalSupply;

      const highSupplyHolders = await this.fetchHolderList();
      const highSupplyHoldersCount = highSupplyHolders.filter((holder) => {
        const balance = toBN(holder.balance);
        return balance.dividedBy(totalSupply).isGreaterThan(0.02);
      }).length;
      return highSupplyHoldersCount;
    } catch (error) {
      console.error("Error counting high supply holders:", error);
      return 0;
    }
  }

  async getProcessedTokenData(): Promise<ProcessedTokenData> {
    try {
      const promises = [] as Promise<any>[];

      console.log(`Fetching security data for token: ${this.tokenAddress}`);
      const security = await this.fetchTokenSecurity();

      console.log(`Fetching trade data for token: ${this.tokenAddress}`);
      const tradeData = await this.fetchTokenTradeData();

      console.log(`Fetching DexScreener data for token: ${this.tokenAddress}`);
      const dexDataPromise = this.fetchDexScreenerData();
      promises.push(dexDataPromise);

      console.log(
        `Analyzing holder distribution for token: ${this.tokenAddress}`
      );
      const holderDistributionTrendPromise =
        this.analyzeHolderDistribution(tradeData);
      promises.push(holderDistributionTrendPromise);

      console.log(
        `Filtering high-value holders for token: ${this.tokenAddress}`
      );
      const highValueHoldersPromise = this.filterHighValueHolders(tradeData);
      promises.push(highValueHoldersPromise);

      console.log(`Checking recent trades for token: ${this.tokenAddress}`);
      const recentTradesPromise = this.checkRecentTrades(tradeData);
      promises.push(recentTradesPromise);

      console.log(
        `Counting high-supply holders for token: ${this.tokenAddress}`
      );
      const highSupplyHoldersCountPromise =
        this.countHighSupplyHolders(security);
      promises.push(highSupplyHoldersCountPromise);

      console.log(
        `Determining DexScreener listing status for token: ${this.tokenAddress}`
      );

      const rugcheckDataPromises = this.fetchRugCheck();
      promises.push(rugcheckDataPromises);

      const [
        dexData,
        holderDistributionTrend,
        highValueHolders,
        recentTrades,
        highSupplyHoldersCount,
        rugcheckData,
      ] = await Promise.all(promises);

      const isDexScreenerListed = dexData.pairs.length > 0;
      const isDexScreenerPaid = dexData.pairs.some(
        (pair: any) => pair.boosts && pair.boosts.active > 0
      );

      console.log("Fetching rugcheck data for token:", this.tokenAddress);

      const processedData: ProcessedTokenData = {
        security,
        tradeData,
        holderDistributionTrend,
        highValueHolders,
        recentTrades,
        highSupplyHoldersCount,
        dexScreenerData: dexData,
        isDexScreenerListed,
        isDexScreenerPaid,
        rugcheckData,
      };

      // console.log("Processed token data:", processedData);
      return processedData;
    } catch (error) {
      console.error("Error processing token data:", error);
      throw error;
    }
  }

  async shouldTradeToken(tokenData?: ProcessedTokenData): Promise<boolean> {
    try {
      if (!tokenData) {
        tokenData = await this.getProcessedTokenData();
      }

      const { tradeData, security, dexScreenerData } = tokenData;
      const { ownerBalance, creatorBalance } = security;
      const { liquidity, marketCap } = dexScreenerData.pairs[0];
      const liquidityUsd = toBN(liquidity.usd);
      const marketCapUsd = toBN(marketCap);
      const totalSupply = tokenData.security.totalSupply;
      const _ownerPercentage = toBN(ownerBalance).dividedBy(totalSupply);
      const _creatorPercentage = toBN(creatorBalance).dividedBy(totalSupply);
      const top10HolderPercent = toBN(tradeData.volume_24h_usd).dividedBy(
        totalSupply
      );
      const priceChange24hPercent = toBN(tradeData.price_change_24h_percent);
      const priceChange12hPercent = toBN(tradeData.price_change_12h_percent);
      const uniqueWallet24h = tradeData.unique_wallet_24h;
      const volume24hUsd = toBN(tradeData.volume_24h_usd);
      const volume24hUsdThreshold = 1000;
      const priceChange24hPercentThreshold = 10;
      const priceChange12hPercentThreshold = 5;
      const top10HolderPercentThreshold = 0.05;
      const uniqueWallet24hThreshold = 100;
      const isTop10Holder = top10HolderPercent.gte(top10HolderPercentThreshold);
      const isVolume24h = volume24hUsd.gte(volume24hUsdThreshold);
      const isPriceChange24h = priceChange24hPercent.gte(
        priceChange24hPercentThreshold
      );
      const isPriceChange12h = priceChange12hPercent.gte(
        priceChange12hPercentThreshold
      );
      const isUniqueWallet24h = uniqueWallet24h >= uniqueWallet24hThreshold;
      const isLiquidityTooLow = liquidityUsd.lt(1000);
      const isMarketCapTooLow = marketCapUsd.lt(100000);
      return (
        isTop10Holder ||
        isVolume24h ||
        isPriceChange24h ||
        isPriceChange12h ||
        isUniqueWallet24h ||
        isLiquidityTooLow ||
        isMarketCapTooLow
      );
    } catch (error) {
      console.error("Error processing token data:", error);
      throw error;
    }
  }

  async formatTokenData(data: ProcessedTokenData): Promise<string> {
    let output = `**Token Security and Trade Report**\n`;
    output += `Token Address: ${this.tokenAddress}\n\n`;
    output +=
      data.dexScreenerData.pairs.length > 0
        ? `Token Ticker: ${data.dexScreenerData.pairs[0].baseToken.name}\n`
        : "";

    // Security Data
    output += `**Ownership Distribution:**\n`;
    output += `- Top 10 Holders Balance: ${data.security.top10HolderBalance}\n`;
    output += `- Top 10 Holders Percentage: ${data.security.top10HolderPercent}%\n\n`;

    // Trade Data
    output += `**Trade Data:**\n`;
    output += `- Holders: ${data.tradeData.holder}\n`;
    output += `- Unique Wallets (24h): ${data.tradeData.unique_wallet_24h}\n`;
    output += `- Price Change (24h): ${data.tradeData.price_change_24h_percent}%\n`;
    output += `- Price Change (12h): ${data.tradeData.price_change_12h_percent}%\n`;
    output += `- Volume (24h USD): $${toBN(
      data.tradeData.volume_24h_usd
    ).toFixed(2)}\n`;
    output += `- Current Price: $${toBN(data.tradeData.price).toFixed(6)}\n\n`;

    // Holder Distribution Trend
    output += `**Holder Distribution Trend:** ${data.holderDistributionTrend}\n\n`;

    // High-Value Holders
    output += `**High-Value Holders (>$5 USD):**\n`;
    if (data.highValueHolders.length === 0) {
      output += `- No high-value holders found or data not available.\n`;
    } else {
      data.highValueHolders.forEach((holder) => {
        output += `- ${holder.holderAddress}: $${holder.balanceUsd}\n`;
      });
    }
    output += `\n`;

    // Recent Trades
    output += `**Recent Trades (Last 24h):** ${
      data.recentTrades ? "Yes" : "No"
    }\n\n`;

    // High-Supply Holders
    output += `**Holders with >2% Supply:** ${data.highSupplyHoldersCount}\n\n`;

    // DexScreener Status
    output += `**DexScreener Listing:** ${
      data.isDexScreenerListed ? "Yes" : "No"
    }\n`;
    if (data.isDexScreenerListed) {
      output += `- Listing Type: ${data.isDexScreenerPaid ? "Paid" : "Free"}\n`;
      output += `- Number of DexPairs: ${data.dexScreenerData.pairs.length}\n\n`;
      output += `**DexScreener Pairs:**\n`;
      data.dexScreenerData.pairs.forEach((pair, index) => {
        output += `\n**Pair ${index + 1}:**\n`;
        output += `- DEX: ${pair.dexId}\n`;
        output += `- URL: ${pair.url}\n`;
        output += `- Price USD: $${toBN(pair.priceUsd).toFixed(6)}\n`;
        output += `- Volume (24h USD): $${toBN(pair.volume.h24).toFixed(2)}\n`;
        output += `- Boosts Active: ${!!(pair.boosts && pair.boosts.active)}\n`;
        output += `- Liquidity USD: $${toBN(pair.liquidity.usd).toFixed(2)}\n`;
      });
    }

    output += `\n`;
    output += `**Rugcheck Data:**\n`;
    output += `**Rugcheck Score:** ${data.rugcheckData.score}\n`;
    data.rugcheckData.risks.forEach((risk) => {
      output += `- ${risk.description} - ${risk.level}\n`;
    });

    output += `**Should Trade Token:** ${
      (await this.shouldTradeToken(data)) ? "Yes" : "No"
    }\n\n`;

    return output;
  }

  formatTokenReport(data: ProcessedTokenData): string {
    let output = "";

    if (data.dexScreenerData.pairs.length > 0) {
      output += `${data.dexScreenerData.pairs[0].baseToken.name} $${data.dexScreenerData.pairs[0].baseToken.symbol}\n`;
      output += `\n`;
    }

    output += `USD: $${formatNumber(
      parseFloat(toBN(data.tradeData.price).toFixed(6))
    )}\n`;
    output += `24h Volume: $${formatNumber(
      parseFloat(toBN(data.tradeData.volume_24h_usd).toFixed(2))
    )}\n`;
    output += `Liquidity: $${formatNumber(
      parseFloat(toBN(data.dexScreenerData.pairs[0].liquidity.usd).toFixed(2))
    )}\n`;
    output += `1h Change: ${data.tradeData.price_change_1h_percent.toFixed(
      2
    )}%\n`;
    output += `Holders: ${formatNumberWithDots(data.tradeData.holder)}\n`;
    output += `Top 10 Holders: ${data.security.top10HolderPercent.toFixed(
      2
    )}%\n`;
    output += `Rugcheck Score: ${data.rugcheckData.score}\n`;
    const score = data.rugcheckData.score;
    const risk = score < 1e3 ? "Good" : score < 5e3 ? "Waring" : "Danger";
    output += `Risk: ${risk}\n`;
    data.rugcheckData.risks.forEach((risk) => {
      output += `${risk.description} - ${risk.level}\n`;
    });

    return output;
  }

  async getTokenReportObject(data: ProcessedTokenData): Promise<any> {
    return {
      CA: this.tokenAddress,
      name: data.dexScreenerData?.pairs[0]?.baseToken.name || "",
      ticker: data.dexScreenerData.pairs[0].baseToken.symbol,
      boostsActive: formatNumber(
        data.dexScreenerData.pairs[0]?.boosts?.active || 0
      ),
      chainId: data.dexScreenerData.pairs[0].chainId,
      dexId: data.dexScreenerData.pairs[0].dexId,
      price: toBN(data.tradeData.price).toFixed(6),
      volume24h: formatNumber(
        parseFloat(toBN(data.tradeData.volume_24h_usd).toFixed(2)),
        2
      ),
      liquidity: formatNumber(
        parseFloat(
          toBN(data.dexScreenerData.pairs[0].liquidity.usd).toFixed(2)
        ),
        2
      ),
      priceChange1h: data.tradeData.price_change_1h_percent,
      holders: formatNumberWithDots(data.tradeData.holder),
      top10Holders: data.security.top10HolderPercent.toFixed(2),
      rugcheckScore: data.rugcheckData.score,
      risk:
        data.rugcheckData.score < 1e3
          ? "Good"
          : data.rugcheckData.score < 5e3
          ? "Warning"
          : "Danger",
      risks: data.rugcheckData.risks,
    };
  }

  async getFormattedTokenReport(): Promise<string> {
    try {
      console.log("Generating formatted token report...");
      const processedData = await this.getProcessedTokenData();
      const formatted = await this.formatTokenData(processedData);

      return formatted;
    } catch (error) {
      console.error("Error generating token report:", error);
      return "Unable to fetch token information. Please try again later.";
    }
  }

  async getFormattedTweetReport(data?: ProcessedTokenData): Promise<string> {
    try {
      console.log("Generating formatted tweet report...");
      const processedData = data ?? (await this.getProcessedTokenData());
      const formatted = await this.formatTokenReport(processedData);

      return formatted;
    } catch (error) {
      console.error("Error generating tweet report:", error);
      return "Unable to fetch token information. Please try again later.";
    }
  }

  async getObject(data?: ProcessedTokenData): Promise<any> {
    try {
      console.log("Generating formatted tweet report...");
      const processedData = data ?? (await this.getProcessedTokenData());
      const formatted = await this.getTokenReportObject(processedData);

      // const review = await generateReview(formatted);

      return formatted;
    } catch (error) {
      console.error("Error generating tweet report:", error);
      return "Unable to fetch token information. Please try again later.";
    }
  }
}
