---
read_when:
    - Você quer acesso a modelos hospedados pelo OpenCode
    - Você quer escolher entre os catálogos Zen e Go
summary: Use os catálogos Zen e Go do OpenCode com OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T12:51:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

O OpenCode expõe dois catálogos hospedados no OpenClaw:

- `opencode/...` para o catálogo **Zen**
- `opencode-go/...` para o catálogo **Go**

Ambos os catálogos usam a mesma chave de API do OpenCode. O OpenClaw mantém os ids de provedor de runtime
separados para que o roteamento upstream por modelo continue correto, mas o onboarding e a documentação os tratam
como uma única configuração do OpenCode.

## Configuração da CLI

### Catálogo Zen

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Catálogo Go

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Trecho de configuração

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos

### Zen

- Provedor de runtime: `opencode`
- Modelos de exemplo: `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Ideal quando você quer o proxy multimodelo selecionado do OpenCode

### Go

- Provedor de runtime: `opencode-go`
- Modelos de exemplo: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Ideal quando você quer a linha Kimi/GLM/MiniMax hospedada pelo OpenCode

## Observações

- `OPENCODE_ZEN_API_KEY` também é compatível.
- Inserir uma chave do OpenCode durante a configuração armazena credenciais para ambos os provedores de runtime.
- Você faz login no OpenCode, adiciona os detalhes de cobrança e copia sua chave de API.
- O faturamento e a disponibilidade do catálogo são gerenciados pelo dashboard do OpenCode.
- Referências OpenCode baseadas em Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
  o saneamento de thought-signature do Gemini ali sem habilitar a validação nativa de replay do Gemini
  nem reescritas de bootstrap.
- Referências OpenCode que não são Gemini mantêm a política mínima de replay compatível com OpenAI.
