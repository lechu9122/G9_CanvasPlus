import React, { useState} from 'react';

export default function SearchWidget() {
    const [query,setQuery] = useState('');

    const onSearch = (e) =>{
        e.preventDefault();
        const queryText = query.trim();
        if (!queryText) return;
        const url = `https://www.google.com/search?q=${encodeURIComponent(queryText)}`;
        window.open(url);
    }
    return(
        <form onSubmit={onSearch}>
            <input value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder={"search"}/>
        </form>
    )
}