import React, { useState} from 'react';
const ENGINES = {
    google:{label: "Google", url: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`},
    baidu:{label: "Baidu", url: (query) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}` },
    bing:{label: "Bing", url: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}` },
    ddg:{label: "DuckDuckGo", url: (query) => `https://www.duckduckgo.com/search?q=${encodeURIComponent(query)}` },
    yahoo:{label: "Yahoo!", url: (query) => `https://www.search.yahoo.com/search?p=${encodeURIComponent(query)}` },
    wikipedia:{label: "Wiki", url: (query) => `https://en.wikipedia.org/w/index.php/search=${encodeURIComponent(query)}` },
}

export default function SearchWidget() {
    const [query,setQuery] = useState('');
    const FIRST_ENGINE = Object.keys(ENGINES)[0]; // sets the engines to the first engine
    const [engine, setEngine] = useState(FIRST_ENGINE);
    const onSearch = (e) =>{
        e.preventDefault();
        const queryText = query.trim();
        if (!queryText) return;
        window.open(ENGINES[engine].url(query),"_blank");
        setQuery("");
    }
    return(
        // Blank Searchbox
        <form
            onSubmit={onSearch}
            style={{
                width:"100%",
                height:"100%",
                border:"border-box",
                display:"flex",
                alignItems:'center',
                justifyContent:'center',
            }}
        >
            <div style={{ display: "flex", width: "100%", gap: 8 }}>
                <select
                    aria-label="Search engine"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    style={{
                        border: "none", background: "none",
                        color: "white", outline: "none",
                    }}
                >
                    {Object.entries(ENGINES).map(([key, { label }]) => (
                        <option key={key} value={key} style={{ color: "black" }}>
                            {label}
                        </option>
                    ))}
                </select>
            <div style={{ position: "relative", flex: 1 }}>
                <input value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder={"Type here to Search"}
                   aria-label={"search"}
                   autoComplete="off"
                   spellCheck={false}
                   style={{
                       border:"none",
                       outline: "none",
                       width:"100%",
                       backgroundColor:"transparent",
                   }}/>
            </div>
            </div>
        </form>
    )
}