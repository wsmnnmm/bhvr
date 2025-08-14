import { useState } from "react";
import { Layout, Menu, Typography, Button, Space } from "antd";
import {
  CalendarOutlined,
  HomeOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import beaver from "./assets/beaver.svg";
import type { ApiResponse } from "shared";
import "./App.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

function App() {
  const location = useLocation();
  const [data, setData] = useState<ApiResponse | undefined>();

  async function sendRequest() {
    try {
      const req = await fetch(`${SERVER_URL}/hello`);
      const res: ApiResponse = await req.json();
      setData(res);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Sider breakpoint="md" collapsible>
        <div
          style={{
            height: 48,
            margin: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <img src={beaver} className="logo" alt="beaver logo" />
          <Typography.Text strong style={{ color: "#fff" }}>
            HabitFlow
          </Typography.Text>
        </div>
        <Menu
          selectedKeys={[location.pathname]}
          theme="dark"
          items={[
            {
              key: "/",
              icon: <HomeOutlined />,
              label: <Link to="/">Today</Link>,
            },
            {
              key: "/habits",
              icon: <CalendarOutlined />,
              label: <Link to="/habits">Habits</Link>,
            },
            {
              key: "/tasks",
              icon: <ScheduleOutlined />,
              label: <Link to="/tasks">Tasks</Link>,
            },
          ]}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ background: "#fff", paddingInline: 16 }}>
          <Space>
            <Button onClick={sendRequest}>Ping API</Button>
            <a className="docs-link" target="_blank" href="https://bhvr.dev">
              Docs
            </a>
          </Space>
        </Layout.Header>
        <Layout.Content style={{ padding: 16 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

export default App;
