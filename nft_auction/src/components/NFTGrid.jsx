import { mistToSui } from '../utils/helpers';

function NFTGrid({ nfts }) {
  const fixImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return '/nft_placeholder.png';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Handle HTTP/HTTPS URLs for NFTs
    }
    if (url.startsWith('walrus://')) {
      return `https://walrus.tusky.io/${url.replace('walrus://', '')}`;
    }
    return `https://walrus.tusky.io/${url.replace(/^\/+/, '')}`;
  };

  return (
    <div className="nft-grid">
      {nfts.length === 0 && (
        <p className="text-center" style={{ color: '#F8FAFC' }}>
          No NFTs available for this collection.
        </p>
      )}
      {nfts.map((nft, index) => {
        const tradeportUrl = `https://www.tradeport.xyz/sui/collection/${encodeURIComponent(nft.nft.chain_state?.nft_type || 'unknown')}?bottomTab=trades&tab=items&tokenId=${nft.nft.token_id}`;
        return (
          <div key={index} className="nft-card">
            <div className="nft-image">
              <img
                src={fixImageUrl(nft.nft.media_url)}
                alt={nft.nft.name || 'Unknown NFT'}
                className="nft-img"
                onError={(e) => {
                  e.target.src = '/nft_placeholder.png';
                  e.target.alt = 'Image unavailable';
                }}
              />
              <a href={tradeportUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src="/tradeport-logo.png"
                  alt="Tradeport Logo"
                  className="tradeport-logo"
                />
              </a>
            </div>
            <div className="nft-details">
              <h3>{nft.nft.name || 'Unknown NFT'}</h3>
              <p>Price: {mistToSui(nft.price)} SUI</p>
              <p>Ranking: {nft.nft.ranking || 'N/A'} / 10,000</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NFTGrid;