const PREFERENCES = [
  "NEAR_WINDOW",
  "NEAR_DOOR",
  "QUIET_AREA",
  "CHILD_FRIENDLY",
  "OUTDOOR_SEATING",
  "PRIVATE_ROOM",
];

let tables = [];

const tableGrid = document.getElementById("tableGrid");
const selectionInfoEl = document.getElementById("selectionInfo");
const statusMessageEl = document.getElementById("statusMessage");
const findTableBtn = document.getElementById("findTableBtn");
const bookTableBtn = document.getElementById("bookTableBtn");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const partySizeInput = document.getElementById("partySizeInput");
const yearSpan = document.getElementById("yearSpan");

let selectedTableId = null;
let recommendedTableId = null;
let tablesLoaded = false;

async function loadTablesFromApi(date, time) {
  try {
    showStatus("Laudade andmete laadimine…", null);
    let url = "http://localhost:8080/api/tables";
    if (date && time) {
      const ts = new Date(`${date}T${time}`);
      if (!Number.isNaN(ts.getTime())) {
        const iso = ts.toISOString();
        const encoded = encodeURIComponent(iso);
        url += `?t=${encoded}`;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Laudade API vastas koodiga ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Laudade API ei tagastanud massiivi.");
    }

    tables = data.map((t, index) => ({
      id: t.id ?? index + 1,
      name: t.name || `Laud ${t.id ?? index + 1}`,
      capacity: t.capacity ?? t.seats ?? 2,
      status:
        typeof t.Status === "string"
          ? t.Status.toUpperCase()
          : typeof t.status === "string"
          ? t.status.toUpperCase()
          : "AVAILABLE",
      tags: Array.isArray(t.tags)
        ? t.tags
        : Array.isArray(t.preferences)
        ? t.preferences
        : [],
    }));

    tablesLoaded = true;
    renderGrid();
    updateAvailabilityClasses();
    updateSelectionInfo();
    showStatus("", null);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    showStatus(
      "Laudade laadimine aadressilt http://localhost:8080/api/tables ebaõnnestus.",
      "error"
    );
    tables = [];
    tablesLoaded = false;
  }
}

function init() {
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);
  dateInput.value = isoDate;
  timeInput.value = "18:00";

  yearSpan.textContent = today.getFullYear().toString();

  attachEventListeners();
  loadTablesFromApi(dateInput.value, timeInput.value);
}

function getKeyFor(date, time) {
  return `${date}T${time}`;
}

function getOccupiedIdsFor(date, time) {
  // Praegu kasutatakse ainult API poolt tagastatud staatust;
  // kuupäev ja kellaaeg on vajalikud ainult kasutajaliidese jaoks.
  return tables.filter((t) => t.status === "RESERVED").map((t) => t.id);
}

function renderGrid() {
  tableGrid.innerHTML = "";
  tables.forEach((table) => {
    const el = document.createElement("button");
    el.className = "table";
    el.type = "button";
    el.dataset.tableId = String(table.id);
    el.innerHTML = `
      <div class="table__name">${table.name}</div>
      <div class="table__meta">
        <span>${table.capacity} kohta</span>
      </div>
      <div class="table__tags">
        ${table.tags
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join("")}
      </div>
    `;
    el.addEventListener("click", () => onTableClick(table.id));
    tableGrid.appendChild(el);
  });
}

function updateAvailabilityClasses() {
  const date = dateInput.value;
  const time = timeInput.value;
  const partySize = Number(partySizeInput.value || "0");
  const occupiedIds = new Set(getOccupiedIdsFor(date, time));

  document.querySelectorAll(".table").forEach((el) => {
    const id = Number(el.dataset.tableId);
    const table = tables.find((t) => t.id === id);

    el.classList.remove("table--occupied", "table--free", "table--recommended", "table--too-small");

    const isOccupied = occupiedIds.has(id);
    const isTooSmall = !!table && partySize > 0 && table.capacity < partySize;

    if (isOccupied) {
      el.classList.add("table--occupied");
    } else if (isTooSmall) {
      el.classList.add("table--too-small");
    } else {
      el.classList.add("table--free");
    }

    if (!isOccupied && !isTooSmall && id === recommendedTableId) {
      el.classList.add("table--recommended");
    }
  });
}

function onTableClick(tableId) {
  if (!tablesLoaded || tables.length === 0) {
    showStatus("Laudade andmed pole veel laetud. Proovi mõne hetke pärast uuesti.", "error");
    return;
  }

  const date = dateInput.value;
  const time = timeInput.value;
  if (!date || !time) {
    showStatus("Palun vali kuupäev ja kellaaeg.", "error");
    return;
  }

  const table = tables.find((t) => t.id === tableId);
  const partySize = Number(partySizeInput.value || "0");

  const occupiedIds = getOccupiedIdsFor(date, time);
  if (occupiedIds.includes(tableId)) {
    showStatus("See laud on valitud kuupäeval ja kellaajal juba hõivatud.", "error");
    return;
  }

  if (table && partySize > 0 && table.capacity < partySize) {
    showStatus(
      `Selles lauas on liiga vähe kohti (max ${table.capacity}, sinu seltskond: ${partySize}).`,
      "error"
    );
    return;
  }

  selectedTableId = tableId;
  recommendedTableId = tableId;
  updateAvailabilityClasses();
  updateSelectionInfo();
  showStatus("", null);
  bookTableBtn.disabled = false;
}

function getSelectedPreferences() {
  const checkboxes = document.querySelectorAll(".pref-checkbox");
  const selected = [];
  checkboxes.forEach((c) => {
    if (c.checked) {
      selected.push(c.value);
    }
  });
  return selected;
}

function scoreTable(table, partySize, selectedPrefs) {
  if (table.capacity < partySize) {
    return -1;
  }
  if (selectedPrefs.length === 0) {
    // eelistusi pole, skoor väiksemate laudade kasuks
    return 100 - table.capacity;
  }
  const matches = selectedPrefs.filter((p) => table.tags.includes(p)).length;
  if (matches === 0) {
    return -1;
  }
  const capacityPenalty = table.capacity - partySize;
  return matches * 100 - capacityPenalty * 5;
}

function findBestTable() {
  const date = dateInput.value;
  const time = timeInput.value;
  const partySize = Number(partySizeInput.value || "0");

  if (!tablesLoaded || tables.length === 0) {
    showStatus("Laudade andmed pole veel laetud. Proovi mõne hetke pärast uuesti.", "error");
    return;
  }

  if (!date || !time || !partySize || partySize <= 0) {
    showStatus("Palun vali kuupäev, kellaaeg ja korrektne seltskonna suurus.", "error");
    return;
  }

  const occupiedIds = new Set(getOccupiedIdsFor(date, time));
  const selectedPrefs = getSelectedPreferences();

  let best = null;
  let bestScore = -1;

  tables.forEach((table) => {
    if (occupiedIds.has(table.id)) return;
    const sc = scoreTable(table, partySize, selectedPrefs);
    if (sc > bestScore) {
      bestScore = sc;
      best = table;
    }
  });

  if (!best) {
    // proovime uuesti eelistusteta, kui eelistustega ei leitud
    if (selectedPrefs.length > 0) {
      let fallback = null;
      let fallbackScore = -1;
      tables.forEach((table) => {
        if (occupiedIds.has(table.id)) return;
        const sc = scoreTable(table, partySize, []);
        if (sc > fallbackScore) {
          fallbackScore = sc;
          fallback = table;
        }
      });
      if (fallback) {
        best = fallback;
      }
    }
  }

  if (!best) {
    showStatus(
      "Selleks kellajaks ei leitud vaba lauda valitud seltskonna suurusele.",
      "error"
    );
    selectedTableId = null;
    recommendedTableId = null;
    updateAvailabilityClasses();
    updateSelectionInfo();
    bookTableBtn.disabled = true;
    return;
  }

  selectedTableId = best.id;
  recommendedTableId = best.id;
  updateAvailabilityClasses();
  updateSelectionInfo();
  bookTableBtn.disabled = false;

  const prefText =
    selectedPrefs.length > 0
      ? ` võttes arvesse eelistusi: ${selectedPrefs.join(", ")}`
      : "";
  showStatus(`Soovitame ${best.name}${prefText}.`, "success");
}

async function bookSelectedTable() {
  const date = dateInput.value;
  const time = timeInput.value;
  if (!selectedTableId || !date || !time) {
    showStatus("Enne broneerimist vali laud ja sisesta kuupäev/kellaaeg.", "error");
    return;
  }

  const table = tables.find((t) => t.id === selectedTableId);
  if (!table) {
    showStatus("Valitud lauda ei leitud.", "error");
    return;
  }

  if (table.status === "RESERVED") {
    showStatus("See laud on juba märgitud kui broneeritud.", "error");
    updateAvailabilityClasses();
    return;
  }

  const ts = new Date(`${date}T${time}`);
  if (Number.isNaN(ts.getTime())) {
    showStatus("Kuupäev või kellaaeg ei ole kehtiv broneeringu jaoks.", "error");
    return;
  }

  const payload = {
    timestamp: ts.toISOString(),
    id: table.id,
  };

  try {
    showStatus("Broneeringu salvestamine…", null);
    const response = await fetch("http://localhost:8080/api/tables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      showStatus(
        `Broneeringu salvestamine ebaõnnestus (vastuse kood ${response.status}).`,
        "error"
      );
      return;
    }

    // Märgime laua lokaalselt broneerituks, kuni järgmise laadimiseni API-st.
    table.status = "RESERVED";
    updateAvailabilityClasses();

  showStatus(
    `Broneering kinnitatud: ${table ? table.name : "valitud laud"} kuupäevaks ${date} kell ${time}.`,
    "success"
  );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    showStatus("Broneeringu salvestamine ebaõnnestus. Kontrolli serveri tööd.", "error");
  }
}

function updateSelectionInfo() {
  if (!selectedTableId) {
    selectionInfoEl.innerHTML =
      "<p>Pole veel valitud. Kliki laual või kasuta nuppu „Leia parim laud“.</p>";
    return;
  }
  const table = tables.find((t) => t.id === selectedTableId);
  if (!table) return;

  const date = dateInput.value || "–";
  const time = timeInput.value || "–";
  const partySize = Number(partySizeInput.value || "0");

  selectionInfoEl.innerHTML = `
    <p><strong>${table.name}</strong> (${table.capacity} kohta)</p>
    <p>Kuupäev: <strong>${date}</strong><br/>
       Kellaaeg: <strong>${time}</strong><br/>
       Seltskonna suurus: <strong>${partySize || "–"}</strong></p>
    <p>Eelistused: ${
      table.tags.length
        ? table.tags.map((t) => `<span class="tag">${t}</span>`).join(" ")
        : "–"
    }</p>
  `;
}

function showStatus(message, type) {
  statusMessageEl.textContent = message || "";
  statusMessageEl.classList.remove("status-message--success", "status-message--error");
  if (type === "success") {
    statusMessageEl.classList.add("status-message--success");
  } else if (type === "error") {
    statusMessageEl.classList.add("status-message--error");
  }
}

function attachEventListeners() {
  findTableBtn.addEventListener("click", findBestTable);
  bookTableBtn.addEventListener("click", bookSelectedTable);

  dateInput.addEventListener("change", () => {
    selectedTableId = null;
    recommendedTableId = null;
    updateAvailabilityClasses();
    updateSelectionInfo();
    bookTableBtn.disabled = true;
    showStatus("", null);
    loadTablesFromApi(dateInput.value, timeInput.value);
  });

  timeInput.addEventListener("change", () => {
    selectedTableId = null;
    recommendedTableId = null;
    updateAvailabilityClasses();
    updateSelectionInfo();
    bookTableBtn.disabled = true;
    showStatus("", null);
    loadTablesFromApi(dateInput.value, timeInput.value);
  });

  partySizeInput.addEventListener("change", () => {
    // uuenda nii infopaneeli kui ka lauaplaani märgistusi
    updateSelectionInfo();
    updateAvailabilityClasses();
  });

  const prefCheckboxes = document.querySelectorAll(".pref-checkbox");
  prefCheckboxes.forEach((c) => {
    c.addEventListener("change", () => {
      // ainult soovituse otsimisel kasutatakse; siin reaalajas midagi ei muudeta
    });
  });
}

document.addEventListener("DOMContentLoaded", init);

