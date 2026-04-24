---
read_when:
    - Gmail Pub/Sub 이벤트를 OpenClaw에 연결하려고 합니다
    - Webhook 헬퍼 명령이 필요합니다
summary: '`openclaw webhooks`용 CLI 참조(Webhook 헬퍼 + Gmail Pub/Sub)'
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T06:09:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook 헬퍼 및 통합(Gmail Pub/Sub, Webhook 헬퍼).

관련 문서:

- Webhooks: [Webhooks](/ko/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/ko/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Gmail watch, Pub/Sub, OpenClaw Webhook 전달을 구성합니다.

필수:

- `--account <email>`

옵션:

- `--project <id>`
- `--topic <name>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`
- `--push-endpoint <url>`
- `--json`

예시:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

`gog watch serve`와 watch 자동 갱신 루프를 실행합니다.

옵션:

- `--account <email>`
- `--topic <topic>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`

예시:

```bash
openclaw webhooks gmail run --account you@example.com
```

전체 설정 흐름과 운영 세부 정보는 [Gmail Pub/Sub 문서](/ko/automation/cron-jobs#gmail-pubsub-integration)를 참고하세요.

## 관련 문서

- [CLI 참조](/ko/cli)
- [Webhook 자동화](/ko/automation/cron-jobs)
