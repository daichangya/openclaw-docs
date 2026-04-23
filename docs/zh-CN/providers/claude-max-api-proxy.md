---
read_when:
    - 你想将 Claude Max 订阅与兼容 OpenAI 的工具一起使用
    - 你想要一个封装 Claude Code CLI 的本地 API 服务器
    - 你想评估基于订阅与基于 API key 的 Anthropic 访问方式
summary: 用于将 Claude 订阅凭证暴露为兼容 OpenAI 端点的社区代理
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-04-23T23:01:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** 是一个社区工具，可将你的 Claude Max/Pro 订阅暴露为兼容 OpenAI 的 API 端点。这样一来，你就可以在任何支持 OpenAI API 格式的工具中使用你的订阅。

<Warning>
这条路径仅用于技术兼容性。Anthropic 过去曾阻止在 Claude Code 之外使用某些订阅
方式。你必须自行决定是否使用它，并在依赖它之前核实 Anthropic 当前的条款。
</Warning>

## 为什么要使用它？

| 方式 | 成本 | 最适合 |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API | 按 token 付费（Opus 约为输入 $15/M，输出 $75/M） | 生产应用、高流量 |
| Claude Max 订阅 | 每月固定 $200 | 个人使用、开发、无限量使用 |

如果你有 Claude Max 订阅，并且希望将其与兼容 OpenAI 的工具一起使用，那么这个代理可能会降低某些工作流的成本。对于生产用途，API key 仍然是更清晰的策略路径。

## 工作原理

```text
你的应用 → claude-max-api-proxy → Claude Code CLI → Anthropic（通过订阅）
     （OpenAI 格式）              （转换格式）      （使用你的登录）
```

该代理会：

1. 在 `http://localhost:3456/v1/chat/completions` 接收 OpenAI 格式请求
2. 将其转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

## 快速开始

<Steps>
  <Step title="安装代理">
    需要 Node.js 20+ 和 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="启动服务器">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="测试代理">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="配置 OpenClaw">
    将 OpenClaw 指向该代理，作为一个自定义的兼容 OpenAI 端点：

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 内置目录

| 模型 ID | 映射到 |
| ----------------- | --------------- |
| `claude-opus-4` | Claude Opus 4 |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4` | Claude Haiku 4 |

## 高级配置

<AccordionGroup>
  <Accordion title="代理风格的兼容 OpenAI 说明">
    这条路径与其他自定义 `/v1` 后端一样，使用同一种代理风格的兼容 OpenAI 路由：

    - 不适用原生仅限 OpenAI 的请求塑形
    - 不支持 `service_tier`、不支持 Responses `store`、不支持提示缓存提示，也不支持
      OpenAI 推理兼容负载塑形
    - 不会在该代理 URL 上注入隐藏的 OpenClaw 归属 headers（`originator`、`version`、`User-Agent`）

  </Accordion>

  <Accordion title="在 macOS 上通过 LaunchAgent 自动启动">
    创建一个 LaunchAgent 以自动运行该代理：

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## 链接

- **npm：** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub：** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues：** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 说明

- 这是一个**社区工具**，并未获得 Anthropic 或 OpenClaw 的官方支持
- 需要已启用的 Claude Max/Pro 订阅，并且 Claude Code CLI 已完成认证
- 该代理在本地运行，不会将数据发送到任何第三方服务器
- 完整支持流式响应

<Note>
如需使用通过 Claude CLI 或 API key 的原生 Anthropic 集成，请参见 [Anthropic 提供商](/zh-CN/providers/anthropic)。如需使用 OpenAI/Codex 订阅，请参见 [OpenAI 提供商](/zh-CN/providers/openai)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Anthropic 提供商" href="/zh-CN/providers/anthropic" icon="bolt">
    通过 Claude CLI 或 API key 实现的原生 OpenClaw 集成。
  </Card>
  <Card title="OpenAI 提供商" href="/zh-CN/providers/openai" icon="robot">
    用于 OpenAI/Codex 订阅。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
