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

export const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS || "";

// A token address to pre-fill the "create treasury" form with (e.g. testnet USDC you've
// already deployed). Each treasury can still be created with any ERC20 token address.
export const DEFAULT_TOKEN_ADDRESS = import.meta.env.VITE_DEFAULT_TOKEN_ADDRESS || "";
