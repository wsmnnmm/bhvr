import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from "antd";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
type Task = import("shared").Task;

export default function Tasks() {
  const [list, setList] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [scope, setScope] = useState<"all" | "today" | "week">("all");
  const [completed, setCompleted] = useState<"all" | "true" | "false">("all");
  const [q, setQ] = useState("");
  const [form] = Form.useForm();

  async function load() {
    const params = new URLSearchParams();
    params.set("scope", scope);
    if (completed !== "all") params.set("completed", completed);
    if (q) params.set("q", q);
    const res = await fetch(`${SERVER_URL}/tasks?` + params.toString()).then(
      (r) => r.json()
    );
    if (res.success) setList(res.data.items);
  }
  useEffect(() => {
    load();
  }, [scope, completed, q]);

  function showCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }
  function showEdit(t: Task) {
    setEditing(t);
    form.setFieldsValue({ title: t.title, dueDate: t.dueDate });
    setOpen(true);
  }

  async function onSubmit() {
    const values = await form.validateFields();
    const body = { title: values.title, dueDate: values.dueDate || undefined };
    const url = editing
      ? `${SERVER_URL}/tasks/${editing.id}`
      : `${SERVER_URL}/tasks`;
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    if (res.success) {
      message.success("保存成功");
      setOpen(false);
      load();
    } else {
      message.error(res.message);
    }
  }

  async function toggleComplete(t: Task) {
    const res = await fetch(`${SERVER_URL}/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !t.completed }),
    }).then((r) => r.json());
    if (res.success) {
      setList((prev) => prev.map((x) => (x.id === t.id ? res.data : x)));
    }
  }

  async function remove(id: string) {
    const res = await fetch(`${SERVER_URL}/tasks/${id}`, {
      method: "DELETE",
    }).then((r) => r.json());
    if (res.success) {
      message.success("已删除");
      load();
    }
  }

  const columns = useMemo(
    () => [
      { title: "标题", dataIndex: "title" },
      { title: "截止日", dataIndex: "dueDate" },
      {
        title: "完成",
        render: (_: any, t: Task) => (
          <Checkbox checked={t.completed} onChange={() => toggleComplete(t)} />
        ),
      },
      {
        title: "操作",
        render: (_: any, t: Task) => (
          <Space>
            <a onClick={() => showEdit(t)}>编辑</a>
            <a onClick={() => remove(t.id)}>删除</a>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Card title="任务">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={scope}
          onChange={setScope}
          options={[
            { value: "all", label: "全部" },
            { value: "today", label: "今日" },
            { value: "week", label: "本周" },
          ]}
        />
        <Select
          value={completed}
          onChange={setCompleted}
          options={[
            { value: "all", label: "全部" },
            { value: "false", label: "未完成" },
            { value: "true", label: "已完成" },
          ]}
        />
        <Input
          placeholder="关键词"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={showCreate}>
          新建任务
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns as any}
        dataSource={list}
        pagination={false}
      />
      <Modal
        title={editing ? "编辑任务" : "新建任务"}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, min: 2, max: 100 }]}
          >
            <Input placeholder="例如：买菜" />
          </Form.Item>
          <Form.Item name="dueDate" label="截止日">
            <Input placeholder="yyyy-mm-dd" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
