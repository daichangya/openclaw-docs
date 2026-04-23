---
read_when:
    - 你想要最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装/补丁/生命周期脚本问题
summary: Bun 工作流（实验性）：安装方式、注意事项与相对于 `pnpm` 的差异
title: Bun（实验性）
x-i18n:
    generated_at: "2026-04-23T20:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c67b27bd25b0a018976c4730704994371f4e9bc7495ae0f84d179764f663bd6
    source_path: install/bun.md
    workflow: 15
---

<Warning>
不建议将 Bun **用于 Gateway 网关运行时**（已知与 WhatsApp 和 Telegram 存在问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，可用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认包管理器仍然是 `pnpm`，它受到完整支持，并被文档工具链使用。Bun 不能使用 `pnpm-lock.yaml`，并且会忽略它。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被 gitignore，因此不会产生仓库变更。若要完全跳过 lockfile 写入：

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

除非显式信任，否则 Bun 会阻止依赖的生命周期脚本。对于此仓库，常见被阻止的脚本并非必需：

- `@whiskeysockets/baileys` `preinstall` —— 检查 Node 主版本是否 >= 20（OpenClaw 默认使用 Node 24，且仍支持 Node 22 LTS，目前为 `22.14+`）
- `protobufjs` `postinstall` —— 发出有关不兼容版本方案的警告（不会生成构建产物）

如果你遇到需要这些脚本的运行时问题，请显式信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事项

有些脚本仍然硬编码为 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前请通过 pnpm 运行这些脚本。
