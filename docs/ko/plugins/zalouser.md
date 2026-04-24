---
read_when:
    - OpenClaw에서 Zalo Personal(비공식) 지원을 원합니다
    - '`zalouser` Plugin을 구성하거나 개발하는 중입니다'
summary: 'Zalo Personal Plugin: 네이티브 `zca-js`를 통한 QR 로그인 + 메시징(Plugin 설치 + 채널 구성 + 도구)'
title: Zalo Personal Plugin
x-i18n:
    generated_at: "2026-04-24T06:29:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

네이티브 `zca-js`를 사용해 일반 Zalo 개인 계정을 자동화하는 OpenClaw용 Zalo Personal 지원 Plugin입니다.

> **Warning:** 비공식 자동화는 계정 정지/차단으로 이어질 수 있습니다. 본인 책임하에 사용하세요.

## 명명

채널 id는 `zalouser`입니다. 이는 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위한 것입니다. `zalo`는 향후 공식 Zalo API 통합 가능성을 위해 남겨 둡니다.

## 실행 위치

이 Plugin은 **Gateway 프로세스 내부**에서 실행됩니다.

원격 Gateway를 사용하는 경우, **Gateway를 실행하는 머신**에 설치/구성한 뒤 Gateway를 재시작하세요.

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 설치

### 옵션 A: npm에서 설치

```bash
openclaw plugins install @openclaw/zalouser
```

그 후 Gateway를 재시작하세요.

### 옵션 B: 로컬 폴더에서 설치(개발용)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

그 후 Gateway를 재시작하세요.

## 구성

채널 구성은 `plugins.entries.*`가 아니라 `channels.zalouser` 아래에 있습니다:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## 에이전트 도구

도구 이름: `zalouser`

액션: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

채널 메시지 액션은 메시지 반응을 위한 `react`도 지원합니다.

## 관련 문서

- [Plugin 만들기](/ko/plugins/building-plugins)
- [커뮤니티 Plugins](/ko/plugins/community)
