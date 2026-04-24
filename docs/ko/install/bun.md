---
read_when:
    - 가장 빠른 로컬 개발 루프를 원합니다(bun + watch)
    - Bun 설치/패치/라이프사이클 스크립트 문제에 부딪혔습니다
summary: 'Bun 워크플로(실험적): pnpm 대비 설치와 주의사항'
title: Bun(실험적)
x-i18n:
    generated_at: "2026-04-24T06:19:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun은 **Gateway 런타임에 권장되지 않습니다**(WhatsApp 및 Telegram 관련 알려진 문제가 있음). 프로덕션에서는 Node를 사용하세요.
</Warning>

Bun은 TypeScript를 직접 실행하기 위한 선택적 로컬 런타임입니다(`bun run ...`, `bun --watch ...`). 기본 패키지 관리자는 여전히 `pnpm`이며, 완전히 지원되고 문서 도구에서도 사용됩니다. Bun은 `pnpm-lock.yaml`을 사용할 수 없고 이를 무시합니다.

## 설치

<Steps>
  <Step title="의존성 설치">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb`는 gitignore 대상이므로 repo에 변경이 생기지 않습니다. lockfile 기록 자체를 완전히 건너뛰려면:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="빌드 및 테스트">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 라이프사이클 스크립트

Bun은 명시적으로 신뢰하지 않으면 의존성 라이프사이클 스크립트를 차단합니다. 이 repo에서는 일반적으로 차단되는 스크립트가 필수는 아닙니다.

- `@whiskeysockets/baileys` `preinstall` -- Node 메이저 버전이 20 이상인지 확인(OpenClaw 기본값은 Node 24이며, 현재 `22.14+`인 Node 22 LTS도 계속 지원)
- `protobufjs` `postinstall` -- 호환되지 않는 버전 체계에 대한 경고를 출력함(빌드 아티팩트 없음)

이 스크립트가 필요한 런타임 문제에 부딪히면 명시적으로 신뢰하세요.

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 주의사항

일부 스크립트는 여전히 pnpm을 하드코딩합니다(예: `docs:build`, `ui:*`, `protocol:check`). 현재로서는 이런 것들은 pnpm으로 실행하세요.

## 관련 항목

- [설치 개요](/ko/install)
- [Node.js](/ko/install/node)
- [업데이트](/ko/install/updating)
