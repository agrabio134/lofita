import { useState, useEffect } from 'react';
import { useWallet, ConnectButton } from '@suiet/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';

function FeaturedNFT({ nft, currentBid, highestBidder, bidHistory, onPlaceBid, attributes, attributesLoading, attributesError }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const wallet = useWallet();

  useEffect(() => {
    console.log('FeaturedNFT received nft:', nft);
    const endTime = new Date(nft.block_time);
    endTime.setHours(endTime.getHours() + 2);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;
      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft('Auction Ended');
        return;
      }
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [nft.block_time]);

  useEffect(() => {
    if (wallet.error) {
      console.error('Wallet connection error:', wallet.error);
      alert('Failed to connect wallet. Please try another wallet or check your connection.');
    }
  }, [wallet.error]);

  const mistToSui = (mist) => (parseInt(mist) / 1_000_000_000).toFixed(2);

  const fixImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return '/nft_placeholder.png';
    }
    if (url.startsWith('walrus://')) {
      return `https://walrus.tusky.io/${url.replace('walrus://', '')}`;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://walrus.tusky.io/${url.replace(/^\/+/, '')}`;
    }
    return url;
  };

  const tradeportUrl = `https://www.tradeport.xyz/sui/collection/0xb07b09b016d28f989b6adda8069096da0c0a0ff6490f6e0866858c023b061bee%3A%3Amystic_yeti%3A%3AMysticYeti?bottomTab=trades&tab=items&tokenId=${nft.nft.token_id}`;

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      alert('Please connect your wallet to purchase the NFT.');
      return;
    }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      alert('Please enter a valid purchase amount.');
      return;
    }
    if (amount < currentBid) {
      alert(`Purchase amount must be at least equal to the current bid of ${currentBid.toFixed(2)} SUI.`);
      return;
    }
    if (!wallet.account?.address) {
      alert('Wallet address not available. Please reconnect your wallet.');
      return;
    }
    if (!wallet.signAndExecuteTransactionBlock) {
      alert('Wallet does not support transaction signing. Please use a compatible wallet (e.g., Slush or Phantom).');
      return;
    }
    if (!nft.id || typeof nft.id !== 'string') {
      console.error('Invalid auction ID:', nft.id, 'NFT data:', nft);
      alert('Invalid auction ID for this NFT. Please ensure the auction is valid and try again.');
      return;
    }

    try {
      console.log('Preparing transaction with auctionId:', nft.id, 'walletAddress:', wallet.account.address, 'amount:', amount, 'amountMist:', Math.round(amount * 1_000_000_000));
      const tx = new Transaction();
      const packageObjectId = "0xYOUR_PACKAGE_ID_HERE"; // Replace with deployed Package ID
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(Math.round(amount * 1_000_000_000))]);
      tx.moveCall({
        target: `${packageObjectId}::marketplace::buy_listings`,
        arguments: [
          tx.object(nft.id), // Auction object ID
          coin,
          tx.object('0x6'), // Clock object ID for Sui system
        ],
      });
      tx.setGasBudget(100_000_000);

      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      console.log('Buy transaction result:', result);
      onPlaceBid(amount);
      setBidAmount('');
      alert(`NFT purchased successfully for ${amount.toFixed(2)} SUI!`);
    } catch (error) {
      console.error('Buy transaction error:', error);
      alert(`Failed to purchase NFT: ${error.message}`);
    }
  };

  return (
    <div className="featured-nft">
      <div className="nft-left">
        <div className="nft-image" id="featured-image">
          <img
            src={fixImageUrl(nft.nft.media_url)}
            alt={nft.nft.name || 'Unknown Yeti'}
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
        <div className="attributes" id="featured-attributes">
          {attributesLoading && <p>Loading attributes...</p>}
          {attributesError && <p>Error loading attributes</p>}
          {attributes.length > 0 ? (
            attributes.map((attr, index) => (
              <p key={index}>
                <span className="attribute-type">{attr.type}:</span>
                <span className="attribute-value">{attr.value}</span>
                <span className="attribute-rarity">{(attr.rarity * 100).toFixed(2)}%</span>
              </p>
            ))
          ) : (
            <p>No attributes available</p>
          )}
        </div>
      </div>
      <div className="nft-details">
        <h2 id="featured-name">{nft.nft.name || 'Unknown Yeti'}</h2>
        <p id="featured-edition">Edition of 10,000 | Sui Blockchain | Tradeport-Listed</p>
        <p id="featured-bid"><strong>Top Bid:</strong> {currentBid.toFixed(2)} SUI</p>
        <p id="featured-token"><strong>Token ID:</strong> {nft.nft.token_id.slice(0, 6)}...{nft.nft.token_id.slice(-6)}</p>
        <p id="featured-ranking"><strong>Ranking:</strong> {nft.nft.ranking || 'N/A'} / 10,000</p>
        <p id="featured-owner"><strong>Owner:</strong> {nft.seller.slice(0, 6)}...{nft.seller.slice(-6)}</p>
        <div className="bid-section">
          <div id="timer">Time Left: {timeLeft}</div>
          <div id="highest-bidder">
            Highest Bidder: {highestBidder} ({currentBid.toFixed(2)} SUI)
          </div>
          <form className="bid-form" onSubmit={handleBidSubmit}>
            <input
              type="number"
              id="bid-amount"
              placeholder="Enter bid in SUI"
              step="0.01"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              disabled={!wallet.connected}
            />
            {wallet.connected ? (
              <button type="submit">Buy Now</button>
            ) : (
              <ConnectButton className="connect-wallet-bid" label="Connect Wallet to Buy" />
            )}
          </form>
          {!wallet.connected && (
            <p style={{ color: '#FF2B7B', fontSize: '0.85rem', textAlign: 'center' }}>
              Connect your wallet to purchase the NFT.
            </p>
          )}
          <div className="bid-history" id="bid-history">
            {bidHistory.map((bid, index) => (
              <p key={index}>{bid.time} - {bid.amount} SUI by {bid.bidder}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedNFT;