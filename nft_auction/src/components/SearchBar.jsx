function SearchBar({ onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const query = e.target.query.value.trim();
    onSearch(query);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input type="text" name="query" placeholder="Search NFTs..." />
      <button type="submit">Search</button>
    </form>
  );
}

export default SearchBar;