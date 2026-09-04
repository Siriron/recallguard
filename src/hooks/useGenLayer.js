import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
import { STUDIONET_CONFIG, CONTRACT_ADDRESS, EXPLORER_TX_URL } from '../config/chains';

// Real Error subclass carrying the tx hash + a timeout flag, confirmed
// pattern — lets the UI distinguish "still probably succeeded, just slow"
// from a genuinely rejected transaction.
export class ConsensusTimeoutError extends Error {
  constructor(hash) {
    super(
      `Consensus is taking longer than expected. Your transaction was submitted — check its status directly: ${EXPLORER_TX_URL(hash)}`
    );
    this.name = 'ConsensusTimeoutError';
    this.txHash = hash;
    this.isTimeout = true;
  }
}

async function ensureChain() {
  const eth = window.ethereum;
  if (!eth) return;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CONFIG.chainId }],
    });
  } catch (err) {
    if (err && err.code === 4902) {
      await eth.request({ method: 'wallet_addEthereumChain', params: [STUDIONET_CONFIG] });
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CONFIG.chainId }],
      });
    } else if (err && err.code === -32002) {
      await new Promise((r) => setTimeout(r, 3000));
    } else {
      throw err;
    }
  }
}

export function useGenLayer() {
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const readClientRef = useRef(null);

  const getReadClient = useCallback(() => {
    if (!readClientRef.current) {
      readClientRef.current = createClient({ chain: studionet });
    }
    return readClientRef.current;
  }, []);

  // Silent reconnect on mount + stay in sync with wallet account changes.
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    eth
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts[0]) setAccount(accounts[0]);
      })
      .catch(() => {});
    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || null);
    if (eth.on) eth.on('accountsChanged', handleAccountsChanged);
    return () => {
      if (eth.removeListener) eth.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      throw new Error('No wallet found. Install MetaMask, BitKeep, or a compatible browser wallet.');
    }
    setConnecting(true);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      await ensureChain();
      setAccount(accounts[0] || null);
      return accounts[0];
    } finally {
      setConnecting(false);
    }
  }, []);

  // Accepts an explicit address so a fresh connect() result can be used
  // immediately, in the same call, without waiting on a re-render to see
  // the updated `account` state. Falls back to the current `account`
  // state for call sites that already know a wallet is connected.
  const getWriteClient = useCallback(
    async (explicitAccount) => {
      const activeAccount = explicitAccount || account;
      if (!activeAccount) throw new Error('Connect a wallet first.');
      await ensureChain();
      const client = createClient({
        chain: studionet,
        account: activeAccount,
        provider: window.ethereum,
      });
      if (typeof client.connect === 'function') {
        try {
          await client.connect('studionet');
        } catch {
          // defensive — not all SDK versions expose this
        }
      }
      return client;
    },
    [account]
  );

  const readContract = useCallback(
    async (functionName, args = []) => {
      if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        throw new Error(
          'CONTRACT_ADDRESS in src/config/chains.ts is still the placeholder. Deploy the contract and update that constant.'
        );
      }
      const client = getReadClient();
      const raw = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
      });
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
      return raw;
    },
    [getReadClient]
  );

  // `explicitAccount` lets a caller that just called connect() pass the
  // freshly-returned address straight through, rather than relying on
  // the `account` state value closed over from a stale render — the
  // state update from connect() is not guaranteed to be visible yet in
  // the same synchronous call chain that triggered it.
  const writeContract = useCallback(
    async (functionName, args = [], value = BigInt(0), explicitAccount) => {
      if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        throw new Error(
          'CONTRACT_ADDRESS in src/config/chains.ts is still the placeholder. Deploy the contract and update that constant.'
        );
      }
      const client = await getWriteClient(explicitAccount);
      const txHash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        value: BigInt(value || 0),
      });

      try {
        const receipt = await client.waitForTransactionReceipt({
          hash: txHash,
          status: TransactionStatus.ACCEPTED,
          retries: 120,
          interval: 4000,
        });
        return { txHash, receipt };
      } catch (err) {
        throw new ConsensusTimeoutError(txHash);
      }
    },
    [getWriteClient]
  );

  // Single entry point for "connect if needed, then write" flows. Uses
  // the address connect() just returned directly, rather than the
  // `account` state — closes the exact gap where a first-time
  // connect-and-act sequence could otherwise fire a write with a stale
  // or missing account because the state update from connect() hadn't
  // been observed yet by the caller's own closure.
  const connectAndWrite = useCallback(
    async (functionName, args = [], value = BigInt(0)) => {
      const activeAccount = account || (await connect());
      if (!activeAccount) throw new Error('Connect a wallet first.');
      return writeContract(functionName, args, value, activeAccount);
    },
    [account, connect, writeContract]
  );

  return {
    account,
    connecting,
    connect,
    readContract,
    writeContract,
    connectAndWrite,
  };
}
