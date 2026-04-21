---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando o roteamento de comandos ou permissões
summary: 'Comandos slash: texto vs nativo, configuração e comandos compatíveis'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-21T13:39:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d90ddee54af7c05b7fdf486590561084581d750e42cd14674d43bbdc0984df5d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos slash

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **autônoma** que começa com `/`.
O comando de chat bash somente-host usa `! <cmd>` (com `/bash <cmd>` como alias).

Existem dois sistemas relacionados:

- **Comandos**: mensagens autônomas `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não somente-diretiva), elas são tratadas como “dicas inline” e **não** persistem configurações da sessão.
  - Em mensagens somente-diretiva (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - As diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única
    lista de permissões usada; caso contrário, a autorização virá das listas de permissões/pareamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados verão as diretivas tratadas como texto simples.

Também há alguns **atalhos inline** (somente remetentes em lista de permissões/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Eles são executados imediatamente, são removidos antes que o modelo veja a mensagem, e o texto restante continua pelo fluxo normal.

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

- `commands.text` (padrão `true`) habilita o parsing de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), os comandos de texto continuam funcionando mesmo que você defina isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ligado para Discord/Telegram; desligado para Slack (até você adicionar comandos slash); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram na inicialização. Os comandos do Slack são gerenciados no app Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **skill** nativamente quando compatível.
  - Auto: ligado para Discord/Telegram; desligado para Slack (o Slack exige criar um comando slash por skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para executar comandos de shell no host (`/bash <cmd>` é um alias; exige listas de permissões de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla por quanto tempo o bash espera antes de mudar para o modo em segundo plano (`0` envia para segundo plano imediatamente).
- `commands.config` (padrão `false`) habilita `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) habilita `/mcp` (lê/grava a configuração de MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) habilita `/plugins` (descoberta/status de Plugin mais controles de instalar + habilitar/desabilitar).
- `commands.debug` (padrão `false`) habilita `/debug` (substituições somente de runtime).
- `commands.restart` (padrão `true`) habilita `/restart` mais ações de ferramenta de reinicialização do Gateway.
- `commands.ownerAllowFrom` (opcional) define a lista de permissões explícita de owner para superfícies de comando/ferramenta exclusivas do owner. Isso é separado de `commands.allowFrom`.
- `commands.ownerDisplay` controla como ids de owner aparecem no prompt de sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma lista de permissões por provedor para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (listas de permissões/pareamento do canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas de provedor o substituem.
- `commands.useAccessGroups` (padrão `true`) aplica listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte de verdade atual:

- comandos embutidos do núcleo vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de Plugin vêm de chamadas `registerCommand()` do Plugin
- a disponibilidade real no seu Gateway ainda depende de flags de configuração, superfície do canal e Plugins instalados/habilitados

### Comandos embutidos do núcleo

Comandos embutidos disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
- `/compact [instructions]` faz Compaction do contexto da sessão. Consulte [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` aborta a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do vínculo de thread.
- `/think <level>` define o nível de thinking. As opções vêm do perfil do provedor do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou `on` binário apenas onde houver suporte. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/trace on|off` alterna a saída de rastreamento de Plugin para a sessão atual.
- `/fast [status|on|off]` mostra ou define o modo rápido.
- `/reasoning [on|off|stream]` alterna a visibilidade de reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define padrões de exec.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores ou modelos de um provedor.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o resumo curto de ajuda.
- `/commands` mostra o catálogo de comandos gerado.
- `/tools [compact|verbose]` mostra o que o agente atual pode usar agora.
- `/status` mostra o status do runtime, incluindo uso/quota do provedor quando disponível.
- `/tasks` lista tarefas ativas/recentes em segundo plano da sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/whoami` mostra seu id de remetente. Alias: `/id`.
- `/skill <name> [input]` executa uma skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas da lista de permissões. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação do exec.
- `/btw <question>` faz uma pergunta lateral sem alterar o contexto futuro da sessão. Consulte [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes da sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou tópico/conversa do Telegram a um destino de sessão.
- `/unfocus` remove o vínculo atual.
- `/agents` lista agentes vinculados à thread da sessão atual.
- `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
- `/steer <id|#> <message>` envia direcionamento para um subagente em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Somente owner. Exige `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Somente owner. Exige `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado do Plugin. `/plugin` é um alias. Somente owner para gravações. Exige `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia substituições de configuração somente de runtime. Somente owner. Exige `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulte [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando habilitado. Padrão: habilitado; defina `commands.restart: false` para desabilitá-lo.
- `/activation mention|always` define o modo de ativação de grupo.
- `/send on|off|inherit` define a política de envio. Somente owner.
- `/bash <command>` executa um comando de shell no host. Somente texto. Alias: `! <command>`. Exige `commands.bash: true` mais listas de permissões de `tools.elevated`.
- `!poll [sessionId]` verifica um trabalho bash em segundo plano.
- `!stop [sessionId]` interrompe um trabalho bash em segundo plano.

### Comandos dock gerados

Comandos dock são gerados a partir de Plugins de canal com suporte a comando nativo. Conjunto incluído atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de Plugin incluídos

Plugins incluídos podem adicionar mais comandos slash. Comandos incluídos atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna Dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de pareamento/configuração de dispositivo. Consulte [Pairing](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de alto risco do node de telefone.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia presets de rich card do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness do app-server Codex incluído. Consulte [Codex Harness](/pt-BR/plugins/codex-harness).
- Comandos somente de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de skill

Skills invocáveis por usuário também são expostas como comandos slash:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- skills também podem aparecer como comandos diretos como `/prose` quando a skill/Plugin os registra.
- o registro nativo de comandos de skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Observações:

- Os comandos aceitam um `:` opcional entre o comando e os argumentos (ex.: `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto será tratado como corpo da mensagem.
- Para a divisão completa de uso por provedor, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com múltiplas contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` vem habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
- `/plugins install <spec>` aceita as mesmas especificações de Plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração do Plugin e pode solicitar uma reinicialização.
- Comando nativo somente do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não disponível como texto).
- Comandos de vínculo de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que vínculos de thread efetivos estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comando ACP e comportamento de runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
- `/verbose` é voltado para depuração e visibilidade extra; mantenha-o **desligado** no uso normal.
- `/trace` é mais restrito que `/verbose`: ele revela apenas linhas de trace/debug do Plugin e mantém desativado o chatter normal e detalhado de ferramentas.
- `/fast on|off` persiste uma substituição de sessão. Use a opção `inherit` da UI de Sessions para limpá-la e voltar aos padrões da configuração.
- `/fast` é específico do provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos de Responses, enquanto solicitações Anthropic públicas diretas, incluindo tráfego autenticado por OAuth enviado a `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta continuam sendo mostrados quando relevantes, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning`, `/verbose` e `/trace` são arriscados em configurações de grupo: podem revelar reasoning interno, saída de ferramenta ou diagnósticos de Plugin que você não pretendia expor. Prefira mantê-los desligados, especialmente em chats em grupo.
- `/model` persiste imediatamente o novo modelo da sessão.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia com o novo modelo em um ponto limpo de nova tentativa.
- Se a atividade de ferramenta ou a saída de resposta já tiver começado, a troca pendente pode permanecer em fila até uma oportunidade posterior de nova tentativa ou até o próximo turno do usuário.
- **Caminho rápido:** mensagens somente-comando de remetentes em lista de permissões são tratadas imediatamente (ignorando fila + modelo).
- **Bloqueio por menção em grupo:** mensagens somente-comando de remetentes em lista de permissões ignoram exigências de menção.
- **Atalhos inline (somente remetentes em lista de permissões):** certos comandos também funcionam quando embutidos em uma mensagem normal e são removidos antes que o modelo veja o texto restante.
  - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens somente-comando não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de skill:** Skills `user-invocable` são expostas como comandos slash. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (ex.: `_2`).
  - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comando nativo impedem comandos por skill).
  - Por padrão, comandos de skill são encaminhados ao modelo como uma solicitação normal.
  - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (Plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu de botões quando um comando oferece opções e você omite o argumento.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora
nesta conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo com suporte a argumentos expõem a mesma troca de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente acessíveis em runtime, incluindo ferramentas do núcleo, ferramentas de
  Plugin conectadas e ferramentas controladas pelo canal.

Para editar perfis e substituições, use o painel Tools da UI de controle ou superfícies de configuração/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/quota do provedor** (exemplo: “Claude 80% restante”) aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provedor para `% restante`; para MiniMax, campos de porcentagem somente-restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano com tag do modelo.
- **Linhas de token/cache** em `/status` podem usar como fallback a entrada de uso mais recente da transcrição quando o snapshot ao vivo da sessão é escasso. Valores ao vivo existentes diferentes de zero ainda prevalecem, e o fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior orientado a prompt quando os totais armazenados estão ausentes ou são menores.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado às respostas normais).
- `/model status` trata de **modelos/autenticação/endpoints**, não de uso.

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

Observações:

- `/model` e `/model list` mostram um seletor compacto numerado (família do modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provedor e modelo mais uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint do provedor configurado (`baseUrl`) e o modo de API (`api`) quando disponíveis.

## Substituições de debug

`/debug` permite definir substituições de configuração **somente de runtime** (memória, não disco). Somente owner. Desabilitado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Observações:

- As substituições se aplicam imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`.
- Use `/debug reset` para limpar todas as substituições e voltar à configuração em disco.

## Saída de trace de Plugin

`/trace` permite alternar **linhas de trace/debug de Plugin com escopo de sessão** sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual de trace da sessão.
- `/trace on` habilita linhas de trace de Plugin para a sessão atual.
- `/trace off` desabilita essas linhas novamente.
- Linhas de trace de Plugin podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` continua gerenciando substituições de configuração somente de runtime.
- `/trace` não substitui `/verbose`; a saída normal detalhada de ferramenta/status ainda pertence a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Somente owner. Desabilitado por padrão; habilite com `commands.config: true`.

Exemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Observações:

- A configuração é validada antes da gravação; alterações inválidas são rejeitadas.
- Atualizações de `/config` persistem após reinicializações.

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente owner. Desabilitado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena a configuração na configuração do OpenClaw, não em configurações de projeto controladas pelo Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

## Atualizações de Plugin

`/plugins` permite que operadores inspecionem Plugins descobertos e alternem a habilitação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desabilitado por padrão; habilite com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Observações:

- `/plugins list` e `/plugins show` usam descoberta real de Plugin no workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do Plugin; não instala nem desinstala Plugins.
- Após alterações de habilitar/desabilitar, reinicie o Gateway para aplicá-las.

## Observações de superfície

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (aponta para a sessão do chat via `CommandTargetSessionKey`)
- **`/stop`** aponta para a sessão de chat ativa para poder abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deverá criar um comando slash do Slack por comando embutido (os mesmos nomes de `/help`). Menus de argumento de comando para o Slack são entregues como botões efêmeros do Block Kit.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O `/status` em texto ainda funciona em mensagens do Slack.

## Perguntas laterais BTW

`/btw` é uma **pergunta lateral** rápida sobre a sessão atual.

Diferentemente do chat normal:

- ele usa a sessão atual como contexto de fundo,
- ele é executado como uma chamada avulsa separada **sem ferramentas**,
- ele não altera o contexto futuro da sessão,
- ele não é gravado no histórico da transcrição,
- ele é entregue como um resultado lateral ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Consulte [BTW Side Questions](/pt-BR/tools/btw) para o comportamento completo e os detalhes
da UX do cliente.
