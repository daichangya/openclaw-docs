---
read_when:
    - Configurando aprovações de exec ou allowlists
    - Implementando a UX de aprovação de exec no app macOS
    - Revisando prompts de escape do sandbox e suas implicações
summary: Aprovações de exec, allowlists e prompts de escape do sandbox
title: Aprovações de exec
x-i18n:
    generated_at: "2026-04-05T12:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Aprovações de exec

As aprovações de exec são a **barreira de proteção do app complementar / host do nó** para permitir que um agente em sandbox execute
comandos em um host real (`gateway` ou `node`). Pense nisso como um intertravamento de segurança:
os comandos são permitidos somente quando a política + allowlist + (opcional) aprovação do usuário concordam.
As aprovações de exec existem **além** da política da ferramenta e do controle elevado (a menos que elevated esteja definido como `full`, o que ignora as aprovações).
A política efetiva é a **mais restritiva** entre `tools.exec.*` e os padrões de aprovações; se um campo de aprovações for omitido, o valor de `tools.exec` será usado.
A execução no host também usa o estado local de aprovações nessa máquina. Um
`ask: "always"` local ao host em `~/.openclaw/exec-approvals.json` continua solicitando confirmação mesmo se
a sessão ou os padrões de configuração pedirem `ask: "on-miss"`.
Use `openclaw approvals get`, `openclaw approvals get --gateway` ou
`openclaw approvals get --node <id|name|ip>` para inspecionar a política solicitada,
as fontes de política do host e o resultado efetivo.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que exija um prompt será
resolvida pelo **fallback de ask** (padrão: negar).

## Onde isso se aplica

As aprovações de exec são aplicadas localmente no host de execução:

- **host do gateway** → processo `openclaw` na máquina do gateway
- **host do nó** → executor do nó (app complementar do macOS ou host de nó sem interface)

Observação sobre o modelo de confiança:

- Chamadores autenticados pelo gateway são operadores confiáveis desse Gateway.
- Nós pareados estendem essa capacidade de operador confiável ao host do nó.
- As aprovações de exec reduzem o risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no host do nó vinculam o contexto canônico de execução: `cwd` canônico, `argv` exato, vínculo de `env`
  quando presente e caminho fixado do executável quando aplicável.
- Para scripts de shell e invocações diretas de arquivo por interpretador/runtime, o OpenClaw também tenta vincular
  um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução,
  a execução será negada em vez de executar conteúdo alterado.
- Esse vínculo de arquivo é intencionalmente best-effort, não um modelo semântico completo de todos os caminhos
  de carregamento de interpretadores/runtimes. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto
  para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura total.

Separação no macOS:

- o **serviço do host do nó** encaminha `system.run` para o **app macOS** via IPC local.
- o **app macOS** aplica aprovações + executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

`~/.openclaw/exec-approvals.json`

Exemplo de esquema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modo "YOLO" sem aprovação

Se você quiser que a execução no host rode sem prompts de aprovação, precisa abrir **ambas** as camadas de política:

- política de execução solicitada na configuração do OpenClaw (`tools.exec.*`)
- política de aprovações local ao host em `~/.openclaw/exec-approvals.json`

Agora este é o comportamento padrão no host, a menos que você o restrinja explicitamente:

- `tools.exec.security`: `full` em `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Diferença importante:

- `tools.exec.host=auto` escolhe onde a execução roda: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe como a execução no host é aprovada: `security=full` mais `ask=off`.
- `auto` não transforma o roteamento para o gateway em uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada com `host=node` é permitida a partir de `auto`, e `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Se você quiser um padrão estável que não seja `auto`, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

Se quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para `allowlist` / `on-miss`
ou `deny`.

Configuração persistente "nunca solicitar" para o host do gateway:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Em seguida, defina o arquivo de aprovações do host para corresponder:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Para um host de nó, aplique o mesmo arquivo de aprovações nesse nó:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Atalho somente para a sessão:

- `/exec security=full ask=off` altera somente a sessão atual.
- `/elevated full` é um atalho de break-glass que também ignora as aprovações de exec para essa sessão.

Se o arquivo de aprovações do host continuar mais restritivo do que a configuração, a política mais restritiva do host ainda prevalece.

## Controles de política

### Segurança (`exec.security`)

- **deny**: bloqueia todas as solicitações de execução no host.
- **allowlist**: permite somente comandos incluídos na allowlist.
- **full**: permite tudo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca solicita confirmação.
- **on-miss**: solicita confirmação somente quando a allowlist não corresponde.
- **always**: solicita confirmação em todo comando.
- a confiança durável `allow-always` não suprime prompts quando o modo efetivo de ask é `always`

### Ask fallback (`askFallback`)

Se um prompt for necessário, mas nenhuma UI estiver acessível, o fallback decide:

- **deny**: bloqueia.
- **allowlist**: permite somente se houver correspondência na allowlist.
- **full**: permite.

### Endurecimento de eval inline de interpretador (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, o OpenClaw trata formas de eval de código inline como somente-aprovação, mesmo se o binário do interpretador em si estiver na allowlist.

Exemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Isto é defesa em profundidade para carregadores de interpretador que não se mapeiam claramente para um único operando de arquivo estável. No modo estrito:

- esses comandos ainda exigem aprovação explícita;
- `allow-always` não persiste automaticamente novas entradas de allowlist para eles.

## Allowlist (por agente)

As allowlists são **por agente**. Se houver vários agentes, alterne qual agente você está
editando no app macOS. Os padrões são **correspondências glob sem diferenciar maiúsculas e minúsculas**.
Os padrões devem resolver para **caminhos de binários** (entradas somente com basename são ignoradas).
Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.
Encadeamentos de shell como `echo ok && pwd` ainda exigem que cada segmento de nível superior satisfaça as regras da allowlist.

Exemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada da allowlist registra:

- **id** UUID estável usado para identidade na UI (opcional)
- **last used** carimbo de data/hora
- **last used command**
- **last resolved path**

## Auto-permitir CLIs de Skills

Quando **Auto-allow skill CLIs** está ativado, executáveis referenciados por Skills conhecidos
são tratados como estando na allowlist em nós (nó macOS ou host de nó sem interface). Isso usa
`skills.bins` via Gateway RPC para buscar a lista de bins de Skills. Desative isso se você quiser allowlists manuais estritas.

Observações importantes sobre confiança:

- Esta é uma **allowlist implícita de conveniência**, separada das entradas manuais de allowlist por caminho.
- Ela é destinada a ambientes de operadores confiáveis nos quais Gateway e nó estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use somente entradas manuais de allowlist por caminho.

## Safe bins (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por exemplo `cut`)
que podem rodar no modo allowlist **sem** entradas explícitas na allowlist. Safe bins rejeitam
args de arquivo posicionais e tokens parecidos com caminho, então só podem operar no fluxo de entrada.
Trate isso como um caminho rápido e limitado para filtros de fluxo, não como uma lista geral de confiança.
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se um comando puder avaliar código, executar subcomandos ou ler arquivos por design, prefira entradas explícitas de allowlist e mantenha os prompts de aprovação ativados.
Safe bins personalizados devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
A validação é determinística somente a partir do formato de `argv` (sem verificações de existência no sistema de arquivos do host), o que
evita comportamento de oráculo de existência de arquivo a partir de diferenças entre permitir/negar.
Opções orientadas a arquivos são negadas para safe bins padrão (por exemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins também impõem uma política explícita por binário para flags que quebram o comportamento
somente stdin (por exemplo `sort -o/--output/--compress-program` e flags recursivas do grep).
Opções longas são validadas em fail-closed no modo safe-bin: flags desconhecidas e abreviações
ambíguas são rejeitadas.
Flags negadas por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins também forçam que tokens de `argv` sejam tratados como **texto literal** no momento da execução (sem expansão de glob
e sem expansão de `$VARS`) para segmentos somente stdin, para que padrões como `*` ou `$HOME/...` não possam ser
usados para introduzir leituras de arquivo.
Safe bins também devem ser resolvidos a partir de diretórios confiáveis de binários (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são automaticamente confiáveis.
Os diretórios confiáveis padrão de safe-bin são intencionalmente mínimos: `/bin`, `/usr/bin`.
Se o seu executável safe-bin estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os explicitamente
a `tools.exec.safeBinTrustedDirs`.
Encadeamento de shell e redirecionamentos não são auto-permitidos no modo allowlist.

O encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior satisfaz a allowlist
(incluindo safe bins ou auto-permissão de Skills). Redirecionamentos continuam sem suporte no modo allowlist.
Substituição de comando (`$()` / crases) é rejeitada durante a análise da allowlist, inclusive dentro de
aspas duplas; use aspas simples se precisar de texto literal `$()`.
Em aprovações do app complementar do macOS, texto bruto de shell contendo sintaxe de controle ou expansão do shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como ausência de correspondência na allowlist, a menos que
o próprio binário do shell esteja na allowlist.
Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de `env` no escopo da solicitação são reduzidas a uma
pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisões `allow-always` no modo allowlist, wrappers de despacho conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executáveis internos em vez de caminhos
de wrappers. Multiplexadores de shell (`busybox`, `toybox`) também são desembrulhados para applets de shell (`sh`, `ash`,
etc.), de modo que executáveis internos sejam persistidos em vez de binários multiplexadores. Se um wrapper ou
multiplexador não puder ser desembrulhado com segurança, nenhuma entrada de allowlist será persistida automaticamente.
Se você colocar interpretadores como `python3` ou `node` na allowlist, prefira `tools.exec.strictInlineEval=true` para que eval inline ainda exija aprovação explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas portadores de eval inline não são persistidos automaticamente.

Safe bins padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas de allowlist para
seus fluxos de trabalho que não usam stdin.
Para `grep` no modo safe-bin, forneça o padrão com `-e`/`--regexp`; a forma posicional do padrão é
rejeitada para que operandos de arquivo não possam ser introduzidos como posicionais ambíguos.

### Safe bins versus allowlist

| Tópico           | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objetivo         | Auto-permitir filtros limitados de stdin              | Confiar explicitamente em executáveis específicos            |
| Tipo de correspondência | Nome do executável + política `argv` de safe-bin | Padrão glob do caminho resolvido do executável               |
| Escopo dos argumentos | Restrito pelo perfil de safe-bin e regras de token literal | Somente correspondência de caminho; os argumentos são de sua responsabilidade |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizados       |
| Melhor uso       | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais |

Local de configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou por agente em `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou por agente em `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou por agente em `agents.list[].tools.exec.safeBinProfiles`). Chaves de perfil por agente substituem as chaves globais.
- entradas da allowlist ficam no `~/.openclaw/exec-approvals.json` local ao host em `agents.<id>.allowlist` (ou via UI de controle / `openclaw approvals allowlist ...`).
- `openclaw security audit` alerta com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode gerar entradas ausentes de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são gerados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900004__
Se você incluir explicitamente `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo safe-bin
para que `jq -n env` não possa despejar o ambiente do processo do host sem um caminho explícito na allowlist
ou um prompt de aprovação.

## Edição na UI de controle

Use o cartão **UI de controle → Nós → Aprovações de exec** para editar padrões, substituições
por agente e allowlists. Escolha um escopo (Padrões ou um agente), ajuste a política,
adicione/remova padrões da allowlist e então clique em **Salvar**. A UI mostra metadados de **último uso**
por padrão para ajudar a manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Nó**. Os nós
precisam anunciar `system.execApprovals.get/set` (app macOS ou host de nó sem interface).
Se um nó ainda não anunciar aprovações de exec, edite diretamente o
`~/.openclaw/exec-approvals.json` local dele.

CLI: `openclaw approvals` oferece suporte a edição em gateway ou nó (consulte [CLI de aprovações](/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite `exec.approval.requested` para clientes operadores.
A UI de controle e o app macOS o resolvem via `exec.approval.resolve`, e então o gateway encaminha a
solicitação aprovada para o host do nó.

Para `host=node`, solicitações de aprovação incluem uma carga `systemRunPlan` canônica. O gateway usa
esse plano como o contexto autoritativo de comando/cwd/sessão ao encaminhar solicitações aprovadas de `system.run`.

Isso importa para a latência de aprovação assíncrona:

- o caminho de execução do nó prepara um único plano canônico antecipadamente
- o registro de aprovação armazena esse plano e seus metadados de vínculo
- uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado
  em vez de confiar em edições posteriores do chamador
- se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` após a criação da solicitação de aprovação, o gateway rejeita a
  execução encaminhada como incompatibilidade de aprovação

## Comandos de interpretador/runtime

Execuções de interpretador/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de `argv`/`cwd`/`env` é sempre vinculado.
- Formas de script de shell direto e de arquivo de runtime direto são vinculadas, em best-effort, a um snapshot de arquivo local concreto.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um único arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do vínculo.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas de eval, cadeias de carregamento específicas de runtime ou formas
  ambíguas com vários arquivos), a execução respaldada por aprovação é negada em vez de alegar cobertura semântica
  que não tem.
- Para esses fluxos de trabalho, prefira sandboxing, um limite de host separado ou um fluxo explícito confiável
  de allowlist/full em que o operador aceite a semântica mais ampla do runtime.

Quando as aprovações são necessárias, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a solicitação será tratada como timeout de aprovação e exibida como motivo da negação.

### Comportamento de entrega de followup

Depois que uma execução assíncrona aprovada termina, o OpenClaw envia um turno `agent` de followup para a mesma sessão.

- Se existir um destino válido de entrega externa (canal entregável mais alvo `to`), a entrega de followup usa esse canal.
- Em fluxos somente de webchat ou de sessão interna sem destino externo, a entrega de followup permanece somente na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem um canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver ativado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para somente sessão em vez de falhar.

A caixa de diálogo de confirmação inclui:

- comando + args
- cwd
- id do agente
- caminho resolvido do executável
- host + metadados de política

Ações:

- **Permitir uma vez** → executar agora
- **Permitir sempre** → adicionar à allowlist + executar
- **Negar** → bloquear

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900005__
Responder no chat:
__OC_I18N_900006__
O comando `/approve` processa tanto aprovações de exec quanto aprovações de plugin. Se o ID não corresponder a uma aprovação de exec pendente, ele verifica automaticamente aprovações de plugin.

### Encaminhamento de aprovação de plugin

O encaminhamento de aprovação de plugin usa o mesmo pipeline de entrega das aprovações de exec, mas tem sua própria
configuração independente em `approvals.plugin`. Ativar ou desativar um não afeta o outro.
__OC_I18N_900007__
O formato da configuração é idêntico ao de `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais que oferecem suporte a respostas interativas compartilhadas renderizam os mesmos botões de aprovação para aprovações de exec e
de plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções de `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou plugin se origina em uma superfície de chat entregável, esse mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos já existentes da UI da Web e da UI do terminal.

Esse caminho compartilhado por comando de texto usa o modelo normal de autenticação do canal para essa conversa. Se o
chat de origem já puder enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um
adaptador nativo de entrega separado apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização, mesmo quando a entrega nativa de aprovação está desativada.

Para Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Um erro/negação real
de aprovação de exec não tenta silenciosamente novamente como uma aprovação de plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs para aprovadores, fanout no chat de origem
e UX interativa de aprovação específica do canal sobre o fluxo compartilhado de `/approve` no mesmo chat.

Quando cartões/botões nativos de aprovação estão disponíveis, essa UI nativa é o principal
caminho voltado para o agente. O agente não deve também ecoar um comando simples de chat
`/approve` duplicado, a menos que o resultado da ferramenta diga que aprovações por chat não estão disponíveis ou
que a aprovação manual seja o único caminho restante.

Modelo genérico:

- a política de execução no host ainda decide se a aprovação de exec é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como cliente nativo de aprovação

Clientes nativos de aprovação ativam automaticamente a entrega prioritária por DM quando tudo isso é verdadeiro:

- o canal oferece suporte à entrega nativa de aprovação
- os aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou das
  fontes de fallback documentadas desse canal
- `channels.<channel>.execApprovals.enabled` está indefinido ou é `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para forçá-lo
quando os aprovadores puderem ser resolvidos. A entrega pública no chat de origem continua explícita por meio de
`channels.<channel>.execApprovals.target`.

FAQ: [Por que existem duas configurações de aprovação de exec para aprovações por chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes nativos de aprovação acrescentam roteamento por DM e fanout opcional no canal sobre o fluxo compartilhado
de `/approve` no mesmo chat e botões de aprovação compartilhados.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação do canal
  para `/approve` no mesmo chat
- quando um cliente nativo de aprovação é ativado automaticamente, o alvo padrão de entrega nativa é DMs de aprovadores
- para Discord e Telegram, somente aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos da configuração existente de proprietário (`allowFrom`, mais `defaultTo` para mensagem direta quando houver suporte)
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do id de aprovação, então ids `plugin:` podem resolver aprovações de plugin
  sem uma segunda camada local ao Slack para fallback
- o roteamento nativo de DM/canal do Matrix é somente para exec; aprovações de plugin do Matrix permanecem no
  fluxo compartilhado de `/approve` no mesmo chat e caminhos opcionais de encaminhamento em `approvals.plugin`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferece suporte a comandos e respostas
- botões nativos de aprovação do Discord roteiam por tipo de id de aprovação: ids `plugin:` vão
  diretamente para aprovações de plugin, todo o resto vai para aprovações de exec
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de exec para plugin que `/approve`
- quando `target` nativo ativa a entrega no chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações de exec pendentes expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

O Telegram usa como padrão DMs de aprovadores (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quiser que prompts de aprovação também apareçam no chat/tópico do Telegram de origem. Para tópicos de fórum do Telegram,
o OpenClaw preserva o tópico para o prompt de aprovação e para o followup após a aprovação.

Veja:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo de IPC no macOS
__OC_I18N_900008__
Observações de segurança:

- Modo do socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com o mesmo UID.
- Challenge/response (nonce + token HMAC + hash da solicitação) + TTL curto.

## Eventos do sistema

O ciclo de vida da execução é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite do aviso de execução em andamento)
- `Exec finished`
- `Exec denied`

Essas mensagens são publicadas na sessão do agente depois que o nó relata o evento.
Aprovações de exec no host do gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando estiver em execução por mais tempo que o limite).
Execuções controladas por aprovação reutilizam o id de aprovação como `runId` nessas mensagens para facilitar a correlação.

## Comportamento quando a aprovação é negada

Quando uma aprovação assíncrona de exec é negada, o OpenClaw impede que o agente reutilize
saída de qualquer execução anterior do mesmo comando na sessão. O motivo da negação
é passado com orientação explícita de que nenhuma saída do comando está disponível, o que impede
o agente de alegar que há nova saída ou de repetir o comando negado com
resultados obsoletos de uma execução bem-sucedida anterior.

## Implicações

- **full** é poderoso; prefira allowlists quando possível.
- **ask** mantém você no controle, ainda permitindo aprovações rápidas.
- Allowlists por agente impedem que as aprovações de um agente vazem para outros.
- Aprovações só se aplicam a solicitações de execução no host vindas de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por design.
  Para bloquear completamente a execução no host, defina a segurança das aprovações como `deny` ou negue a ferramenta `exec` via política da ferramenta.

Relacionado:

- [Ferramenta exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/tools/skills)

## Relacionado

- [Exec](/pt-BR/tools/exec) — ferramenta de execução de comandos de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — modos de sandbox e acesso ao workspace
- [Security](/pt-BR/gateway/security) — modelo de segurança e hardening
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usar cada um
