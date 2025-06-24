import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FeaturedNFT from './components/FeaturedNFT';
import MyNFTGrid from './components/MyNFTGrid';
import CollectionGrid from './components/CollectionGrid';
import SearchBar from './components/SearchBar';
import ApplyForm from './components/ApplyForm';
import AdminView from './components/AdminView';
import NFTDetail from './components/NFTDetail';
import './index.css';

const FETCH_COLLECTIONS = gql`
  query fetchCollectionInfo($slug: String) {
    sui {
      collections(
        where: {
          _or: [{ semantic_slug: { _eq: $slug } }, { slug: { _eq: $slug } }]
        }
      ) {
        id
        title
        slug
        semantic_slug
        description
        floor
        volume
        usd_volume
        cover_url
        supply
        verified
        discord
        twitter
        website
      }
    }
  }
`;

const FETCH_LISTINGS = gql`
  query fetchCollectionListings($collectionId: uuid!) {
    sui {
      listings(
        where: {
          collection_id: { _eq: $collectionId }
          listed: { _eq: true }
        }
        order_by: { price: asc_nulls_last }
      ) {
        id
        price
        price_str
        block_time
        seller
        market_name
        nonce
        nft {
          id
          token_id
          name
          media_url
          media_type
          ranking
          owner
          chain_state
          collection_id
        }
      }
    }
  }
`;

const FETCH_NFT_ATTRIBUTES = gql`
  query fetchNftAttributes($collectionId: uuid!, $tokenId: String!) {
    sui {
      nfts(
        where: {
          collection_id: { _eq: $collectionId }
          token_id: { _eq: $tokenId }
        }
      ) {
        attributes {
          type
          value
          rarity
        }
      }
    }
  }
`;

const FETCH_WALLET_NFTS = gql`
  query fetchWalletNFTs($owner: String!) {
    sui {
      nfts(
        where: {
          owner: { _eq: $owner }
        }
      ) {
        id
        token_id
        name
        media_url
        media_type
        ranking
        owner
        collection_id
        chain_state
      }
    }
  }
`;

function App() {
  const wallet = useWallet();
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState('None');
  const [bidHistory, setBidHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('collections');
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Mock admin wallet address
  const ADMIN_ADDRESS = '0x3a74d8e94bf49bb738a3f1dedcc962ed01c89f78d21c01d87ee5e6980f0750e9'; // Replace with actual admin address

  useEffect(() => {
    if (wallet.connected && wallet.account?.address === ADMIN_ADDRESS) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [wallet.connected, wallet.account]);

  // Fetch collections (Mystic Yetis and Doonies)
  const { data: yetisData, loading: yetisLoading, error: yetisError } = useQuery(FETCH_COLLECTIONS, {
    variables: { slug: '0xb07b09b016d28f989b6adda8069096da0c0a0ff6490f6e0866858c023b061bee::mystic_yeti::MysticYeti' },
    onError: (error) => console.error('Mystic Yetis query error:', error.message),
  });

  const { data: dooniesData, loading: dooniesLoading, error: dooniesError } = useQuery(FETCH_COLLECTIONS, {
    variables: { slug: '0x9f48e186b1527bd164960a03f392c14669acfd1ef560fb6138ad0918e6e712a3' },
    onError: (error) => console.error('Doonies query error:', error.message),
  });

  // Mock Bored Toilet Club collection
  const boredToiletClub = {
    slug: 'bored-toilet-club',
    title: 'Bored Toilet Club',
    description: 'Bored Toilet Club NFTs - Coming Soon',
    cover_url: 'https://static.wixstatic.com/media/dd1567_a18892f00fa444cdae7e8dbcbd533564~mv2.png/v1/fill/w_192,h_192,lg_1,usm_0.66_1.00_0.01/dd1567_a18892f00fa444cdae7e8dbcbd533564~mv2.png',
    website: 'https://www.boredtoilet.club/',
    floor: 0,
    volume: 0,
    supply: 0,
    verified: false,
  };

  // Combine collections
  const collections = [
    ...(yetisData?.sui.collections || []),
    ...(dooniesData?.sui.collections || []),
    boredToiletClub,
  ];

  // Fetch listings for selected collection
  const { loading: listingsLoading, error: listingsError, data: listingsData } = useQuery(FETCH_LISTINGS, {
    variables: { collectionId: selectedCollection?.id || '' },
    skip: !selectedCollection || selectedCollection.slug === 'bored-toilet-club',
    onError: (error) => console.error('Listings query error:', error.message),
  });

  const featuredNFT = listingsData?.sui.listings?.length > 0 ? listingsData.sui.listings[0] : null;
  const { loading: attributesLoading, error: attributesError, data: attributesData } = useQuery(FETCH_NFT_ATTRIBUTES, {
    variables: {
      collectionId: selectedCollection?.id || '',
      tokenId: featuredNFT?.nft.token_id || '',
    },
    skip: !featuredNFT?.nft.token_id || !selectedCollection || selectedCollection.slug === 'bored-toilet-club',
    onError: (error) => console.error('Attributes query error:', error.message),
  });

  const { loading: walletNftsLoading, error: walletNftsError, data: walletNftsData } = useQuery(FETCH_WALLET_NFTS, {
    variables: { owner: wallet.account?.address },
    skip: !wallet.connected,
    onError: (error) => console.error('Wallet NFTs query error:', error.message),
  });

  useEffect(() => {
    if (wallet.error) {
      console.error('Wallet connection error:', wallet.error);
      alert('Failed to connect wallet. Please try another wallet or check your connection.');
    }
    if (wallet.connected) {
      console.log('Connected wallet:', wallet.name, wallet.account?.address);
    }
    if (activeFilter === 'collections') {
      setFilteredData([]);
      setSelectedCollection(null);
    } else if (activeFilter === 'auctions' && listingsData?.sui.listings) {
      setFilteredData(listingsData.sui.listings);
      if (listingsData.sui.listings.length > 0) {
        const firstNFT = listingsData.sui.listings[0];
        const priceSui = parseInt(firstNFT.price) / 1_000_000_000;
        setCurrentBid(priceSui);
        setHighestBidder(firstNFT.seller.slice(0, 6) + '...' + firstNFT.seller.slice(-6));
        setBidHistory([
          {
            time: new Date(firstNFT.block_time).toLocaleString('en-US', { hour12: true }),
            amount: priceSui.toFixed(2),
            bidder: firstNFT.seller.slice(0, 6) + '...' + firstNFT.seller.slice(-6),
          },
        ]);
      }
    }
  }, [listingsData, wallet.connected, wallet.error, activeFilter]);

  const handleSearch = (query) => {
    setActiveFilter('search');
    setSelectedCollection(null);
    if (!query) {
      setFilteredData(listingsData?.sui.listings || []);
      alert('Displaying all NFTs.');
      return;
    }
    const filtered = listingsData?.sui.listings.filter(
      (nft) =>
        (nft.nft.name && nft.nft.name.toLowerCase().includes(query.toLowerCase())) ||
        Object.values(nft.nft.chain_state.bcs).some(
          (value) => value && typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase())
        )
    ) || [];
    setFilteredData(filtered);
    alert(`Found ${filtered.length} NFTs matching "${query}"`);
  };

  const handleMyNfts = () => {
    setActiveFilter('my-nfts');
    setSelectedCollection(null);
    if (!wallet.connected) {
      alert('Please connect your wallet to view your NFTs.');
      setFilteredData([]);
      return;
    }
    if (walletNftsLoading) {
      setFilteredData([]);
      alert('Loading your NFTs...');
      return;
    }
    if (walletNftsError) {
      setFilteredData([]);
      alert(`Error loading NFTs: ${walletNftsError.message}`);
      return;
    }
    const nfts = walletNftsData?.sui.nfts || [];
    setFilteredData(nfts.map((nft) => ({ nft, price: '0' })));
    if (nfts.length === 0) {
      alert("You don't own any NFTs yet.");
    }
  };

  const handleAuctions = () => {
    if (!selectedCollection) {
      alert('Please select a collection to view its auctions.');
      return;
    }
    if (selectedCollection.slug === 'bored-toilet-club') {
      alert('Bored Toilet Club NFTs are coming soon.');
      return;
    }
    setActiveFilter('auctions');
    setFilteredData(listingsData?.sui.listings || []);
  };

  const handleCollections = () => {
    setActiveFilter('collections');
    setSelectedCollection(null);
    setFilteredData([]);
  };

  const handleApply = () => {
    setActiveFilter('apply');
    setSelectedCollection(null);
    setFilteredData([]);
  };

  const handleAdmin = () => {
    if (!isAdmin) {
      alert('You do not have admin access.');
      return;
    }
    setActiveFilter('admin');
    setSelectedCollection(null);
    setFilteredData([]);
  };

  const handleSelectCollection = (collection) => {
    if (collection.slug === 'bored-toilet-club') {
      alert('Bored Toilet Club NFTs are coming soon.');
      return;
    }
    setSelectedCollection(collection);
    setActiveFilter('auctions');
  };

  const handlePlaceBid = (bidAmount) => {
    if (!wallet.connected) {
      alert('Please connect a wallet to place a bid.');
      return;
    }
    if (isNaN(bidAmount)) {
      alert('Please enter a valid bid amount.');
      return;
    }
    if (bidAmount <= currentBid + 0.1) {
      alert(`Bid must be at least 0.1 SUI higher than the current bid of ${currentBid.toFixed(2)} SUI.`);
      return;
    }
    setCurrentBid(bidAmount);
    setHighestBidder(wallet.account?.address.slice(0, 6) + '...' + wallet.account?.address.slice(-6));
    const now = new Date().toLocaleString('en-US', { hour12: true });
    setBidHistory((prev) => [...prev, { time: now, amount: bidAmount.toFixed(2), bidder: 'You' }]);
    alert(`Bid placed successfully! New highest bid: ${bidAmount.toFixed(2)} SUI`);
  };

  return (
    <Router>
      <div>
        <header>
          <div className="logo">Lofita Auction</div>
          <div className="wallet-connect">
            <ConnectButton className="header-wallet" />
          </div>
        </header>
        <div className="auction-container">
          <div className="details-section">
            <SearchBar onSearch={handleSearch} />
            <nav>
              <Link to="/" onClick={handleCollections}>Collections</Link>
              <Link to="/" onClick={handleAuctions}>Live Auctions</Link>
              <Link to="/my-nfts" onClick={handleMyNfts}>My NFTs</Link>
              {/* <Link to="/apply" onClick={handleApply}>Apply to List</Link> */}
              {isAdmin && <Link to="/admin" onClick={handleAdmin}>Admin</Link>}
              <Link to="#" onClick={(e) => { e.preventDefault(); /* Handle Help */ }}>Help</Link>
            </nav>
          </div>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {(yetisLoading || dooniesLoading) && activeFilter === 'collections' && (
                    <p className="text-center">Loading collections...</p>
                  )}
                  {(yetisError || dooniesError) && activeFilter === 'collections' && (
                    <p className="text-center" style={{ color: '#FF2B7B' }}>
                      Error loading collections: {(yetisError?.message || dooniesError?.message)}. Please try refreshing.
                    </p>
                  )}
                  {listingsLoading && activeFilter === 'auctions' && <p className="text-center">Loading NFTs...</p>}
                  {listingsError && activeFilter === 'auctions' && (
                    <p className="text-center" style={{ color: '#FF2B7B' }}>
                      Error loading NFTs: {listingsError.message}. Please try refreshing or contact support.
                    </p>
                  )}
                  {activeFilter === 'auctions' && featuredNFT && featuredNFT.id && (
                    <FeaturedNFT
                      nft={featuredNFT}
                      currentBid={currentBid}
                      highestBidder={highestBidder}
                      bidHistory={bidHistory}
                      onPlaceBid={handlePlaceBid}
                      attributes={attributesData?.sui.nfts[0]?.attributes || []}
                      attributesLoading={attributesLoading}
                      attributesError={attributesError}
                    />
                  )}
                  {activeFilter === 'collections' ? (
                    <CollectionGrid
                      collections={collections}
                      onSelectCollection={handleSelectCollection}
                    />
                  ) : activeFilter === 'auctions' || activeFilter === 'search' ? (
                    <MyNFTGrid nfts={filteredData} />
                  ) : null}
                </>
              }
            />
            <Route path="/my-nfts" element={<MyNFTGrid nfts={filteredData} />} />
            <Route path="/apply" element={<ApplyForm />} />
            <Route path="/admin" element={isAdmin ? <AdminView /> : <p>You do not have admin access.</p>} />
            <Route path="/nft/:collectionId/:tokenId" element={<NFTDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;