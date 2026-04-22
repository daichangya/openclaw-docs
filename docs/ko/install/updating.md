---
read_when:
    - OpenClaw 업데이트하기
    - 업데이트 후 문제가 발생함
summary: 전역 설치 또는 소스에서 OpenClaw를 안전하게 업데이트하기, 그리고 롤백 전략
title: 업데이트하기
x-i18n:
    generated_at: "2026-04-22T04:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# 업데이트하기

OpenClaw를 최신 상태로 유지하세요.

## 권장: `openclaw update`

가장 빠른 업데이트 방법입니다. 설치 유형(npm 또는 git)을 감지하고, 최신 버전을 가져오며, `openclaw doctor`를 실행하고, gateway를 재시작합니다.

```bash
openclaw update
```

채널을 전환하거나 특정 버전을 대상으로 하려면:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 적용하지 않고 미리 보기
```

`--channel beta`는 beta를 우선하지만, beta 태그가 없거나 최신 stable 릴리스보다 오래된 경우 런타임은 stable/latest로 폴백합니다. 일회성 패키지 업데이트를 위해 원시 npm beta dist-tag를 원하면 `--tag beta`를 사용하세요.

채널 의미 체계는 [Development channels](/ko/install/development-channels)를 참고하세요.

## 대안: 설치 프로그램 다시 실행

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

온보딩을 건너뛰려면 `--no-onboard`를 추가하세요. 소스 설치의 경우 `--install-method git --no-onboard`를 전달하세요.

## 대안: 수동 npm, pnpm 또는 bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 루트 소유 전역 npm 설치

일부 Linux npm 설정은 `/usr/lib/node_modules/openclaw` 같은 루트 소유 디렉터리 아래에 전역 패키지를 설치합니다. OpenClaw는 이 레이아웃을 지원합니다. 설치된 패키지는 런타임에서 읽기 전용으로 처리되며, 번들 Plugin 런타임 의존성은 패키지 트리를 변경하는 대신 쓰기 가능한 런타임 디렉터리에 준비됩니다.

강화된 systemd 유닛의 경우, `ReadWritePaths`에 포함된 쓰기 가능한 스테이지 디렉터리를 설정하세요.

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR`가 설정되지 않은 경우, OpenClaw는 systemd가 제공하면 `$STATE_DIRECTORY`를 사용하고, 그다음 `~/.openclaw/plugin-runtime-deps`로 폴백합니다.

## 자동 업데이터

자동 업데이터는 기본적으로 꺼져 있습니다. `~/.openclaw/openclaw.json`에서 활성화하세요.

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| 채널 | 동작 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours`만큼 대기한 뒤, `stableJitterHours` 전체에 걸쳐 결정적 지터를 적용하여 배포합니다(분산 롤아웃). |
| `beta`   | `betaCheckIntervalHours`마다(기본값: 매시간) 확인하고 즉시 적용합니다. |
| `dev`    | 자동 적용이 없습니다. 수동으로 `openclaw update`를 사용하세요. |

gateway는 시작 시 업데이트 힌트도 기록합니다(`update.checkOnStart: false`로 비활성화).

## 업데이트 후

<Steps>

### doctor 실행

```bash
openclaw doctor
```

구성을 마이그레이션하고, DM 정책을 감사하고, gateway 상태를 확인합니다. 자세한 내용: [Doctor](/ko/gateway/doctor)

### gateway 재시작

```bash
openclaw gateway restart
```

### 확인

```bash
openclaw health
```

</Steps>

## 롤백

### 버전 고정(npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

팁: `npm view openclaw version`은 현재 게시된 버전을 보여줍니다.

### 커밋 고정(소스)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

최신 상태로 돌아가려면: `git checkout main && git pull`.

## 막혔을 때

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요.
- 소스 체크아웃에서 `openclaw update --channel dev`를 사용할 때, 업데이터는 필요하면 자동으로 `pnpm`을 부트스트랩합니다. pnpm/corepack 부트스트랩 오류가 보이면 `pnpm`을 수동으로 설치하거나(`corepack`을 다시 활성화한 뒤) 업데이트를 다시 실행하세요.
- 확인: [Troubleshooting](/ko/gateway/troubleshooting)
- Discord에서 문의: [https://discord.gg/clawd](https://discord.gg/clawd)

## 관련 항목

- [Install Overview](/ko/install) — 모든 설치 방법
- [Doctor](/ko/gateway/doctor) — 업데이트 후 상태 확인
- [Migrating](/ko/install/migrating) — 주요 버전 마이그레이션 가이드
