import React, { useEffect, useState } from "react";
import Timer from "./Timer";
import "./App.css";

export default function App() {
  const themes = [
    "linear-gradient(135deg, #1e3c72, #2a5298)",
    "linear-gradient(135deg, #ff9966, #ff5e62)",
    "linear-gradient(135deg, #00b09b, #96c93d)",
    "linear-gradient(135deg, #ff758c, #ff7eb3)",
    "linear-gradient(135deg, #2193b0, #6dd5ed)"
  ];

  const [bg, setBg] = useState(themes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBg(themes[Math.floor(Math.random() * themes.length)]);
    }, 5000); // ganti tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app" style={{ background: bg }}>
      <Timer />
      <SpotifyPlayer />
    </div>
  );
}

function SpotifyPlayer() {
  return (
    <div className="spotify-player">
      <iframe
        src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"
        width="300"
        height="80"
        frameBorder="0"
        allow="encrypted-media"
        title="Spotify"
      ></iframe>
    </div>
  );
}
