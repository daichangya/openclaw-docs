---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando o roteamento de comandos ou permissões
summary: 'Comandos de barra: texto vs nativos, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-21T17:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos de barra

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **autônoma** que começa com `/`.
O comando de chat bash somente do host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens autônomas `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não apenas com diretivas), elas são tratadas como “dicas inline” e **não** persistem as configurações da sessão.
  - Em mensagens somente com diretivas (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - As diretivas só são aplicadas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única
    allowlist usada; caso contrário, a autorização vem das allowlists/emparelhamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem as diretivas tratadas como texto simples.

Também há alguns **atalhos inline** (somente remetentes autorizados/na allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Eles são executados imediatamente, removidos antes que o modelo veja a mensagem, e o texto restante continua pelo fluxo normal.

## Configuração

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (padrão `true`) ativa a análise de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), os comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ligado para Discord/Telegram; desligado para Slack (até você adicionar slash commands); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram na inicialização. Os comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **skill** de forma nativa quando houver suporte.
  - Auto: ligado para Discord/Telegram; desligado para Slack (o Slack exige a criação de um slash command por skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) ativa `! <cmd>` para executar comandos do shell do host (`/bash <cmd>` é um alias; requer allowlists de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash espera antes de mudar para o modo em segundo plano (`0` envia para segundo plano imediatamente).
- `commands.config` (padrão `false`) ativa `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) ativa `/mcp` (lê/grava a configuração de MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) ativa `/plugins` (descoberta/status de plugins mais controles de instalar + ativar/desativar).
- `commands.debug` (padrão `false`) ativa `/debug` (substituições somente de runtime).
- `commands.restart` (padrão `true`) ativa `/restart` mais ações de ferramenta para reiniciar o gateway.
- `commands.ownerAllowFrom` (opcional) define a allowlist explícita do proprietário para superfícies de comandos/ferramentas exclusivas do proprietário. Isso é separado de `commands.allowFrom`.
- `commands.ownerDisplay` controla como os ids do proprietário aparecem no prompt do sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma allowlist por provedor para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (allowlists/emparelhamento do canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas do provedor têm precedência.
- `commands.useAccessGroups` (padrão `true`) aplica allowlists/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte da verdade atual:

- os comandos embutidos do núcleo vêm de `src/auto-reply/commands-registry.shared.ts`
- os comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- os comandos de plugins vêm de chamadas `registerCommand()` do plugin
- a disponibilidade real no seu gateway ainda depende de flags de configuração, superfície do canal e plugins instalados/ativados

### Comandos embutidos do núcleo

Comandos embutidos disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
- `/reset soft [message]` mantém a transcrição atual, descarta ids de sessão reutilizados do backend CLI e executa novamente, no lugar, o carregamento inicial/de prompt do sistema.
- `/compact [instructions]` compacta o contexto da sessão. Veja [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` interrompe a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do vínculo da thread.
- `/think <level>` define o nível de raciocínio. As opções vêm do perfil do provedor do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou apenas binário `on` quando houver suporte. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/trace on|off` alterna a saída de rastreamento de plugin para a sessão atual.
- `/fast [status|on|off]` mostra ou define o modo rápido.
- `/reasoning [on|off|stream]` alterna a visibilidade do raciocínio. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define os padrões de execução.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores ou modelos de um provedor.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o resumo curto de ajuda.
- `/commands` mostra o catálogo de comandos gerado.
- `/tools [compact|verbose]` mostra o que o agente atual pode usar neste momento.
- `/status` mostra o status do runtime, incluindo uso/cota do provedor quando disponível.
- `/tasks` lista tarefas em segundo plano ativas/recentes para a sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/whoami` mostra seu id de remetente. Alias: `/id`.
- `/skill <name> [input]` executa uma skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas da allowlist. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação de execução.
- `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Veja [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes para a sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou o tópico/conversa do Telegram a um alvo de sessão.
- `/unfocus` remove o vínculo atual.
- `/agents` lista agentes vinculados à thread para a sessão atual.
- `/kill <id|#|all>` interrompe um ou todos os subagentes em execução.
- `/steer <id|#> <message>` envia direcionamento para um subagente em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Somente proprietário. Requer `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração do servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Somente proprietário. Requer `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado do plugin. `/plugin` é um alias. Somente proprietário para gravações. Requer `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia substituições de configuração somente de runtime. Somente proprietário. Requer `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Veja [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando ativado. Padrão: ativado; defina `commands.restart: false` para desativá-lo.
- `/activation mention|always` define o modo de ativação em grupo.
- `/send on|off|inherit` define a política de envio. Somente proprietário.
- `/bash <command>` executa um comando do shell do host. Somente texto. Alias: `! <command>`. Requer `commands.bash: true` mais allowlists de `tools.elevated`.
- `!poll [sessionId]` verifica um trabalho bash em segundo plano.
- `!stop [sessionId]` interrompe um trabalho bash em segundo plano.

### Comandos dock gerados

Os comandos dock são gerados a partir de plugins de canal com suporte a comandos nativos. Conjunto empacotado atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins empacotados

Os plugins empacotados podem adicionar mais slash commands. Comandos empacotados atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna o dreaming de memória. Veja [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de emparelhamento/configuração do dispositivo. Veja [Pairing](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de Node do telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia predefinições de rich card do LINE. Veja [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness app-server Codex empacotado. Veja [Codex Harness](/pt-BR/plugins/codex-harness).
- Comandos somente do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de skill

As skills invocáveis pelo usuário também são expostas como slash commands:

- `/skill <name> [input]` sempre funciona como o ponto de entrada genérico.
- as skills também podem aparecer como comandos diretos como `/prose` quando a skill/o plugin os registra.
- o registro nativo de comandos de skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Notas:

- Os comandos aceitam um `:` opcional entre o comando e os args (por exemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência difusa); se não houver correspondência, o texto é tratado como o corpo da mensagem.
- Para o detalhamento completo de uso por provedor, use `openclaw status --usage`.
- `/allowlist add|remove` requer `commands.config=true` e respeita `configWrites` do canal.
- Em canais com várias contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` é ativado por padrão; defina `commands.restart: false` para desativá-lo.
- `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração do plugin e pode solicitar um reinício.
- Comando nativo somente do Discord: `/vc join|leave|status` controla canais de voz (requer `channels.discord.voice` e comandos nativos; não disponível como texto).
- Os comandos de vínculo de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que os vínculos de thread efetivos estejam ativados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência do comando ACP e comportamento de runtime: [ACP Agents](/pt-BR/tools/acp-agents).
- `/verbose` é destinado a depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
- `/trace` é mais restrito que `/verbose`: ele apenas revela linhas de rastreamento/depuração pertencentes ao plugin e mantém desativado o chatter normal detalhado de ferramentas.
- `/fast on|off` persiste uma substituição da sessão. Use a opção `inherit` da UI de Sessões para limpá-la e voltar aos padrões da configuração.
- `/fast` é específico por provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos Responses, enquanto solicitações públicas diretas para Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Veja [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning`, `/verbose` e `/trace` são arriscados em ambientes de grupo: podem revelar raciocínio interno, saída de ferramenta ou diagnósticos de plugin que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats de grupo.
- `/model` persiste imediatamente o novo modelo da sessão.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia com o novo modelo em um ponto limpo de nova tentativa.
- Se a atividade de ferramenta ou a saída da resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de nova tentativa ou o próximo turno do usuário.
- **Caminho rápido:** mensagens somente com comandos de remetentes na allowlist são tratadas imediatamente (ignorando fila + modelo).
- **Bloqueio por menção em grupo:** mensagens somente com comandos de remetentes na allowlist ignoram requisitos de menção.
- **Atalhos inline (somente remetentes na allowlist):** certos comandos também funcionam quando incorporados em uma mensagem normal e são removidos antes que o modelo veja o restante do texto.
  - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens somente com comandos não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de skill:** skills `user-invocable` são expostas como slash commands. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo, `_2`).
  - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comandos nativos impedem comandos por skill).
  - Por padrão, comandos de skill são encaminhados ao modelo como uma solicitação normal.
  - As skills podem opcionalmente declarar `command-dispatch: tool` para encaminhar o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — veja [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite args obrigatórios). Telegram e Slack mostram um menu de botões quando um comando oferece escolhas e você omite o arg.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora
nesta conversa**.

- O padrão de `/tools` é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies com comandos nativos que oferecem suporte a argumentos expõem a mesma troca de modo como `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente acessíveis em runtime, incluindo ferramentas do núcleo, ferramentas de
  plugins conectados e ferramentas pertencentes ao canal.

Para editar perfis e substituições, use o painel Tools da UI de Controle ou as superfícies de config/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provedor** (exemplo: “Claude 80% restante”) aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está ativado. O OpenClaw normaliza janelas de provedor para `% restante`; no MiniMax, campos de percentual apenas-restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano com tag do modelo.
- **Linhas de tokens/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão ao vivo é escasso. Valores ativos existentes diferentes de zero ainda prevalecem, e o fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior orientado ao prompt quando os totais armazenados estiverem ausentes ou forem menores.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado às respostas normais).
- `/model status` trata de **modelos/auth/endpoints**, não de uso.

## Seleção de modelo (`/model`)

`/model` é implementado como uma diretiva.

Exemplos:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Notas:

- `/model` e `/model list` mostram um seletor compacto numerado (família do modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo mais uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provedor (`baseUrl`) e o modo de API (`api`) quando disponíveis.

## Substituições de depuração

`/debug` permite definir substituições de configuração **somente de runtime** (memória, não disco). Somente proprietário. Desativado por padrão; ative com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- As substituições são aplicadas imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`.
- Use `/debug reset` para limpar todas as substituições e voltar à configuração em disco.

## Saída de rastreamento de plugin

`/trace` permite alternar **linhas de rastreamento/depuração de plugin com escopo de sessão** sem ativar o modo detalhado completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sem argumento mostra o estado atual de rastreamento da sessão.
- `/trace on` ativa linhas de rastreamento de plugin para a sessão atual.
- `/trace off` as desativa novamente.
- Linhas de rastreamento de plugin podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` continua gerenciando substituições de configuração somente de runtime.
- `/trace` não substitui `/verbose`; a saída normal detalhada de ferramentas/status continua pertencendo a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Somente proprietário. Desativado por padrão; ative com `commands.config: true`.

Exemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notas:

- A configuração é validada antes da gravação; alterações inválidas são rejeitadas.
- As atualizações de `/config` persistem após reinicializações.

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente proprietário. Desativado por padrão; ative com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` armazena configuração na config do OpenClaw, não em configurações de projeto de propriedade do Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

## Atualizações de plugins

`/plugins` permite que operadores inspecionem plugins descobertos e alternem a ativação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desativado por padrão; ative com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notas:

- `/plugins list` e `/plugins show` usam descoberta real de plugins com base no workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após alterações de ativação/desativação, reinicie o gateway para aplicá-las.

## Notas de superfície

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (direciona para a sessão do chat via `CommandTargetSessionKey`)
- **`/stop`** mira a sessão de chat ativa para que possa interromper a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você ativar `commands.native`, deverá criar um slash command do Slack por comando embutido (com os mesmos nomes de `/help`). Menus de argumentos de comando para o Slack são entregues como botões efêmeros do Block Kit.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O `/status` em texto ainda funciona em mensagens do Slack.

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferentemente do chat normal:

- ele usa a sessão atual como contexto de fundo,
- ele é executado como uma chamada única separada **sem ferramentas**,
- ele não altera o contexto futuro da sessão,
- ele não é gravado no histórico da transcrição,
- ele é entregue como um resultado paralelo ao vivo em vez de uma mensagem normal do assistente.

Isso faz de `/btw` algo útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Veja [BTW Side Questions](/pt-BR/tools/btw) para o comportamento completo e os
detalhes de UX do cliente.
