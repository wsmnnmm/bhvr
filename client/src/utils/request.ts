import { message } from "antd";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, init);
  const data = await res.json();
  if (data?.success) return data.data as T;
  message.error(data?.message || "请求失败");
  throw new Error(data?.message || "request error");
}

export function toDateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
