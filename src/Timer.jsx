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
  const didFinishRef = useRef(false);         // pastikan finish cuma sekali
  const notifRef = useRef(null);              // menyimpan object Notification
  const notifTimeoutRef = useRef(null);       // menyimpan timeout id untuk notif

  // minta izin notifikasi sekali saat mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    return () => {
      // cleanup saat unmount
      clearTimeout(notifTimeoutRef.current);
      stopAlarm(); // juga menutup audio & notifikasi jika ada
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // countdown loop
  useEffect(() => {
    if (!running || total <= 0) return;

    tickRef.current = setTimeout(() => {
      setTotal((t) => {
        // ketika sudah sampai 0 atau 1, pastikan handleFinish hanya dipanggil sekali
        if (t <= 1) {
          // panggil finish hanya jika belum pernah dipanggil
          if (!didFinishRef.current) {
            handleFinish();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearTimeout(tickRef.current);
  }, [running, total]);

  // Set waktu dari input (reset flag finished)
  const handleSet = () => {
    const m = minStr === "" ? 0 : Math.max(0, Math.floor(Number(minStr) || 0));
    const sRaw = secStr === "" ? 0 : Math.floor(Number(secStr) || 0);
    const s = Math.min(59, Math.max(0, sRaw));
    setTotal(m * 60 + s);
    didFinishRef.current = false;
    // clear any pending notif timeout (safety)
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

    // kalau dari pause -> start pertama kali (bukan resume), hitung usage
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
    // hentikan alarm & notifikasi
    stopAlarm();
  };

  // panggil saat timer selesai — diproteksi oleh didFinishRef
  const handleFinish = () => {
    // pastikan hanya sekali
    if (didFinishRef.current) return;
    didFinishRef.current = true;

    setRunning(false);

    // stop any previous notif timeout / notif
    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
      notifTimeoutRef.current = null;
    }
    if (notifRef.current) {
      try { notifRef.current.close(); } catch {}
      notifRef.current = null;
    }

    // play alarm (looping)
    try {
      alarmRef.current = new Audio("/timer.mp3");
      alarmRef.current.loop = true;
      // play may be blocked until user interaction — handle promise
      alarmRef.current.play().catch(() => {
        // autoplay mungkin diblokir; tapi kita tetap jadwalkan notifikasi fallback
      });
    } catch (e) {
      // ignore
    }

    // tampilkan notifikasi setelah jeda (biar alarm terdengar dulu)
    notifTimeoutRef.current = setTimeout(() => {
      notifTimeoutRef.current = null;

      // kalau Notification API tersedia & granted
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          // pastikan notif lama ditutup
          if (notifRef.current) {
            try { notifRef.current.close(); } catch {}
            notifRef.current = null;
          }

          notifRef.current = new Notification("⏰ Timer Selesai!", {
            body: "Waktunya sudah habis!",
            icon: "/favicon.ico"
          });

          // klik notifikasi -> hentikan alarm & tutup notifikasi
          notifRef.current.onclick = () => {
            stopAlarm();
            try { notifRef.current.close(); } catch {}
            notifRef.current = null;
          };

          // jika pengguna menutup notifikasi (close), juga hentikan alarm
          notifRef.current.onclose = () => {
            stopAlarm();
            notifRef.current = null;
          };
        } catch (e) {
          // jika bikin Notification gagal, fallback ke alert
          alertAndStop();
        }
      } else {
        // fallback jika permission tidak diberikan
        alertAndStop();
      }
    }, 3000); // 3 detik jeda
  };

  // hentikan alarm + clear notif timeout + tutup notifikasi
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
    // tampilkan alert sinkron lalu hentikan alarm setelah user menutup alert
    try {
      alert("⏰ Timer selesai!");
    } catch (e) {
      // ignore
    }
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

      {/* Statistik pemakaian */}
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
