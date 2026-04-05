---
read_when:
    - Você quer o catálogo OpenCode Go
    - Você precisa das refs de modelo em runtime para modelos hospedados em Go
summary: Use o catálogo OpenCode Go com a configuração compartilhada do OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T12:51:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go é o catálogo Go dentro do [OpenCode](/providers/opencode).
Ele usa a mesma `OPENCODE_API_KEY` do catálogo Zen, mas mantém o id de provedor em runtime
`opencode-go` para que o roteamento upstream por modelo continue correto.

## Modelos compatíveis

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Configuração da CLI

```bash
openclaw onboard --auth-choice opencode-go
# ou de forma não interativa
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Trecho de configuração

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Comportamento de roteamento

O OpenClaw lida com o roteamento por modelo automaticamente quando a ref do modelo usa `opencode-go/...`.

## Observações

- Use [OpenCode](/providers/opencode) para o onboarding compartilhado e a visão geral do catálogo.
- As refs de runtime permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
