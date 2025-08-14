import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
  ApiResponse,
  EchoRequest,
  ApiSuccess,
  ApiError,
  Habit,
  HabitCheckin,
  Task,
} from "shared/dist";
import type { ContentfulStatusCode } from "hono/utils/http-status";

const app = new Hono();

app.use(cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/hello", async (c) => {
  const data: ApiResponse = {
    message: "Hello BHVR!",
    success: true,
    timestamp: new Date().toISOString(),
  };

  return c.json(data, { status: 200 });
});

app.post("/echo", async (c) => {
  try {
    const body = await c.req.json<EchoRequest>();
    const message = typeof body?.message === "string" ? body.message : "";
    if (!message) {
      return c.json(
        {
          message: "message is required",
          success: true,
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse,
        { status: 400 }
      );
    }
    const data: ApiResponse = {
      message,
      success: true,
      timestamp: new Date().toISOString(),
    };
    return c.json(data, { status: 200 });
  } catch {
    const data: ApiResponse = {
      message: "invalid json",
      success: true,
      timestamp: new Date().toISOString(),
    };
    return c.json(data, { status: 400 });
  }
});

function ok<T>(data: T, status: ContentfulStatusCode = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  return { body, status } as const;
}

function err(
  code: string,
  message: string,
  status: ContentfulStatusCode = 400,
  details?: unknown
) {
  const body: ApiError = { success: false, code, message, details };
  return { body, status } as const;
}

function nowIso() {
  return new Date().toISOString();
}

function isValidDateString(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime());
}

function toDateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const habits = new Map<string, Habit>();
const habitCheckins = new Map<string, Set<string>>();
const tasks = new Map<string, Task>();

function calcStreak(habitId: string, refDateKey: string) {
  const keys = habitCheckins.get(habitId) || new Set<string>();
  let streak = 0;
  let cursor = new Date(refDateKey + "T00:00:00Z");
  while (keys.has(toDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

app.get("/habits", (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") || 20))
  );
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const items = Array.from(habits.values())
    .filter((h) => (q ? h.name.toLowerCase().includes(q) : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const start = (page - 1) * limit;
  const data = {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
  const r = ok(data);
  return c.json(r.body, r.status);
});

app.post("/habits", async (c) => {
  const body = await c.req
    .json<{ name: string; color?: string; schedule: { days: number[] } }>()
    .catch(() => undefined);
  if (!body) {
    const r = err("VALIDATION_ERROR", "invalid json");
    return c.json(r.body, r.status);
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const days = Array.isArray(body.schedule?.days) ? body.schedule.days : [];
  if (name.length < 2 || name.length > 30) {
    const r = err("VALIDATION_ERROR", "name length 2..30");
    return c.json(r.body, r.status);
  }
  if (!days.length || days.some((d) => d < 0 || d > 6)) {
    const r = err("VALIDATION_ERROR", "schedule.days invalid");
    return c.json(r.body, r.status);
  }
  const id = crypto.randomUUID();
  const now = nowIso();
  const habit: Habit = {
    id,
    name,
    color: body.color,
    schedule: { days },
    createdAt: now,
    updatedAt: now,
  };
  habits.set(id, habit);
  habitCheckins.set(id, new Set());
  const r = ok(habit, 201);
  return c.json(r.body, r.status);
});

app.patch("/habits/:id", async (c) => {
  const id = c.req.param("id");
  const exist = habits.get(id);
  if (!exist) {
    const r = err("NOT_FOUND", "habit not found", 404);
    return c.json(r.body, r.status);
  }
  const body = await c.req
    .json<
      Partial<{ name: string; color?: string; schedule: { days: number[] } }>
    >()
    .catch(() => undefined);
  if (!body) {
    const r = err("VALIDATION_ERROR", "invalid json");
    return c.json(r.body, r.status);
  }
  if (typeof body.name === "string") {
    const n = body.name.trim();
    if (n.length < 2 || n.length > 30) {
      const r = err("VALIDATION_ERROR", "name length 2..30");
      return c.json(r.body, r.status);
    }
    exist.name = n;
  }
  if (typeof body.color === "string") exist.color = body.color;
  if (body.schedule?.days) {
    const days = body.schedule.days;
    if (
      !Array.isArray(days) ||
      !days.length ||
      days.some((d) => d < 0 || d > 6)
    ) {
      const r = err("VALIDATION_ERROR", "schedule.days invalid");
      return c.json(r.body, r.status);
    }
    exist.schedule = { days };
  }
  exist.updatedAt = nowIso();
  const r = ok(exist);
  return c.json(r.body, r.status);
});

app.delete("/habits/:id", (c) => {
  const id = c.req.param("id");
  const existed = habits.delete(id);
  habitCheckins.delete(id);
  if (!existed) {
    const r = err("NOT_FOUND", "habit not found", 404);
    return c.json(r.body, r.status);
  }
  const r = ok(true);
  return c.json(r.body, r.status);
});

app.post("/habits/:id/checkin", async (c) => {
  const id = c.req.param("id");
  if (!habits.has(id)) {
    const r = err("NOT_FOUND", "habit not found", 404);
    return c.json(r.body, r.status);
  }
  const body = await c.req.json<{ date: string }>().catch(() => undefined);
  if (!body || typeof body.date !== "string" || !isValidDateString(body.date)) {
    const r = err("VALIDATION_ERROR", "date invalid yyyy-mm-dd");
    return c.json(r.body, r.status);
  }
  const set = habitCheckins.get(id) || new Set<string>();
  const has = set.has(body.date);
  if (has) set.delete(body.date);
  else set.add(body.date);
  habitCheckins.set(id, set);
  const streak = calcStreak(id, body.date);
  const r = ok({ streak, checked: !has });
  return c.json(r.body, r.status);
});

app.get("/habits/:id/calendar", (c) => {
  const id = c.req.param("id");
  if (!habits.has(id)) {
    const r = err("NOT_FOUND", "habit not found", 404);
    return c.json(r.body, r.status);
  }
  const url = new URL(c.req.url);
  const month = url.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const r = err("VALIDATION_ERROR", "month invalid yyyy-mm");
    return c.json(r.body, r.status);
  }
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const r = err("VALIDATION_ERROR", "month invalid yyyy-mm");
    return c.json(r.body, r.status);
  }
  const first = new Date(Date.UTC(y, m - 1, 1));
  const next = new Date(Date.UTC(y, m, 1));
  const set = habitCheckins.get(id) || new Set<string>();
  const dates: Record<string, boolean> = {};
  for (
    let d = new Date(first);
    d < next;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
  ) {
    dates[toDateKey(d)] = set.has(toDateKey(d));
  }
  const todayKey = toDateKey(new Date());
  const streak = calcStreak(id, todayKey);
  const r = ok({ dates, streak });
  return c.json(r.body, r.status);
});

app.get("/tasks", (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") || 20))
  );
  const scope = url.searchParams.get("scope") || "all";
  const completedParam = url.searchParams.get("completed");
  const completed =
    completedParam === null ? undefined : completedParam === "true";
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const todayKey = toDateKey(new Date());
  const startOfWeek = (() => {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = (day + 6) % 7;
    const s = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    );
    return new Date(s.getTime() - diff * 24 * 60 * 60 * 1000);
  })();
  const weekKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    weekKeys.add(
      toDateKey(new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000))
    );
  }
  const items = Array.from(tasks.values())
    .filter((t) => (q ? t.title.toLowerCase().includes(q) : true))
    .filter((t) => (completed === undefined ? true : t.completed === completed))
    .filter((t) => {
      if (scope === "today")
        return (
          (!t.completed && (!t.dueDate || t.dueDate === todayKey)) ||
          t.dueDate === todayKey
        );
      if (scope === "week")
        return t.dueDate ? weekKeys.has(t.dueDate) : !t.completed;
      return true;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const start = (page - 1) * limit;
  const data = {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
  const r = ok(data);
  return c.json(r.body, r.status);
});

app.post("/tasks", async (c) => {
  const body = await c.req
    .json<{ title: string; dueDate?: string }>()
    .catch(() => undefined);
  if (!body) {
    const r = err("VALIDATION_ERROR", "invalid json");
    return c.json(r.body, r.status);
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 2 || title.length > 100) {
    const r = err("VALIDATION_ERROR", "title length 2..100");
    return c.json(r.body, r.status);
  }
  if (body.dueDate && !isValidDateString(body.dueDate)) {
    const r = err("VALIDATION_ERROR", "dueDate invalid yyyy-mm-dd");
    return c.json(r.body, r.status);
  }
  const id = crypto.randomUUID();
  const now = nowIso();
  const task: Task = {
    id,
    title,
    dueDate: body.dueDate,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  tasks.set(id, task);
  const r = ok(task, 201);
  return c.json(r.body, r.status);
});

app.patch("/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const t = tasks.get(id);
  if (!t) {
    const r = err("NOT_FOUND", "task not found", 404);
    return c.json(r.body, r.status);
  }
  const body = await c.req
    .json<Partial<Pick<Task, "title" | "dueDate" | "completed">>>()
    .catch(() => undefined);
  if (!body) {
    const r = err("VALIDATION_ERROR", "invalid json");
    return c.json(r.body, r.status);
  }
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2 || title.length > 100) {
      const r = err("VALIDATION_ERROR", "title length 2..100");
      return c.json(r.body, r.status);
    }
    t.title = title;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate && !isValidDateString(body.dueDate)) {
      const r = err("VALIDATION_ERROR", "dueDate invalid yyyy-mm-dd");
      return c.json(r.body, r.status);
    }
    t.dueDate = body.dueDate;
  }
  if (typeof body.completed === "boolean") t.completed = body.completed;
  t.updatedAt = nowIso();
  const r = ok(t);
  return c.json(r.body, r.status);
});

app.delete("/tasks/:id", (c) => {
  const id = c.req.param("id");
  const existed = tasks.delete(id);
  if (!existed) {
    const r = err("NOT_FOUND", "task not found", 404);
    return c.json(r.body, r.status);
  }
  const r = ok(true);
  return c.json(r.body, r.status);
});

export default app;
