---
read_when:
    - Você quer um guia amigável para iniciantes sobre a TUI
    - Você precisa da lista completa de recursos, comandos e atalhos da TUI
summary: 'UI de terminal (TUI): conecte-se ao Gateway de qualquer máquina'
title: TUI
x-i18n:
    generated_at: "2026-04-05T12:57:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (UI de terminal)

## Início rápido

1. Inicie o Gateway.

```bash
openclaw gateway
```

2. Abra a TUI.

```bash
openclaw tui
```

3. Digite uma mensagem e pressione Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` se o seu Gateway usar autenticação por senha.

## O que você vê

- Cabeçalho: URL da conexão, agente atual, sessão atual.
- Log do chat: mensagens do usuário, respostas do assistente, avisos do sistema, cartões de ferramentas.
- Linha de status: estado da conexão/execução (conectando, em execução, transmitindo, inativo, erro).
- Rodapé: estado da conexão + agente + sessão + modelo + think/fast/verbose/reasoning + contagens de tokens + deliver.
- Entrada: editor de texto com preenchimento automático.

## Modelo mental: agentes + sessões

- Agentes são slugs únicos (por exemplo, `main`, `research`). O Gateway expõe a lista.
- Sessões pertencem ao agente atual.
- Chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, a TUI expande isso para `agent:<currentAgent>:main`.
  - Se você digitar `/session agent:other:main`, você muda explicitamente para a sessão desse agente.
- Escopo da sessão:
  - `per-sender` (padrão): cada agente tem muitas sessões.
  - `global`: a TUI sempre usa a sessão `global` (o seletor pode estar vazio).
- O agente + sessão atuais ficam sempre visíveis no rodapé.

## Envio + entrega

- As mensagens são enviadas ao Gateway; a entrega aos provedores fica desativada por padrão.
- Ative a entrega:
  - `/deliver on`
  - ou o painel Settings
  - ou inicie com `openclaw tui --deliver`

## Seletores + sobreposições

- Seletor de modelo: lista os modelos disponíveis e define a substituição da sessão.
- Seletor de agente: escolhe um agente diferente.
- Seletor de sessão: mostra apenas sessões do agente atual.
- Settings: alterna entrega, expansão da saída de ferramentas e visibilidade do thinking.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: abortar a execução ativa
- Ctrl+C: limpar a entrada (pressione duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelo
- Ctrl+G: seletor de agente
- Ctrl+P: seletor de sessão
- Ctrl+O: alternar expansão da saída de ferramentas
- Ctrl+T: alternar visibilidade do thinking (recarrega o histórico)

## Comandos de barra

Principais:

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Controles de sessão:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo de vida da sessão:

- `/new` ou `/reset` (redefine a sessão)
- `/abort` (aborta a execução ativa)
- `/settings`
- `/exit`

Outros comandos de barra do Gateway (por exemplo, `/context`) são encaminhados ao Gateway e mostrados como saída do sistema. Consulte [Comandos de barra](/tools/slash-commands).

## Comandos de shell locais

- Prefixe uma linha com `!` para executar um comando de shell local no host da TUI.
- A TUI solicita uma vez por sessão a permissão para execução local; recusar mantém `!` desativado para a sessão.
- Os comandos são executados em um shell novo e não interativo no diretório de trabalho da TUI (sem `cd`/env persistente).
- Os comandos de shell locais recebem `OPENCLAW_SHELL=tui-local` no ambiente.
- Um `!` sozinho é enviado como uma mensagem normal; espaços à esquerda não acionam execução local.

## Saída de ferramentas

- Chamadas de ferramentas aparecem como cartões com args + resultados.
- Ctrl+O alterna entre visualizações recolhida/expandida.
- Enquanto as ferramentas executam, atualizações parciais são transmitidas para o mesmo cartão.

## Cores do terminal

- A TUI mantém o texto do corpo do assistente na cor de primeiro plano padrão do terminal para que terminais escuros e claros permaneçam legíveis.
- Se o terminal usar um fundo claro e a detecção automática estiver errada, defina `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forçar a paleta escura original, defina `OPENCLAW_THEME=dark`.

## Histórico + streaming

- Ao conectar, a TUI carrega o histórico mais recente (padrão de 200 mensagens).
- Respostas em streaming são atualizadas no lugar até serem finalizadas.
- A TUI também escuta eventos de ferramentas do agente para fornecer cartões de ferramentas mais ricos.

## Detalhes da conexão

- A TUI se registra no Gateway como `mode: "tui"`.
- Reconexões mostram uma mensagem do sistema; lacunas de eventos aparecem no log.

## Opções

- `--url <url>`: URL do WebSocket do Gateway (o padrão é a configuração ou `ws://127.0.0.1:<port>`)
- `--token <token>`: token do Gateway (se necessário)
- `--password <password>`: senha do Gateway (se necessário)
- `--session <key>`: chave da sessão (padrão: `main`, ou `global` quando o escopo é global)
- `--deliver`: entregar respostas do assistente ao provedor (desativado por padrão)
- `--thinking <level>`: substitui o nível de thinking para envios
- `--message <text>`: envia uma mensagem inicial após conectar
- `--timeout-ms <ms>`: tempo limite do agente em ms (o padrão é `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entradas do histórico a carregar (padrão `200`)

Observação: quando você define `--url`, a TUI não usa credenciais da configuração ou do ambiente como fallback.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

## Solução de problemas

Sem saída após enviar uma mensagem:

- Execute `/status` na TUI para confirmar que o Gateway está conectado e inativo/ocupado.
- Verifique os logs do Gateway: `openclaw logs --follow`.
- Confirme que o agente pode ser executado: `openclaw status` e `openclaw models status`.
- Se você espera mensagens em um canal de chat, ative a entrega (`/deliver on` ou `--deliver`).

## Solução de problemas de conexão

- `disconnected`: verifique se o Gateway está em execução e se `--url/--token/--password` estão corretos.
- Nenhum agente no seletor: verifique `openclaw agents list` e sua configuração de roteamento.
- Seletor de sessão vazio: você pode estar no escopo global ou ainda não ter sessões.

## Relacionado

- [Control UI](/web/control-ui) — interface de controle baseada na web
- [Referência da CLI](/cli) — referência completa de comandos da CLI
