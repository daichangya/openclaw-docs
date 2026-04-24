---
read_when:
    - Tailscale + CoreDNS를 통한 광역 검색(DNS-SD)을 원합니다
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns`에 대한 CLI 참조(광역 검색 도우미)'
title: DNS
x-i18n:
    generated_at: "2026-04-24T06:07:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

광역 검색(Tailscale + CoreDNS)을 위한 DNS 도우미입니다. 현재는 macOS + Homebrew CoreDNS에 초점을 맞추고 있습니다.

관련 항목:

- Gateway 검색: [Discovery](/ko/gateway/discovery)
- 광역 검색 config: [Configuration](/ko/gateway/configuration)

## 설정

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

유니캐스트 DNS-SD 검색을 위한 CoreDNS 설정을 계획하거나 적용합니다.

옵션:

- `--domain <domain>`: 광역 검색 도메인(예: `openclaw.internal`)
- `--apply`: CoreDNS config를 설치 또는 업데이트하고 서비스를 재시작합니다(`sudo` 필요, macOS 전용)

표시 내용:

- 해석된 검색 도메인
- zone 파일 경로
- 현재 tailnet IP
- 권장되는 `openclaw.json` 검색 config
- 설정해야 하는 Tailscale Split DNS nameserver/domain 값

참고:

- `--apply` 없이 실행하면 이 명령은 계획 도우미로만 동작하며 권장 설정을 출력합니다.
- `--domain`을 생략하면 OpenClaw는 config의 `discovery.wideArea.domain`을 사용합니다.
- 현재 `--apply`는 macOS만 지원하며 Homebrew CoreDNS를 전제로 합니다.
- `--apply`는 필요 시 zone 파일을 부트스트랩하고, CoreDNS import stanza가 존재하도록 보장한 뒤 `coredns` brew 서비스를 재시작합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Discovery](/ko/gateway/discovery)
