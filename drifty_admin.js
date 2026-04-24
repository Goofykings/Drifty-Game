(() => {
  "use strict";

  const CONFIG = typeof window !== "undefined" && window.DRIFTY_ADMIN_LOCAL_CONFIG && typeof window.DRIFTY_ADMIN_LOCAL_CONFIG === "object"
    ? window.DRIFTY_ADMIN_LOCAL_CONFIG
    : null;

  const DEFAULTS = {
    supabaseUrl: "",
    serviceRoleKey: "",
    passphraseHash: "",
    leaderboardTableName: "drifty_leaderboard_records",
    communityLevelsTableName: "drifty_community_levels",
    communitySubmissionsTableName: "drifty_community_level_submissions",
  };

  const state = {
    unlocked: false,
    submissions: [],
    approvedLevels: [],
    leaderboardRows: [],
    filterText: "",
  };

  const els = {
    lockScreen: document.getElementById("lockScreen"),
    lockStatus: document.getElementById("lockStatus"),
    passphraseInput: document.getElementById("passphraseInput"),
    unlockButton: document.getElementById("unlockButton"),
    app: document.getElementById("app"),
    appStatus: document.getElementById("appStatus"),
    refreshButton: document.getElementById("refreshButton"),
    lockButton: document.getElementById("lockButton"),
    submissionCount: document.getElementById("submissionCount"),
    submissionList: document.getElementById("submissionList"),
    approvedLevelsList: document.getElementById("approvedLevelsList"),
    leaderboardFilter: document.getElementById("leaderboardFilter"),
    leaderboardList: document.getElementById("leaderboardList"),
  };

  function getConfig() {
    return { ...DEFAULTS, ...(CONFIG || {}) };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setLockStatus(text, tone = "") {
    els.lockStatus.textContent = text;
    els.lockStatus.className = `status${tone ? ` ${tone}` : ""}`;
  }

  function setAppStatus(text, tone = "") {
    els.appStatus.textContent = text;
    els.appStatus.className = `status${tone ? ` ${tone}` : ""}`;
  }

  function getBaseUrl() {
    return getConfig().supabaseUrl.replace(/\/+$/, "");
  }

  function getHeaders(includeJson = false) {
    const config = getConfig();
    const headers = {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    };
    if (includeJson) {
      headers["Content-Type"] = "application/json";
      headers.Prefer = "return=representation";
    }
    return headers;
  }

  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  async function restFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Request failed with ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function formatTime(time) {
    if (!Number.isFinite(time)) {
      return "--:--.--";
    }
    const totalCentiseconds = Math.round(time * 100);
    const minutes = Math.floor(totalCentiseconds / 6000);
    const seconds = Math.floor((totalCentiseconds % 6000) / 100);
    const centiseconds = totalCentiseconds % 100;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  async function loadPendingSubmissions() {
    const config = getConfig();
    const params = new URLSearchParams({
      select: "submission_id,level_name,creator_name,creator_time_ms,level_text,start_angle,status,review_note,submitted_at",
      status: "eq.pending",
      order: "submitted_at.asc",
    });
    const url = `${getBaseUrl()}/rest/v1/${config.communitySubmissionsTableName}?${params.toString()}`;
    state.submissions = await restFetch(url, { headers: getHeaders(false) }) || [];
  }

  async function loadApprovedLevels() {
    const config = getConfig();
    const params = new URLSearchParams({
      select: "level_id,submission_id,level_name,creator_name,creator_time_ms,approved_at",
      order: "approved_at.desc",
    });
    const url = `${getBaseUrl()}/rest/v1/${config.communityLevelsTableName}?${params.toString()}`;
    state.approvedLevels = await restFetch(url, { headers: getHeaders(false) }) || [];
  }

  async function loadLeaderboardRows() {
    const config = getConfig();
    const params = new URLSearchParams({
      select: "record_key,scope,level_index,time_ms,player_name,car_variant,car_color,deaths,updated_at",
      order: "updated_at.desc",
    });
    const url = `${getBaseUrl()}/rest/v1/${config.leaderboardTableName}?${params.toString()}`;
    state.leaderboardRows = await restFetch(url, { headers: getHeaders(false) }) || [];
  }

  async function refreshAll() {
    setAppStatus("Refreshing admin data...");
    await Promise.all([
      loadPendingSubmissions(),
      loadApprovedLevels(),
      loadLeaderboardRows(),
    ]);
    render();
    setAppStatus("Admin data refreshed.", "ok");
  }

  async function unlock() {
    const config = getConfig();
    if (!config.supabaseUrl || !config.serviceRoleKey || !config.passphraseHash) {
      setLockStatus("Add your local config first. See drifty_admin_local.example.js.", "warn");
      return;
    }

    els.unlockButton.disabled = true;
    setLockStatus("Checking passphrase...");
    try {
      const entered = els.passphraseInput.value;
      const enteredHash = await sha256Hex(entered);
      if (enteredHash !== String(config.passphraseHash).trim().toLowerCase()) {
        throw new Error("Wrong passphrase.");
      }
      state.unlocked = true;
      els.lockScreen.classList.add("hidden");
      els.app.classList.remove("hidden");
      await refreshAll();
    } catch (error) {
      setLockStatus(error.message || "Unlock failed.", "error");
    } finally {
      els.unlockButton.disabled = false;
      els.passphraseInput.value = "";
    }
  }

  function lock() {
    state.unlocked = false;
    els.app.classList.add("hidden");
    els.lockScreen.classList.remove("hidden");
    setLockStatus("Locked.");
  }

  function renderSubmissions() {
    els.submissionCount.textContent = `${state.submissions.length} pending`;
    if (state.submissions.length === 0) {
      els.submissionList.innerHTML = `<div class="card"><p class="muted">No pending community level submissions.</p></div>`;
      return;
    }
    els.submissionList.innerHTML = state.submissions.map((submission) => `
      <div class="card" data-submission-id="${escapeHtml(submission.submission_id)}">
        <div class="card-head">
          <div>
            <h3>${escapeHtml(submission.level_name)}</h3>
            <p class="muted small">by ${escapeHtml(submission.creator_name)} | creator time ${formatTime(submission.creator_time_ms)}</p>
          </div>
          <span class="pill">${escapeHtml(submission.status)}</span>
        </div>
        <textarea class="review-note" placeholder="Optional review note"></textarea>
        <pre>${escapeHtml(submission.level_text)}</pre>
        <div class="actions">
          <button data-action="approve-submission" data-id="${escapeHtml(submission.submission_id)}">Approve</button>
          <button data-action="deny-submission" data-id="${escapeHtml(submission.submission_id)}" class="danger">Deny</button>
        </div>
      </div>
    `).join("");
  }

  function renderApprovedLevels() {
    if (state.approvedLevels.length === 0) {
      els.approvedLevelsList.innerHTML = `<div class="card"><p class="muted">No approved community levels yet.</p></div>`;
      return;
    }
    els.approvedLevelsList.innerHTML = state.approvedLevels.map((level) => `
      <div class="card" data-level-id="${escapeHtml(level.level_id)}">
        <div class="card-head">
          <div>
            <h3>${escapeHtml(level.level_name)}</h3>
            <p class="muted small">by ${escapeHtml(level.creator_name)} | creator time ${formatTime(level.creator_time_ms)}</p>
          </div>
        </div>
        <div class="actions">
          <button data-action="delete-level" data-id="${escapeHtml(level.level_id)}" class="danger">Remove Level</button>
        </div>
      </div>
    `).join("");
  }

  function renderLeaderboard() {
    const filtered = state.leaderboardRows.filter((row) => {
      const haystack = `${row.record_key} ${row.scope} ${row.player_name || ""}`.toLowerCase();
      return haystack.includes(state.filterText);
    });
    if (filtered.length === 0) {
      els.leaderboardList.innerHTML = `<div class="card"><p class="muted">No leaderboard rows match this filter.</p></div>`;
      return;
    }
    els.leaderboardList.innerHTML = filtered.map((row) => `
      <div class="leaderboard-row" data-record-key="${escapeHtml(row.record_key)}">
        <div>
          <div>${escapeHtml(row.record_key)}</div>
          <div class="muted small">${escapeHtml(row.scope)}${row.level_index == null ? "" : ` | level ${escapeHtml(row.level_index)}`}</div>
        </div>
        <input data-field="time_ms" type="number" min="0" step="0.001" value="${escapeHtml(row.time_ms)}" aria-label="Time">
        <input data-field="player_name" type="text" maxlength="10" value="${escapeHtml(row.player_name || "")}" aria-label="Player name">
        <input data-field="deaths" type="number" min="0" step="1" value="${escapeHtml(row.deaths ?? "")}" aria-label="Deaths">
        <input data-field="car_variant" type="text" value="${escapeHtml(row.car_variant || "")}" aria-label="Car variant">
        <input data-field="car_color" type="text" value="${escapeHtml(row.car_color || "")}" aria-label="Car color">
        <div class="actions" style="margin-top: 0;">
          <button data-action="save-record" data-id="${escapeHtml(row.record_key)}">Save</button>
          <button data-action="delete-record" data-id="${escapeHtml(row.record_key)}" class="danger">Delete</button>
        </div>
      </div>
    `).join("");
  }

  function render() {
    renderSubmissions();
    renderApprovedLevels();
    renderLeaderboard();
  }

  function getSubmissionNote(button) {
    const card = button.closest("[data-submission-id]");
    const note = card ? card.querySelector(".review-note") : null;
    return note ? note.value.trim() : "";
  }

  async function approveSubmission(submissionId, note) {
    const config = getConfig();
    const submission = state.submissions.find((entry) => entry.submission_id === submissionId);
    if (!submission) {
      throw new Error("Submission not found.");
    }

    const createUrl = `${getBaseUrl()}/rest/v1/${config.communityLevelsTableName}`;
    await restFetch(createUrl, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({
        submission_id: submission.submission_id,
        level_name: submission.level_name,
        creator_name: submission.creator_name,
        creator_time_ms: submission.creator_time_ms,
        level_text: submission.level_text,
        start_angle: Number.isFinite(submission.start_angle) ? submission.start_angle : 0,
        leaderboard_json: [
          {
            player_name: submission.creator_name,
            time_ms: submission.creator_time_ms,
          },
        ],
      }),
    });

    const patchUrl = `${getBaseUrl()}/rest/v1/${config.communitySubmissionsTableName}?submission_id=eq.${encodeURIComponent(submissionId)}`;
    await restFetch(patchUrl, {
      method: "PATCH",
      headers: getHeaders(true),
      body: JSON.stringify({
        status: "approved",
        review_note: note || null,
        reviewed_at: new Date().toISOString(),
      }),
    });
  }

  async function denySubmission(submissionId, note) {
    const config = getConfig();
    const patchUrl = `${getBaseUrl()}/rest/v1/${config.communitySubmissionsTableName}?submission_id=eq.${encodeURIComponent(submissionId)}`;
    await restFetch(patchUrl, {
      method: "PATCH",
      headers: getHeaders(true),
      body: JSON.stringify({
        status: "denied",
        review_note: note || null,
        reviewed_at: new Date().toISOString(),
      }),
    });
  }

  async function deleteApprovedLevel(levelId) {
    const config = getConfig();
    const url = `${getBaseUrl()}/rest/v1/${config.communityLevelsTableName}?level_id=eq.${encodeURIComponent(levelId)}`;
    await restFetch(url, {
      method: "DELETE",
      headers: getHeaders(false),
    });
  }

  async function saveLeaderboardRecord(recordKey, rowEl) {
    const config = getConfig();
    const payload = {};
    for (const input of rowEl.querySelectorAll("input[data-field]")) {
      const field = input.dataset.field;
      if (field === "time_ms") {
        payload[field] = Number(input.value);
      } else if (field === "deaths") {
        payload[field] = input.value === "" ? null : Math.max(0, Math.floor(Number(input.value)));
      } else {
        payload[field] = input.value.trim() || null;
      }
    }
    payload.updated_at = new Date().toISOString();
    const url = `${getBaseUrl()}/rest/v1/${config.leaderboardTableName}?record_key=eq.${encodeURIComponent(recordKey)}`;
    await restFetch(url, {
      method: "PATCH",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
  }

  async function deleteLeaderboardRecord(recordKey) {
    const config = getConfig();
    const url = `${getBaseUrl()}/rest/v1/${config.leaderboardTableName}?record_key=eq.${encodeURIComponent(recordKey)}`;
    await restFetch(url, {
      method: "DELETE",
      headers: getHeaders(false),
    });
  }

  async function handleAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;
    button.disabled = true;
    try {
      if (action === "approve-submission") {
        await approveSubmission(id, getSubmissionNote(button));
        setAppStatus("Submission approved.", "ok");
      } else if (action === "deny-submission") {
        await denySubmission(id, getSubmissionNote(button));
        setAppStatus("Submission denied.", "warn");
      } else if (action === "delete-level") {
        await deleteApprovedLevel(id);
        setAppStatus("Community level removed.", "warn");
      } else if (action === "save-record") {
        const rowEl = button.closest("[data-record-key]");
        await saveLeaderboardRecord(id, rowEl);
        setAppStatus("Leaderboard record updated.", "ok");
      } else if (action === "delete-record") {
        await deleteLeaderboardRecord(id);
        setAppStatus("Leaderboard record removed.", "warn");
      }
      await refreshAll();
    } catch (error) {
      setAppStatus(error.message || "Admin action failed.", "error");
    } finally {
      button.disabled = false;
    }
  }

  els.unlockButton.addEventListener("click", unlock);
  els.passphraseInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      unlock();
    }
  });
  els.lockButton.addEventListener("click", lock);
  els.refreshButton.addEventListener("click", refreshAll);
  els.leaderboardFilter.addEventListener("input", (event) => {
    state.filterText = String(event.target.value || "").trim().toLowerCase();
    renderLeaderboard();
  });
  document.addEventListener("click", handleAction);

  if (!CONFIG) {
    setLockStatus("No local admin config loaded yet. The page is waiting for drifty_admin_local.js.", "warn");
  }
})();
