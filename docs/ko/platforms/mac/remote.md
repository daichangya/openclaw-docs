---
read_when:
    - 원격 mac 제어 설정 또는 디버깅하기
summary: SSH를 통해 원격 OpenClaw gateway를 제어하는 macOS 앱 흐름
title: 원격 제어
x-i18n:
    generated_at: "2026-04-24T06:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# 원격 OpenClaw (macOS ⇄ 원격 호스트)

이 흐름을 사용하면 macOS 앱이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw gateway를 완전한 원격 제어 방식으로 다룰 수 있습니다. 이는 앱의 **Remote over SSH**(원격 실행) 기능입니다. 모든 기능—상태 점검, Voice Wake 전달, Web Chat—은 _Settings → General_의 동일한 원격 SSH 구성을 재사용합니다.

## 모드

- **로컬(이 Mac)**: 모든 것이 노트북에서 실행됩니다. SSH는 사용되지 않습니다.
- **Remote over SSH(기본값)**: OpenClaw 명령이 원격 호스트에서 실행됩니다. mac 앱은 `-o BatchMode`, 선택한 identity/key, 로컬 포트 전달과 함께 SSH 연결을 엽니다.
- **Remote direct (ws/wss)**: SSH 터널 없음. mac 앱이 gateway URL에 직접 연결합니다(예: Tailscale Serve 또는 공개 HTTPS 리버스 프록시를 통해).

## 원격 전송

원격 모드는 두 가지 전송을 지원합니다.

- **SSH 터널**(기본값): `ssh -N -L ...`을 사용해 gateway 포트를 localhost로 전달합니다. 터널이 loopback이기 때문에 gateway는 Node의 IP를 `127.0.0.1`로 보게 됩니다.
- **직접(ws/wss)**: gateway URL에 직접 연결합니다. gateway는 실제 클라이언트 IP를 봅니다.

## 원격 호스트의 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다(`pnpm install && pnpm build && pnpm link --global`).
2. 비대화형 셸에서 `openclaw`가 PATH에 있도록 합니다(필요하면 `/usr/local/bin` 또는 `/opt/homebrew/bin`에 symlink).
3. 키 인증으로 SSH를 엽니다. LAN 밖에서도 안정적으로 접근할 수 있도록 **Tailscale** IP를 권장합니다.

## macOS 앱 설정

1. _Settings → General_을 엽니다.
2. **OpenClaw runs** 아래에서 **Remote over SSH**를 선택하고 다음을 설정합니다.
   - **Transport**: **SSH tunnel** 또는 **Direct (ws/wss)**.
   - **SSH target**: `user@host` (선택적으로 `:port`).
     - gateway가 같은 LAN에 있고 Bonjour를 광고하면 검색 목록에서 선택해 이 필드를 자동 입력할 수 있습니다.
   - **Gateway URL** (Direct 전용): `wss://gateway.example.ts.net` (또는 로컬/LAN용 `ws://...`)
   - **Identity file** (고급): 키 경로
   - **Project root** (고급): 명령에 사용되는 원격 체크아웃 경로
   - **CLI path** (고급): 실행 가능한 `openclaw` 진입점/바이너리의 선택적 경로(광고되면 자동 입력)
3. **Test remote**를 누르세요. 성공이면 원격 `openclaw status --json`이 올바르게 실행된다는 뜻입니다. 실패는 보통 PATH/CLI 문제를 의미하며, exit 127은 원격에서 CLI를 찾지 못했다는 뜻입니다.
4. 상태 점검과 Web Chat은 이제 이 SSH 터널을 통해 자동으로 실행됩니다.

## Web Chat

- **SSH 터널**: Web Chat은 전달된 WebSocket 제어 포트(기본값 18789)를 통해 gateway에 연결합니다.
- **Direct (ws/wss)**: Web Chat은 구성된 gateway URL에 직접 연결합니다.
- 더 이상 별도의 WebChat HTTP 서버는 없습니다.

## 권한

- 원격 호스트에는 로컬과 동일한 TCC 승인(Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications)이 필요합니다. 해당 머신에서 온보딩을 실행해 한 번 승인하세요.
- Nodes는 `node.list` / `node.describe`를 통해 권한 상태를 광고하므로 에이전트는 무엇을 사용할 수 있는지 알 수 있습니다.

## 보안 참고

- 원격 호스트에서는 loopback bind를 선호하고 SSH 또는 Tailscale을 통해 연결하세요.
- SSH 터널링은 엄격한 host-key checking을 사용합니다. 먼저 호스트 키를 신뢰해 `~/.ssh/known_hosts`에 존재하게 하세요.
- Gateway를 non-loopback 인터페이스에 bind하는 경우 유효한 Gateway 인증이 필요합니다: token, password, 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 identity-aware 리버스 프록시.
- [보안](/ko/gateway/security) 및 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## WhatsApp 로그인 흐름(원격)

- **원격 호스트에서** `openclaw channels login --verbose`를 실행하세요. 휴대폰의 WhatsApp으로 QR을 스캔합니다.
- 인증이 만료되면 해당 호스트에서 로그인을 다시 실행하세요. 상태 점검이 링크 문제를 표시합니다.

## 문제 해결

- **exit 127 / not found**: 비로그인 셸에서 `openclaw`가 PATH에 없습니다. `/etc/paths`, 셸 rc에 추가하거나 `/usr/local/bin`/`/opt/homebrew/bin`에 symlink하세요.
- **Health probe failed**: SSH 도달 가능성, PATH, 그리고 Baileys가 로그인되었는지(`openclaw status --json`) 확인하세요.
- **Web Chat stuck**: gateway가 원격 호스트에서 실행 중인지, 전달된 포트가 gateway WS 포트와 일치하는지 확인하세요. UI는 정상적인 WS 연결이 필요합니다.
- **Node IP shows 127.0.0.1**: SSH 터널에서는 정상입니다. gateway가 실제 클라이언트 IP를 보게 하려면 **Transport**를 **Direct (ws/wss)**로 전환하세요.
- **Voice Wake**: 원격 모드에서는 트리거 구문이 자동으로 전달되므로 별도의 전달기는 필요 없습니다.

## 알림 소리

스크립트에서 `openclaw`와 `node.invoke`를 사용해 알림별 소리를 선택하세요. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

이제 앱에는 전역 “기본 소리” 토글이 없습니다. 호출자가 요청별로 소리(또는 없음)를 선택합니다.

## 관련

- [macOS 앱](/ko/platforms/macos)
- [원격 액세스](/ko/gateway/remote)
