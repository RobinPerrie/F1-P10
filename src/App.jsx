import { useState, useEffect, useMemo, useCallback } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";
import {
  TEAMS,
  DRIVERS,
  RACES_2026,
  FLAGS,
  scorePrediction,
  fetchRaceResult,
  fetchSprintResult,
} from "./f1data.js";

// ─── Firestore helpers ───────────────────────────────────────

async function saveUserProfile(uid, displayName) {
  await setDoc(doc(db, "players", uid), { displayName, uid }, { merge: true });
}

async function savePrediction(uid, round, type, p10, dnf) {
  const id = `${uid}_${round}_${type}`;
  try {
    await setDoc(doc(db, "predictions", id), {
      uid,
      round,
      type,
      p10,
      dnf: dnf || null,
      timestamp: Date.now(),
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to save prediction:", e);
    return { success: false, error: e.message };
  }
}

async function saveRaceResults(round, results, type) {
  // type = "main" or "sprint"
  await setDoc(doc(db, "results", `${round}_${type}`), { round, type, results });
}

async function isEmailAllowed(email) {
  try {
    const snap = await getDoc(doc(db, "allowedEmails", email.toLowerCase()));
    return snap.exists();
  } catch {
    return false;
  }
}

// ─── App ─────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [predictions, setPredictions] = useState({});
  const [raceResults, setRaceResults] = useState({});
  const [sprintResults, setSprintResults] = useState({});
  const [view, setView] = useState("dashboard");
  const [selectedRace, setSelectedRace] = useState(null);
  const [fetchingResults, setFetchingResults] = useState(false);

  // ── Auth listener ─────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Firestore real-time listeners ─────────────────────────

  useEffect(() => {
    // Players
    const unsubPlayers = onSnapshot(collection(db, "players"), (snap) => {
      const p = {};
      snap.forEach((d) => (p[d.id] = d.data()));
      setPlayers(p);
    });

    // Predictions
    const unsubPreds = onSnapshot(collection(db, "predictions"), (snap) => {
      const pr = {};
      snap.forEach((d) => (pr[d.id] = d.data()));
      setPredictions(pr);
    });

    // Results
    const unsubResults = onSnapshot(collection(db, "results"), (snap) => {
      const rr = {};
      const sr = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data.type === "main") rr[data.round] = data.results;
        if (data.type === "sprint") sr[data.round] = data.results;
      });
      setRaceResults(rr);
      setSprintResults(sr);
    });

    return () => {
      unsubPlayers();
      unsubPreds();
      unsubResults();
    };
  }, []);

  // ── Set default selected race ─────────────────────────────

  useEffect(() => {
    if (!selectedRace) {
      const now = new Date();
      const next = RACES_2026.find((r) => new Date(r.date) > now);
      setSelectedRace(next?.round || 1);
    }
  }, [selectedRace]);

  // ── Fetch results from API ────────────────────────────────

  async function syncResults() {
    setFetchingResults(true);
    for (const race of RACES_2026) {
      if (!raceResults[race.round]) {
        const res = await fetchRaceResult(race.round);
        if (res) await saveRaceResults(race.round, res, "main");
      }
      if (race.hasSprint && !sprintResults[race.round]) {
        const res = await fetchSprintResult(race.round);
        if (res) await saveRaceResults(race.round, res, "sprint");
      }
    }
    setFetchingResults(false);
  }

  // ── Standings ─────────────────────────────────────────────

  const standings = useMemo(() => {
    const playerIds = Object.keys(players);
    return playerIds
      .map((uid) => {
        let totalPoints = 0;
        let correctP10 = 0;
        let wrongGuesses = 0;
        let biggestLoss = 0;
        let correctDnfs = 0;

        for (const race of RACES_2026) {
          // Main
          const mKey = `${uid}_${race.round}_main`;
          const mPred = predictions[mKey];
          const mRes = raceResults[race.round];
          if (mPred && mRes) {
            const s = scorePrediction(mPred, mRes, false);
            totalPoints += s.points;
            if (s.position === 10) correctP10++;
            if (s.p10Points === 0 && s.position !== null) wrongGuesses++;
            if (s.position && Math.abs(s.position - 10) > biggestLoss)
              biggestLoss = Math.abs(s.position - 10);
            if (s.dnfBonus) correctDnfs++;
          }
          // Sprint
          if (race.hasSprint) {
            const sKey = `${uid}_${race.round}_sprint`;
            const sPred = predictions[sKey];
            const sRes = sprintResults[race.round];
            if (sPred && sRes) {
              const s = scorePrediction(sPred, sRes, true);
              totalPoints += s.points;
              if (s.position === 10) correctP10++;
              if (s.p10Points === 0 && s.position !== null) wrongGuesses++;
              if (s.dnfBonus) correctDnfs++;
            }
          }
        }

        return {
          uid,
          displayName: players[uid]?.displayName || "Unknown",
          totalPoints,
          correctP10,
          wrongGuesses,
          biggestLoss,
          correctDnfs,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [players, predictions, raceResults, sprintResults]);

  const now = new Date();
  const nextRace =
    RACES_2026.find((r) => new Date(r.date) > now) || RACES_2026[RACES_2026.length - 1];
  const seasonComplete = RACES_2026.every((r) => raceResults[r.round]);

  // ── Loading ───────────────────────────────────────────────

  if (authLoading)
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          P<span className="accent">10</span>
        </div>
        <div className="loading-bar">
          <div className="loading-bar-inner" />
        </div>
      </div>
    );

  // ── Auth Screen ───────────────────────────────────────────

  if (!user)
    return (
      <AuthScreen
        onLogin={() => {}}
        players={players}
      />
    );

  // ── Main App ──────────────────────────────────────────────

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-left">
            <span className="nav-logo">
              P<span className="accent">10</span>
            </span>
            <div className="nav-links">
              {["dashboard", "races", "predict", ...(seasonComplete ? ["wrap"] : [])].map((v) => (
                <button
                  key={v}
                  className={`nav-link ${view === v ? "active" : ""}`}
                  onClick={() => {
                    setView(v);
                    if (v === "predict") setSelectedRace(nextRace?.round || 1);
                  }}
                >
                  {v === "dashboard"
                    ? "Standings"
                    : v === "races"
                    ? "Races"
                    : v === "predict"
                    ? "Predict"
                    : "Season Wrap"}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-right">
            <span className="user-name">{user.displayName || user.email}</span>
            <button className="logout-btn" onClick={() => signOut(auth)}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {view === "dashboard" && (
          <Dashboard
            standings={standings}
            raceResults={raceResults}
            predictions={predictions}
            currentUid={user.uid}
            fetchingResults={fetchingResults}
            syncResults={syncResults}
            nextRace={nextRace}
            setView={setView}
            setSelectedRace={setSelectedRace}
            now={now}
          />
        )}

        {view === "predict" && (
          <PredictView
            currentUid={user.uid}
            predictions={predictions}
            raceResults={raceResults}
            selectedRace={selectedRace}
            setSelectedRace={setSelectedRace}
            now={now}
          />
        )}

        {view === "races" && (
          <RacesView
            raceResults={raceResults}
            sprintResults={sprintResults}
            predictions={predictions}
            players={players}
            currentUid={user.uid}
            selectedRace={selectedRace}
            setSelectedRace={setSelectedRace}
          />
        )}

        {view === "wrap" && seasonComplete && (
          <WrapView standings={standings} />
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════

function AuthScreen({ players }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        if (!displayName.trim()) {
          setError("Enter a display name");
          setLoading(false);
          return;
        }
        // Check whitelist before creating account
        const allowed = await isEmailAllowed(email);
        if (!allowed) {
          setError("This email is not on the invite list. Ask the admin to add you.");
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
        await saveUserProfile(cred.user.uid, displayName.trim());
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      const msg = e.code?.replace("auth/", "").replace(/-/g, " ") || e.message;
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    }
    setLoading(false);
  }

  return (
    <div className="login-screen">
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="logo-mark">
            P<span className="accent">10</span>
          </div>
          <h1 className="login-title">F1 P10</h1>
          <p className="login-sub">Predict the P10 finisher. Outsmart your mates.</p>
        </div>

        <div className="login-form">
          {isRegister && (
            <input
              className="input"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {error && <p className="error-text">{error}</p>}

          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
          </button>

          <button className="link-btn" onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Already have an account? Sign in" : "New player? Create account"}
          </button>
        </div>

        {Object.keys(players).length > 0 && (
          <div className="player-chips">
            <span className="chip-label">Active players:</span>
            {Object.values(players).map((p) => (
              <span key={p.uid} className="chip">
                {p.displayName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

function Dashboard({
  standings,
  raceResults,
  predictions,
  currentUid,
  fetchingResults,
  syncResults,
  nextRace,
  setView,
  setSelectedRace,
  now,
}) {
  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="hero-card">
        <div>
          <h2 className="hero-title">Season 2026</h2>
          <p className="hero-sub">
            {nextRace
              ? `Next up: ${FLAGS[nextRace.location] || ""} ${nextRace.name} — ${new Date(
                  nextRace.date
                ).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
              : "Season complete!"}
          </p>
        </div>
        <button
          className={`primary-btn ${fetchingResults ? "btn-disabled" : ""}`}
          onClick={syncResults}
          disabled={fetchingResults}
        >
          {fetchingResults ? "Fetching..." : "⟳ Sync Results"}
        </button>
      </div>

      {/* Standings */}
      <h3 className="section-title">Player Standings</h3>
      {standings.length === 0 ? (
        <p className="empty-text">No players yet — share the link with your friends!</p>
      ) : (
        <div className="table-wrap">
          <div className="table-header">
            <span className="cell cell-pos">Pos</span>
            <span className="cell cell-grow">Player</span>
            <span className="cell cell-pts">Points</span>
            <span className="cell cell-stat hide-sm">P10s</span>
            <span className="cell cell-stat hide-sm">DNFs</span>
          </div>
          {standings.map((p, i) => (
            <div
              key={p.uid}
              className={`table-row ${p.uid === currentUid ? "row-highlight" : ""}`}
            >
              <span className="cell cell-pos">
                <span className={`pos-badge ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>
                  {i + 1}
                </span>
              </span>
              <span className="cell cell-grow font-bold">{p.displayName}</span>
              <span className="cell cell-pts mono">{p.totalPoints}</span>
              <span className="cell cell-stat hide-sm muted">{p.correctP10}</span>
              <span className="cell cell-stat hide-sm muted">{p.correctDnfs}</span>
            </div>
          ))}
        </div>
      )}

      {/* Race Grid */}
      <h3 className="section-title" style={{ marginTop: 32 }}>
        Race Calendar
      </h3>
      <div className="race-grid">
        {RACES_2026.map((race) => {
          const hasResult = !!raceResults[race.round];
          const hasPred = !!predictions[`${currentUid}_${race.round}_main`];
          const isPast = new Date(race.date) < now;
          return (
            <div
              key={race.round}
              className={`race-card ${isPast && !hasResult ? "race-past" : ""} ${hasResult ? "race-done" : ""}`}
              onClick={() => {
                setSelectedRace(race.round);
                setView(hasResult ? "races" : "predict");
              }}
            >
              <div className="race-card-top">
                <span className="race-round">R{race.round}</span>
                {race.hasSprint && <span className="sprint-badge">Sprint</span>}
              </div>
              <span className="race-flag">{FLAGS[race.location] || "🏁"}</span>
              <span className="race-location">{race.location}</span>
              <span className="race-date">
                {new Date(race.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
              <div className="race-status">
                {hasResult && <span className="status-done">✓</span>}
                {hasPred && !hasResult && <span className="status-predicted">Predicted</span>}
                {!hasPred && !hasResult && !isPast && <span className="status-open">Open</span>}
                {isPast && !hasResult && <span className="status-pending">Awaiting</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PREDICT VIEW
// ═══════════════════════════════════════════════════════════════

function PredictView({ currentUid, predictions, raceResults, selectedRace, setSelectedRace, now }) {
  const race = RACES_2026.find((r) => r.round === selectedRace) || RACES_2026[0];
  const isLocked = new Date(race.date) < now && !!raceResults[race.round];

  const existingMain = predictions[`${currentUid}_${race.round}_main`];
  const existingSprint = predictions[`${currentUid}_${race.round}_sprint`];

  const [mainP10, setMainP10] = useState(existingMain?.p10 || "");
  const [mainDnf, setMainDnf] = useState(existingMain?.dnf || "");
  const [sprintP10, setSprintP10] = useState(existingSprint?.p10 || "");
  const [sprintDnf, setSprintDnf] = useState(existingSprint?.dnf || "");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const em = predictions[`${currentUid}_${race.round}_main`];
    const es = predictions[`${currentUid}_${race.round}_sprint`];
    setMainP10(em?.p10 || "");
    setMainDnf(em?.dnf || "");
    setSprintP10(es?.p10 || "");
    setSprintDnf(es?.dnf || "");
    setSaved(false);
    setSaveError("");
  }, [selectedRace, currentUid, predictions]);

  async function save() {
    setSaveError("");
    let hasError = false;

    if (mainP10) {
      const res = await savePrediction(currentUid, race.round, "main", mainP10, mainDnf);
      if (!res.success) {
        hasError = true;
        setSaveError(res.error || "Failed to save main race prediction. Check Firestore rules.");
      }
    }
    if (race.hasSprint && sprintP10) {
      const res = await savePrediction(currentUid, race.round, "sprint", sprintP10, sprintDnf);
      if (!res.success) {
        hasError = true;
        setSaveError(res.error || "Failed to save sprint prediction. Check Firestore rules.");
      }
    }

    if (!hasError) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="fade-in">
      <RaceSelector race={race} selected={selectedRace} setSelected={setSelectedRace} />

      {isLocked ? (
        <div className="locked-banner">🔒 Race complete — predictions locked</div>
      ) : (
        <>
          <div className="prediction-card">
            <h3 className="pred-card-title">🏁 Main Race — Who finishes P10?</h3>
            <DriverPicker value={mainP10} onChange={setMainP10} label="P10 Prediction" />
            <DriverPicker value={mainDnf} onChange={setMainDnf} label="First DNF (Bonus Point)" />
          </div>

          {race.hasSprint && (
            <div className="prediction-card">
              <h3 className="pred-card-title">⚡ Sprint Race — Who finishes P10?</h3>
              <DriverPicker value={sprintP10} onChange={setSprintP10} label="P10 Prediction" />
              <DriverPicker value={sprintDnf} onChange={setSprintDnf} label="First DNF (Bonus Point)" />
            </div>
          )}

          <button className="primary-btn full-width" onClick={save} style={{ marginTop: 16 }}>
            {saved ? "✓ Saved!" : "Save Predictions"}
          </button>

          {saveError && (
            <p className="error-text" style={{ marginTop: 8 }}>{saveError}</p>
          )}

          {/* Show current saved predictions */}
          {(existingMain || existingSprint) && (
            <div className="prediction-card" style={{ marginTop: 16, opacity: 0.8 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>
                Your Saved Predictions
              </h4>
              {existingMain && (
                <p style={{ fontSize: 14, color: "#ccc", margin: "4px 0" }}>
                  🏁 Main P10: <strong style={{ color: "#ff8c00" }}>
                    {DRIVERS.find(d => d.id === existingMain.p10)?.name || existingMain.p10}
                  </strong>
                  {existingMain.dnf && (
                    <span style={{ marginLeft: 12, color: "#888" }}>
                      DNF: {DRIVERS.find(d => d.id === existingMain.dnf)?.name || existingMain.dnf}
                    </span>
                  )}
                </p>
              )}
              {existingSprint && (
                <p style={{ fontSize: 14, color: "#ccc", margin: "4px 0" }}>
                  ⚡ Sprint P10: <strong style={{ color: "#ff8c00" }}>
                    {DRIVERS.find(d => d.id === existingSprint.p10)?.name || existingSprint.p10}
                  </strong>
                  {existingSprint.dnf && (
                    <span style={{ marginLeft: 12, color: "#888" }}>
                      DNF: {DRIVERS.find(d => d.id === existingSprint.dnf)?.name || existingSprint.dnf}
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <PointsReference />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RACES VIEW
// ═══════════════════════════════════════════════════════════════

function RacesView({
  raceResults,
  sprintResults,
  predictions,
  players,
  currentUid,
  selectedRace,
  setSelectedRace,
}) {
  const race = RACES_2026.find((r) => r.round === selectedRace) || RACES_2026[0];
  const results = raceResults[race.round];
  const playerIds = Object.keys(players);

  return (
    <div className="fade-in">
      <RaceSelector race={race} selected={selectedRace} setSelected={setSelectedRace} />

      {!results ? (
        <div className="no-results">
          <p style={{ fontSize: 40, marginBottom: 8 }}>🏁</p>
          <p>No results available yet for this race.</p>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Hit "Sync Results" on the dashboard to fetch from the API.
          </p>
        </div>
      ) : (
        <>
          <h3 className="section-title">Race Classification</h3>
          <div className="table-wrap">
            <div className="table-header">
              <span className="cell" style={{ width: 40 }}>Pos</span>
              <span className="cell cell-grow">Driver</span>
              <span className="cell" style={{ width: 80 }}>Status</span>
            </div>
            {results.map((r) => (
              <div
                key={r.position}
                className={`table-row ${r.position === 10 ? "row-p10" : ""}`}
              >
                <span className="cell font-bold" style={{ width: 40 }}>{r.position}</span>
                <span className="cell cell-grow">
                  {r.name} <span className="muted">({r.code})</span>
                </span>
                <span
                  className="cell"
                  style={{
                    width: 80,
                    fontSize: 12,
                    color:
                      r.status === "Finished" || r.status?.startsWith("+")
                        ? "#4ade80"
                        : "#f87171",
                  }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          <h3 className="section-title" style={{ marginTop: 32 }}>
            Player Scores — This Race
          </h3>
          <div className="table-wrap">
            <div className="table-header">
              <span className="cell cell-grow">Player</span>
              <span className="cell" style={{ width: 100 }}>Prediction</span>
              <span className="cell" style={{ width: 60, textAlign: "center" }}>Actual</span>
              <span className="cell" style={{ width: 50, textAlign: "right" }}>Pts</span>
            </div>
            {playerIds.map((uid) => {
              const pred = predictions[`${uid}_${race.round}_main`];
              const score = scorePrediction(pred, results, false);
              const driver = pred ? DRIVERS.find((d) => d.id === pred.p10) : null;
              return (
                <div
                  key={uid}
                  className={`table-row ${uid === currentUid ? "row-highlight" : ""}`}
                >
                  <span className="cell cell-grow font-bold">
                    {players[uid]?.displayName || "Unknown"}
                  </span>
                  <span className="cell" style={{ width: 100 }}>
                    {driver?.code || "—"}
                  </span>
                  <span className="cell mono" style={{ width: 60, textAlign: "center" }}>
                    {score.position ? `P${score.position}` : "—"}
                  </span>
                  <span
                    className="cell mono font-bold"
                    style={{
                      width: 50,
                      textAlign: "right",
                      color: score.points > 0 ? "#4ade80" : "#888",
                    }}
                  >
                    {pred ? score.points : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SEASON WRAP
// ═══════════════════════════════════════════════════════════════

function WrapView({ standings }) {
  if (!standings.length) return null;
  const winner = standings[0];
  const mostCorrect = [...standings].sort((a, b) => b.correctP10 - a.correctP10)[0];
  const mostWrong = [...standings].sort((a, b) => b.wrongGuesses - a.wrongGuesses)[0];
  const biggestLoss = [...standings].sort((a, b) => b.biggestLoss - a.biggestLoss)[0];
  const bestDnf = [...standings].sort((a, b) => b.correctDnfs - a.correctDnfs)[0];

  const awards = [
    { emoji: "🏆", title: "Champion", player: winner.displayName, stat: `${winner.totalPoints} pts` },
    { emoji: "🎯", title: "Sharpshooter", sub: "Most correct P10s", player: mostCorrect.displayName, stat: `${mostCorrect.correctP10} P10s` },
    { emoji: "💀", title: "The Gambler", sub: "Most wrong guesses", player: mostWrong.displayName, stat: `${mostWrong.wrongGuesses} misses` },
    { emoji: "📉", title: "Biggest L", sub: "Furthest off P10", player: biggestLoss.displayName, stat: `${biggestLoss.biggestLoss} positions off` },
    { emoji: "💥", title: "Crash Prophet", sub: "Most correct DNFs", player: bestDnf.displayName, stat: `${bestDnf.correctDnfs} DNFs` },
  ];

  return (
    <div className="fade-in">
      <div className="wrap-header">
        <h2 className="wrap-title">2026 Season Wrap</h2>
        <p className="wrap-sub">The definitive P10 predictions recap</p>
      </div>

      <div className="awards-grid">
        {awards.map((a, i) => (
          <div key={i} className={`award-card ${i === 0 ? "award-champ" : ""}`}>
            <span style={{ fontSize: i === 0 ? 60 : 40 }}>{a.emoji}</span>
            <h3 className="award-title">{a.title}</h3>
            {a.sub && <p className="award-sub">{a.sub}</p>}
            <p className="award-player">{a.player}</p>
            <p className="award-stat">{a.stat}</p>
          </div>
        ))}
      </div>

      <h3 className="section-title" style={{ marginTop: 40 }}>
        Final Standings
      </h3>
      <div className="table-wrap">
        <div className="table-header">
          <span className="cell cell-pos">Pos</span>
          <span className="cell cell-grow">Player</span>
          <span className="cell cell-pts">Points</span>
          <span className="cell cell-stat hide-sm">P10s</span>
          <span className="cell cell-stat hide-sm">DNFs</span>
          <span className="cell cell-stat hide-sm">Misses</span>
        </div>
        {standings.map((p, i) => (
          <div key={p.uid} className="table-row">
            <span className="cell cell-pos">
              <span className={`pos-badge ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>
                {i + 1}
              </span>
            </span>
            <span className="cell cell-grow font-bold">{p.displayName}</span>
            <span className="cell cell-pts mono">{p.totalPoints}</span>
            <span className="cell cell-stat hide-sm muted">{p.correctP10}</span>
            <span className="cell cell-stat hide-sm muted">{p.correctDnfs}</span>
            <span className="cell cell-stat hide-sm muted">{p.wrongGuesses}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

function RaceSelector({ race, selected, setSelected }) {
  return (
    <div className="race-selector">
      <button
        className="arrow-btn"
        onClick={() => setSelected(Math.max(1, selected - 1))}
        disabled={selected <= 1}
      >
        ◀
      </button>
      <div className="race-selector-title">
        <span className="race-flag-lg">{FLAGS[race.location] || "🏁"}</span>
        <div>
          <h2 className="predict-title">
            Round {race.round}: {race.name}
          </h2>
          <p className="predict-date">
            {new Date(race.date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {race.hasSprint && " • Sprint Weekend ⚡"}
          </p>
        </div>
      </div>
      <button
        className="arrow-btn"
        onClick={() => setSelected(Math.min(24, selected + 1))}
        disabled={selected >= 24}
      >
        ▶
      </button>
    </div>
  );
}

function DriverPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = DRIVERS.find((d) => d.id === value);

  const filtered = DRIVERS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      TEAMS[d.team].name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach((d) => {
    if (!grouped[d.team]) grouped[d.team] = [];
    grouped[d.team].push(d);
  });

  return (
    <div className="picker-wrap">
      <label className="picker-label">{label}</label>
      <button className="picker-btn" onClick={() => setOpen(!open)}>
        {selected ? (
          <span className="picker-selected">
            <span className="team-dot" style={{ background: TEAMS[selected.team].color }} />
            {selected.name}
            <span className="picker-code">{selected.code}</span>
          </span>
        ) : (
          <span className="picker-placeholder">Select a driver…</span>
        )}
        <span className="picker-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="picker-dropdown">
          <input
            className="picker-search"
            placeholder="Search driver or team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="picker-list">
            {value && (
              <button
                className="picker-clear"
                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
              >
                ✕ Clear selection
              </button>
            )}
            {Object.entries(grouped).map(([teamId, drivers]) => (
              <div key={teamId}>
                <div
                  className="picker-team-header"
                  style={{ borderLeft: `3px solid ${TEAMS[teamId].color}` }}
                >
                  {TEAMS[teamId].name}
                </div>
                {drivers.map((d) => (
                  <button
                    key={d.id}
                    className={`picker-option ${d.id === value ? "picker-option-active" : ""}`}
                    onClick={() => { onChange(d.id); setOpen(false); setSearch(""); }}
                  >
                    <span className="team-dot" style={{ background: TEAMS[d.team].color }} />
                    <span className="picker-driver-name">{d.name}</span>
                    <span className="picker-driver-code">
                      {d.code} #{d.number}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PointsReference() {
  return (
    <div className="points-ref">
      <h4 className="ref-title">Points Reference</h4>
      <div className="ref-grid">
        <div className="ref-col">
          <span className="ref-header">Main Race</span>
          {["P10 = 25", "±1 = 18", "±2 = 15", "±3 = 12", "±4 = 10", "±5 = 8", "±6 = 6", "±7 = 4", "±8 = 2", "±9 = 1"].map(
            (t) => (
              <span key={t} className="ref-row">{t}</span>
            )
          )}
        </div>
        <div className="ref-col">
          <span className="ref-header">Sprint Race</span>
          {["P10 = 10", "±1 = 8", "±2 = 7", "±3 = 6", "±4 = 5", "±5 = 4", "±6 = 3", "±7 = 2", "±8 = 1"].map(
            (t) => (
              <span key={t} className="ref-row">{t}</span>
            )
          )}
        </div>
      </div>
      <p className="ref-note">+1 bonus point for correctly predicting the first DNF</p>
    </div>
  );
}
