---
read_when:
    - voice-call Plugin을 사용 중이며 CLI 진입점을 원합니다
    - '`voicecall call|continue|dtmf|status|tail|expose`에 대한 빠른 예제를 원합니다'
summary: '`openclaw voicecall`에 대한 CLI 참조(voice-call Plugin 명령 표면)'
title: 음성 통화
x-i18n:
    generated_at: "2026-04-24T06:09:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall`은 Plugin이 제공하는 명령입니다. voice-call Plugin이 설치되고 활성화된 경우에만 표시됩니다.

기본 문서:

- voice-call Plugin: [Voice Call](/ko/plugins/voice-call)

## 공통 명령

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Webhook 노출(Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

보안 참고: Webhook 엔드포인트는 신뢰하는 네트워크에만 노출하세요. 가능하면 Tailscale Funnel보다 Tailscale Serve를 우선 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [voice call Plugin](/ko/plugins/voice-call)
