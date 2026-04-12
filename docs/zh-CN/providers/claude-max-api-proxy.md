---
read_when:
    - 你想将 Claude Max 订阅与兼容 OpenAI 的工具一起使用
    - 你想要一个封装 Claude Code CLI 的本地 API 服务器
    - 你想评估基于订阅与基于 API 密钥的 Anthropic 访问方式
summary: 将 Claude 订阅凭证暴露为与 OpenAI 兼容端点的社区代理
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-04-12T10:19:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 534bc3d189e68529fb090258eb0d6db6d367eb7e027ad04b1f0be55f6aa7d889
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API 代理

**claude-max-api-proxy** 是一个社区工具，可将你的 Claude Max/Pro 订阅暴露为与 OpenAI 兼容的 API 端点。这让你能够在任何支持 OpenAI API 格式的工具中使用你的订阅。

<Warning>
这条路径仅提供技术兼容性。Anthropic 过去曾阻止在 Claude Code 之外使用某些订阅用法。你必须自行决定是否使用它，并在依赖它之前核实 Anthropic 当前的条款。
</Warning>

## 为什么使用这个？

| 方式 | 成本 | 最适合 |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API | 按 token 付费（Opus 约为输入 $15/M、输出 $75/M） | 生产应用、高使用量 |
| Claude Max subscription | 每月固定 $200 | 个人使用、开发、无限使用 |

如果你有 Claude Max 订阅，并希望将它与兼容 OpenAI 的工具一起使用，这个代理可能会在某些工作流中降低成本。对于生产用途，API 密钥仍然是政策上更明确的路径。

## 工作原理

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

该代理会：

1. 在 `http://localhost:3456/v1/chat/completions` 接收 OpenAI 格式的请求
2. 将它们转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

## 入门指南

<Steps>
  <Step title="安装代理">
    需要 Node.js 20+ 和 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # 验证 Claude CLI 已完成身份验证
    claude --version
    ```

  </Step>
  <Step title="启动服务器">
    ```bash
    claude-max-api
    # 服务器运行在 http://localhost:3456
    ```
  </Step>
  <Step title="测试代理">
    ```bash
    # 健康检查
    curl http://localhost:3456/health

    # 列出模型
    curl http://localhost:3456/v1/models

    # 聊天补全
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="配置 OpenClaw">
    将 OpenClaw 指向该代理，作为一个自定义的与 OpenAI 兼容的端点：

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

## 可用模型

| 模型 ID | 映射到 |
| ----------------- | --------------- |
| `claude-opus-4` | Claude Opus 4 |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4` | Claude Haiku 4 |

## 高级

<AccordionGroup>
  <Accordion title="代理式 OpenAI 兼容说明">
    这条路径使用与其他自定义 `/v1` 后端相同的代理式 OpenAI 兼容路由：

    - 不适用 OpenAI 原生专用的请求整形
    - 不支持 `service_tier`、不支持 Responses `store`、不支持提示缓存提示，也不支持 OpenAI 推理兼容负载整形
    - 不会在代理 URL 上注入隐藏的 OpenClaw 归属头（`originator`、`version`、`User-Agent`）

  </Accordion>

  <Accordion title="在 macOS 上使用 LaunchAgent 自动启动">
    创建一个 LaunchAgent 来自动运行该代理：

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

- 这是一个**社区工具**，并非 Anthropic 或 OpenClaw 官方支持
- 需要已激活的 Claude Max/Pro 订阅，并且 Claude Code CLI 已完成身份验证
- 该代理在本地运行，不会将数据发送到任何第三方服务器
- 完全支持流式响应

<Note>
如需通过 Claude CLI 或 API 密钥进行原生 Anthropic 集成，请参阅 [Anthropic provider](/zh-CN/providers/anthropic)。如需 OpenAI/Codex 订阅，请参阅 [OpenAI provider](/zh-CN/providers/openai)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/zh-CN/providers/anthropic" icon="bolt">
    通过 Claude CLI 或 API 密钥实现的原生 OpenClaw 集成。
  </Card>
  <Card title="OpenAI provider" href="/zh-CN/providers/openai" icon="robot">
    适用于 OpenAI/Codex 订阅。
  </Card>
  <Card title="Model providers" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障切换行为的概览。
  </Card>
  <Card title="Configuration" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
