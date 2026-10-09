// ========================================================
// PIXEL MEMO WIDGET CLIENT CONTROLLER (RAINMETER DESKTOP STYLE)
// Communicates with MyMemo Next.js API & Tauri Window Controls
// ========================================================

const API_BASE = "http://localhost:3000/api/widget/tasks";
let tasks = [];
let activeTab = "ALL";
let isDesktopPinned = true; // Default: tertempel di desktop (Rainmeter)
let isLocked = false;
let isSoundEnabled = true;

// DOM Elements
const questList = document.getElementById("questList");
const playerName = document.getElementById("playerName");
const expFill = document.getElementById("expFill");
const expText = document.getElementById("expText");
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

// Set initial desktop mode
invokeTauri("set_desktop_pinned", { pinned: true });

// Toggle Desktop Pin vs Always-on-Top
async function toggleDesktopMode() {
  isDesktopPinned = !isDesktopPinned;
  modeBtn.classList.toggle("active", isDesktopPinned);
  modeBtn.textContent = isDesktopPinned ? "🖥️" : "📌";
  modeBtn.title = isDesktopPinned
    ? "Mode: Tertempel di Desktop (Rainmeter)"
    : "Mode: Always on Top (Melayang di atas jendela)";
  ctxToggleMode.textContent = isDesktopPinned
    ? "🖥️ Mode: Nempel di Desktop"
    : "📌 Mode: Always on Top";
  playSound("blip");
  await invokeTauri("set_desktop_pinned", { pinned: isDesktopPinned });
}

modeBtn.addEventListener("click", toggleDesktopMode);
ctxToggleMode.addEventListener("click", () => {
  toggleDesktopMode();
  hideContextMenu();
});

// Lock / Unlock Drag Region
function toggleLockPosition() {
  isLocked = !isLocked;
  lockBtn.textContent = isLocked ? "🔒" : "🔓";
  lockBtn.title = isLocked ? "Buka Kunci Posisi" : "Kunci Posisi Widget";
  ctxToggleLock.textContent = isLocked ? "🔒 Buka Kunci Posisi" : "🔓 Kunci Posisi (Lock)";
  dragHeader.classList.toggle("locked", isLocked);

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
    const res = await fetch(API_BASE, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    tasks = data.tasks || [];

    if (data.user?.username) {
      playerName.textContent = `PLAYER: ${data.user.username.toUpperCase()}`;
    }

    updateHud();
    renderTasks();

    syncStatus.querySelector(".status-dot").className = "status-dot green";
    syncText.textContent = "ONLINE";
  } catch (err) {
    console.warn("Failed to sync tasks:", err);
    syncStatus.querySelector(".status-dot").className = "status-dot red";
    syncText.textContent = "OFFLINE";
    showErrorState();
  }
}

function updateHud() {
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  expFill.style.width = `${percent}%`;
  expText.textContent = `${doneCount}/${total} XP (${percent}%)`;

  const hasUrgent = tasks.some(
    (t) => t.status !== "DONE" && (t.priority === "URGENT" || t.priority === "HIGH")
  );

  if (total > 0 && doneCount === total) {
    mascotAvatar.textContent = "😺";
  } else if (hasUrgent) {
    mascotAvatar.textContent = "🙀";
  } else {
    mascotAvatar.textContent = "🐱";
  }
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
// RENDER QUEST LIST
// ========================================================
function renderTasks() {
  questList.innerHTML = "";

  const filtered = tasks.filter((t) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "TODO") return t.status === "TODO" || t.status === "BACKLOG";
    if (activeTab === "IN_PROGRESS") return t.status === "IN_PROGRESS";
    if (activeTab === "DONE") return t.status === "DONE";
    return true;
  });

  if (filtered.length === 0) {
    questList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚔️</span>
        <p>TIDAK ADA QUEST AKTIF</p>
      </div>
    `;
    return;
  }

  filtered.forEach((task) => {
    const isDone = task.status === "DONE";
    const card = document.createElement("div");
    card.className = `quest-card ${isDone ? "done" : ""}`;

    const deadlineInfo = formatDeadline(task.deadline);

    card.innerHTML = `
      <div class="quest-header-row">
        <div class="pixel-checkbox" data-id="${task.id}" title="${isDone ? 'Tandai Belum Selesai' : 'Tandai Selesai'}">
          ${isDone ? "✔" : ""}
        </div>
        <div class="quest-content">
          <div class="quest-title">${escapeHtml(task.title)}</div>
          <div class="quest-badges">
            <span class="badge priority-${task.priority}">${task.priority}</span>
            <span class="badge category">#${escapeHtml(task.category || "Umum")}</span>
            ${
              deadlineInfo
                ? `<span class="badge deadline ${deadlineInfo.isUrgent ? "urgent" : ""}">⏰ ${deadlineInfo.text}</span>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    // Toggle Checkbox event
    const chk = card.querySelector(".pixel-checkbox");
    chk.addEventListener("click", () => toggleTaskStatus(task));

    questList.appendChild(card);
  });
}

function showErrorState() {
  questList.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">📡</span>
      <p>SERVER MY-MEMO OFFLINE<br><span style="font-size: 8px; color: #fe5b59;">Jalankan: npm run dev</span></p>
      <button class="retro-btn text-btn" id="retryBtn">COBA LAGI</button>
    </div>
  `;
  document.getElementById("retryBtn")?.addEventListener("click", fetchTasks);
}

// ========================================================
// TASK ACTIONS (TOGGLE & ADD)
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
    await fetch(API_BASE, {
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

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  const priority = prioritySelect.value;
  playSound("blip");
  taskInput.value = "";

  try {
    syncText.textContent = "MENYIMPAN...";
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priority,
        category: "Tugas Pribadi",
        status: "TODO",
      }),
    });

    if (res.ok) {
      await fetchTasks();
    }
  } catch (err) {
    console.error("Gagal menambah tugas:", err);
  }
});

// Tab Buttons Click
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.getAttribute("data-tab");
    playSound("blip");
    renderTasks();
  });
});

refreshBtn.addEventListener("click", () => {
  playSound("blip");
  fetchTasks();
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Initial Sync and Polling (Every 15 Seconds)
fetchTasks();
setInterval(fetchTasks, 15000);
