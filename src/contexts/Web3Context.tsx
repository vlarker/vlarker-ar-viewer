import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserProvider, ethers } from 'ethers';

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface Web3ContextType {
    provider: BrowserProvider | null;
    account: string | null;
    networkId: bigint | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    isConnecting: boolean;
    error: string | null;
}

const Web3Context = createContext<Web3ContextType>({
    provider: null,
    account: null,
    networkId: null,
    connect: async () => { },
    disconnect: () => { },
    isConnecting: false,
    error: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [networkId, setNetworkId] = useState<bigint | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const switchNetwork = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }], // 137 for Polygon Mainnet
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0x89',
                                chainName: 'Polygon Mainnet',
                                rpcUrls: ['https://polygon-rpc.com/'],
                                nativeCurrency: {
                                    name: 'POL',
                                    symbol: 'POL',
                                    decimals: 18,
                                },
                                blockExplorerUrls: ['https://polygonscan.com/'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error("Failed to add Polygon Mainnet:", addError);
                }
            } else {
                console.error("Failed to switch network:", switchError);
            }
        }
    };

    const initProvider = async () => {
        if (window.ethereum) {
            try {
                await switchNetwork();
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                setProvider(browserProvider);
                const network = await browserProvider.getNetwork();
                setNetworkId(network.chainId);

                // Check if already connected
                const accounts = await browserProvider.listAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0].address);
                }

                window.ethereum.on('accountsChanged', (accounts: string[]) => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    } else {
                        setAccount(null);
                    }
                });

                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
            } catch (err: any) {
                console.error("Initialization error:", err);
            }
        }
    };

    useEffect(() => {
        initProvider();
    }, []);

    const connect = async () => {
        if (!window.ethereum) {
            setError("Please install MetaMask to use this application.");
            return;
        }
        setError(null);
        setIsConnecting(true);
        try {
            await switchNetwork();
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await browserProvider.send("eth_requestAccounts", []);
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setProvider(browserProvider);
                const network = await browserProvider.getNetwork();
                setNetworkId(network.chainId);
            }
        } catch (err: any) {
            console.error("Connection error:", err);
            setError(err.message || "Failed to connect wallet.");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAccount(null);
        // Note: Metamask handles disconnect internally, but we can clear app state
    };

    return (
        <Web3Context.Provider value={{ provider, account, networkId, connect, disconnect, isConnecting, error }}>
            {children}
        </Web3Context.Provider>
    );
};
