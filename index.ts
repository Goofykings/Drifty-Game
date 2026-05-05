declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const leaderboardSelectOptions = [
  "record_key,leaderboard_period,period_key,scope,level_index,time_ms,player_name,car_variant,car_color,deaths,updated_at",
  "record_key,leaderboard_period,period_key,scope,level_index,time_ms,car_variant,car_color,deaths,updated_at",
  "record_key,scope,level_index,time_ms,player_name,car_variant,car_color,deaths,updated_at",
  "record_key,scope,level_index,time_ms,car_variant,car_color,deaths,updated_at",
];

function env(name: string, fallback = "") {
  return Deno.env.get(name) || fallback;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: corsHeaders,
  });
}

async function sha256Hex(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function assertAdmin(passphrase: unknown) {
  const expectedPassphrase = env("DRIFTY_ADMIN_PASSPHRASE");
  const expectedHash = env("DRIFTY_ADMIN_PASSPHRASE_HASH").trim().toLowerCase();
  if (!expectedPassphrase && !expectedHash) {
    throw new Error("Missing DRIFTY_ADMIN_PASSPHRASE or DRIFTY_ADMIN_PASSPHRASE_HASH.");
  }
  if (expectedPassphrase && String(passphrase || "") === expectedPassphrase) {
    return;
  }
  const actualHash = await sha256Hex(String(passphrase || ""));
  if (actualHash !== expectedHash) {
    throw new Error("Wrong passphrase.");
  }
}

function getSupabaseConfig() {
  const supabaseUrl = env("SUPABASE_URL").replace(/\/+$/, "");
  const secretKey = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
  }
  return {
    supabaseUrl,
    secretKey,
    leaderboardTableName: env("DRIFTY_LEADERBOARD_TABLE", "drifty_leaderboard_records"),
    communityLevelsTableName: env("DRIFTY_COMMUNITY_LEVELS_TABLE", "drifty_community_levels"),
    communitySubmissionsTableName: env("DRIFTY_COMMUNITY_SUBMISSIONS_TABLE", "drifty_community_level_submissions"),
  };
}

async function restFetch(path: string, options: RequestInit = {}) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: config.secretKey,
      Authorization: `Bearer ${config.secretKey}`,
      ...(options.body ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(await response.text() || `Supabase request failed with ${response.status}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function getDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getNewYorkDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(values.weekday),
  };
}

function getCurrentLeaderboardPeriodKeys() {
  const now = new Date();
  const current = getNewYorkDateParts(now);
  const weekStartUtc = new Date(Date.UTC(current.year, current.month - 1, current.day - Math.max(0, current.weekday)));
  return {
    daily: getDateKey(now),
    weekly: getDateKey(weekStartUtc),
  };
}

async function deleteLeaderboardRows(path: string) {
  const rows = await restFetch(path, {
    method: "DELETE",
    headers: {
      Prefer: "return=representation",
    },
  });
  return Array.isArray(rows) ? rows.length : 0;
}

function safeString(value: unknown, maxLength = 200) {
  return String(value ?? "").slice(0, maxLength);
}

function cleanLeaderboardRecord(record: Record<string, unknown>) {
  return {
    record_key: safeString(record.record_key, 120),
    leaderboard_period: safeString(record.leaderboard_period, 32),
    period_key: safeString(record.period_key, 32),
    scope: safeString(record.scope, 64),
    level_index: Number.isInteger(record.level_index) ? record.level_index : null,
    time_ms: Number(record.time_ms),
    player_name: safeString(record.player_name, 10) || null,
    deaths: Number.isFinite(Number(record.deaths)) ? Math.max(0, Math.floor(Number(record.deaths))) : null,
    car_variant: safeString(record.car_variant, 32) || "coupe",
    car_color: safeString(record.car_color, 32) || "#909090",
    updated_at: safeString(record.updated_at, 64) || new Date().toISOString(),
  };
}

function cleanLeaderboardPatch(patch: Record<string, unknown>) {
  return {
    time_ms: Number(patch.time_ms),
    player_name: safeString(patch.player_name, 10) || null,
    deaths: Number.isFinite(Number(patch.deaths)) ? Math.max(0, Math.floor(Number(patch.deaths))) : null,
    car_variant: safeString(patch.car_variant, 32) || "coupe",
    car_color: safeString(patch.car_color, 32) || "#909090",
    updated_at: safeString(patch.updated_at, 64) || new Date().toISOString(),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return textResponse("ok");
  }
  if (request.method !== "POST") {
    return textResponse("Method not allowed.", 405);
  }

  try {
    const { action, passphrase, payload = {} } = await request.json();
    await assertAdmin(passphrase);

    if (action === "verifyAdmin") {
      return jsonResponse({ ok: true });
    }

    const config = getSupabaseConfig();
    const body = payload as Record<string, unknown>;

    if (action === "listPendingSubmissions") {
      const params = new URLSearchParams({
        select: "submission_id,level_name,creator_name,creator_time_ms,level_text,start_angle,status,review_note,submitted_at",
        status: "eq.pending",
        order: "submitted_at.asc",
      });
      return jsonResponse(await restFetch(`/rest/v1/${config.communitySubmissionsTableName}?${params.toString()}`) || []);
    }

    if (action === "listApprovedLevels") {
      const params = new URLSearchParams({
        select: "level_id,submission_id,level_name,creator_name,creator_time_ms,approved_at",
        order: "approved_at.desc",
      });
      return jsonResponse(await restFetch(`/rest/v1/${config.communityLevelsTableName}?${params.toString()}`) || []);
    }

    if (action === "listLeaderboardRows") {
      let lastError: Error | null = null;
      for (const select of leaderboardSelectOptions) {
        const params = new URLSearchParams({ select, order: "updated_at.desc" });
        try {
          return jsonResponse(await restFetch(`/rest/v1/${config.leaderboardTableName}?${params.toString()}`) || []);
        } catch (error) {
          lastError = error as Error;
        }
      }
      throw lastError || new Error("Leaderboard rows failed to load.");
    }

    if (action === "approveSubmission") {
      const submissionId = safeString(body.submissionId, 120);
      const note = safeString(body.note, 1000) || null;
      const submissionParams = new URLSearchParams({
        select: "submission_id,level_name,creator_name,creator_time_ms,level_text,start_angle",
        submission_id: `eq.${submissionId}`,
        limit: "1",
      });
      const submissions = await restFetch(`/rest/v1/${config.communitySubmissionsTableName}?${submissionParams.toString()}`) || [];
      const submission = submissions[0];
      if (!submission) {
        throw new Error("Submission not found.");
      }
      await restFetch(`/rest/v1/${config.communityLevelsTableName}`, {
        method: "POST",
        body: JSON.stringify({
          submission_id: submission.submission_id,
          level_name: submission.level_name,
          creator_name: submission.creator_name,
          creator_time_ms: submission.creator_time_ms,
          level_text: submission.level_text,
          start_angle: Number.isFinite(submission.start_angle) ? submission.start_angle : 0,
          leaderboard_json: [{ player_name: submission.creator_name, time_ms: submission.creator_time_ms }],
        }),
      });
      await restFetch(`/rest/v1/${config.communitySubmissionsTableName}?submission_id=eq.${encodeURIComponent(submissionId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved", review_note: note, reviewed_at: new Date().toISOString() }),
      });
      return jsonResponse({ ok: true });
    }

    if (action === "denySubmission") {
      const submissionId = safeString(body.submissionId, 120);
      await restFetch(`/rest/v1/${config.communitySubmissionsTableName}?submission_id=eq.${encodeURIComponent(submissionId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "denied",
          review_note: safeString(body.note, 1000) || null,
          reviewed_at: new Date().toISOString(),
        }),
      });
      return jsonResponse({ ok: true });
    }

    if (action === "deleteApprovedLevel") {
      const levelId = safeString(body.levelId, 120);
      await restFetch(`/rest/v1/${config.communityLevelsTableName}?level_id=eq.${encodeURIComponent(levelId)}`, { method: "DELETE" });
      return jsonResponse({ ok: true });
    }

    if (action === "createLeaderboardRecord") {
      await restFetch(`/rest/v1/${config.leaderboardTableName}`, {
        method: "POST",
        body: JSON.stringify(cleanLeaderboardRecord(body.record as Record<string, unknown>)),
      });
      return jsonResponse({ ok: true });
    }

    if (action === "updateLeaderboardRecord") {
      const recordKey = safeString(body.recordKey, 120);
      await restFetch(`/rest/v1/${config.leaderboardTableName}?record_key=eq.${encodeURIComponent(recordKey)}`, {
        method: "PATCH",
        body: JSON.stringify(cleanLeaderboardPatch(body.patch as Record<string, unknown>)),
      });
      return jsonResponse({ ok: true });
    }

    if (action === "deleteLeaderboardRecord") {
      const recordKey = safeString(body.recordKey, 120);
      await restFetch(`/rest/v1/${config.leaderboardTableName}?record_key=eq.${encodeURIComponent(recordKey)}`, { method: "DELETE" });
      return jsonResponse({ ok: true });
    }

    if (action === "resetAllLeaderboardRecords") {
      const periodKeys = getCurrentLeaderboardPeriodKeys();
      const allTimeDeleted = await deleteLeaderboardRows(
        `/rest/v1/${config.leaderboardTableName}?leaderboard_period=eq.all_time`,
      );
      const dailyDeleted = await deleteLeaderboardRows(
        `/rest/v1/${config.leaderboardTableName}?leaderboard_period=eq.daily&period_key=eq.${encodeURIComponent(periodKeys.daily)}`,
      );
      const weeklyDeleted = await deleteLeaderboardRows(
        `/rest/v1/${config.leaderboardTableName}?leaderboard_period=eq.weekly&period_key=eq.${encodeURIComponent(periodKeys.weekly)}`,
      );
      return jsonResponse({
        ok: true,
        deleted: allTimeDeleted + dailyDeleted + weeklyDeleted,
        deletedByPeriod: {
          all_time: allTimeDeleted,
          daily: dailyDeleted,
          weekly: weeklyDeleted,
        },
        periodKeys,
      });
    }

    return textResponse("Unknown admin action.", 400);
  } catch (error) {
    return textResponse(error instanceof Error ? error.message : "Admin request failed.", 400);
  }
});
