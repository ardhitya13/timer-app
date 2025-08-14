import React, { useEffect, useRef, useState, useCallback } from "react";

export default function Timer() {
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);

  const [minStr, setMinStr] = useState("");
  const [secStr, setSecStr] = useState("");

  const [usageCount, setUsageCount] = useState(() => {
    return Number(localStorage.getItem("usageCount") || 0);
  });

  const tickRef = useRef(null);
  const alarmRef = useRef(null);
  const didFinishRef = useRef(false);
  const notifRef = useRef(null);
  const notifTimeoutRef = useRef(null);

  // Minta izin notifikasi saat mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    return () => {
      clearTimeout(notifTimeoutRef.current);
      stopAlarm();
    };
  }, []);

  // Countdown loop
  useEffect(() => {
    if (!running || total <= 0) return;

    tickRef.current = setTimeout(() => {
      setTotal((t) => {
        if (t <= 1) {
          if (!didFinishRef.current) handleFinish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearTimeout(tickRef.current);
  }, [running, total]);

  // Set waktu dari input
  const handleSet = () => {
    const m = minStr === "" ? 0 : Math.max(0, Math.floor(Number(minStr) || 0));
    const sRaw = secStr === "" ? 0 : Math.floor(Number(secStr) || 0);
    const s = Math.min(59, Math.max(0, sRaw));
    setTotal(m * 60 + s);
    didFinishRef.current = false;

    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
      notifTimeoutRef.current = null;
    }
    if (notifRef.current) {
      try { notifRef.current.close(); } catch {}
      notifRef.current = null;
    }
  };

  const handleStartPause = () => {
    if (total === 0 && !running) return;

    if (!running && total > 0) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem("usageCount", newCount);
    }

    setRunning((v) => !v);
  };

  const handleReset = () => {
    setRunning(false);
    setTotal(0);
    setMinStr("");
    setSecStr("");
    didFinishRef.current = false;
    stopAlarm();
  };

  const handleFinish = () => {
    if (didFinishRef.current) return;
    didFinishRef.current = true;

    setRunning(false);

    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
      notifTimeoutRef.current = null;
    }
    if (notifRef.current) {
      try { notifRef.current.close(); } catch {}
      notifRef.current = null;
    }

    // Play alarm dengan PUBLIC_URL
    try {
      alarmRef.current = new Audio(process.env.PUBLIC_URL + "/timer.mp3");
      alarmRef.current.loop = true;
      alarmRef.current.play().catch(() => {});
    } catch {}

    // Notifikasi setelah 3 detik
    notifTimeoutRef.current = setTimeout(() => {
      notifTimeoutRef.current = null;

      if ("Notification" in window && Notification.permission === "granted") {
        try {
          if (notifRef.current) {
            try { notifRef.current.close(); } catch {}
            notifRef.current = null;
          }

          notifRef.current = new Notification("⏰ Timer Selesai!", {
            body: "Waktunya sudah habis!",
            icon: process.env.PUBLIC_URL + "/favicon.ico"
          });

          notifRef.current.onclick = () => {
            stopAlarm();
            try { notifRef.current.close(); } catch {}
            notifRef.current = null;
          };
          notifRef.current.onclose = () => {
            stopAlarm();
            notifRef.current = null;
          };
        } catch (e) {
          alertAndStop();
        }
      } else {
        alertAndStop();
      }
    }, 3000);
  };

  const stopAlarm = () => {
    if (alarmRef.current) {
      try {
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
      } catch {}
      alarmRef.current = null;
    }

    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
      notifTimeoutRef.current = null;
    }

    if (notifRef.current) {
      try { notifRef.current.close(); } catch {}
      notifRef.current = null;
    }
  };

  const alertAndStop = () => {
    try { alert("⏰ Timer selesai!"); } catch {}
    stopAlarm();
  };

  return (
    <div className="timer pixel-card">
      <div className="time-display">{formatTime(total)}</div>

      <div className="inputs">
        <label className="pixel-label">
          <span>Menit</span>
          <input
            type="number"
            min="0"
            placeholder="00"
            value={minStr}
            onChange={(e) => setMinStr(e.target.value)}
            className="pixel-input"
          />
        </label>

        <label className="pixel-label">
          <span>Detik</span>
          <input
            type="number"
            min="0"
            max="59"
            placeholder="00"
            value={secStr}
            onChange={(e) => setSecStr(e.target.value)}
            className="pixel-input"
          />
        </label>

        <button onClick={handleSet} className="pixel-btn">Set</button>
      </div>

      <div className="btn-row">
        <button
          onClick={handleStartPause}
          className="pixel-btn green"
          disabled={total === 0 && !running}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={handleReset} className="pixel-btn red">Reset</button>
      </div>

      <div style={{ marginTop: "10px", fontSize: "10px" }}>
        📊 Kamu sudah pakai timer ini <b>{usageCount}</b> kali
      </div>
    </div>
  );
}

function formatTime(sec) {
  const mm = Math.floor(sec / 60).toString().padStart(2, "0");
  const ss = (sec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
