---
read_when:
    - Depurar a visualização do WebChat no Mac ou a porta de loopback
summary: Como o app Mac incorpora o WebChat do gateway e como depurá-lo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-05T12:48:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (app macOS)

O app de barra de menus do macOS incorpora a UI do WebChat como uma visualização SwiftUI nativa. Ele
se conecta ao Gateway e usa por padrão a **sessão principal** do
agente selecionado (com um alternador de sessão para outras sessões).

- **Modo local**: conecta-se diretamente ao WebSocket do Gateway local.
- **Modo remoto**: encaminha a porta de controle do Gateway por SSH e usa esse
  túnel como plano de dados.

## Inicialização e depuração

- Manual: menu Lobster → “Open Chat”.
- Abertura automática para testes:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logs: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Como é conectado

- Plano de dados: métodos WS do Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` e eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` retorna linhas de transcrição normalizadas para exibição: tags de
  diretiva inline são removidas do texto visível, cargas XML de chamada de
  ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamada de
  ferramenta) e tokens de controle do modelo em ASCII/largura completa vazados
  são removidos, linhas do assistente compostas apenas por tokens silenciosos
  como `NO_REPLY` / `no_reply` exatos são omitidas,
  e linhas muito grandes podem ser substituídas por placeholders.
- Sessão: usa por padrão a sessão primária (`main`, ou `global` quando o escopo é
  global). A UI pode alternar entre sessões.
- O onboarding usa uma sessão dedicada para manter a configuração da primeira execução separada.

## Superfície de segurança

- O modo remoto encaminha apenas a porta de controle do WebSocket do Gateway por SSH.

## Limitações conhecidas

- A UI é otimizada para sessões de chat (não para um sandbox completo de navegador).
