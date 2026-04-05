---
read_when:
    - Depurando ou configurando o acesso ao WebChat
summary: Host estático do WebChat em loopback e uso do WS do Gateway para a interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-05T12:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (interface WebSocket do Gateway)

Status: a interface de chat SwiftUI do macOS/iOS se comunica diretamente com o WebSocket do Gateway.

## O que é

- Uma interface de chat nativa para o gateway (sem navegador embutido e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o gateway.
2. Abra a interface do WebChat (app macOS/iOS) ou a aba de chat da Control UI.
3. Verifique se um caminho de autenticação válido do gateway está configurado (segredo compartilhado por padrão,
   mesmo no loopback local).

## Como funciona (comportamento)

- A interface se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` também é normalizado para exibição: tags de diretiva de entrega inline
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, cargas XML de chamada de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e
  tokens de controle de modelo vazados em ASCII/largura total são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro seja apenas o
  token silencioso exato `NO_REPLY` / `no_reply` são omitidas.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a interface (sem execução do agente).
- Execuções abortadas podem manter saída parcial do assistente visível na interface.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer, e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado do gateway (sem monitoramento de arquivo local).
- Se o gateway estiver inacessível, o WebChat ficará somente leitura.

## Painel de ferramentas de agentes da Control UI

- O painel Tools em `/agents` da Control UI tem duas visualizações separadas:
  - **Disponível agora** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    pode realmente usar em runtime, incluindo ferramentas do core, de plugin e pertencentes ao canal.
  - **Configuração da ferramenta** usa `tools.catalog` e permanece focado em perfis, substituições e
    semântica do catálogo.
- A disponibilidade em runtime é definida por sessão. Trocar de sessão no mesmo agente pode alterar a lista
  **Disponível agora**.
- O editor de configuração não implica disponibilidade em runtime; o acesso efetivo ainda segue a precedência
  da política (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto encapsula o WebSocket do gateway por SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: contagem máxima de caracteres para campos de texto em respostas `chat.history`. Quando uma entrada da transcrição excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um marcador. O cliente também pode enviar `maxChars` por requisição para substituir esse padrão em uma única chamada `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a aba de chat da Control UI no navegador pode usar cabeçalhos de identidade do Tailscale
  Serve quando ativado.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso para clientes de navegador atrás de uma origem de proxy **fora de loopback** com reconhecimento de identidade (consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino do gateway remoto.
- `session.*`: armazenamento de sessão e padrões de chave principal.
