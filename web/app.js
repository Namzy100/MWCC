const scheduleBody = document.getElementById("scheduleBody");
const divisionFilter = document.getElementById("divisionFilter");
const tournamentFilter = document.getElementById("tournamentFilter");
const teamFilter = document.getElementById("teamFilter");
const sessionFilter = document.getElementById("sessionFilter");
const groundFilter = document.getElementById("groundFilter");
const pageSizeSelect = document.getElementById("pageSize");
const sortBySelect = document.getElementById("sortBy");
const densityToggle = document.getElementById("densityToggle");
const searchInput = document.getElementById("searchInput");
const presetFilter = document.getElementById("presetFilter");
const dateFromInput = document.getElementById("dateFrom");
const dateToInput = document.getElementById("dateTo");
const matchCount = document.getElementById("matchCount");
const weekendCount = document.getElementById("weekendCount");
const groundCount = document.getElementById("groundCount");
const showingCount = document.getElementById("showingCount");
const busiestWeekend = document.getElementById("busiestWeekend");
const resetFilters = document.getElementById("resetFilters");
const downloadCsv = document.getElementById("downloadCsv");
const printSchedule = document.getElementById("printSchedule");
const teamList = document.getElementById("teamList");
const teamSearch = document.getElementById("teamSearch");
const lastUpdated = document.getElementById("lastUpdated");
const backToTop = document.getElementById("backToTop");
const scheduleCards = document.getElementById("scheduleCards");
const quickFilterButtons = document.querySelectorAll(".quick-filters .chip");
const fixtureGrid = document.getElementById("fixtureGrid");
const highlightStrip = document.getElementById("highlightStrip");
const countdown = document.getElementById("countdown");
const exportIcs = document.getElementById("exportIcs");
const changeLog = document.getElementById("changeLog");
const adminPanel = document.getElementById("adminPanel");
const adminUpload = document.getElementById("adminUpload");
const unlockAdmin = document.getElementById("unlockAdmin");
const lockAdmin = document.getElementById("lockAdmin");
const heroMatchTitle = document.getElementById("heroMatchTitle");
const heroMatchMeta = document.getElementById("heroMatchMeta");
const statTeams = document.getElementById("statTeams");
const statTournaments = document.getElementById("statTournaments");
const statMostSuccessful = document.getElementById("statMostSuccessful");
const statLastChampion = document.getElementById("statLastChampion");
const resultsGrid = document.getElementById("resultsGrid");
const resultsTabs = document.getElementById("resultsTabs");
const rfTournamentTabs = document.getElementById("rfTournamentTabs");
const fixturesList = document.getElementById("fixturesList");
const resultsList = document.getElementById("resultsList");
const standingsBody = document.getElementById("standingsBody");
const standingsEmpty = document.getElementById("standingsEmpty");
const standingsTabs = document.getElementById("standingsTabs");
const scorecardForm = document.getElementById("scorecardForm");
const scoreMatchId = document.getElementById("scoreMatchId");
const scoreUrl = document.getElementById("scoreUrl");
const scoreResult = document.getElementById("scoreResult");
const scoreResultType = document.getElementById("scoreResultType");
const scoreWinner = document.getElementById("scoreWinner");
const scoreTeamOneRuns = document.getElementById("scoreTeamOneRuns");
const scoreTeamOneOvers = document.getElementById("scoreTeamOneOvers");
const scoreTeamTwoRuns = document.getElementById("scoreTeamTwoRuns");
const scoreTeamTwoOvers = document.getElementById("scoreTeamTwoOvers");
const clearScorecards = document.getElementById("clearScorecards");
const exportReminders = document.getElementById("exportReminders");
const resultsFixtures = document.getElementById("resultsFixtures");

const SESSION_MAP = {
  "08:30": "Morning",
  "09:00": "Morning",
  "09:15": "Morning",
  "10:00": "Morning",
  "10:30": "Morning",
  "11:00": "Morning",
  "11:30": "Morning",
  "12:00": "Midday",
  "12:30": "Midday",
  "13:00": "Midday",
  "13:30": "Evening",
  "14:00": "Evening",
  "14:15": "Evening",
  "14:30": "Evening",
  "15:00": "Evening",
  "15:30": "Evening",
  "18:45": "Evening",
  "19:00": "Evening",
};

let allRows = [];
let lastFiltered = [];
let allTeams = [];
let activeQuickFilter = "all";
let activeResultsView = "fixtures";
let activeResultsTournament = "D1_WHITE";
let lastLoadedTimestamp = null;
let computedStandings = {};
let captainLookup = {};
const ADMIN_CODE = "MWCC2026";
const SCORECARD_KEY = "mwcc_scorecards";

const STANDINGS = {
  D1_WHITE: [],
  D1_RED: [],
  D2_WHITE: [],
  D2_RED: [],
  T20: [],
};

const CLUB_MAP = {
  // Example:
  // "South Barrington Cricket Club": ["SBCC Slayers", "SBCC Tigers"],
};

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return [];
  const headers = lines[0].split("\t").length > lines[0].split(",").length
    ? lines[0].split("\t")
    : lines[0].split(",");

  return lines.slice(1).map((line) => {
    const parts = line.split("\t").length > line.split(",").length
      ? line.split("\t")
      : line.split(",");
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (parts[idx] || "").trim();
    });
    return row;
  });
}

function normalizeRows(rows) {
  return rows.map((row, idx) => {
    const division = row["Division"] || row["Tournament"] || row["Division "] || "";
    const time = row["Time"] || "";
    const sessionKey = time ? time.replace(/\s?(AM|PM)$/i, "") : "";
    const time24 = to24Hour(sessionKey, time);

    return {
      index: row["#"] || idx + 1,
      division,
      matchType: row["Match Type"] || row["Match type"] || "League",
      date: row["Date"] || "",
      time: time,
      teamOne: row["Team One"] || "",
      teamTwo: row["Team Two"] || "",
      ground: row["Ground"] || "",
      session: SESSION_MAP[time24] || "Session",
    };
  });
}

function to24Hour(timePart, raw) {
  if (!raw) return "";
  const isPM = /PM/i.test(raw);
  const clean = timePart || raw.replace(/\s?(AM|PM)$/i, "");
  let [hours, minutes] = clean.split(":");
  let h = parseInt(hours, 10);
  const m = minutes || "00";
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

function renderFilters(rows) {
  const divisions = unique(rows.map((r) => r.division));
  const tournaments = divisions;
  const teams = unique(rows.flatMap((r) => [r.teamOne, r.teamTwo]));
  const sessions = unique(rows.map((r) => r.session));
  const grounds = unique(rows.map((r) => r.ground));

  fillSelect(divisionFilter, ["All", ...divisions]);
  fillSelect(tournamentFilter, ["All", ...tournaments]);
  fillSelect(teamFilter, ["All", ...teams]);
  fillSelect(sessionFilter, ["All", ...sessions]);
  fillSelect(groundFilter, ["All", ...grounds]);
  if (presetFilter) {
    fillPresetOptions(teams);
  }

  allTeams = teams;
  renderTeamList(teams);
}

function fillPresetOptions(teams) {
  if (!presetFilter) return;
  presetFilter.innerHTML = "";
  const options = [{ value: "all", label: "All Teams" }];
  const clubs = Object.keys(CLUB_MAP);
  clubs.forEach((club) => options.push({ value: `club:${club}`, label: `Club: ${club}` }));
  teams.forEach((team) => options.push({ value: `team:${team}`, label: `Team: ${team}` }));
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    presetFilter.appendChild(option);
  });
}

function fillSelect(select, values) {
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function unique(list) {
  return Array.from(new Set(list.filter(Boolean))).sort();
}

function applyFilters() {
  const divisionValue = divisionFilter.value;
  const tournamentValue = tournamentFilter.value;
  const teamValue = teamFilter.value;
  const sessionValue = sessionFilter.value;
  const groundValue = groundFilter.value;
  const searchValue = searchInput.value.toLowerCase();
  const pageSize = pageSizeSelect.value;
  const sortValue = sortBySelect ? sortBySelect.value : "date_asc";
  const presetValue = presetFilter ? presetFilter.value : "all";
  const dateFrom = dateFromInput ? parseDateInput(dateFromInput.value) : null;
  const dateTo = dateToInput ? parseDateInput(dateToInput.value) : null;
  const presetTeams = presetToTeams(presetValue);

  const filtered = allRows.filter((row) => {
    if (divisionValue && divisionValue !== "All" && row.division !== divisionValue) {
      return false;
    }
    if (tournamentValue && tournamentValue !== "All" && row.division !== tournamentValue) {
      return false;
    }
    if (teamValue && teamValue !== "All" && row.teamOne !== teamValue && row.teamTwo !== teamValue) {
      return false;
    }
    if (sessionValue && sessionValue !== "All" && row.session !== sessionValue) {
      return false;
    }
    if (groundValue && groundValue !== "All" && row.ground !== groundValue) {
      return false;
    }
    if (presetTeams && !presetTeams.has(row.teamOne) && !presetTeams.has(row.teamTwo)) {
      return false;
    }
    if (dateFrom || dateTo) {
      const rowDate = toDate(row.date);
      if (dateFrom && rowDate < dateFrom) return false;
      if (dateTo && rowDate > dateTo) return false;
    }
    if (searchValue) {
      const blob = `${row.division} ${row.teamOne} ${row.teamTwo} ${row.ground}`.toLowerCase();
      if (!blob.includes(searchValue)) return false;
    }
    return true;
  });

  const quickFiltered = applyQuickFilter(filtered, activeQuickFilter);
  const sorted = sortRows(quickFiltered, sortValue);
  lastFiltered = sorted;
  const limited = applyPageSize(sorted, pageSize);
  renderTable(limited);
  renderCards(limited);
  updateSummary(sorted, limited);
}

function renderResults(rows) {
  if (!fixturesList || !resultsList) return;
  const scorecards = loadScorecards();
  const sorted = [...rows].sort((a, b) => toDateTime(a) - toDateTime(b));
  const tournamentRows = sorted.filter((row) => tournamentKey(row.division) === activeResultsTournament);

  fixturesList.innerHTML = "";
  resultsList.innerHTML = "";

  const fixtures = tournamentRows.filter((row) => !scorecards[String(row.index)]);
  const results = tournamentRows.filter((row) => scorecards[String(row.index)]);

  renderResultList(fixturesList, fixtures, "Upcoming", scorecards, false);
  renderResultList(resultsList, results, "Completed", scorecards, true);

  fixturesList.classList.toggle("hidden", activeResultsView !== "fixtures");
  resultsList.classList.toggle("hidden", activeResultsView !== "results");
}

function renderResultList(container, rows, fallbackStatus, scorecards, showResult) {
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = "<div class='empty-state'>No matches found.</div>";
    return;
  }
  let currentDate = null;
  rows.forEach((row) => {
    if (row.date !== currentDate) {
      currentDate = row.date;
      const header = document.createElement("div");
      header.className = "results-date";
      header.textContent = formatDateLabel(row.date);
      container.appendChild(header);
    }
    const key = String(row.index);
    const scorecard = scorecards[key];
    const status = scorecard ? "Completed" : fallbackStatus;
    const timeLabel = row.time || "TBD";
    const tournamentLabel = shortTournamentLabel(row.division);
    const scoreLine = scorecard ? formatScoreLine(row, scorecard) : "";
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <div class="result-header">
        <span class="result-tag">${tournamentLabel}</span>
        <span class="badge ${divisionBadge(row.division)}">${row.division}</span>
        <span class="result-status ${status.toLowerCase()}">${status}</span>
      </div>
      <div class="result-matchup">
        <div class="result-team">
          <span class="team-logo">${teamInitials(row.teamOne)}</span>
          <span>${row.teamOne}</span>
        </div>
        <span class="vs">vs</span>
        <div class="result-team">
          <span class="team-logo">${teamInitials(row.teamTwo)}</span>
          <span>${row.teamTwo}</span>
        </div>
      </div>
      <div class="result-meta-line">${row.ground} • ${row.date} • ${timeLabel}</div>
      <div class="result-meta-line">${row.matchType}</div>
      ${
        showResult && scorecard
          ? `<div class="result-summary">${scorecard.result || "Result available"}</div>`
          : `<div class="result-note">Match starts at ${timeLabel}</div>`
      }
      ${scoreLine ? `<div class="result-score">${scoreLine}</div>` : ""}
      <div class="result-actions">
        ${
          scorecard
            ? `<a class="primary" href="${scorecard.url}" target="_blank" rel="noreferrer">Scorecard</a>`
            : `<a class="ghost" href="schedule.html">View Details</a>`
        }
        <button class="ghost download-card" data-match="${row.index}" type="button">Download Card</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderStandings(tournamentId) {
  if (!standingsBody || !standingsEmpty) return;
  standingsBody.innerHTML = "";
  const rows = computedStandings[tournamentId] || [];
  standingsEmpty.style.display = rows.length ? "none" : "block";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.team}</td>
      <td>${row.played}</td>
      <td>${row.won}</td>
      <td>${row.lost}</td>
      <td>${row.points}</td>
      <td>${row.nrr}</td>
    `;
    standingsBody.appendChild(tr);
  });
}

function calculateStandings(rows) {
  const scorecards = loadScorecards();
  const table = {
    D1_WHITE: {},
    D1_RED: {},
    D2_WHITE: {},
    D2_RED: {},
    T20: {},
  };

  rows.forEach((row) => {
    const key = String(row.index);
    const scorecard = scorecards[key];
    if (!scorecard) return;
    const tournament = tournamentKey(row.division);
    const standings = table[tournament] || table.D1_WHITE;

    const teamOne = row.teamOne;
    const teamTwo = row.teamTwo;

    const teamOneEntry = standings[teamOne] || createStandingEntry(teamOne);
    const teamTwoEntry = standings[teamTwo] || createStandingEntry(teamTwo);

    teamOneEntry.played += 1;
    teamTwoEntry.played += 1;

    const resultType = scorecard.resultType || "win";
    const winner = scorecard.winner || "";

    if (resultType === "tie") {
      teamOneEntry.points += 1;
      teamTwoEntry.points += 1;
      teamOneEntry.tied += 1;
      teamTwoEntry.tied += 1;
    } else if (resultType === "no_result" || resultType === "abandoned") {
      teamOneEntry.points += 1;
      teamTwoEntry.points += 1;
      teamOneEntry.noResult += 1;
      teamTwoEntry.noResult += 1;
    } else {
      if (winner === "teamOne") {
        teamOneEntry.won += 1;
        teamTwoEntry.lost += 1;
        teamOneEntry.points += 2;
      } else if (winner === "teamTwo") {
        teamTwoEntry.won += 1;
        teamOneEntry.lost += 1;
        teamTwoEntry.points += 2;
      }
    }

    const t1Runs = parseNumber(scorecard.t1Runs);
    const t2Runs = parseNumber(scorecard.t2Runs);
    const t1Balls = oversToBalls(scorecard.t1Overs);
    const t2Balls = oversToBalls(scorecard.t2Overs);

    if (t1Runs !== null && t2Runs !== null && t1Balls && t2Balls) {
      teamOneEntry.runsFor += t1Runs;
      teamOneEntry.runsAgainst += t2Runs;
      teamOneEntry.ballsFor += t1Balls;
      teamOneEntry.ballsAgainst += t2Balls;

      teamTwoEntry.runsFor += t2Runs;
      teamTwoEntry.runsAgainst += t1Runs;
      teamTwoEntry.ballsFor += t2Balls;
      teamTwoEntry.ballsAgainst += t1Balls;
    }

    standings[teamOne] = teamOneEntry;
    standings[teamTwo] = teamTwoEntry;
    table[tournament] = standings;
  });

  return Object.fromEntries(
    Object.entries(table).map(([key, teams]) => {
      const rows = Object.values(teams).map((entry) => ({
        ...entry,
        nrr: formatNrr(entry),
      }));
      rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.nrr !== a.nrr) return b.nrr - a.nrr;
        return a.team.localeCompare(b.team);
      });
      return [key, rows];
    })
  );
}

function createStandingEntry(team) {
  return {
    team,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    points: 0,
    runsFor: 0,
    runsAgainst: 0,
    ballsFor: 0,
    ballsAgainst: 0,
    nrr: 0,
  };
}

function oversToBalls(value) {
  if (!value) return 0;
  const text = String(value).trim();
  if (!text) return 0;
  const [oversPart, ballsPart] = text.split(".");
  const overs = parseInt(oversPart, 10);
  if (Number.isNaN(overs)) return 0;
  const balls = ballsPart ? Math.min(parseInt(ballsPart, 10) || 0, 5) : 0;
  return overs * 6 + balls;
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatNrr(entry) {
  if (!entry.ballsFor || !entry.ballsAgainst) return 0;
  const oversFor = entry.ballsFor / 6;
  const oversAgainst = entry.ballsAgainst / 6;
  if (!oversFor || !oversAgainst) return 0;
  const nrr = entry.runsFor / oversFor - entry.runsAgainst / oversAgainst;
  return Number(nrr.toFixed(2));
}

function formatScoreLine(row, scorecard) {
  if (!scorecard) return "";
  const t1Runs = scorecard.t1Runs;
  const t2Runs = scorecard.t2Runs;
  if (t1Runs === undefined || t2Runs === undefined || t1Runs === "" || t2Runs === "") {
    return "";
  }
  const t1Overs = scorecard.t1Overs ? `${scorecard.t1Overs} ov` : "";
  const t2Overs = scorecard.t2Overs ? `${scorecard.t2Overs} ov` : "";
  const teamOne = row.teamOne;
  const teamTwo = row.teamTwo;
  return `${teamOne} ${t1Runs}${t1Overs ? ` (${t1Overs})` : ""} · ${teamTwo} ${t2Runs}${t2Overs ? ` (${t2Overs})` : ""}`;
}

function renderHomeFixtures(rows) {
  if (!fixtureGrid) return;
  fixtureGrid.innerHTML = "";
  const sorted = [...rows].sort((a, b) => toDateTime(a) - toDateTime(b));
  const now = new Date();
  const upcomingOnly = sorted.filter((row) => toDateTime(row) >= now);
  const upcoming = (upcomingOnly.length ? upcomingOnly : sorted).slice(0, 6);
  upcoming.forEach((row) => {
    const status = fixtureStatus(row);
    const card = document.createElement("article");
    card.className = "fixture-card";
    card.innerHTML = `
      <div class="fixture-header">
        <span class="fixture-status ${status.toLowerCase()}">${status}</span>
        <span class="badge ${divisionBadge(row.division)}">${row.division}</span>
      </div>
      <div class="fixture-teams">
        <div class="team-logo">${row.teamOne.slice(0, 2).toUpperCase()}</div>
        <div>
          <strong>${row.teamOne}</strong>
          <div class="fixture-meta">vs ${row.teamTwo}</div>
        </div>
      </div>
      <div class="fixture-meta">${row.ground} • ${row.date} • ${row.time}</div>
      <div class="fixture-actions">
        <span class="fixture-meta">${row.matchType}</span>
        <a class="ghost" href="schedule.html">View Details</a>
      </div>
    `;
    fixtureGrid.appendChild(card);
  });
}

function rotateHighlights() {
  if (!highlightStrip) return;
  const items = highlightStrip.querySelectorAll(".highlight");
  if (!items.length) return;
  let idx = 0;
  setInterval(() => {
    items.forEach((item) => item.classList.remove("active"));
    items[idx % items.length].classList.add("active");
    idx += 1;
  }, 4000);
}

function startCountdown(target) {
  if (!countdown) return;
  if (!target) {
    countdown.textContent = "TBD";
    return;
  }
  const tick = () => {
    const now = new Date();
    const diff = target ? target - now : 0;
    if (diff <= 0) {
      countdown.textContent = "Live";
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    countdown.textContent = `${days}d ${hours}h ${mins}m`;
  };
  tick();
  setInterval(tick, 60000);
}

function updateHeroFromData(rows) {
  if (!heroMatchTitle || !heroMatchMeta) return null;
  const sorted = [...rows].sort((a, b) => toDateTime(a) - toDateTime(b));
  const nextMatch = sorted.find((row) => toDateTime(row) >= new Date()) || sorted[0];
  if (!nextMatch) return null;
  heroMatchTitle.textContent = `${nextMatch.teamOne} vs ${nextMatch.teamTwo}`;
  heroMatchMeta.textContent = `${nextMatch.ground} • ${formatDateLabel(nextMatch.date)} • ${nextMatch.time}`;
  return toDateTime(nextMatch);
}

function updateHighlights(rows) {
  if (!highlightStrip) return;
  const sorted = [...rows].sort((a, b) => toDateTime(a) - toDateTime(b));
  const now = new Date();
  const upcomingOnly = sorted.filter((row) => toDateTime(row) >= now);
  const items = (upcomingOnly.length ? upcomingOnly : sorted).slice(0, 3);
  highlightStrip.innerHTML = "";
  items.forEach((row, index) => {
    const div = document.createElement("div");
    div.className = `highlight${index === 0 ? " active" : ""}`;
    div.textContent = `${row.teamOne} vs ${row.teamTwo} • ${row.date} • ${row.time}`;
    highlightStrip.appendChild(div);
  });
}

function updateHomeStats(rows) {
  if (!statTeams || !statTournaments) return;
  const teams = new Set(rows.flatMap((r) => [r.teamOne, r.teamTwo]));
  const tournaments = new Set(rows.map((r) => r.division));
  statTeams.textContent = teams.size.toString();
  statTournaments.textContent = tournaments.size.toString();
  // Keep most successful and last champion as configured placeholders for now.
  if (statMostSuccessful && !statMostSuccessful.textContent) statMostSuccessful.textContent = "SBCC Slayers";
  if (statLastChampion && !statLastChampion.textContent) statLastChampion.textContent = "Deccan Mavericks";
}

function fixtureStatus(row) {
  const now = new Date();
  const matchTime = toDateTime(row);
  if (!matchTime || Number.isNaN(matchTime.getTime())) return "Upcoming";
  const diff = matchTime - now;
  if (Math.abs(diff) < 1000 * 60 * 90) return "Live";
  if (diff < 0) return "Completed";
  return "Upcoming";
}

function renderTable(rows) {
  if (!scheduleBody) return;
  scheduleBody.innerHTML = "";
  if (!rows.length) {
    scheduleBody.innerHTML =
      "<tr><td class='empty-state' colspan='9'>No matches found for these filters.</td></tr>";
    return;
  }
  let currentDate = null;
  rows.forEach((row) => {
    if (row.date !== currentDate) {
      currentDate = row.date;
      const groupRow = document.createElement("tr");
      groupRow.className = "group-row";
      groupRow.innerHTML = `<td colspan="9">${formatDateLabel(row.date)}</td>`;
      scheduleBody.appendChild(groupRow);
    }
    const badgeClass = divisionBadge(row.division);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.index}</td>
      <td><span class="badge ${badgeClass}">${row.division}</span></td>
      <td>${row.matchType}</td>
      <td>${row.date}</td>
      <td>${row.time}</td>
      <td>${row.teamOne}</td>
      <td>${row.teamTwo}</td>
      <td>${row.ground}</td>
      <td class="session-tag">${row.session}</td>
    `;
    scheduleBody.appendChild(tr);
  });
}

function renderCards(rows) {
  if (!scheduleCards) return;
  scheduleCards.innerHTML = "";
  if (!rows.length) {
    scheduleCards.innerHTML = "<div class='empty-state'>No matches found for these filters.</div>";
    return;
  }
  let currentDate = null;
  rows.forEach((row) => {
    if (row.date !== currentDate) {
      currentDate = row.date;
      const group = document.createElement("div");
      group.className = "card-date";
      group.textContent = formatDateLabel(row.date);
      scheduleCards.appendChild(group);
    }
    const card = document.createElement("article");
    card.className = "match-card";
    card.innerHTML = `
      <div class="match-card-header">
        <span class="badge ${divisionBadge(row.division)}">${row.division}</span>
        <span class="session-tag">${row.session}</span>
      </div>
      <h3>${row.teamOne} vs ${row.teamTwo}</h3>
      <p>${row.matchType}</p>
      <div class="match-meta">
        <span>${row.date} • ${row.time}</span>
        <span>${row.ground}</span>
      </div>
    `;
    scheduleCards.appendChild(card);
  });
}

function updateSummary(all, visible) {
  matchCount.textContent = all.length;
  const weekends = new Set(all.map((row) => row.date));
  weekendCount.textContent = weekends.size;
  const grounds = new Set(all.map((row) => row.ground));
  groundCount.textContent = grounds.size;
  showingCount.textContent = visible.length;
  if (busiestWeekend) {
    busiestWeekend.textContent = busiestWeekendLabel(all);
  }
}

function resetAll() {
  divisionFilter.value = "All";
  tournamentFilter.value = "All";
  teamFilter.value = "All";
  sessionFilter.value = "All";
  groundFilter.value = "All";
  pageSizeSelect.value = "all";
  searchInput.value = "";
  if (sortBySelect) sortBySelect.value = "date_asc";
  if (densityToggle) densityToggle.value = "comfortable";
  if (presetFilter) presetFilter.value = "all";
  if (dateFromInput) dateFromInput.value = "";
  if (dateToInput) dateToInput.value = "";
  activeQuickFilter = "all";
  if (quickFilterButtons.length) {
    quickFilterButtons.forEach((btn) => btn.classList.remove("active"));
    quickFilterButtons[0]?.classList.add("active");
  }
  applyFilters();
}

function initEventListeners() {
  [
    divisionFilter,
    tournamentFilter,
    teamFilter,
    sessionFilter,
    groundFilter,
    pageSizeSelect,
    sortBySelect,
    densityToggle,
    presetFilter,
    dateFromInput,
    dateToInput,
  ]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", applyFilters));
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (resetFilters) {
    resetFilters.addEventListener("click", resetAll);
  }
  if (downloadCsv) {
    downloadCsv.addEventListener("click", downloadFilteredCsv);
  }
  if (exportIcs) {
    exportIcs.addEventListener("click", exportIcsFile);
  }
  if (printSchedule) {
    printSchedule.addEventListener("click", () => window.print());
  }
  if (teamSearch) {
    teamSearch.addEventListener("input", applyTeamSearch);
  }
  if (densityToggle) {
    densityToggle.addEventListener("change", () => applyDensity(densityToggle.value));
  }
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("visible", window.scrollY > 320);
    });
  }
  if (quickFilterButtons.length) {
    quickFilterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        quickFilterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        activeQuickFilter = button.dataset.range || "all";
        applyFilters();
      });
    });
  }

  if (unlockAdmin) {
    unlockAdmin.addEventListener("click", () => {
      const code = window.prompt("Enter admin code");
      if (code === ADMIN_CODE) {
        sessionStorage.setItem("mwcc_admin", "true");
        updateAdminVisibility(true);
      }
    });
  }
  if (lockAdmin) {
    lockAdmin.addEventListener("click", () => {
      sessionStorage.removeItem("mwcc_admin");
      updateAdminVisibility(false);
    });
  }
  if (adminUpload) {
    adminUpload.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const rows = parseCsv(e.target.result);
        loadRows(rows);
      };
      reader.readAsText(file);
    });
  }

  if (scorecardForm) {
    scorecardForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const id = scoreMatchId?.value?.trim();
      const url = scoreUrl?.value?.trim();
      if (!id || !url) return;
      const result = scoreResult?.value?.trim() || "";
      const resultType = scoreResultType?.value || "win";
      const winner = scoreWinner?.value || "";
      const t1Runs = scoreTeamOneRuns?.value?.trim() || "";
      const t1Overs = scoreTeamOneOvers?.value?.trim() || "";
      const t2Runs = scoreTeamTwoRuns?.value?.trim() || "";
      const t2Overs = scoreTeamTwoOvers?.value?.trim() || "";
      const scorecards = loadScorecards();
      scorecards[id] = {
        url,
        result,
        resultType,
        winner,
        t1Runs,
        t1Overs,
        t2Runs,
        t2Overs,
      };
      saveScorecards(scorecards);
      renderResults(allRows);
      computedStandings = calculateStandings(allRows);
      renderStandings(activeResultsTournament);
      updateChangeLog();
      scoreMatchId.value = "";
      scoreUrl.value = "";
      scoreResult.value = "";
      if (scoreResultType) scoreResultType.value = "win";
      if (scoreWinner) scoreWinner.value = "";
      if (scoreTeamOneRuns) scoreTeamOneRuns.value = "";
      if (scoreTeamOneOvers) scoreTeamOneOvers.value = "";
      if (scoreTeamTwoRuns) scoreTeamTwoRuns.value = "";
      if (scoreTeamTwoOvers) scoreTeamTwoOvers.value = "";
    });
  }

  if (clearScorecards) {
    clearScorecards.addEventListener("click", () => {
      saveScorecards({});
      renderResults(allRows);
      computedStandings = calculateStandings(allRows);
      renderStandings(activeResultsTournament);
      updateChangeLog();
    });
  }

  if (standingsTabs) {
    standingsTabs.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        standingsTabs.querySelectorAll(".tab").forEach((btn) => btn.classList.remove("active"));
        tab.classList.add("active");
        renderStandings(tab.dataset.tournament);
      });
    });
  }

  if (resultsTabs) {
    resultsTabs.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        resultsTabs.querySelectorAll(".tab").forEach((btn) => btn.classList.remove("active"));
        tab.classList.add("active");
        activeResultsView = tab.dataset.view;
        renderResults(allRows);
      });
    });
  }

  if (rfTournamentTabs) {
    rfTournamentTabs.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        rfTournamentTabs.querySelectorAll(".tab").forEach((btn) => btn.classList.remove("active"));
        tab.classList.add("active");
        activeResultsTournament = tab.dataset.tournament;
        renderResults(allRows);
      });
    });
  }

  if (resultsFixtures) {
    resultsFixtures.addEventListener("click", (event) => {
      const target = event.target.closest(".download-card");
      if (!target) return;
      const matchId = target.dataset.match;
      const row = allRows.find((item) => String(item.index) === String(matchId));
      if (row) {
        downloadMatchCard(row);
      }
    });
  }

  if (exportReminders) {
    exportReminders.addEventListener("click", () => {
      downloadReminderCsv(allRows);
    });
  }
}

function loadRows(rows) {
  allRows = normalizeRows(rows);
  if (adminPanel) {
    updateAdminVisibility(sessionStorage.getItem("mwcc_admin") === "true");
  }
  lastLoadedTimestamp = new Date().toLocaleString("en-US");
  if (divisionFilter && scheduleBody) {
    renderFilters(allRows);
    if (densityToggle) {
      applyDensity(densityToggle.value);
    }
    applyFilters();
    renderResults(allRows);
    computedStandings = calculateStandings(allRows);
    renderStandings("D1_WHITE");
  } else {
    const teams = unique(allRows.flatMap((r) => [r.teamOne, r.teamTwo]));
    allTeams = teams;
    renderTeamList(teams);
    renderHomeFixtures(allRows);
    updateHomeStats(allRows);
    updateHighlights(allRows);
    const target = updateHeroFromData(allRows);
    rotateHighlights();
    startCountdown(target);
  }
  updateLastUpdated(rows);
  updateChangeLog();
}

function updateLastUpdated(rows) {
  if (!lastUpdated) return;
  const dates = rows.map((row) => toDate(row["Date"])).filter((value) => value.getTime() > 0);
  if (!dates.length) {
    lastUpdated.textContent = "Unavailable";
    return;
  }
  const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
  lastUpdated.textContent = latest.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function updateChangeLog() {
  if (!changeLog || !lastLoadedTimestamp) return;
  const scorecards = loadScorecards();
  const count = Object.keys(scorecards).length;
  changeLog.innerHTML = `
    <div class="change-item"><span>Schedule loaded</span><span>${lastLoadedTimestamp}</span></div>
    <div class="change-item"><span>Scorecards linked</span><span>${count}</span></div>
    <div class="change-item"><span>Download available</span><span>Filtered CSV</span></div>
  `;
}

function updateAdminVisibility(visible) {
  if (!adminPanel) return;
  adminPanel.classList.toggle("active", visible);
}

function loadScorecards() {
  try {
    return JSON.parse(localStorage.getItem(SCORECARD_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveScorecards(scorecards) {
  localStorage.setItem(SCORECARD_KEY, JSON.stringify(scorecards));
}

function renderTeamList(teams) {
  if (!teamList) return;
  teamList.innerHTML = "";
  const groups = groupTeams(teams);
  groups.forEach((group) => {
    const heading = document.createElement("h4");
    heading.className = "team-group-title";
    heading.textContent = group.label;
    teamList.appendChild(heading);

    const wrap = document.createElement("div");
    wrap.className = "team-group";
    group.teams.forEach((team) => {
      const tag = document.createElement("span");
      tag.className = "team-pill";
      tag.textContent = team;
      wrap.appendChild(tag);
    });
    teamList.appendChild(wrap);
  });
}

function groupTeams(teams) {
  const clubGroups = Object.keys(CLUB_MAP);
  if (clubGroups.length) {
    return clubGroups
      .map((club) => ({
        label: club,
        teams: (CLUB_MAP[club] || []).filter((team) => teams.includes(team)).sort(),
      }))
      .filter((group) => group.teams.length);
  }

  const buckets = {};
  teams.forEach((team) => {
    const letter = team[0]?.toUpperCase() || "#";
    if (!buckets[letter]) buckets[letter] = [];
    buckets[letter].push(team);
  });
  return Object.keys(buckets)
    .sort()
    .map((letter) => ({
      label: letter,
      teams: buckets[letter].sort(),
    }));
}

function applyTeamSearch() {
  if (!teamSearch) return;
  const query = teamSearch.value.toLowerCase().trim();
  if (!query) {
    renderTeamList(allTeams);
    return;
  }
  const filtered = allTeams.filter((team) => team.toLowerCase().includes(query));
  renderTeamList(filtered);
}

function applyPageSize(rows, pageSize) {
  if (pageSize === "all") return rows;
  const limit = parseInt(pageSize, 10);
  return rows.slice(0, limit);
}

function presetToTeams(presetValue) {
  if (!presetValue || presetValue === "all") return null;
  if (presetValue.startsWith("club:")) {
    const clubName = presetValue.replace("club:", "");
    const teams = CLUB_MAP[clubName] || [];
    return new Set(teams);
  }
  if (presetValue.startsWith("team:")) {
    return new Set([presetValue.replace("team:", "")]);
  }
  return null;
}

function applyQuickFilter(rows, rangeKey) {
  if (!rangeKey || rangeKey === "all") return rows;
  if (rangeKey === "playoffs") {
    return rows.filter((row) => row.matchType !== "League");
  }
  if (rangeKey.startsWith("month:")) {
    const target = rangeKey.replace("month:", "");
    return rows.filter((row) => {
      const dt = toDate(row.date);
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const year = dt.getFullYear();
      return `${year}-${month}` === target;
    });
  }
  const uniqueDates = Array.from(new Set(rows.map((row) => row.date))).sort(
    (a, b) => toDate(a) - toDate(b)
  );
  const desired = rangeKey === "next2" ? 4 : 8;
  const keep = new Set(uniqueDates.slice(0, desired));
  return rows.filter((row) => keep.has(row.date));
}

function sortRows(rows, sortValue) {
  const sorted = [...rows];
  if (sortValue === "date_desc") {
    sorted.sort((a, b) => toDate(b.date) - toDate(a.date));
    return sorted;
  }
  if (sortValue === "team_asc") {
    sorted.sort((a, b) => (a.teamOne + a.teamTwo).localeCompare(b.teamOne + b.teamTwo));
    return sorted;
  }
  if (sortValue === "ground_asc") {
    sorted.sort((a, b) => a.ground.localeCompare(b.ground));
    return sorted;
  }
  sorted.sort((a, b) => toDate(a.date) - toDate(b.date));
  return sorted;
}

function applyDensity(value) {
  document.body.dataset.density = value;
}

function divisionBadge(division) {
  const lower = (division || "").toLowerCase();
  if (lower.includes("yash") || (lower.includes("premier") && !lower.includes("redball"))) {
    return "badge-d1white";
  }
  if (lower.includes("redball premier") || (lower.includes("division 1") && lower.includes("red"))) {
    return "badge-d1red";
  }
  if (lower.includes("redball division ii") || (lower.includes("division 2") && lower.includes("red"))) {
    return "badge-d2";
  }
  if (lower.includes("elite white") || (lower.includes("division 2") && !lower.includes("red"))) {
    return "badge-d2";
  }
  if (lower.includes("t20") || lower.includes("blast")) return "badge-t20";
  return "";
}

function shortTournamentLabel(divisionName) {
  const key = tournamentKey(divisionName);
  switch (key) {
    case "D1_WHITE":
      return "Yash Premier";
    case "D1_RED":
      return "Div 1 Red";
    case "D2_WHITE":
      return "Div 2 White";
    case "D2_RED":
      return "Div 2 Red";
    case "T20":
      return "T20";
    default:
      return "League";
  }
}

function tournamentKey(divisionName) {
  const lower = (divisionName || "").toLowerCase();
  if (lower.includes("yash") || (lower.includes("premier") && !lower.includes("redball"))) {
    return "D1_WHITE";
  }
  if (lower.includes("redball premier") || (lower.includes("division 1") && lower.includes("red"))) {
    return "D1_RED";
  }
  if (lower.includes("redball division ii") || (lower.includes("division 2") && lower.includes("red"))) {
    return "D2_RED";
  }
  if (lower.includes("elite white") || (lower.includes("division 2") && !lower.includes("red"))) {
    return "D2_WHITE";
  }
  if (lower.includes("t20") || lower.includes("blast")) return "T20";
  return "D1_WHITE";
}

function teamInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function toDate(value) {
  const parts = (value || "").split("/");
  if (parts.length !== 3) return new Date(0);
  const [month, day, year] = parts.map((v) => parseInt(v, 10));
  return new Date(year, month - 1, day);
}

function toDateTime(row) {
  const base = toDate(row.date);
  if (Number.isNaN(base.getTime())) return new Date(0);
  if (!row.time) return base;
  const [time, meridiem] = row.time.split(" ");
  const [hh, mm] = (time || "00:00").split(":");
  let hour = parseInt(hh || "0", 10);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  base.setHours(hour, parseInt(mm || "0", 10), 0, 0);
  return base;
}

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateLabel(value) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function busiestWeekendLabel(rows) {
  if (!rows.length) return "-";
  const counts = rows.reduce((acc, row) => {
    acc[row.date] = (acc[row.date] || 0) + 1;
    return acc;
  }, {});
  const [bestDate, bestCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return `${formatDateLabel(bestDate)} (${bestCount})`;
}

function downloadFilteredCsv() {
  if (!lastFiltered.length) return;
  const header = ["#", "Division", "Match Type", "Date", "Time", "Team One", "Team Two", "Ground"];
  const lines = [header.join(",")];
  lastFiltered.forEach((row, idx) => {
    const fields = [
      idx + 1,
      row.division,
      row.matchType,
      row.date,
      row.time,
      row.teamOne,
      row.teamTwo,
      row.ground,
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
    lines.push(fields.join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "filtered_schedule.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadReminderCsv(rows) {
  if (!rows.length) return;
  const now = new Date();
  const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcoming = rows.filter((row) => {
    const dt = toDateTime(row);
    return dt >= now && dt <= in24;
  });
  const target = upcoming.length ? upcoming : rows.slice(0, 10);
  const header = [
    "Match ID",
    "Tournament",
    "Date",
    "Time",
    "Team One",
    "Team Two",
    "Ground",
    "Captain Email (Team One)",
    "Captain Email (Team Two)",
    "Captain Phone (Team One)",
    "Captain Phone (Team Two)",
  ];
  const lines = [header.join(",")];
  target.forEach((row) => {
    const captainOne = getCaptainContact(row.teamOne);
    const captainTwo = getCaptainContact(row.teamTwo);
    const fields = [
      row.index,
      row.division,
      row.date,
      row.time,
      row.teamOne,
      row.teamTwo,
      row.ground,
      captainOne.email || "",
      captainTwo.email || "",
      captainOne.phone || "",
      captainTwo.phone || "",
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
    lines.push(fields.join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mwcc_match_reminders.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadMatchCard(row) {
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 630;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#f7efe6";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#7a1f1d";
  ctx.fillRect(0, 0, width, 120);

  ctx.fillStyle = "#f7efe6";
  ctx.font = "700 36px 'Space Grotesk', sans-serif";
  ctx.fillText("Midwest Cricket Conference", 48, 72);

  ctx.fillStyle = "#2a1916";
  ctx.font = "700 48px 'Space Grotesk', sans-serif";
  ctx.fillText(`${row.teamOne} vs ${row.teamTwo}`, 48, 200);

  ctx.font = "500 24px 'Space Grotesk', sans-serif";
  ctx.fillText(`${row.division} • ${row.matchType}`, 48, 245);

  ctx.fillStyle = "#7a1f1d";
  ctx.font = "600 28px 'Space Grotesk', sans-serif";
  ctx.fillText(`Date: ${row.date}`, 48, 320);
  ctx.fillText(`Time: ${row.time || "TBD"}`, 48, 360);
  ctx.fillText(`Ground: ${row.ground}`, 48, 400);

  ctx.fillStyle = "#2a1916";
  ctx.font = "500 20px 'Space Grotesk', sans-serif";
  ctx.fillText("Generated by MWCC Schedule Engine", 48, 560);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mwcc_${row.index}_${row.teamOne}_vs_${row.teamTwo}.png`
      .replace(/\s+/g, "_")
      .toLowerCase();
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

function getCaptainContact(team) {
  return captainLookup[team] || {};
}

function exportIcsFile() {
  if (!lastFiltered.length) return;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MWCC//Schedule//EN",
  ];
  lastFiltered.forEach((row, idx) => {
    const dt = toDate(row.date);
    if (Number.isNaN(dt.getTime())) return;
    const [time, meridiem] = row.time.split(" ");
    const [hh, mm] = (time || "00:00").split(":");
    let hour = parseInt(hh || "0", 10);
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    dt.setHours(hour, parseInt(mm || "0", 10), 0, 0);
    const stamp = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${idx}@mwcc`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${stamp}`);
    lines.push(`SUMMARY:${row.teamOne} vs ${row.teamTwo}`);
    lines.push(`LOCATION:${row.ground}`);
    lines.push(`DESCRIPTION:${row.matchType} • ${row.division}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\\n")], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mwcc_schedule.ics";
  link.click();
  URL.revokeObjectURL(link.href);
}

fetch("data/schedule_2026.csv")
  .then((res) => res.text())
  .then((text) => loadRows(parseCsv(text)))
  .catch(() => {
    if (scheduleBody) {
      scheduleBody.innerHTML =
        "<tr><td colspan='9'>Schedule data is unavailable. Please check back later.</td></tr>";
    }
  });

fetch("data/captains.json")
  .then((res) => res.json())
  .then((data) => {
    captainLookup = data || {};
  })
  .catch(() => {
    captainLookup = {};
  });

initEventListeners();
