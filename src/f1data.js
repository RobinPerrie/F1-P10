// ─── Teams ────────────────────────────────────────────────────

export const TEAMS = {
  mclaren: { name: "McLaren", color: "#FF8000" },
  mercedes: { name: "Mercedes", color: "#27F4D2" },
  red_bull: { name: "Red Bull", color: "#3671C6" },
  ferrari: { name: "Ferrari", color: "#E8002D" },
  williams: { name: "Williams", color: "#64C4FF" },
  racing_bulls: { name: "Racing Bulls", color: "#6692FF" },
  aston_martin: { name: "Aston Martin", color: "#229971" },
  haas: { name: "Haas", color: "#B6BABD" },
  audi: { name: "Audi", color: "#FF5733" },
  alpine: { name: "Alpine", color: "#FF87BC" },
  cadillac: { name: "Cadillac", color: "#1E3A5F" },
};

// ─── Drivers ──────────────────────────────────────────────────

export const DRIVERS = [
  { id: "norris", name: "Lando Norris", code: "NOR", number: 1, team: "mclaren" },
  { id: "piastri", name: "Oscar Piastri", code: "PIA", number: 81, team: "mclaren" },
  { id: "russell", name: "George Russell", code: "RUS", number: 63, team: "mercedes" },
  { id: "antonelli", name: "Kimi Antonelli", code: "ANT", number: 12, team: "mercedes" },
  { id: "verstappen", name: "Max Verstappen", code: "VER", number: 33, team: "red_bull" },
  { id: "hadjar", name: "Isack Hadjar", code: "HAD", number: 6, team: "red_bull" },
  { id: "leclerc", name: "Charles Leclerc", code: "LEC", number: 16, team: "ferrari" },
  { id: "hamilton", name: "Lewis Hamilton", code: "HAM", number: 44, team: "ferrari" },
  { id: "albon", name: "Alex Albon", code: "ALB", number: 23, team: "williams" },
  { id: "sainz", name: "Carlos Sainz", code: "SAI", number: 55, team: "williams" },
  { id: "lawson", name: "Liam Lawson", code: "LAW", number: 30, team: "racing_bulls" },
  { id: "lindblad", name: "Arvid Lindblad", code: "LIN", number: 45, team: "racing_bulls" },
  { id: "alonso", name: "Fernando Alonso", code: "ALO", number: 14, team: "aston_martin" },
  { id: "stroll", name: "Lance Stroll", code: "STR", number: 18, team: "aston_martin" },
  { id: "ocon", name: "Esteban Ocon", code: "OCO", number: 31, team: "haas" },
  { id: "bearman", name: "Oliver Bearman", code: "BEA", number: 87, team: "haas" },
  { id: "hulkenberg", name: "Nico Hulkenberg", code: "HUL", number: 27, team: "audi" },
  { id: "bortoleto", name: "Gabriel Bortoleto", code: "BOR", number: 5, team: "audi" },
  { id: "gasly", name: "Pierre Gasly", code: "GAS", number: 10, team: "alpine" },
  { id: "colapinto", name: "Franco Colapinto", code: "COL", number: 43, team: "alpine" },
  { id: "perez", name: "Sergio Perez", code: "PER", number: 11, team: "cadillac" },
  { id: "bottas", name: "Valtteri Bottas", code: "BOT", number: 77, team: "cadillac" },
];

// ─── 2026 Race Calendar ──────────────────────────────────────

export const RACES_2026 = [
  { round: 1, name: "Australian Grand Prix", location: "Melbourne", date: "2026-03-08", hasSprint: false },
  { round: 2, name: "Chinese Grand Prix", location: "Shanghai", date: "2026-03-15", hasSprint: true },
  { round: 3, name: "Japanese Grand Prix", location: "Suzuka", date: "2026-03-29", hasSprint: false },
  { round: 4, name: "Bahrain Grand Prix", location: "Sakhir", date: "2026-04-12", hasSprint: false },
  { round: 5, name: "Saudi Arabian Grand Prix", location: "Jeddah", date: "2026-04-19", hasSprint: false },
  { round: 6, name: "Miami Grand Prix", location: "Miami", date: "2026-05-03", hasSprint: true },
  { round: 7, name: "Canadian Grand Prix", location: "Montreal", date: "2026-05-24", hasSprint: true },
  { round: 8, name: "Monaco Grand Prix", location: "Monaco", date: "2026-06-07", hasSprint: false },
  { round: 9, name: "Barcelona-Catalunya Grand Prix", location: "Barcelona", date: "2026-06-14", hasSprint: false },
  { round: 10, name: "Austrian Grand Prix", location: "Spielberg", date: "2026-06-28", hasSprint: false },
  { round: 11, name: "British Grand Prix", location: "Silverstone", date: "2026-07-05", hasSprint: true },
  { round: 12, name: "Belgian Grand Prix", location: "Spa", date: "2026-07-19", hasSprint: false },
  { round: 13, name: "Hungarian Grand Prix", location: "Budapest", date: "2026-07-26", hasSprint: false },
  { round: 14, name: "Dutch Grand Prix", location: "Zandvoort", date: "2026-08-23", hasSprint: true },
  { round: 15, name: "Italian Grand Prix", location: "Monza", date: "2026-09-06", hasSprint: false },
  { round: 16, name: "Spanish Grand Prix", location: "Madrid", date: "2026-09-13", hasSprint: false },
  { round: 17, name: "Azerbaijan Grand Prix", location: "Baku", date: "2026-09-26", hasSprint: false },
  { round: 18, name: "Singapore Grand Prix", location: "Singapore", date: "2026-10-11", hasSprint: true },
  { round: 19, name: "United States Grand Prix", location: "Austin", date: "2026-10-25", hasSprint: false },
  { round: 20, name: "Mexico City Grand Prix", location: "Mexico City", date: "2026-11-01", hasSprint: false },
  { round: 21, name: "São Paulo Grand Prix", location: "São Paulo", date: "2026-11-08", hasSprint: false },
  { round: 22, name: "Las Vegas Grand Prix", location: "Las Vegas", date: "2026-11-21", hasSprint: false },
  { round: 23, name: "Qatar Grand Prix", location: "Lusail", date: "2026-11-29", hasSprint: false },
  { round: 24, name: "Abu Dhabi Grand Prix", location: "Yas Marina", date: "2026-12-06", hasSprint: false },
];

// ─── Country flags ────────────────────────────────────────────

export const FLAGS = {
  Melbourne: "🇦🇺", Shanghai: "🇨🇳", Suzuka: "🇯🇵", Sakhir: "🇧🇭", Jeddah: "🇸🇦",
  Miami: "🇺🇸", Montreal: "🇨🇦", Monaco: "🇲🇨", Barcelona: "🇪🇸", Spielberg: "🇦🇹",
  Silverstone: "🇬🇧", Spa: "🇧🇪", Budapest: "🇭🇺", Zandvoort: "🇳🇱", Monza: "🇮🇹",
  Madrid: "🇪🇸", Baku: "🇦🇿", Singapore: "🇸🇬", Austin: "🇺🇸", "Mexico City": "🇲🇽",
  "São Paulo": "🇧🇷", "Las Vegas": "🇺🇸", Lusail: "🇶🇦", "Yas Marina": "🇦🇪",
};

// ─── Scoring ──────────────────────────────────────────────────

//  Main race: P10 = 25, ±1 = 18, ±2 = 15, … ±9 = 1, beyond = 0
const MAIN_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
// Sprint race: P10 = 10, ±1 = 8, ±2 = 7, … ±8 = 1, beyond = 0
const SPRINT_POINTS = [10, 8, 7, 6, 5, 4, 3, 2, 1];

export function getPointsForPosition(actualPosition, isSprint) {
  const table = isSprint ? SPRINT_POINTS : MAIN_POINTS;
  const diff = Math.abs(actualPosition - 10);
  if (diff >= table.length) return 0;
  return table[diff];
}

export function scorePrediction(prediction, results, isSprint) {
  if (!prediction || !results?.length) return { points: 0, p10Points: 0, dnfBonus: 0, position: null };

  // Find the predicted driver in results
  const predDriver = DRIVERS.find((d) => d.id === prediction.p10);
  const driverResult = results.find(
    (r) => r.driverId === prediction.p10 || (predDriver && r.code === predDriver.code)
  );

  let p10Points = 0;
  let position = null;

  if (driverResult) {
    position = driverResult.position;
    p10Points = getPointsForPosition(position, isSprint);
  }

  // DNF bonus: +1 if correctly predicted first DNF
  let dnfBonus = 0;
  if (prediction.dnf) {
    // DNFs are drivers whose status is not "Finished" and not lapped ("+N Lap")
    const dnfs = results.filter(
      (r) => r.status && r.status !== "Finished" && !r.status.startsWith("+")
    );
    if (dnfs.length > 0) {
      // The "first" DNF by convention is the last in the classification (retired earliest)
      const firstDnf = dnfs[dnfs.length - 1];
      const predDnfDriver = DRIVERS.find((d) => d.id === prediction.dnf);
      if (
        firstDnf.driverId === prediction.dnf ||
        (predDnfDriver && firstDnf.code === predDnfDriver.code)
      ) {
        dnfBonus = 1;
      }
    }
  }

  return { points: p10Points + dnfBonus, p10Points, dnfBonus, position };
}

// ─── Jolpica API ──────────────────────────────────────────────

const API_BASE = "https://api.jolpi.ca/ergast/f1";

export async function fetchRaceResult(round) {
  try {
    const res = await fetch(`${API_BASE}/2026/${round}/results.json`);
    const data = await res.json();
    const results = data?.MRData?.RaceTable?.Races?.[0]?.Results;
    if (!results?.length) return null;
    return results.map((r) => ({
      position: parseInt(r.position),
      driverId: r.Driver.driverId,
      code: r.Driver.code,
      name: `${r.Driver.givenName} ${r.Driver.familyName}`,
      status: r.status,
    }));
  } catch {
    return null;
  }
}

export async function fetchSprintResult(round) {
  try {
    const res = await fetch(`${API_BASE}/2026/${round}/sprint.json`);
    const data = await res.json();
    const results = data?.MRData?.RaceTable?.Races?.[0]?.SprintResults;
    if (!results?.length) return null;
    return results.map((r) => ({
      position: parseInt(r.position),
      driverId: r.Driver.driverId,
      code: r.Driver.code,
      name: `${r.Driver.givenName} ${r.Driver.familyName}`,
      status: r.status,
    }));
  } catch {
    return null;
  }
}
