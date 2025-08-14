import React, { useEffect, useState } from "react";
import Timer from "./Timer";
import "./App.css";

const THEMES = [
  { type: "video", label: "Programer", src: process.env.PUBLIC_URL + "/coding.mp4" },
  { type: "video", label: "Train", src: process.env.PUBLIC_URL + "/train.mp4" },
  { type: "video", label: "Study", src: process.env.PUBLIC_URL + "/vidio1.mp4" },
  { type: "video", label: "Mountain", src: process.env.PUBLIC_URL + "/mountain.mp4" },
  { type: "video", label: "Beach Sunset", src: process.env.PUBLIC_URL + "/beach_sunset.mp4" }
];

export default function App() {
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = THEMES[themeIndex];

  // Jam real-time
  const [time, setTime] = useState(getTimeString());
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app">
      {/* BACKGROUND */}
      {theme.type === "video" ? (
        <video key={theme.src} autoPlay loop muted playsInline className="background">
          <source src={theme.src} type="video/mp4" />
        </video>
      ) : (
        <div
          key={theme.src}
          className="background"
          style={{ backgroundImage: `url(${theme.src})` }}
        />
      )}

      {/* KONTEN */}
      <div className="content">
        <h1 className="clock">{time}</h1>

        <Timer />

        {/* PILIH TEMA */}
        <div className="theme-selector">
          {THEMES.map((t, i) => (
            <button
              key={i}
              onClick={() => setThemeIndex(i)}
              className={`pixel-btn ${i === themeIndex ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SPOTIFY */}
      <div className="floating-spotify">
        <iframe
          title="Spotify Player"
          src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"
          width="320"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>

      {/* COPYRIGHT */}
      <div className="copyright">© Ardhitya</div>
    </div>
  );
}

function getTimeString() {
  const now = new Date();
  return now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
