import { useState } from "react";
import { Form, Input, Button, Space } from "antd";
import beaver from "./assets/beaver.svg";
import type { ApiResponse } from "shared";
import "./App.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

function App() {
  const [data, setData] = useState<ApiResponse | undefined>();
  const [echo, setEcho] = useState<ApiResponse | undefined>();

  async function sendRequest() {
    try {
      const req = await fetch(`${SERVER_URL}/hello`);
      const res: ApiResponse = await req.json();
      setData(res);
    } catch (error) {
      console.log(error);
    }
  }

  async function submitEcho(values: { message: string }) {
    try {
      const req = await fetch(`${SERVER_URL}/echo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: values.message }),
      });
      const res: ApiResponse = await req.json();
      setEcho(res);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <div>
        <a href="https://github.com/stevedylandev/bhvr" target="_blank">
          <img src={beaver} className="logo" alt="beaver logo" />
        </a>
      </div>
      <h1>bhvr</h1>
      <h2>Bun + Hono + Vite + React</h2>
      <p>A typesafe fullstack monorepo</p>
      <div className="card">
        <div className="button-container">
          <button onClick={sendRequest}>Call API</button>
          <a className="docs-link" target="_blank" href="https://bhvr.dev">
            Docs
          </a>
        </div>
        {data && (
          <pre className="response">
            <code>
              Message: {data.message} <br />
              Success: {data.success.toString()} <br />
              Timestamp: {data.timestamp}
            </code>
          </pre>
        )}

        <Space direction="vertical" style={{ width: "100%", marginTop: 16 }}>
          <Form layout="inline" onFinish={submitEcho}>
            <Form.Item
              name="message"
              rules={[{ required: true, message: "Please input a message" }]}
            >
              <Input placeholder="Say something" allowClear />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Echo
              </Button>
            </Form.Item>
          </Form>

          {echo && (
            <pre className="response">
              <code>
                Echo Message: {echo.message} <br />
                Success: {echo.success.toString()} <br />
                Timestamp: {echo.timestamp}
              </code>
            </pre>
          )}
        </Space>
      </div>
    </>
  );
}

export default App;
