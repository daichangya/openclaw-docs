---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando roteamento de comandos ou permissões
summary: 'Comandos de barra: texto vs nativos, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-05T12:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c91437140732d9accca1094f07b9e05f861a75ac344531aa24cc2ffe000630f
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos de barra

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`.
O comando de chat bash somente no host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens `/...` independentes.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não apenas de diretiva), elas são tratadas como “dicas inline” e **não** persistem as configurações da sessão.
  - Em mensagens somente de diretiva (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - As diretivas só são aplicadas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, essa será a única
    lista de permissões usada; caso contrário, a autorização vem das listas de permissões/emparelhamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem as diretivas tratadas como texto simples.

Também há alguns **atalhos inline** (somente remetentes autorizados/na lista de permissões): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (padrão `true`) habilita a análise de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ligado para Discord/Telegram; desligado para Slack (até você adicionar slash commands); ignorado para providers sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provider (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram na inicialização. Os comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **skill** nativamente quando compatível.
  - Auto: ligado para Discord/Telegram; desligado para Slack (o Slack exige criar um slash command por skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provider (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para executar comandos do shell do host (`/bash <cmd>` é um alias; exige listas de permissões de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla por quanto tempo o bash espera antes de mudar para o modo em segundo plano (`0` envia para segundo plano imediatamente).
- `commands.config` (padrão `false`) habilita `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) habilita `/plugins` (descoberta/status de plugins mais controles de instalar + habilitar/desabilitar).
- `commands.debug` (padrão `false`) habilita `/debug` (substituições somente em tempo de execução).
- `commands.allowFrom` (opcional) define uma lista de permissões por provider para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (listas de permissões/emparelhamento do canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas por provider o substituem.
- `commands.useAccessGroups` (padrão `true`) aplica listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Texto + nativo (quando habilitado):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (mostra o que o agente atual pode usar agora; `verbose` adiciona descrições)
- `/skill <name> [input]` (executa uma skill pelo nome)
- `/status` (mostra o status atual; inclui uso/cota do provider para o provider do modelo atual quando disponível)
- `/tasks` (lista tarefas em segundo plano da sessão atual; mostra detalhes de tarefas ativas e recentes com contagens de fallback locais ao agente)
- `/allowlist` (listar/adicionar/remover entradas da lista de permissões)
- `/approve <id> <decision>` (resolve prompts de aprovação de exec; use a mensagem de aprovação pendente para ver as decisões disponíveis)
- `/context [list|detail|json]` (explica “context”; `detail` mostra tamanho por arquivo + por ferramenta + por skill + do prompt do sistema)
- `/btw <question>` (faz uma pergunta lateral efêmera sobre a sessão atual sem alterar o contexto futuro da sessão; veja [/tools/btw](/pt-BR/tools/btw))
- `/export-session [path]` (alias: `/export`) (exporta a sessão atual para HTML com o prompt completo do sistema)
- `/whoami` (mostra seu ID de remetente; alias: `/id`)
- `/session idle <duration|off>` (gerencia auto-desfoco por inatividade para vínculos de thread com foco)
- `/session max-age <duration|off>` (gerencia auto-desfoco por idade máxima rígida para vínculos de thread com foco)
- `/subagents list|kill|log|info|send|steer|spawn` (inspeciona, controla ou inicia execuções de subagentes para a sessão atual)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (inspeciona e controla sessões de runtime ACP)
- `/agents` (lista agentes vinculados à thread para esta sessão)
- `/focus <target>` (Discord: vincula esta thread, ou uma nova thread, a um alvo de sessão/subagente)
- `/unfocus` (Discord: remove o vínculo atual da thread)
- `/kill <id|#|all>` (aborta imediatamente um ou todos os subagentes em execução desta sessão; sem mensagem de confirmação)
- `/steer <id|#> <message>` (redireciona um subagente em execução imediatamente: durante a execução quando possível; caso contrário, aborta o trabalho atual e reinicia com a mensagem de direcionamento)
- `/tell <id|#> <message>` (alias para `/steer`)
- `/config show|get|set|unset` (persiste a configuração em disco, somente proprietário; exige `commands.config: true`)
- `/mcp show|get|set|unset` (gerencia configuração de servidor MCP do OpenClaw, somente proprietário; exige `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (inspeciona plugins descobertos, instala novos e alterna a habilitação; somente proprietário para escritas; exige `commands.plugins: true`)
  - `/plugin` é um alias para `/plugins`.
  - `/plugin install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
  - Escritas de habilitar/desabilitar ainda respondem com uma dica de reinicialização. Em um gateway em primeiro plano com watch, o OpenClaw pode executar essa reinicialização automaticamente logo após a gravação.
- `/debug show|set|unset|reset` (substituições em tempo de execução, somente proprietário; exige `commands.debug: true`)
- `/usage off|tokens|full|cost` (rodapé de uso por resposta ou resumo de custo local)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (controla TTS; veja [/tts](/tools/tts))
  - Discord: o comando nativo é `/voice` (o Discord reserva `/tts`); o texto `/tts` ainda funciona.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (muda as respostas para Telegram)
- `/dock-discord` (alias: `/dock_discord`) (muda as respostas para Discord)
- `/dock-slack` (alias: `/dock_slack`) (muda as respostas para Slack)
- `/activation mention|always` (somente grupos)
- `/send on|off|inherit` (somente proprietário)
- `/reset` ou `/new [model]` (dica opcional de modelo; o restante é encaminhado)
- `/think <off|minimal|low|medium|high|xhigh>` (escolhas dinâmicas por modelo/provider; aliases: `/thinking`, `/t`)
- `/fast status|on|off` (omitir o argumento mostra o estado efetivo atual do modo rápido)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; quando ligado, envia uma mensagem separada com o prefixo `Reasoning:`; `stream` = rascunho somente no Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` ignora aprovações de exec)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (envie `/exec` para mostrar o atual)
- `/model <name>` (alias: `/models`; ou `/<alias>` de `agents.defaults.models.*.alias`)
- `/queue <mode>` (mais opções como `debounce:2s cap:25 drop:summarize`; envie `/queue` para ver as configurações atuais)
- `/bash <command>` (somente no host; alias para `! <command>`; exige `commands.bash: true` + listas de permissões `tools.elevated`)
- `/dreaming [off|core|rem|deep|status|help]` (ativa/desativa o modo dreaming ou mostra o status; veja [Dreaming](/pt-BR/concepts/memory-dreaming))

Somente texto:

- `/compact [instructions]` (veja [/concepts/compaction](/pt-BR/concepts/compaction))
- `! <command>` (somente no host; um de cada vez; use `!poll` + `!stop` para jobs longos)
- `!poll` (verifica saída / status; aceita `sessionId` opcional; `/bash poll` também funciona)
- `!stop` (interrompe o job bash em execução; aceita `sessionId` opcional; `/bash stop` também funciona)

Observações:

- Os comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou o nome de um provider (correspondência aproximada); se não houver correspondência, o texto é tratado como corpo da mensagem.
- Para ver a divisão completa do uso por provider, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com várias contas, `/allowlist --account <id>` direcionado a configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo de custo local a partir dos logs de sessão do OpenClaw.
- `/restart` é habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
- Comando nativo somente do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não disponível como texto).
- Os comandos de vínculo de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que os vínculos de thread efetivos estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência do comando ACP e comportamento de runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
- `/verbose` serve para depuração e visibilidade extra; mantenha-o **desligado** no uso normal.
- `/fast on|off` persiste uma substituição da sessão. Use a opção `inherit` na interface de Sessões para limpá-la e voltar ao padrão da configuração.
- `/fast` é específico por provider: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos de Responses, enquanto solicitações Anthropic públicas diretas, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Veja [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning` (e `/verbose`) são arriscados em grupos: podem revelar raciocínio interno ou saída de ferramenta que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats em grupo.
- `/model` persiste o novo modelo da sessão imediatamente.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se já houver uma execução ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto de nova tentativa limpo.
- Se a atividade de ferramentas ou a saída da resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de nova tentativa ou a próxima interação do usuário.
- **Caminho rápido:** mensagens somente de comando de remetentes na lista de permissões são tratadas imediatamente (ignoram fila + modelo).
- **Bloqueio por menção em grupo:** mensagens somente de comando de remetentes na lista de permissões ignoram requisitos de menção.
- **Atalhos inline (somente remetentes na lista de permissões):** certos comandos também funcionam quando incorporados em uma mensagem normal e são removidos antes que o modelo veja o restante.
  - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens somente de comando não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de skill:** Skills `user-invocable` são expostas como comandos de barra. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo, `_2`).
  - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comandos nativos impedem comandos por skill).
  - Por padrão, comandos de skill são encaminhados ao modelo como uma solicitação normal.
  - Skills podem declarar opcionalmente `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — veja [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu de botões quando um comando aceita escolhas e você omite o argumento.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora
nesta conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo que aceitam argumentos expõem a mesma troca de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então alterar agente, canal, thread, autorização do remetente ou modelo pode
  mudar a saída.
- `/tools` inclui ferramentas realmente alcançáveis em runtime, incluindo ferramentas centrais, ferramentas de plugin conectadas e ferramentas pertencentes ao canal.

Para editar perfil e substituições, use o painel de Ferramentas da UI de Controle ou superfícies de config/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provider** (exemplo: “Claude 80% restante”) aparece em `/status` para o provider do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provider para `% restante`; para MiniMax, campos percentuais somente de restante são invertidos antes da exibição, e respostas `model_remains` priorizam a entrada do modelo de chat com um rótulo de plano marcado com o modelo.
- **Linhas de token/cache** em `/status` podem recorrer à entrada de uso mais recente do transcript quando o snapshot ao vivo da sessão é escasso. Valores ao vivo não zero existentes ainda têm prioridade, e o fallback do transcript também pode recuperar o rótulo do modelo ativo em runtime mais um total maior orientado ao prompt quando totais armazenados estão ausentes ou são menores.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado às respostas normais).
- `/model status` é sobre **modelos/auth/endpoints**, não sobre uso.

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

- `/model` e `/model list` mostram um seletor compacto numerado (família do modelo + providers disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provider e modelo mais uma etapa de envio.
- `/model <#>` seleciona desse seletor (e prefere o provider atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provider (`baseUrl`) e o modo de API (`api`) quando disponível.

## Substituições de depuração

`/debug` permite definir substituições de configuração **somente em tempo de execução** (memória, não disco). Somente proprietário. Desabilitado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Observações:

- As substituições são aplicadas imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`.
- Use `/debug reset` para limpar todas as substituições e voltar à configuração em disco.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Somente proprietário. Desabilitado por padrão; habilite com `commands.config: true`.

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
- As atualizações de `/config` persistem após reinicializações.

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente proprietário. Desabilitado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena a configuração na configuração do OpenClaw, não em configurações de projeto de propriedade do Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

## Atualizações de plugin

`/plugins` permite que operadores inspecionem plugins descobertos e alternem a habilitação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desabilitado por padrão; habilite com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Observações:

- `/plugins list` e `/plugins show` usam descoberta real de plugins no workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após mudanças de habilitação/desabilitação, reinicie o gateway para aplicá-las.

## Observações sobre superfícies

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (aponta para a sessão de chat via `CommandTargetSessionKey`)
- **`/stop`** aponta para a sessão de chat ativa para que possa abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deverá criar um slash command do Slack para cada comando embutido (com os mesmos nomes de `/help`). Menus de argumentos de comando para Slack são entregues como botões efêmeros do Block Kit.
  - Exceção de comando nativo do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O texto `/status` ainda funciona em mensagens do Slack.

## Perguntas laterais BTW

`/btw` é uma **pergunta lateral** rápida sobre a sessão atual.

Diferente do chat normal:

- usa a sessão atual como contexto de fundo,
- é executado como uma chamada única separada **sem ferramentas**,
- não altera o contexto futuro da sessão,
- não é gravado no histórico do transcript,
- é entregue como um resultado lateral ao vivo em vez de uma mensagem normal do assistente.

Isso faz de `/btw` algo útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Veja [Perguntas laterais BTW](/pt-BR/tools/btw) para o comportamento completo e detalhes
de UX do cliente.
