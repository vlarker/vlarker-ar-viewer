export const VlownAddress = "0x49fD01FaA12c5Aa2be9B6494E1AE0c87b29c53ED";

export const VlownABI = [
    // Read operations
    "function isClaimAvailable(int32 lat, int32 lng) view returns (bool)",
    "function getSalePrice(int32 lat, int32 lng) view returns (uint256)",
    "function getTokenId(int32 lat, int32 lng) pure returns (uint64)",
    "function isTokenOwner(uint256 tokenId, address account) view returns (bool)",
    "function tokensOfOwner(address owner) view returns (uint256[])",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function stakePrice() view returns (uint256)",
    "function transferFee() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function tokenByIndex(uint256 index) view returns (uint256)",

    // Write operations
    "function stakeClaim(int32 lat, int32 lng, uint256 listingPrice) payable",
    "function purchaseLand(int32 lat, int32 lng, uint256 newListingPrice) payable",
    "function setSalePrice(uint64 tokenId, uint256 newPrice)",

    // Admin Operations (onlyOwner)
    "function withdrawFees()",
    "function setTransferFee(uint256 amount)",
    "function setStakePrice(uint256 amount)",

    // Events and direct ERC721 references
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function owner() view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
