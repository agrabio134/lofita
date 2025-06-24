import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { WalletProvider, ConnectButton } from '@suiet/wallet-kit'
import App from './App.jsx'
import '@suiet/wallet-kit/style.css'
import './index.css'

const client = new ApolloClient({
  uri: 'https://api.indexer.xyz/graphql',
  cache: new InMemoryCache(),
  headers: {
    'x-api-key': 'dy3hRpp.cd7fef04eb74666815f15fac06980c27',
    'x-api-user': 'lofita'
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletProvider
      autoConnect={true}
    >
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </WalletProvider>
  </React.StrictMode>
)