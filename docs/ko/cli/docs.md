---
read_when:
    - 터미널에서 실시간 OpenClaw 문서를 검색하려고 합니다.
summary: '`openclaw docs`에 대한 CLI 참조(실시간 문서 인덱스 검색)'
title: 문서
x-i18n:
    generated_at: "2026-04-24T06:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

실시간 문서 인덱스를 검색합니다.

인수:

- `[query...]`: 실시간 문서 인덱스로 보낼 검색어

예시:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

참고:

- 쿼리 없이 실행하면 `openclaw docs`는 실시간 문서 검색 진입점을 엽니다.
- 여러 단어 쿼리는 하나의 검색 요청으로 그대로 전달됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
