---
read_when:
    - Docker を使ってクラウド VM に OpenClaw をデプロイする場合
    - 共有バイナリの bake、永続化、更新フローが必要な場合
summary: 長期間稼働する OpenClaw Gateway ホスト向けの共有 Docker VM 実行手順
title: Docker VM Runtime
x-i18n:
    generated_at: "2026-04-05T12:47:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Docker VM Runtime

GCP、Hetzner、そのほか同様の VPS プロバイダーなど、VM ベースの Docker インストール向けの共有実行手順です。

## 必要なバイナリをイメージに bake する

実行中のコンテナー内にバイナリをインストールするのは罠です。
実行時にインストールされたものは、再起動時に失われます。

Skills に必要なすべての外部バイナリは、イメージビルド時にインストールしておく必要があります。

以下の例では 3 つの一般的なバイナリのみを示します:

- Gmail アクセス用の `gog`
- Google Places 用の `goplaces`
- WhatsApp 用の `wacli`

これらは例であり、完全な一覧ではありません。
同じパターンを使って、必要なだけ多くのバイナリをインストールできます。

後から追加のバイナリに依存する新しい Skills を追加する場合は、次が必要です:

1. Dockerfile を更新する
2. イメージを再ビルドする
3. コンテナーを再起動する

**Dockerfile の例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 例のバイナリ 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# 例のバイナリ 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# 例のバイナリ 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# 以下に同じパターンでさらにバイナリを追加

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
上記のダウンロード URL は x86_64（amd64）向けです。ARM ベースの VM（例: Hetzner ARM、GCP Tau T2A）の場合は、各ツールのリリースページにある適切な ARM64 バリアントにダウンロード URL を置き換えてください。
</Note>

## ビルドと起動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 中に `Killed` または `exit code 137` でビルドが失敗する場合、VM のメモリーが不足しています。
再試行する前に、より大きいマシンクラスを使用してください。

バイナリを確認する:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

期待される出力:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway を確認する:

```bash
docker compose logs -f openclaw-gateway
```

期待される出力:

```
[gateway] listening on ws://0.0.0.0:18789
```

## 何がどこに永続化されるか

OpenClaw は Docker 上で動作しますが、Docker 自体がソースオブトゥルースではありません。
すべての長期間保持される状態は、再起動、再ビルド、再起動後も維持されなければなりません。

| Component           | Location                          | Persistence mechanism  | Notes                                                         |
| ------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway config      | `/home/node/.openclaw/`           | ホストのボリュームマウント | `openclaw.json`, `.env` を含む                              |
| Model auth profiles | `/home/node/.openclaw/agents/`    | ホストのボリュームマウント | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API キー） |
| Skill configs       | `/home/node/.openclaw/skills/`    | ホストのボリュームマウント | Skill レベルの状態                                             |
| Agent workspace     | `/home/node/.openclaw/workspace/` | ホストのボリュームマウント | コードとエージェント成果物                                      |
| WhatsApp session    | `/home/node/.openclaw/`           | ホストのボリュームマウント | QR ログインを保持                                            |
| Gmail keyring       | `/home/node/.openclaw/`           | ホストボリューム + パスワード | `GOG_KEYRING_PASSWORD` が必要                               |
| External binaries   | `/usr/local/bin/`                 | Docker イメージ         | ビルド時に bake しておく必要がある                                   |
| Node runtime        | Container filesystem              | Docker イメージ         | イメージビルドのたびに再構築                                     |
| OS packages         | Container filesystem              | Docker イメージ         | 実行時にインストールしない                                     |
| Docker container    | Ephemeral                         | 再起動可能            | 破棄しても安全                                               |

## 更新

VM 上の OpenClaw を更新するには:

```bash
git pull
docker compose build
docker compose up -d
```
