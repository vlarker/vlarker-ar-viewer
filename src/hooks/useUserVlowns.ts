import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { VlownABI, VlownAddress } from '../contracts/VlownData';
import { useWeb3 } from '../contexts/Web3Context';
import toast from 'react-hot-toast';

export interface VlownPlot {
    tokenId: string;
    lat: number;
    lng: number;
    salePrice: string;
}

export function useUserVlowns(refreshTimestamp: number = 0) {
    const { provider, account } = useWeb3();
    const [vlowns, setVlowns] = useState<VlownPlot[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const load = async () => {
            if (!provider || !account) {
                setVlowns([]);
                return;
            }
            setIsLoading(true);
            try {
                const contract = new ethers.Contract(VlownAddress, VlownABI, provider);

                // Fetch everything natively from the Contract mapping in ~50ms
                const ownedTokenIds = await contract.tokensOfOwner(account);

                const portfolio: VlownPlot[] = [];
                for (const idObj of ownedTokenIds) {
                    const id = idObj.toString();
                    const tokenIdBig = BigInt(id);
                    const rawLat = Number(BigInt.asIntN(32, tokenIdBig >> 32n));
                    const rawLng = Number(BigInt.asIntN(32, tokenIdBig & 0xFFFFFFFFn));
                    const lat = rawLat / 10000;
                    const lng = rawLng / 10000;
                    const priceWei = await contract.getSalePrice(rawLat, rawLng);

                    portfolio.push({
                        tokenId: id,
                        lat,
                        lng,
                        salePrice: ethers.formatEther(priceWei)
                    });
                }

                setVlowns(portfolio);
            } catch (err: any) {
                console.error("Failed to load portfolio:", err);
                toast.error(err.message || "Failed to parse portfolio");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [provider, account, refreshTimestamp]);

    return { vlowns, isLoading };
}
