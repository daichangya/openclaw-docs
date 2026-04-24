---
read_when:
    - gateway 서비스 및/또는 로컬 상태를 제거하려는 것입니다.
    - 먼저 드라이런을 실행하려는 것입니다.
summary: '`openclaw uninstall`에 대한 CLI 참조(gateway 서비스 + 로컬 데이터 제거)'
title: Uninstall
x-i18n:
    generated_at: "2026-04-24T06:09:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

gateway 서비스 + 로컬 데이터를 제거합니다(CLI는 유지됨).

옵션:

- `--service`: gateway 서비스를 제거합니다
- `--state`: 상태 및 config를 제거합니다
- `--workspace`: 워크스페이스 디렉터리를 제거합니다
- `--app`: macOS 앱을 제거합니다
- `--all`: 서비스, 상태, 워크스페이스, 앱을 모두 제거합니다
- `--yes`: 확인 프롬프트를 건너뜁니다
- `--non-interactive`: 프롬프트를 비활성화합니다. `--yes`가 필요합니다
- `--dry-run`: 파일을 제거하지 않고 수행할 작업만 출력합니다

예시:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

참고:

- 상태 또는 워크스페이스를 제거하기 전에 복원 가능한 스냅샷이 필요하면 먼저 `openclaw backup create`를 실행하세요.
- `--all`은 서비스, 상태, 워크스페이스, 앱을 함께 제거하는 축약형입니다.
- `--non-interactive`에는 `--yes`가 필요합니다.

## 관련

- [CLI reference](/ko/cli)
- [Uninstall](/ko/install/uninstall)
