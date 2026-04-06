---
read_when:
    - 你想配置 memory 搜索提供商或嵌入模型
    - 你想设置 QMD 后端
    - 你想调整混合搜索、MMR 或时间衰减
    - 你想启用多模态 memory 索引
summary: memory 搜索、嵌入提供商、QMD、混合搜索和多模态索引的所有配置项
title: memory 配置参考
x-i18n:
    generated_at: "2026-04-06T00:34:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2be752f3b08441807224b4c33f4b63aea2de6deb43ac42db7e34f8e837b0240
    source_path: reference/memory-config.md
    workflow: 15
---

# memory 配置参考

本页列出了 OpenClaw memory 搜索的所有配置项。有关概念性概览，请参见：

- [Memory Overview](/zh-CN/concepts/memory) -- memory 的工作方式
- [Builtin Engine](/zh-CN/concepts/memory-builtin) -- 默认 SQLite 后端
- [QMD Engine](/zh-CN/concepts/memory-qmd) -- 本地优先 sidecar
- [Memory Search](/zh-CN/concepts/memory-search) -- 搜索流水线与调优

除非另有说明，所有 memory 搜索设置都位于 `openclaw.json` 中的
`agents.defaults.memorySearch` 下。

---

## 提供商选择

| 键名 | 类型 | 默认值 | 描述 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自动检测 | 嵌入适配器 ID：`openai`、`gemini`、`voyage`、`mistral`、`bedrock`、`ollama`、`local` |
| `model`    | `string`  | 提供商默认值 | 嵌入模型名称 |
| `fallback` | `string`  | `"none"`         | 当主提供商失败时使用的回退适配器 ID |
| `enabled`  | `boolean` | `true`           | 启用或禁用 memory 搜索 |

### 自动检测顺序

当未设置 `provider` 时，OpenClaw 会选择第一个可用项：

1. `local` -- 如果已配置 `memorySearch.local.modelPath` 且文件存在。
2. `openai` -- 如果可以解析 OpenAI 密钥。
3. `gemini` -- 如果可以解析 Gemini 密钥。
4. `voyage` -- 如果可以解析 Voyage 密钥。
5. `mistral` -- 如果可以解析 Mistral 密钥。
6. `bedrock` -- 如果 AWS SDK 凭证链可解析（实例角色、访问密钥、profile、SSO、Web 身份或共享配置）。

支持 `ollama`，但不会自动检测（请显式设置）。

### API 密钥解析

远程嵌入需要 API 密钥。Bedrock 则改用 AWS SDK 默认凭证链
（实例角色、SSO、访问密钥）。

| 提供商 | 环境变量 | 配置键 |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Bedrock  | AWS 凭证链 | 无需 API 密钥 |
| Ollama   | `OLLAMA_API_KEY`（占位符） | --                                |

Codex OAuth 仅覆盖 chat/completions，不满足嵌入请求。

---

## 远程端点配置

用于自定义兼容 OpenAI 的端点或覆盖提供商默认值：

| 键名 | 类型 | 描述 |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | 自定义 API 基础 URL |
| `remote.apiKey`  | `string` | 覆盖 API 密钥 |
| `remote.headers` | `object` | 额外的 HTTP 标头（与提供商默认值合并） |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Gemini 专属配置

| 键名 | 类型 | 默认值 | 描述 |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | 也支持 `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072 |

<Warning>
更改模型或 `outputDimensionality` 会触发自动全量重新索引。
</Warning>

---

## Bedrock 嵌入配置

Bedrock 使用 AWS SDK 默认凭证链 -- 无需 API 密钥。
如果 OpenClaw 运行在具有 Bedrock 启用实例角色的 EC2 上，只需设置
提供商和模型：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| 键名 | 类型 | 默认值 | 描述 |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意 Bedrock 嵌入模型 ID |
| `outputDimensionality` | `number` | 模型默认值 | 对于 Titan V2：256、512 或 1024 |

### 支持的模型

支持以下模型（带系列检测和维度默认值）：

| 模型 ID | 提供商 | 默认维度 | 可配置维度 |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256、512、1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256、384、1024、3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

带吞吐后缀的变体（例如 `amazon.titan-embed-text-v1:2:8k`）会继承
基础模型的配置。

### 身份验证

Bedrock 认证使用标准 AWS SDK 凭证解析顺序：

1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
2. SSO 令牌缓存
3. Web 身份令牌凭证
4. 共享凭证和配置文件
5. ECS 或 EC2 元数据凭证

区域从 `AWS_REGION`、`AWS_DEFAULT_REGION`、
`amazon-bedrock` 提供商的 `baseUrl` 中解析，或默认使用 `us-east-1`。

### IAM 权限

IAM 角色或用户需要：

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

为实现最小权限，请将 `InvokeModel` 限定到特定模型：

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## 本地嵌入配置

| 键名 | 类型 | 默认值 | 描述 |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | 自动下载 | GGUF 模型文件路径 |
| `local.modelCacheDir` | `string` | node-llama-cpp 默认值 | 已下载模型的缓存目录 |

默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。
需要原生构建：`pnpm approve-builds`，然后执行 `pnpm rebuild node-llama-cpp`。

---

## 混合搜索配置

均位于 `memorySearch.query.hybrid` 下：

| 键名 | 类型 | 默认值 | 描述 |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | 启用混合 BM25 + 向量搜索 |
| `vectorWeight`        | `number`  | `0.7`   | 向量分数权重（0-1） |
| `textWeight`          | `number`  | `0.3`   | BM25 分数权重（0-1） |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小乘数 |

### MMR（多样性）

| 键名 | 类型 | 默认值 | 描述 |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | 启用 MMR 重排序 |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性 |

### 时间衰减（时效性）

| 键名 | 类型 | 默认值 | 描述 |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | 启用时效性加权 |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | 分数每 N 天减半 |

常青文件（`MEMORY.md`、`memory/` 中无日期的文件）永不衰减。

### 完整示例

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## 其他 memory 路径

| 键名 | 类型 | 描述 |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | 要索引的其他目录或文件 |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

路径可以是绝对路径或相对于工作区的路径。目录会被递归扫描，
以查找 `.md` 文件。符号链接处理取决于当前后端：
内置引擎会忽略符号链接，而 QMD 会遵循底层 QMD
扫描器的行为。

对于按智能体作用域划分的跨智能体 transcript 搜索，请使用
`agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。
这些额外 collection 使用相同的 `{ path, name, pattern? }` 结构，但
会按智能体进行合并，并且当路径指向当前工作区之外时，可以保留显式共享名称。
如果同一个已解析路径同时出现在 `memory.qmd.paths` 和
`memorySearch.qmd.extraCollections` 中，QMD 会保留第一项并跳过
重复项。

---

## 多模态 memory（Gemini）

使用 Gemini Embedding 2 将图像和音频与 Markdown 一起建立索引：

| 键名 | 类型 | 默认值 | 描述 |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引 |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 用于索引的最大文件大小 |

仅适用于 `extraPaths` 中的文件。默认 memory 根目录仍仅支持 Markdown。
需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`
（图像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| 键名 | 类型 | 默认值 | 描述 |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | 在 SQLite 中缓存 chunk 嵌入 |
| `cache.maxEntries` | `number`  | `50000` | 最大缓存嵌入数量 |

可防止在重新索引或 transcript 更新期间对未更改文本重复嵌入。

---

## 批量索引

| 键名 | 类型 | 默认值 | 描述 |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批处理作业数 |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批处理完成 |
| `remote.batch.pollIntervalMs` | `number`  | --      | 轮询间隔 |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批处理超时 |

适用于 `openai`、`gemini` 和 `voyage`。对于大型回填任务，OpenAI 批处理通常
最快且最便宜。

---

## 会话 memory 搜索（实验性）

索引会话 transcript，并通过 `memory_search` 提供结果：

| 键名 | 类型 | 默认值 | 描述 |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用会话索引 |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含 transcript |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 重新索引的字节阈值 |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 重新索引的消息阈值 |

会话索引为选择启用，并且异步运行。结果可能会略有
滞后。会话日志存储在磁盘上，因此请将文件系统访问视为信任
边界。

---

## SQLite 向量加速（sqlite-vec）

| 键名 | 类型 | 默认值 | 描述 |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 执行向量查询 |
| `store.vector.extensionPath` | `string`  | 内置 | 覆盖 sqlite-vec 路径 |

当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内余弦
相似度计算。

---

## 索引存储

| 键名 | 类型 | 默认值 | 描述 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支持 `{agentId}` 令牌） |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 分词器（`unicode61` 或 `trigram`） |

---

## QMD 后端配置

设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置都位于
`memory.qmd` 下：

| 键名 | 类型 | 默认值 | 描述 |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可执行文件路径 |
| `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query` |
| `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`  | 索引会话 transcript |
| `sessions.retentionDays` | `number`  | --       | transcript 保留期 |
| `sessions.exportDir`     | `string`  | --       | 导出目录 |

### 更新计划

| 键名 | 类型 | 默认值 | 描述 |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | 刷新间隔 |
| `update.debounceMs`       | `number`  | `15000` | 文件变更防抖 |
| `update.onBoot`           | `boolean` | `true`  | 启动时刷新 |
| `update.waitForBootSync`  | `boolean` | `false` | 在刷新完成前阻塞启动 |
| `update.embedInterval`    | `string`  | --      | 单独的嵌入执行周期 |
| `update.commandTimeoutMs` | `number`  | --      | QMD 命令超时 |
| `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作超时 |
| `update.embedTimeoutMs`   | `number`  | --      | QMD 嵌入操作超时 |

### 限制

| 键名 | 类型 | 默认值 | 描述 |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults`       | `number` | `6`     | 最大搜索结果数 |
| `limits.maxSnippetChars`  | `number` | --      | 限制 snippet 长度 |
| `limits.maxInjectedChars` | `number` | --      | 限制注入的总字符数 |
| `limits.timeoutMs`        | `number` | `4000`  | 搜索超时 |

### 范围

控制哪些会话可以接收 QMD 搜索结果。使用与
[`session.sendPolicy`](/zh-CN/gateway/configuration-reference#session) 相同的 schema：

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

默认仅限私信。`match.keyPrefix` 匹配规范化后的会话键；
`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

### 引用

`memory.citations` 适用于所有后端：

| 值 | 行为 |
| ---------------- | --------------------------------------------------- |
| `auto`（默认） | 在 snippet 中包含 `Source: <path#line>` 页脚 |
| `on`             | 始终包含页脚 |
| `off`            | 省略页脚（路径仍会在内部传递给智能体） |

### 完整 QMD 示例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming（实验性）

Dreaming 配置位于 `plugins.entries.memory-core.config.dreaming` 下，
而不在 `agents.defaults.memorySearch` 下。

Dreaming 以一次计划扫描的形式运行，并将内部的 light/deep/REM 阶段作为
实现细节。

有关概念行为和斜杠命令，请参见 [Dreaming](/zh-CN/concepts/dreaming)。

### 用户设置

| 键名 | 类型 | 默认值 | 描述 |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | 完全启用或禁用 Dreaming |
| `frequency` | `string`  | `0 3 * * *` | 完整 Dreaming 扫描的可选 cron 周期 |

### 示例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

说明：

- Dreaming 将机器状态写入 `memory/.dreams/`。
- Dreaming 将人类可读的叙述输出写入 `DREAMS.md`（或现有的 `dreams.md`）。
- light/deep/REM 阶段策略和阈值属于内部行为，不是面向用户的配置。
