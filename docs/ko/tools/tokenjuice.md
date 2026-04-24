---
read_when:
    - OpenClaw에서 더 짧은 `exec` 또는 `bash` 도구 결과를 원합니다
    - 번들 tokenjuice Plugin을 활성화하고 싶습니다
    - tokenjuice가 무엇을 바꾸고 무엇을 원본 그대로 두는지 이해해야 합니다
summary: 시끄러운 exec 및 bash 도구 결과를 선택적 번들 Plugin으로 압축하기
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T06:42:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice`는 명령이 이미 실행된 뒤 시끄러운 `exec` 및 `bash`
도구 결과를 압축하는 선택적 번들 Plugin입니다.

이것은 명령 자체가 아니라 반환되는 `tool_result`를 바꿉니다. Tokenjuice는
셸 입력을 다시 쓰거나, 명령을 재실행하거나, 종료 코드를 바꾸지 않습니다.

현재는 Pi 내장 실행에 적용되며, tokenjuice는 내장
`tool_result` 경로에 hook을 걸어 세션으로 다시 들어가는 출력을 줄입니다.

## Plugin 활성화

빠른 방법:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

동일한 방법:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw는 이미 이 Plugin을 함께 제공합니다. 별도의 `plugins install`
또는 `tokenjuice install openclaw` 단계는 없습니다.

config를 직접 편집하고 싶다면:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice가 바꾸는 것

- 세션에 다시 들어가기 전에 시끄러운 `exec` 및 `bash` 결과를 압축합니다.
- 원래 명령 실행은 그대로 유지합니다.
- 정확한 파일 내용 읽기와 tokenjuice가 원본 그대로 두어야 하는 다른 명령은 보존합니다.
- 옵트인 방식으로 유지됩니다. 어디서나 축어 출력이 필요하다면 Plugin을 비활성화하세요.

## 작동 확인

1. Plugin을 활성화합니다.
2. `exec`를 호출할 수 있는 세션을 시작합니다.
3. `git status` 같은 시끄러운 명령을 실행합니다.
4. 반환된 도구 결과가 원시 셸 출력보다 더 짧고 구조화되어 있는지 확인합니다.

## Plugin 비활성화

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

또는:

```bash
openclaw plugins disable tokenjuice
```

## 관련 항목

- [Exec 도구](/ko/tools/exec)
- [사고 수준](/ko/tools/thinking)
- [컨텍스트 엔진](/ko/concepts/context-engine)
