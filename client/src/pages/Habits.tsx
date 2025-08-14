import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Space,
  Select,
  message,
} from "antd";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

type Habit = import("shared").Habit;

const daysOptions = [
  { label: "日", value: 0 },
  { label: "一", value: 1 },
  { label: "二", value: 2 },
  { label: "三", value: 3 },
  { label: "四", value: 4 },
  { label: "五", value: 5 },
  { label: "六", value: 6 },
];

export default function Habits() {
  const [list, setList] = useState<Habit[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [form] = Form.useForm();

  async function load() {
    const res = await fetch(`${SERVER_URL}/habits`).then((r) => r.json());
    if (res.success) setList(res.data.items);
  }
  useEffect(() => {
    load();
  }, []);

  function showCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }
  function showEdit(h: Habit) {
    setEditing(h);
    form.setFieldsValue({
      name: h.name,
      color: h.color,
      days: h.schedule.days,
    });
    setOpen(true);
  }

  async function onSubmit() {
    const values = await form.validateFields();
    const body = {
      name: values.name,
      color: values.color,
      schedule: { days: values.days },
    };
    const url = editing
      ? `${SERVER_URL}/habits/${editing.id}`
      : `${SERVER_URL}/habits`;
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

  async function remove(id: string) {
    const res = await fetch(`${SERVER_URL}/habits/${id}`, {
      method: "DELETE",
    }).then((r) => r.json());
    if (res.success) {
      message.success("已删除");
      load();
    }
  }

  const columns = useMemo(
    () => [
      { title: "名称", dataIndex: "name" },
      {
        title: "频率",
        render: (_: any, h: Habit) =>
          h.schedule.days.map((d) => (
            <Tag key={d}>{daysOptions.find((x) => x.value === d)?.label}</Tag>
          )),
      },
      {
        title: "操作",
        render: (_: any, h: Habit) => (
          <Space>
            <a onClick={() => showEdit(h)}>编辑</a>
            <a onClick={() => remove(h.id)}>删除</a>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Card title="习惯">
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={showCreate}>
          新建习惯
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns as any}
        dataSource={list}
        pagination={false}
      />
      <Modal
        title={editing ? "编辑习惯" : "新建习惯"}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, min: 2, max: 30 }]}
          >
            <Input placeholder="例如：早起" />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Input placeholder="#1677ff" />
          </Form.Item>
          <Form.Item name="days" label="每周频率" rules={[{ required: true }]}>
            <Select mode="multiple" options={daysOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
