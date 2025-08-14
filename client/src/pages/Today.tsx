import { useEffect, useState } from "react";
import { Card, List, Checkbox, Space, message } from "antd";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

type Task = import("shared").Task;
type Habit = import("shared").Habit;

export default function Today() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch(`${SERVER_URL}/habits`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setHabits(res.data.items);
      });
    fetch(`${SERVER_URL}/tasks?scope=today&completed=false`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTasks(res.data.items);
      });
  }, []);

  async function toggleHabit(id: string) {
    const today = new Date();
    const key = `${today.getUTCFullYear()}-${String(
      today.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
    const res = await fetch(`${SERVER_URL}/habits/${id}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: key }),
    }).then((r) => r.json());
    if (res.success) {
      message.success(res.data.checked ? "已打卡" : "已撤销");
    }
  }

  async function toggleTask(t: Task) {
    const res = await fetch(`${SERVER_URL}/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !t.completed }),
    }).then((r) => r.json());
    if (res.success) {
      setTasks((prev) => prev.map((x) => (x.id === t.id ? res.data : x)));
    }
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="今日习惯">
        <List
          dataSource={habits}
          renderItem={(h) => (
            <List.Item
              actions={[
                <a key="toggle" onClick={() => toggleHabit(h.id)}>
                  打卡/撤销
                </a>,
              ]}
            >
              {" "}
              {h.name}{" "}
            </List.Item>
          )}
        />
      </Card>
      <Card title="今日任务">
        <List
          dataSource={tasks}
          renderItem={(t) => (
            <List.Item>
              <Checkbox checked={t.completed} onChange={() => toggleTask(t)}>
                {t.title}
              </Checkbox>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
