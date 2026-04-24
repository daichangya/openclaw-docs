---
read_when:
    - Gateway를 위한 저렴한 상시 실행 Linux 호스트를 원합니다
    - 자체 VPS를 운영하지 않고 원격 Control UI 접근을 원합니다
summary: 원격 접근을 위해 exe.dev(VM + HTTPS 프록시)에서 OpenClaw Gateway 실행하기
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T06:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

목표: exe.dev VM에서 OpenClaw Gateway를 실행하고, 노트북에서 `https://<vm-name>.exe.xyz`로 접근할 수 있게 합니다.

이 페이지는 exe.dev의 기본 **exeuntu** 이미지를 기준으로 합니다. 다른 배포판을 선택했다면 패키지는 그에 맞게 바꿔 주세요.

## 초보자용 빠른 경로

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 필요에 따라 인증 키/토큰을 입력합니다
3. VM 옆의 "Agent"를 클릭하고 Shelley가 프로비저닝을 완료할 때까지 기다립니다
4. `https://<vm-name>.exe.xyz/`를 열고 구성된 공유 시크릿으로 인증합니다(이 가이드는 기본적으로 토큰 인증을 사용하지만 `gateway.auth.mode`를 바꾸면 비밀번호 인증도 작동합니다)
5. `openclaw devices approve <requestId>`로 대기 중인 기기 페어링 요청을 승인합니다

## 필요한 것

- exe.dev 계정
- [exe.dev](https://exe.dev) 가상 머신에 대한 `ssh exe.dev` 접근(선택 사항)

## Shelley를 사용한 자동 설치

[exe.dev](https://exe.dev)의 에이전트인 Shelley는 아래 프롬프트로
즉시 OpenClaw를 설치할 수 있습니다. 사용되는 프롬프트는 다음과 같습니다:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 수동 설치

## 1) VM 생성

기기에서 다음을 실행합니다:

```bash
ssh exe.dev new
```

그런 다음 연결합니다:

```bash
ssh <vm-name>.exe.xyz
```

팁: 이 VM은 **상태 유지형**으로 두세요. OpenClaw는 `openclaw.json`, 에이전트별
`auth-profiles.json`, 세션, 채널/Provider 상태를
`~/.openclaw/` 아래에 저장하며, 워크스페이스는 `~/.openclaw/workspace/` 아래에 둡니다.

## 2) 사전 요구 사항 설치(VM에서)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw 설치

OpenClaw 설치 스크립트를 실행합니다:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx를 설정해 OpenClaw를 포트 8000으로 프록시

`/etc/nginx/sites-enabled/default`를 다음 내용으로 편집합니다:

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket 지원
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 표준 프록시 헤더
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 장기 연결을 위한 타임아웃 설정
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

클라이언트가 보낸 체인을 보존하는 대신 전달 헤더를 덮어쓰세요.
OpenClaw는 명시적으로 구성된 프록시에서 온 전달 IP 메타데이터만 신뢰하며,
append 방식의 `X-Forwarded-For` 체인은 강화 측면에서 위험으로 간주됩니다.

## 5) OpenClaw 접근 및 권한 부여

`https://<vm-name>.exe.xyz/`에 접근합니다(온보딩의 Control UI 출력 참고). 인증을 요구하면 VM에 구성된 공유 시크릿을 붙여넣으세요. 이 가이드는 토큰 인증을 사용하므로 `openclaw config get gateway.auth.token`으로 `gateway.auth.token`을 가져오세요(또는 `openclaw doctor --generate-gateway-token`으로 생성). Gateway를 비밀번호 인증으로 바꿨다면 대신 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 사용하세요.
`openclaw devices list`와 `openclaw devices approve <requestId>`로 기기를 승인하세요. 헷갈리면 브라우저에서 Shelley를 사용하세요!

## 원격 접근

원격 접근은 [exe.dev](https://exe.dev)의 인증으로 처리됩니다. 기본적으로 포트 8000의 HTTP 트래픽은 이메일 인증과 함께 `https://<vm-name>.exe.xyz`로 전달됩니다.

## 업데이트

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

가이드: [업데이트](/ko/install/updating)

## 관련 문서

- [원격 Gateway](/ko/gateway/remote)
- [설치 개요](/ko/install)
