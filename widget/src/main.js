// ========================================================
// PIXEL MEMO WIDGET CLIENT CONTROLLER (RAINMETER DESKTOP STYLE)
// Communicates with MyMemo Next.js Vercel Production API & Tauri Controls
// ========================================================

const PROD_API_HOST = "https://memo-ash.vercel.app";
const PROD_API_URL = "https://memo-ash.vercel.app/api/widget/tasks";
const LOCAL_API_URL = "http://localhost:3000/api/widget/tasks";

// Primary API endpoint is Vercel Production
let activeApiUrl = PROD_API_URL;
let activeHost = PROD_API_HOST;

let tasks = [];          // Active tasks
let archivedTasks = [];  // Archived tasks
let activeTab = "TASK";  // 2 categories: "TASK" and "ARCHIVE"
let isDesktopPinned = false;
let isLocked = false;
let isSoundEnabled = true;

// DOM Elements
const questList = document.getElementById("questList");
const taskCountBadge = document.getElementById("taskCountBadge");
const archiveCountBadge = document.getElementById("archiveCountBadge");
const mascotAvatar = document.getElementById("mascotAvatar");
const syncStatus = document.getElementById("syncStatus");
const syncText = document.getElementById("syncText");
const addForm = document.getElementById("addForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const refreshBtn = document.getElementById("refreshBtn");
const lockBtn = document.getElementById("lockBtn");
const modeBtn = document.getElementById("modeBtn");
const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const dragHeader = document.getElementById("dragHeader");
const tabButtons = document.querySelectorAll(".tab-btn");

// Context Menu Elements
const contextMenu = document.getElementById("contextMenu");
const ctxToggleMode = document.getElementById("ctxToggleMode");
const ctxToggleLock = document.getElementById("ctxToggleLock");
const ctxToggleSound = document.getElementById("ctxToggleSound");
const ctxRefresh = document.getElementById("ctxRefresh");
const ctxClose = document.getElementById("ctxClose");

// ========================================================
// 8-BIT RETRO SOUND SYNTHESIZER (WEB AUDIO API)
// ========================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type) {
  if (!isSoundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "coin") {
      // 8-bit coin sound: B5 to E6
      osc.type = "square";
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "blip") {
      // Short blip
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "fanfare") {
      // High chime
      osc.type = "square";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.5, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.warn("Audio play error:", e);
  }
}

// ========================================================
// TAURI WINDOW COMMANDS
// ========================================================
async function invokeTauri(command, args = {}) {
  try {
    if (window.__TAURI__?.core?.invoke) {
      return await window.__TAURI__.core.invoke(command, args);
    }
    if (window.__TAURI_INTERNALS__?.invoke) {
      return await window.__TAURI_INTERNALS__.invoke(command, args);
    }
  } catch (err) {
    console.warn(`Tauri command '${command}' failed:`, err);
  }
}

// Mode UI Update Helper
function updateModeUI() {
  modeBtn.classList.toggle("active", isDesktopPinned);
  modeBtn.textContent = isDesktopPinned ? "🖥️" : "📌";
  modeBtn.title = isDesktopPinned
    ? "Mode: Tertempel di Desktop (Rainmeter)"
    : "Mode: Always on Top (Melayang di atas jendela)";
  ctxToggleMode.textContent = isDesktopPinned
    ? "🖥️ Mode: Nempel di Desktop"
    : "📌 Mode: Always on Top";
}

// Sync initial window mode from saved state
async function initWindowState() {
  try {
    const state = await invokeTauri("get_saved_window_state");
    if (state && typeof state.pinned === "boolean") {
      isDesktopPinned = state.pinned;
    } else {
      isDesktopPinned = false; // Default: Floating Always on Top
    }
  } catch (e) {
    isDesktopPinned = false;
  }
  updateModeUI();
  await invokeTauri("set_desktop_pinned", { pinned: isDesktopPinned });
}
initWindowState();

// Toggle Desktop Pin vs Always-on-Top
async function toggleDesktopMode() {
  isDesktopPinned = !isDesktopPinned;
  updateModeUI();
  playSound("blip");
  await invokeTauri("set_desktop_pinned", { pinned: isDesktopPinned });
}

modeBtn.addEventListener("click", toggleDesktopMode);
ctxToggleMode.addEventListener("click", () => {
  toggleDesktopMode();
  hideContextMenu();
});

// Window Dragging Handlers
function setupDragHandling() {
  const handleDrag = (e) => {
    // Abaikan jika mengklik kontrol interaktif (tombol, input, dropdown)
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("select")) {
      return;
    }
    // Hanya drag dengan klik kiri dan saat tidak di-lock
    if (e.button === 0 && !isLocked) {
      invokeTauri("start_drag");
    }
  };

  dragHeader.addEventListener("mousedown", handleDrag);

  const hudBar = document.querySelector(".hud-bar");
  if (hudBar) {
    hudBar.addEventListener("mousedown", handleDrag);
  }
}
setupDragHandling();

// Save window position on beforeunload
window.addEventListener("beforeunload", () => {
  invokeTauri("save_window_position");
});

// Close button in titlebar
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    playSound("blip");
    invokeTauri("close_widget");
  });
}

// Lock / Unlock Drag Region
function toggleLockPosition() {
  isLocked = !isLocked;
  lockBtn.textContent = isLocked ? "🔒" : "🔓";
  lockBtn.title = isLocked ? "Buka Kunci Posisi" : "Kunci Posisi Widget";
  ctxToggleLock.textContent = isLocked ? "🔒 Buka Kunci Posisi" : "🔓 Kunci Posisi (Lock)";
  dragHeader.classList.toggle("locked", isLocked);

  const hudBar = document.querySelector(".hud-bar");
  if (hudBar) {
    hudBar.classList.toggle("locked", isLocked);
  }

  // Set drag attributes
  if (isLocked) {
    dragHeader.removeAttribute("data-tauri-drag-region");
    dragHeader.querySelectorAll("[data-tauri-drag-region]").forEach((el) => {
      el.removeAttribute("data-tauri-drag-region");
    });
  } else {
    dragHeader.setAttribute("data-tauri-drag-region", "");
    dragHeader.querySelector(".header-left")?.setAttribute("data-tauri-drag-region", "");
  }

  playSound("blip");
}

lockBtn.addEventListener("click", toggleLockPosition);
ctxToggleLock.addEventListener("click", () => {
  toggleLockPosition();
  hideContextMenu();
});

// Context Menu Handlers
function showContextMenu(x, y) {
  contextMenu.style.display = "flex";
  if (x !== undefined && y !== undefined) {
    contextMenu.style.left = `${Math.min(x, 150)}px`;
    contextMenu.style.top = `${Math.min(y, 400)}px`;
    contextMenu.style.right = "auto";
  } else {
    contextMenu.style.right = "10px";
    contextMenu.style.top = "40px";
    contextMenu.style.left = "auto";
  }
}

function hideContextMenu() {
  contextMenu.style.display = "none";
}

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  playSound("blip");
  if (contextMenu.style.display === "none") {
    showContextMenu();
  } else {
    hideContextMenu();
  }
});

// Right click context menu anywhere on widget
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  playSound("blip");
  showContextMenu(e.clientX, e.clientY);
});

document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target) && e.target !== menuBtn) {
    hideContextMenu();
  }
});

// Sound Toggle
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  ctxToggleSound.textContent = isSoundEnabled ? "🔊 Suara 8-Bit (ON)" : "🔇 Suara 8-Bit (OFF)";
  if (isSoundEnabled) playSound("blip");
  hideContextMenu();
}
ctxToggleSound.addEventListener("click", toggleSound);

// Close Widget (from context menu)
ctxClose.addEventListener("click", () => {
  playSound("blip");
  invokeTauri("close_widget");
});

ctxRefresh.addEventListener("click", () => {
  playSound("blip");
  fetchTasks();
  hideContextMenu();
});

// ========================================================
// DATA FETCHING & SYNCHRONIZATION
// ========================================================
async function fetchTasks() {
  try {
    syncText.textContent = "SYNCING...";
    let res;
    try {
      res = await fetch(activeApiUrl, { cache: "no-store" });
      if (!res.ok && activeApiUrl === PROD_API_URL) {
        // Fallback ke local dev jika endpoint production Vercel belum tersedia
        console.warn(`Production API ${res.status}, mencoba fallback ke localhost...`);
        const localRes = await fetch(LOCAL_API_URL, { cache: "no-store" });
        if (localRes.ok) {
          res = localRes;
          syncText.textContent = "LOCAL (PROD SYNCING)";
        }
      }
    } catch (netErr) {
      console.warn("Network issue with prod, trying local:", netErr);
      res = await fetch(LOCAL_API_URL, { cache: "no-store" });
      syncText.textContent = "LOCAL";
    }

    if (!res || !res.ok) {
      throw new Error(`Server returned status ${res?.status || "offline"}`);
    }

    const data = await res.json();

    // Pisahkan active tasks dan archived tasks
    if (data.archivedTasks) {
      tasks = data.tasks || [];
      archivedTasks = data.archivedTasks || [];
    } else {
      const allTasks = data.tasks || [];
      tasks = allTasks.filter((t) => !t.isArchived);
      archivedTasks = allTasks.filter((t) => t.isArchived);
    }

    updateHud();
    renderTasks();

    syncStatus.querySelector(".status-dot").className = "status-dot green";
    if (res.url && res.url.includes("vercel.app")) {
      syncText.textContent = "VERCEL LIVE";
    } else if (syncText.textContent === "SYNCING...") {
      syncText.textContent = "ONLINE";
    }
  } catch (err) {
    console.warn("Failed to sync tasks:", err);
    syncStatus.querySelector(".status-dot").className = "status-dot red";
    syncText.textContent = "OFFLINE";
    showErrorState();
  }
}

// Update Text Jumlah Task & Archive
function updateHud() {
  const taskCount = tasks.length;
  const archiveCount = archivedTasks.length;

  if (taskCountBadge) taskCountBadge.textContent = `${taskCount} TASK`;
  if (archiveCountBadge) archiveCountBadge.textContent = `${archiveCount} ARCHIVE`;

  const hasUrgent = tasks.some(
    (t) => t.status !== "DONE" && (t.priority === "URGENT" || t.priority === "HIGH")
  );

  if (taskCount === 0 && archiveCount > 0) {
    mascotAvatar.textContent = "😺";
  } else if (hasUrgent) {
    mascotAvatar.textContent = "🙀";
  } else {
    mascotAvatar.textContent = "🐱";
  }
}

// Sort Berdasarkan Waktu Deadline Terdekat (Terdekat di Atas)
function sortByClosestDeadline(list) {
  return [...list].sort((a, b) => {
    const timeA = a.deadline ? new Date(a.deadline).getTime() : null;
    const timeB = b.deadline ? new Date(b.deadline).getTime() : null;

    // Keduanya punya deadline: deadline lebih awal (terdekat) di atas
    if (timeA !== null && timeB !== null) {
      return timeA - timeB;
    }
    // Jika hanya A punya deadline, A ditaruh di atas
    if (timeA !== null) return -1;
    // Jika hanya B punya deadline, B ditaruh di atas
    if (timeB !== null) return 1;

    // Jika keduanya tanpa deadline, urutkan berdasarkan order/id
    return (a.order || 0) - (b.order || 0);
  });
}

function formatDeadline(isoString) {
  if (!isoString) return null;
  const target = new Date(isoString);
  const now = new Date();

  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  const timeStr = target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) {
    return { text: `HARI INI ${timeStr}`, isUrgent: true };
  }

  const isPast = target < now;
  const dateStr = target.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

  return {
    text: `${dateStr} ${timeStr}`,
    isUrgent: isPast,
  };
}

// ========================================================
// RENDER QUEST / TASK LIST (2 CATEGORIES: TASK & ARCHIVE)
// ========================================================
function renderTasks() {
  questList.innerHTML = "";

  const isArchiveView = activeTab === "ARCHIVE";
  const currentList = isArchiveView ? archivedTasks : tasks;
  const sortedList = sortByClosestDeadline(currentList);

  if (sortedList.length === 0) {
    questList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">${isArchiveView ? "📦" : "⚔️"}</span>
        <p>${isArchiveView ? "BELUM ADA TASK DI-ARCHIVE" : "TIDAK ADA TASK AKTIF"}</p>
      </div>
    `;
    return;
  }

  sortedList.forEach((task) => {
    const isDone = task.status === "DONE";
    const card = document.createElement("div");
    card.className = `quest-card ${isDone ? "done" : ""} ${isArchiveView ? "archived" : ""}`;

    const deadlineInfo = formatDeadline(task.deadline);

    // Render Gambar jika ada (Requirement 3)
    let imageHtml = "";
    if (task.imageUrl && task.imageUrl.trim()) {
      let imgUrl = task.imageUrl.trim();
      if (imgUrl.startsWith("/")) {
        imgUrl = `${PROD_API_HOST}${imgUrl}`;
      }
      imageHtml = `
        <div class="quest-image-container">
          <img 
            src="${escapeHtml(imgUrl)}" 
            alt="Preview Gambar" 
            class="quest-image" 
            loading="lazy" 
            onerror="this.parentElement.style.display='none'"
          />
        </div>
      `;
    }

    card.innerHTML = `
      <div class="quest-header-row">
        <div class="pixel-checkbox" data-id="${task.id}" title="${
          isArchiveView
            ? "Task di-archive"
            : isDone
            ? "Tandai Belum Selesai"
            : "Tandai Selesai"
        }">
          ${isArchiveView ? "📦" : isDone ? "✔" : ""}
        </div>
        <div class="quest-content">
          <div class="quest-title">${escapeHtml(task.title)}</div>
          ${imageHtml}
          <div class="quest-badges">
            <span class="badge priority-${task.priority}">${task.priority}</span>
            ${
              deadlineInfo
                ? `<span class="badge deadline ${deadlineInfo.isUrgent ? "urgent" : ""}">⏰ ${deadlineInfo.text}</span>`
                : ""
            }
            ${
              isArchiveView
                ? `<button class="badge unarchive-btn" data-action="unarchive" title="Kembalikan ke Task">↩ RESTORE</button>`
                : `<button class="badge archive-btn" data-action="archive" title="Pindahkan ke Archive">📦 ARCHIVE</button>`
            }
          </div>
        </div>
      </div>
    `;

    // Toggle Checkbox event (khusus tab Task aktif)
    const chk = card.querySelector(".pixel-checkbox");
    if (!isArchiveView) {
      chk.addEventListener("click", () => toggleTaskStatus(task));
    }

    // Toggle Archive / Restore
    const actionBtn = card.querySelector("[data-action]");
    if (actionBtn) {
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleArchiveTask(task, !isArchiveView);
      });
    }

    questList.appendChild(card);
  });
}

function showErrorState() {
  questList.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">📡</span>
      <p>SERVER OFFLINE / MENUNGGU DEPLOY<br><span style="font-size: 8px; color: #fe5b59;">Hubungkan ke memo-ash.vercel.app</span></p>
      <button class="retro-btn text-btn" id="retryBtn">COBA LAGI</button>
    </div>
  `;
  document.getElementById("retryBtn")?.addEventListener("click", fetchTasks);
}

// ========================================================
// TASK ACTIONS (TOGGLE, ARCHIVE & ADD)
// ========================================================
async function toggleTaskStatus(task) {
  const newStatus = task.status === "DONE" ? "TODO" : "DONE";
  task.status = newStatus;

  if (newStatus === "DONE") {
    playSound("coin");
  } else {
    playSound("blip");
  }

  updateHud();
  renderTasks();

  try {
    await fetch(activeApiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    });

    const remaining = tasks.filter((t) => t.status !== "DONE").length;
    if (remaining === 0 && tasks.length > 0) {
      playSound("fanfare");
    }
  } catch (err) {
    console.error("Gagal update status:", err);
  }
}

async function toggleArchiveTask(task, shouldArchive) {
  playSound("blip");
  try {
    const res = await fetch(activeApiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        isArchived: shouldArchive,
      }),
    });
    if (res.ok) {
      await fetchTasks();
    }
  } catch (err) {
    console.error("Gagal update archive status:", err);
  }
}

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  const priority = prioritySelect.value;
  playSound("blip");
  taskInput.value = "";

  try {
    syncText.textContent = "MENYIMPAN...";
    const res = await fetch(activeApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priority,
        status: "TODO",
        isArchived: false,
      }),
    });

    if (res.ok) {
      await fetchTasks();
    }
  } catch (err) {
    console.error("Gagal menambah tugas:", err);
  }
});

// Tab Buttons Click (Hanya 2 kategori: TASK & ARCHIVE)
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.getAttribute("data-tab"); // "TASK" atau "ARCHIVE"
    playSound("blip");
    renderTasks();
  });
});

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    playSound("blip");
    fetchTasks();
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Initial Sync and Polling (Every 15 Seconds)
fetchTasks();
setInterval(fetchTasks, 15000);
