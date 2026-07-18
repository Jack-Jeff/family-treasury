import { createConfig, http } from "wagmi";
import { monad, monadTestnet } from "viem/chains";
import { injected } from "wagmi/connectors";

// Which network the app targets is controlled by VITE_CHAIN (default: testnet).
const USE_MAINNET = import.meta.env.VITE_CHAIN === "mainnet";
export const activeChain = USE_MAINNET ? monad : monadTestnet;

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()], // MetaMask / any injected EVM wallet
  transports: {
    [monad.id]: http(import.meta.env.VITE_MONAD_MAINNET_RPC || undefined),
    [monadTestnet.id]: http(import.meta.env.VITE_MONAD_TESTNET_RPC || undefined),
  },
});

export const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS || "";
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "";
