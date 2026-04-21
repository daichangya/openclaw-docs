---
read_when:
    - Configurando aprovações de execução ou listas de permissões
    - Implementando a UX de aprovação de execução no app macOS
    - Revisando prompts de saída do sandbox e implicações
summary: Aprovações de execução, listas de permissões e prompts de saída do sandbox
title: Aprovações de execução
x-i18n:
    generated_at: "2026-04-21T13:37:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Aprovações de execução

As aprovações de execução são a **proteção do app complementar / host do node** para permitir que um agente em sandbox execute
comandos em um host real (`gateway` ou `node`). Pense nisso como um intertravamento de segurança:
os comandos só são permitidos quando política + lista de permissões + (opcionalmente) aprovação do usuário concordam.
As aprovações de execução existem **além** da política de ferramentas e do controle elevated (a menos que elevated esteja como `full`, o que ignora as aprovações).
A política efetiva é a **mais restritiva** entre os padrões de `tools.exec.*` e de aprovações; se um campo de aprovações for omitido, o valor de `tools.exec` será usado.
A execução no host também usa o estado local de aprovações nessa máquina. Um valor local no host
`ask: "always"` em `~/.openclaw/exec-approvals.json` continua exibindo prompts mesmo que
os padrões da sessão ou da configuração solicitem `ask: "on-miss"`.
Use `openclaw approvals get`, `openclaw approvals get --gateway` ou
`openclaw approvals get --node <id|name|ip>` para inspecionar a política solicitada,
as fontes de política do host e o resultado efetivo.
Para a máquina local, `openclaw exec-policy show` expõe a mesma visão mesclada e
`openclaw exec-policy set|preset` pode sincronizar a política local solicitada com o
arquivo local de aprovações do host em uma única etapa. Quando um escopo local solicita `host=node`,
`openclaw exec-policy show` informa esse escopo como gerenciado pelo node em runtime, em vez de
fingir que o arquivo local de aprovações é a fonte de verdade efetiva.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que exija um prompt será
resolvida pelo **fallback de ask** (padrão: negar).

Clientes nativos de aprovação em chat também podem expor recursos específicos do canal na
mensagem de aprovação pendente. Por exemplo, o Matrix pode iniciar atalhos de reação no
prompt de aprovação (`✅` permitir uma vez, `❌` negar e `♾️` permitir sempre quando disponível),
mantendo ainda os comandos `/approve ...` na mensagem como fallback.

## Onde se aplica

As aprovações de execução são aplicadas localmente no host de execução:

- **host do gateway** → processo `openclaw` na máquina do gateway
- **host do node** → runner do node (app complementar do macOS ou host de node headless)

Observação sobre o modelo de confiança:

- Chamadores autenticados no Gateway são operadores confiáveis para esse Gateway.
- Nodes pareados estendem essa capacidade de operador confiável ao host do node.
- As aprovações de execução reduzem o risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no host do node vinculam o contexto canônico de execução: cwd canônico, argv exato, vinculação de env
  quando presente e caminho do executável fixado, quando aplicável.
- Para scripts de shell e invocações diretas de arquivo por interpretador/runtime, o OpenClaw também tenta vincular
  um operando concreto de arquivo local. Se esse arquivo vinculado mudar depois da aprovação, mas antes da execução,
  a execução será negada em vez de executar conteúdo alterado.
- Essa vinculação de arquivo é intencionalmente best-effort, não um modelo semântico completo de todo
  caminho de carregamento de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um
  arquivo local concreto para vincular, ele se recusa a emitir uma execução apoiada em aprovação em vez de fingir cobertura total.

Divisão no macOS:

- **serviço do host do node** encaminha `system.run` para o **app macOS** por IPC local.
- **app macOS** aplica aprovações + executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

`~/.openclaw/exec-approvals.json`

Exemplo de schema:

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

Se você quiser que a execução no host rode sem prompts de aprovação, é preciso abrir **ambas** as camadas de política:

- política de execução solicitada na configuração do OpenClaw (`tools.exec.*`)
- política local de aprovações do host em `~/.openclaw/exec-approvals.json`

Esse agora é o comportamento padrão do host, a menos que você o restrinja explicitamente:

- `tools.exec.security`: `full` em `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinção importante:

- `tools.exec.host=auto` escolhe onde a execução roda: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe como a execução no host é aprovada: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw não adiciona um controle separado de aprovação heurística de ofuscação de comando nem uma camada de rejeição prévia de script por cima da política configurada de execução no host.
- `auto` não transforma o roteamento para gateway em uma sobrescrita livre a partir de uma sessão em sandbox. Uma solicitação por chamada com `host=node` é permitida a partir de `auto`, e `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox estiver ativo. Se você quiser um padrão estável diferente de auto, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

Se quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para `allowlist` / `on-miss`
ou `deny`.

Configuração persistente de host do gateway "nunca perguntar":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Depois, defina o arquivo de aprovações do host para corresponder:

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

Atalho local para a mesma política de host do gateway na máquina atual:

```bash
openclaw exec-policy preset yolo
```

Esse atalho local atualiza ambos:

- `tools.exec.host/security/ask` locais
- padrões locais de `~/.openclaw/exec-approvals.json`

Ele é intencionalmente apenas local. Se você precisar alterar aprovações do host do gateway ou do host do node
remotamente, continue usando `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Para um host do node, aplique o mesmo arquivo de aprovações nesse node:

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

Limitação importante apenas local:

- `openclaw exec-policy` não sincroniza aprovações de node
- `openclaw exec-policy set --host node` é rejeitado
- aprovações de execução de node são buscadas do node em runtime, então atualizações direcionadas ao node precisam usar `openclaw approvals --node ...`

Atalho apenas para a sessão:

- `/exec security=full ask=off` altera somente a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de execução para essa sessão.

Se o arquivo de aprovações do host continuar mais restritivo que a configuração, a política mais restritiva do host ainda vence.

## Controles de política

### Security (`exec.security`)

- **deny**: bloqueia todas as solicitações de execução no host.
- **allowlist**: permite apenas comandos na lista de permissões.
- **full**: permite tudo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca exibe prompt.
- **on-miss**: exibe prompt somente quando a lista de permissões não corresponder.
- **always**: exibe prompt em todo comando.
- confiança durável `allow-always` não suprime prompts quando o modo efetivo de ask é `always`

### Ask fallback (`askFallback`)

Se um prompt for necessário, mas nenhuma UI estiver acessível, o fallback decide:

- **deny**: bloqueia.
- **allowlist**: permite somente se a lista de permissões corresponder.
- **full**: permite.

### Endurecimento de eval inline de interpretador (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, o OpenClaw trata formas inline de code-eval como somente por aprovação, mesmo que o binário do interpretador em si esteja na lista de permissões.

Exemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Isso é defesa em profundidade para carregadores de interpretador que não mapeiam de forma limpa para um operando de arquivo único e estável. No modo estrito:

- esses comandos ainda precisam de aprovação explícita;
- `allow-always` não persiste automaticamente novas entradas de lista de permissões para eles.

## Lista de permissões (por agente)

As listas de permissões são **por agente**. Se houver vários agentes, alterne qual agente você está
editando no app macOS. Os padrões são **correspondências glob sem distinção entre maiúsculas e minúsculas**.
Os padrões devem resolver para **caminhos de binário** (entradas somente com basename são ignoradas).
Entradas legadas `agents.default` são migradas para `agents.main` ao carregar.
Cadeias de shell como `echo ok && pwd` ainda exigem que cada segmento de nível superior satisfaça as regras da lista de permissões.

Exemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada da lista de permissões rastreia:

- **id** UUID estável usado para identidade na UI (opcional)
- **último uso** timestamp
- **último comando usado**
- **último caminho resolvido**

## Permitir automaticamente CLIs de Skills

Quando **Permitir automaticamente CLIs de Skills** está ativado, executáveis referenciados por Skills conhecidos
são tratados como estando na lista de permissões em nodes (node macOS ou host de node headless). Isso usa
`skills.bins` via RPC do Gateway para buscar a lista de binários de Skills. Desative isso se quiser listas de permissões manuais estritas.

Observações importantes de confiança:

- Esta é uma **lista de permissões implícita de conveniência**, separada das entradas manuais de lista de permissões por caminho.
- Ela é destinada a ambientes de operadores confiáveis em que Gateway e node estão no mesmo limite de confiança.
- Se você exigir confiança estritamente explícita, mantenha `autoAllowSkills: false` e use somente entradas manuais de lista de permissões por caminho.

## Safe bins (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por exemplo `cut`)
que podem executar no modo de lista de permissões **sem** entradas explícitas de lista de permissões. Safe bins rejeitam
args posicionais de arquivo e tokens semelhantes a caminho, então só podem operar sobre o stream de entrada.
Trate isso como um caminho rápido e restrito para filtros de stream, não como uma lista geral de confiança.
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se um comando puder avaliar código, executar subcomandos ou ler arquivos por definição, prefira entradas explícitas de lista de permissões e mantenha prompts de aprovação ativados.
Safe bins personalizados devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
A validação é determinística apenas pelo formato de argv (sem verificações de existência no sistema de arquivos do host), o que
evita comportamento de oráculo de existência de arquivo por diferenças entre permitir/negar.
Opções orientadas a arquivo são negadas para safe bins padrão (por exemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins também aplicam política explícita de flags por binário para opções que quebram o comportamento
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

Safe bins também forçam os tokens de argv a serem tratados como **texto literal** no momento da execução (sem expansão de glob
e sem expansão de `$VARS`) para segmentos somente stdin, então padrões como `*` ou `$HOME/...` não podem ser
usados para disfarçar leituras de arquivo.
Safe bins também precisam ser resolvidos a partir de diretórios de binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcionais). Entradas de `PATH` nunca são confiáveis automaticamente.
Os diretórios confiáveis padrão para safe bins são intencionalmente mínimos: `/bin`, `/usr/bin`.
Se o executável do seu safe-bin estiver em caminhos de package manager/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os explicitamente
a `tools.exec.safeBinTrustedDirs`.
Encadeamento de shell e redirecionamentos não são permitidos automaticamente no modo de lista de permissões.

O encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior satisfaz a lista de permissões
(incluindo safe bins ou permissão automática de Skills). Redirecionamentos continuam sem suporte no modo de lista de permissões.
Substituição de comando (`$()` / crases) é rejeitada durante o parsing da lista de permissões, inclusive dentro de
aspas duplas; use aspas simples se precisar de texto literal `$()`.
Nas aprovações do app complementar no macOS, texto bruto de shell contendo sintaxe de controle ou expansão de shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como ausência de correspondência na lista de permissões, a menos que
o próprio binário do shell esteja na lista de permissões.
Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), sobrescritas de env com escopo de requisição são reduzidas a uma
pequena lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisões `allow-always` no modo de lista de permissões, wrappers de despacho conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez de caminhos
do wrapper. Multiplexadores de shell (`busybox`, `toybox`) também são desembrulhados para applets de shell (`sh`, `ash`,
etc.), para que executáveis internos sejam persistidos em vez de binários do multiplexador. Se um wrapper ou
multiplexador não puder ser desembrulhado com segurança, nenhuma entrada de lista de permissões será persistida automaticamente.
Se você colocar interpretadores como `python3` ou `node` na lista de permissões, prefira `tools.exec.strictInlineEval=true` para que eval inline ainda exija aprovação explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas carregadores de eval inline não são persistidos automaticamente.

Safe bins padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas de lista de permissões para
seus fluxos de trabalho que não sejam somente stdin.
Para `grep` no modo safe-bin, forneça o padrão com `-e`/`--regexp`; a forma posicional do padrão é
rejeitada para que operandos de arquivo não possam ser disfarçados como posicionais ambíguos.

### Safe bins versus lista de permissões

| Tópico           | `tools.exec.safeBins`                                  | Lista de permissões (`exec-approvals.json`)                  |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objetivo         | Permitir automaticamente filtros restritos de stdin    | Confiar explicitamente em executáveis específicos            |
| Tipo de correspondência | Nome do executável + política de argv de safe-bin | Padrão glob do caminho resolvido do executável               |
| Escopo dos argumentos | Restrito pelo perfil de safe-bin e regras de token literal | Apenas correspondência de caminho; os argumentos são de sua responsabilidade |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizados       |
| Melhor uso       | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento ou efeitos colaterais mais amplos |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou por agente em `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou por agente em `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou por agente em `agents.list[].tools.exec.safeBinProfiles`). Chaves de perfil por agente sobrescrevem chaves globais.
- entradas de lista de permissões ficam no `~/.openclaw/exec-approvals.json` local do host em `agents.<id>.allowlist` (ou via UI de controle / `openclaw approvals allowlist ...`).
- `openclaw security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando binários de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode gerar entradas ausentes de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Binários de interpretador/runtime não são gerados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900005__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo safe-bin
para que `jq -n env` não possa despejar o ambiente do processo do host sem um caminho explícito na lista de permissões
ou prompt de aprovação.

## Edição na UI de controle

Use o cartão **UI de controle → Nodes → Aprovações de execução** para editar padrões, sobrescritas
por agente e listas de permissões. Escolha um escopo (Padrões ou um agente), ajuste a política,
adicione/remova padrões da lista de permissões e depois clique em **Salvar**. A UI mostra metadados de **último uso**
por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**. Nodes
precisam anunciar `system.execApprovals.get/set` (app macOS ou host de node headless).
Se um node ainda não anunciar aprovações de execução, edite diretamente seu
`~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` oferece suporte à edição de gateway ou node (veja [CLI de aprovações](/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite `exec.approval.requested` para clientes operadores.
A UI de controle e o app macOS resolvem isso via `exec.approval.resolve`, e então o gateway encaminha a
requisição aprovada ao host do node.

Para `host=node`, as solicitações de aprovação incluem um payload canônico `systemRunPlan`. O gateway usa
esse plano como contexto autoritativo de comando/cwd/sessão ao encaminhar solicitações
aprovadas de `system.run`.

Isso importa para a latência de aprovação assíncrona:

- o caminho de execução do node prepara um plano canônico logo de início
- o registro de aprovação armazena esse plano e seus metadados de vinculação
- uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado
  em vez de confiar em edições posteriores do chamador
- se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` depois que a solicitação de aprovação foi criada, o gateway rejeita a
  execução encaminhada como incompatibilidade de aprovação

## Comandos de interpretador/runtime

Execuções de interpretador/runtime apoiadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script de shell e de arquivo de runtime são vinculadas por best-effort a um snapshot concreto de arquivo local.
- Formas comuns de wrapper de package manager que ainda resolvem para um único arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes da vinculação.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de package, formas de eval, cadeias de carregamento específicas do runtime ou formas
  ambíguas com vários arquivos), a execução apoiada por aprovação é negada em vez de alegar uma cobertura semântica que
  não possui.
- Para esses fluxos de trabalho, prefira sandboxing, um limite de host separado ou um fluxo explícito e confiável de
  lista de permissões/full em que o operador aceita a semântica mais ampla do runtime.

Quando aprovações são necessárias, a ferramenta de execução retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a solicitação é tratada como timeout de aprovação e apresentada como motivo de negação.

### Comportamento de entrega de followup

Depois que uma execução assíncrona aprovada termina, o OpenClaw envia um turno de `agent` de followup para a mesma sessão.

- Se existir um destino externo de entrega válido (canal entregável mais alvo `to`), a entrega do followup usa esse canal.
- Em fluxos somente de webchat ou sessão interna, sem alvo externo, a entrega do followup permanece somente na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver ativado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para somente sessão em vez de falhar.

A caixa de diálogo de confirmação inclui:

- comando + args
- cwd
- id do agente
- caminho resolvido do executável
- host + metadados de política

Ações:

- **Permitir uma vez** → executa agora
- **Permitir sempre** → adiciona à lista de permissões + executa
- **Negar** → bloqueia

## Encaminhamento de aprovações para canais de chat

Você pode encaminhar prompts de aprovação de execução para qualquer canal de chat (incluindo canais de Plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900006__
Responder no chat:
__OC_I18N_900007__
O comando `/approve` lida tanto com aprovações de execução quanto com aprovações de Plugin. Se o ID não corresponder a uma aprovação de execução pendente, ele automaticamente verifica aprovações de Plugin.

### Encaminhamento de aprovação de Plugin

O encaminhamento de aprovação de Plugin usa o mesmo pipeline de entrega das aprovações de execução, mas tem sua própria
configuração independente em `approvals.plugin`. Ativar ou desativar um não afeta o outro.
__OC_I18N_900008__
O formato da configuração é idêntico ao de `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma maneira.

Canais que oferecem suporte a respostas interativas compartilhadas exibem os mesmos botões de aprovação para aprovações de execução e
de Plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções de `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de execução ou Plugin se origina de uma superfície de chat entregável, esse mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos já existentes da UI web e da UI de terminal.

Esse caminho compartilhado de comando em texto usa o modelo normal de autenticação do canal para essa conversa. Se o
chat de origem já puder enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um
adaptador nativo de entrega separado apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização, mesmo quando a entrega nativa de aprovações está desativada.

Para Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Uma negação/erro real de
aprovação de execução não tenta silenciosamente de novo como aprovação de Plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs para aprovadores, fanout para o chat de origem
e UX interativa de aprovação específica do canal por cima do fluxo compartilhado de `/approve` no mesmo chat.

Quando cards/botões nativos de aprovação estão disponíveis, essa UI nativa é o caminho principal
voltado ao agente. O agente não deve também repetir um comando simples de chat
`/approve` duplicado, a menos que o resultado da ferramenta diga que aprovações por chat estão indisponíveis ou
que aprovação manual é o único caminho restante.

Modelo genérico:

- a política de execução no host ainda decide se a aprovação de execução é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como cliente nativo de aprovação

Clientes nativos de aprovação ativam automaticamente entrega priorizando DM quando tudo isto for verdadeiro:

- o canal oferece suporte à entrega nativa de aprovações
- aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou das
  fontes de fallback documentadas desse canal
- `channels.<channel>.execApprovals.enabled` está ausente ou como `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para forçá-lo
quando os aprovadores puderem ser resolvidos. A entrega pública no chat de origem continua explícita via
`channels.<channel>.execApprovals.target`.

FAQ: [Por que existem duas configurações de aprovação de execução para aprovações por chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes nativos de aprovação adicionam roteamento por DM e fanout opcional de canal por cima do fluxo compartilhado
de `/approve` no mesmo chat e dos botões compartilhados de aprovação.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação do canal
  para `/approve` no mesmo chat
- quando um cliente nativo de aprovação é ativado automaticamente, o destino nativo padrão de entrega são DMs para aprovadores
- para Discord e Telegram, apenas aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos da configuração de owner existente (`allowFrom`, além de `defaultTo` de mensagem direta quando compatível)
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do id de aprovação, então IDs `plugin:` podem resolver aprovações de Plugin
  sem uma segunda camada local de fallback do Slack
- roteamento nativo de DM/canal e atalhos de reação do Matrix lidam com aprovações de execução e de Plugin;
  a autorização de Plugin continua vindo de `channels.matrix.dm.allowFrom`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferece suporte a comandos e respostas
- botões nativos de aprovação do Discord roteiam pelo tipo do id de aprovação: IDs `plugin:` vão
  diretamente para aprovações de Plugin, todo o resto vai para aprovações de execução
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de execução para Plugin que `/approve`
- quando `target` nativo ativa entrega no chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações de execução pendentes expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente configurado de aprovação puder aceitar a solicitação, o prompt recorre a `askFallback`

O Telegram usa DMs para aprovadores por padrão (`target: "dm"`). Você pode trocar para `channel` ou `both` quando
quiser que prompts de aprovação também apareçam no chat/tópico Telegram de origem. Para tópicos de fórum do Telegram,
o OpenClaw preserva o tópico para o prompt de aprovação e para o follow-up pós-aprovação.

Veja:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo de IPC no macOS
__OC_I18N_900009__
Observações de segurança:

- Modo do socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com mesmo UID.
- Challenge/response (nonce + token HMAC + hash da requisição) + TTL curto.

## Eventos do sistema

O ciclo de vida de execução é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite para aviso de execução)
- `Exec finished`
- `Exec denied`

Essas mensagens são publicadas na sessão do agente depois que o node informa o evento.
Aprovações de execução no host do gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando fica em execução por mais tempo que o limite).
Execuções controladas por aprovação reutilizam o id de aprovação como `runId` nessas mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação de execução assíncrona é negada, o OpenClaw impede que o agente reutilize
saída de qualquer execução anterior do mesmo comando na sessão. O motivo da negação
é passado com orientação explícita de que nenhuma saída do comando está disponível, o que impede
o agente de alegar que existe nova saída ou repetir o comando negado com
resultados obsoletos de uma execução anterior bem-sucedida.

## Implicações

- **full** é poderoso; prefira listas de permissões sempre que possível.
- **ask** mantém você no fluxo enquanto ainda permite aprovações rápidas.
- Listas de permissões por agente impedem que aprovações de um agente vazem para outros.
- Aprovações só se aplicam a solicitações de execução no host vindas de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por definição.
  Para bloquear rigidamente a execução no host, defina security das aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

Relacionado:

- [ferramenta Exec](/pt-BR/tools/exec)
- [modo Elevated](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills)

## Relacionado

- [Exec](/pt-BR/tools/exec) — ferramenta de execução de comandos de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — modos de sandbox e acesso ao workspace
- [Security](/pt-BR/gateway/security) — modelo de segurança e hardening
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usar cada um
