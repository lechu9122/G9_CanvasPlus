import React, {useRef, useState} from "react";
export default function SearchWidget() {
    const [searchText, setSearchText] = useState("");
    const inputRef = useRef(null);
    const onSubmit = (e) => {
        e.preventDefault();
        const query = searchText.trim();
        if (!query) return;
        const url = `https://www.google.com/search?q=${encodeURI(query)}`;
        window.open(url, '_blank',"noopener");
    }

    return (
    <form
        onSubmit={onSubmit}
        style={{
            /* Fit the widget's content area exactly */
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <div style={{ display: "flex", width: "100%", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
                <input
                    ref={inputRef}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search the web…"
                    aria-label="Search"
                    autoComplete="off"
                    spellCheck={false}
                    style={{
                        width: "100%",
                        padding: "10px 12px 10px 34px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        outline: "none",
                    }}
                />
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 14,
                        opacity: 0.8,
                    }}
                >
            🔎
          </span>
            </div>
            <button
                type="submit"
                style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(99,102,241,0.2)",
                    color: "white",
                    fontWeight: 600,
                }}
            >
                Search
            </button>
        </div>
    </form>
    );

}