---
read_when:
    - 你想将 MiniMax 用于 `web_search`
    - 你需要一个 MiniMax Coding Plan key
    - 你想了解 MiniMax 中国区 / 全球搜索主机的配置指引
summary: 通过 Coding Plan 搜索 API 使用 MiniMax Search
title: MiniMax 搜索
x-i18n:
    generated_at: "2026-04-23T21:09:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw 支持将 MiniMax 作为 `web_search` 提供商，通过 MiniMax
Coding Plan 搜索 API 使用。它会返回结构化搜索结果，包括标题、URL、
摘要以及相关查询。

## 获取 Coding Plan key

<Steps>
  <Step title="创建 key">
    在
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) 创建或复制一个 MiniMax Coding Plan key。
  </Step>
  <Step title="存储 key">
    在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`，或通过以下命令配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY` 作为环境变量别名。当 `MINIMAX_API_KEY`
已经指向 coding-plan token 时，它仍会作为兼容性回退被读取。

## 配置

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // 如果已设置 MINIMAX_CODE_PLAN_KEY，则可选
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**环境变量替代方式：** 在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`。
对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。

## 地区选择

MiniMax Search 使用以下端点：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- 中国区：`https://api.minimaxi.com/v1/coding_plan/search`

如果未设置 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 会按以下顺序解析
地区：

1. `tools.web.search.minimax.region` / 插件自有 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

这意味着，中国区新手引导，或设置了 `MINIMAX_API_HOST=https://api.minimaxi.com/...`
时，也会自动让 MiniMax Search 走中国区主机。

即使你是通过 OAuth `minimax-portal` 路径完成 MiniMax 认证，
网页搜索仍然会注册为提供商 id `minimax`；OAuth 提供商 base URL
仅用于作为中国区 / 全球主机选择的地区提示。

## 支持的参数

MiniMax Search 支持：

- `query`
- `count`（OpenClaw 会将返回的结果列表裁剪到所请求的数量）

目前尚不支持提供商专用过滤项。

## 相关内容

- [网页搜索概览](/zh-CN/tools/web) -- 所有提供商与自动检测
- [MiniMax](/zh-CN/providers/minimax) -- 模型、图像、语音与认证设置
