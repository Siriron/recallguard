// Single source of truth for chain + contract configuration.
// Plain constants — no .env, no Vercel environment variables. Changing
// the deployed address means editing the one line below.

export const STUDIONET_CONFIG = {
  chainId: '0xF22F', // 61999
  chainName: 'GenLayer StudioNet',
  rpcUrls: ['https://studio.genlayer.com/api'],
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
};

export const CONTRACT_ADDRESS = '0x008DA77B7973A6601CAc312731EFf46537a1356a';

export const EXPLORER_TX_URL = (hash) =>
  `${STUDIONET_CONFIG.blockExplorerUrls[0]}/tx/${hash}`;

export const EXPLORER_ADDRESS_URL = (address) =>
  `${STUDIONET_CONFIG.blockExplorerUrls[0]}/address/${address}`;

export const CPSC_RECALL_URL = (recallNumber) =>
  `https://www.cpsc.gov/Recalls?field_rc_number_value=${encodeURIComponent(recallNumber)}`;
