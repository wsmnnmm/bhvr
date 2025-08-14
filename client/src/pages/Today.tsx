import { useEffect, useMemo, useState } from "react";
import { Card, List, Checkbox, Space, message, Empty, Skeleton } from "antd";
import { api, toDateKey } from "../utils/request";

type Task = import("shared").Task;
type Habit = import("shared").Habit;

export default function Today() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [hs, ts] = await Promise.all([
          api<{ items: Habit[] }>("/habits?page=1&limit=100"),
          api<{ items: Task[] }>(
            "/tasks?scope=today&completed=false&page=1&limit=100"
          ),
        ]);
        setHabits(hs.items);
        setTasks(ts.items);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggleHabit(id: string) {
    const key = toDateKey(new Date());
    const res = await api<{ streak: number; checked: boolean }>(
      `/habits/${id}/checkin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: key }),
      }
    );
    message.success(res.checked ? "已打卡" : "已撤销");
  }

  async function toggleTask(t: Task) {
    const res = await api<Task>(`/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !t.completed }),
    });
    setTasks((prev) => prev.map((x) => (x.id === t.id ? res : x)));
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="今日习惯">
        {loading ? (
          <Skeleton active />
        ) : (
          <List
            locale={{
              emptyText: <Empty description="今天没有需要打卡的习惯" />,
            }}
            dataSource={habits}
            renderItem={(h) => (
              <List.Item
                actions={[
                  <a key="toggle" onClick={() => toggleHabit(h.id)}>
                    打卡/撤销
                  </a>,
                ]}
              >
                {h.name}
              </List.Item>
            )}
          />
        )}
      </Card>
      <Card title="今日任务">
        {loading ? (
          <Skeleton active />
        ) : (
          <List
            locale={{ emptyText: <Empty description="暂无任务" /> }}
            dataSource={tasks}
            renderItem={(t) => (
              <List.Item>
                <Checkbox checked={t.completed} onChange={() => toggleTask(t)}>
                  {t.title}
                </Checkbox>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );
}
