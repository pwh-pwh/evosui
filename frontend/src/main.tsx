import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import App from "./App";
import "./styles.css";

const { networkConfig } = createNetworkConfig({
  localnet: { url: "http://127.0.0.1:9000" },
  devnet: { url: getJsonRpcFullnodeUrl("devnet") },
  testnet: { url: getJsonRpcFullnodeUrl("testnet") },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet") },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
