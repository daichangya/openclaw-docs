---
read_when:
    - 你想要最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装 / patch / 生命周期脚本问题
summary: Bun 工作流（实验性）：与 pnpm 相比的安装方式和注意事项
title: Bun（实验性）
x-i18n:
    generated_at: "2026-04-24T03:16:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
不建议将 Bun **用于 Gateway 网关运行时**（已知会与 WhatsApp 和 Telegram 出现问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，可用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认的包管理器仍然是 `pnpm`，它是完全受支持的，并被文档工具链使用。Bun 不能使用 `pnpm-lock.yaml`，并且会忽略它。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被加入 gitignore，因此不会造成仓库变更。如果你想完全跳过 lockfile 写入：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="构建和测试">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 生命周期脚本

除非被显式信任，否则 Bun 会阻止依赖的生命周期脚本。对于这个仓库，常见被阻止的脚本并非必需：

- `@whiskeysockets/baileys` 的 `preinstall` —— 检查 Node 主版本是否 >= 20（OpenClaw 默认使用 Node 24，也仍支持 Node 22 LTS，目前为 `22.14+`）
- `protobufjs` 的 `postinstall` —— 输出关于不兼容版本方案的警告（不会生成构建产物）

如果你遇到需要这些脚本的运行时问题，请显式信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事项

某些脚本仍然硬编码为 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前请仍通过 pnpm 运行这些脚本。

## 相关内容

- [Install overview](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [Updating](/zh-CN/install/updating)
