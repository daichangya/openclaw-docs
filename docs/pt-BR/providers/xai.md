---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando a autenticação da xAI ou IDs de modelo
summary: Use modelos Grok da xAI no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-05T12:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

O OpenClaw inclui um plugin de provedor `xai` empacotado para modelos Grok.

## Configuração

1. Crie uma chave de API no console da xAI.
2. Defina `XAI_API_KEY` ou execute:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Escolha um modelo como:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

O OpenClaw agora usa a API Responses da xAI como transporte xAI empacotado. A mesma
`XAI_API_KEY` também pode alimentar `web_search` com tecnologia Grok, `x_search` de primeira classe
e `code_execution` remoto.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provedor de modelo xAI empacotado agora também reutiliza essa chave como fallback.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.

## Catálogo atual de modelos empacotados

O OpenClaw agora inclui estas famílias de modelos xAI prontas para uso:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

O plugin também resolve por encaminhamento IDs mais novos `grok-4*` e `grok-code-fast*` quando
eles seguem o mesmo formato de API.

Observações sobre modelos rápidos:

- `grok-4-fast`, `grok-4-1-fast` e as variantes `grok-4.20-beta-*` são as
  referências Grok atuais com suporte a imagem no catálogo empacotado.
- `/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
  reescreve solicitações xAI nativas da seguinte forma:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Aliases legados de compatibilidade ainda são normalizados para os IDs canônicos empacotados. Por
exemplo:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Pesquisa na web

O provedor empacotado de pesquisa na web `grok` também usa `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Limites conhecidos

- A autenticação hoje é apenas por chave de API. Ainda não existe fluxo OAuth/código de dispositivo da xAI no OpenClaw.
- `grok-4.20-multi-agent-experimental-beta-0304` não é compatível no caminho normal do provedor xAI porque exige uma superfície de API upstream diferente do transporte xAI padrão do OpenClaw.

## Observações

- O OpenClaw aplica automaticamente correções de compatibilidade específicas da xAI para esquema de ferramentas e chamada de ferramentas no caminho compartilhado do runner.
- Solicitações xAI nativas usam `tool_stream: true` por padrão. Defina
  `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
  desabilitá-lo.
- O wrapper xAI empacotado remove flags estritas de esquema de ferramenta não compatíveis e
  chaves de payload de raciocínio antes de enviar solicitações xAI nativas.
- `web_search`, `x_search` e `code_execution` são expostos como ferramentas do OpenClaw. O OpenClaw habilita o built-in específico da xAI de que precisa dentro de cada solicitação de ferramenta, em vez de anexar todas as ferramentas nativas a cada turno de chat.
- `x_search` e `code_execution` pertencem ao plugin xAI empacotado, em vez de serem codificados diretamente no runtime central de modelos.
- `code_execution` é execução remota em sandbox da xAI, não [`exec`](/tools/exec) local.
- Para a visão geral mais ampla dos provedores, consulte [Provedores de modelos](/providers/index).
