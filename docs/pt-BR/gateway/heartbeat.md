---
read_when:
    - Ajustando a cadência ou as mensagens de heartbeat
    - Decidindo entre heartbeat e cron para tarefas agendadas
summary: Mensagens de polling de heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T12:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat ou Cron?** Consulte [Automation & Tasks](/automation) para orientações sobre quando usar cada um.

O heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa
destacar qualquer coisa que precise de atenção sem enviar spam para você.

O heartbeat é um turno agendado da sessão principal — ele **não** cria registros de [tarefas em segundo plano](/automation/tasks).
Registros de tarefas são para trabalho desacoplado (execuções ACP, subagentes, tarefas cron isoladas).

Solução de problemas: [Scheduled Tasks](/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

1. Deixe os heartbeats ativados (o padrão é `30m`, ou `1h` para autenticação OAuth/token da Anthropic, incluindo reutilização da Claude CLI) ou defina sua própria cadência.
2. Crie um pequeno checklist em `HEARTBEAT.md` ou um bloco `tasks:` no workspace do agente (opcional, mas recomendado).
3. Decida para onde as mensagens de heartbeat devem ir (`target: "none"` é o padrão; defina `target: "last"` para encaminhar ao último contato).
4. Opcional: ative a entrega do raciocínio do heartbeat para maior transparência.
5. Opcional: use contexto de bootstrap leve se as execuções de heartbeat precisarem apenas de `HEARTBEAT.md`.
6. Opcional: ative sessões isoladas para evitar enviar o histórico completo da conversa a cada heartbeat.
7. Opcional: restrinja os heartbeats a horários ativos (hora local).

Exemplo de configuração:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando autenticação OAuth/token da Anthropic é o modo de autenticação detectado, incluindo reutilização da Claude CLI). Defina `agents.defaults.heartbeat.every` ou por agente em `agents.list[].heartbeat.every`; use `0m` para desativar.
- Corpo do prompt (configurável via `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt de heartbeat é enviado **literalmente** como a mensagem do usuário. O prompt de sistema
  inclui uma seção “Heartbeat” e a execução é sinalizada internamente.
- Horários ativos (`heartbeat.activeHours`) são verificados no fuso horário configurado.
  Fora da janela, os heartbeats são ignorados até o próximo tick dentro da janela.

## Para que serve o prompt de heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em segundo plano**: “Consider outstanding tasks” incentiva o agente a revisar
  acompanhamentos (caixa de entrada, calendário, lembretes, trabalho enfileirado) e destacar qualquer coisa urgente.
- **Check-in humano**: “Checkup sometimes on your human during day time” incentiva uma
  mensagem leve ocasional do tipo “precisa de algo?”, mas evita spam noturno
  usando o fuso horário local configurado (consulte [/concepts/timezone](/concepts/timezone)).

O heartbeat pode reagir a [tarefas em segundo plano](/automation/tasks) concluídas, mas uma execução de heartbeat em si não cria um registro de tarefa.

Se você quiser que um heartbeat faça algo muito específico (por exemplo, “verifique estatísticas do Gmail PubSub”
ou “verifique a integridade do gateway”), defina `agents.defaults.heartbeat.prompt` (ou
`agents.list[].heartbeat.prompt`) com um corpo personalizado (enviado literalmente).

## Contrato de resposta

- Se nada precisar de atenção, responda com **`HEARTBEAT_OK`**.
- Durante execuções de heartbeat, o OpenClaw trata `HEARTBEAT_OK` como um ack quando ele aparece
  no **início ou no fim** da resposta. O token é removido e a resposta é
  descartada se o conteúdo restante for **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, ele não é tratado
  de forma especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora dos heartbeats, `HEARTBEAT_OK` solto no início/fim de uma mensagem é removido
e registrado em log; uma mensagem que seja apenas `HEARTBEAT_OK` é descartada.

## Configuração

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global de heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se qualquer agente tiver um bloco `heartbeat`, **somente esses agentes** executam heartbeats.
- `channels.defaults.heartbeat` define padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com várias contas) substitui por canal.

### Heartbeats por agente

Se qualquer entrada em `agents.list[]` incluir um bloco `heartbeat`, **somente esses agentes**
executarão heartbeats. O bloco por agente é mesclado por cima de `agents.defaults.heartbeat`
(assim você pode definir padrões compartilhados uma vez e substituir por agente).

Exemplo: dois agentes, apenas o segundo agente executa heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemplo de horários ativos

Restrinja heartbeats ao horário comercial em um fuso horário específico:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Fora dessa janela (antes das 9h ou depois das 22h do Leste), os heartbeats são ignorados. O próximo tick agendado dentro da janela será executado normalmente.

### Configuração 24/7

Se você quiser que os heartbeats sejam executados o dia todo, use um destes padrões:

- Omita `activeHours` completamente (sem restrição de janela de tempo; esse é o comportamento padrão).
- Defina uma janela de dia inteiro: `activeHours: { start: "00:00", end: "24:00" }`.

Não defina o mesmo horário em `start` e `end` (por exemplo, `08:00` a `08:00`).
Isso é tratado como uma janela de largura zero, então os heartbeats são sempre ignorados.

### Exemplo com várias contas

Use `accountId` para direcionar uma conta específica em canais com várias contas, como o Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Observações dos campos

- `every`: intervalo do heartbeat (string de duração; unidade padrão = minutos).
- `model`: substituição opcional de modelo para execuções de heartbeat (`provider/model`).
- `includeReasoning`: quando ativado, também entrega a mensagem separada `Reasoning:` quando disponível (mesmo formato de `/reasoning on`).
- `lightContext`: quando true, execuções de heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat é executado em uma sessão nova sem histórico prévio da conversa. Usa o mesmo padrão de isolamento de cron `sessionTarget: "isolated"`. Reduz drasticamente o custo em tokens por heartbeat. Combine com `lightContext: true` para máxima economia. O roteamento de entrega ainda usa o contexto da sessão principal.
- `session`: chave de sessão opcional para execuções de heartbeat.
  - `main` (padrão): sessão principal do agente.
  - Chave de sessão explícita (copie de `openclaw sessions --json` ou da [CLI de sessões](/cli/sessions)).
  - Formatos de chave de sessão: consulte [Sessions](/concepts/session) e [Groups](/channels/groups).
- `target`:
  - `last`: entrega ao último canal externo usado.
  - canal explícito: qualquer canal configurado ou id de plugin, por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`.
  - `none` (padrão): executa o heartbeat, mas **não entrega** externamente.
- `directPolicy`: controla o comportamento de entrega direta/DM:
  - `allow` (padrão): permite entrega direta/DM de heartbeat.
  - `block`: suprime entrega direta/DM (`reason=dm-blocked`).
- `to`: substituição opcional do destinatário (id específico do canal, por exemplo E.164 para WhatsApp ou um id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.
- `accountId`: id de conta opcional para canais com várias contas. Quando `target: "last"`, o id da conta se aplica ao último canal resolvido se ele oferecer suporte a contas; caso contrário, é ignorado. Se o id da conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.
- `prompt`: substitui o corpo de prompt padrão (não é mesclado).
- `ackMaxChars`: máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.
- `suppressToolErrorWarnings`: quando true, suprime cargas de aviso de erro de ferramenta durante execuções de heartbeat.
- `activeHours`: restringe execuções de heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para o início do dia), `end` (HH:MM exclusivo; `24:00` é permitido para o fim do dia) e `timezone` opcional.
  - Omitido ou `"user"`: usa seu `agents.defaults.userTimezone` se estiver definido; caso contrário, usa o fuso horário do sistema host.
  - `"local"`: sempre usa o fuso horário do sistema host.
  - Qualquer identificador IANA (por exemplo, `America/New_York`): usado diretamente; se for inválido, usa o comportamento `"user"` acima.
  - `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
  - Fora da janela ativa, os heartbeats são ignorados até o próximo tick dentro da janela.

## Comportamento de entrega

- Por padrão, os heartbeats são executados na sessão principal do agente (`agent:<id>:<mainKey>`),
  ou em `global` quando `session.scope = "global"`. Defina `session` para substituir por uma
  sessão específica de canal (Discord/WhatsApp/etc.).
- `session` afeta apenas o contexto da execução; a entrega é controlada por `target` e `to`.
- Para entregar a um canal/destinatário específico, defina `target` + `to`. Com
  `target: "last"`, a entrega usa o último canal externo dessa sessão.
- As entregas de heartbeat permitem destinos diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios para destinos diretos enquanto ainda executa o turno de heartbeat.
- Se a fila principal estiver ocupada, o heartbeat é ignorado e tentado novamente mais tarde.
- Se `target` não resolver para nenhum destino externo, a execução ainda acontece, mas nenhuma
  mensagem de saída é enviada.
- Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desativados, a execução é ignorada antecipadamente como `reason=alerts-disabled`.
- Se apenas a entrega de alertas estiver desativada, o OpenClaw ainda pode executar o heartbeat, atualizar timestamps de tarefas vencidas, restaurar o timestamp de inatividade da sessão e suprimir a carga externa do alerta.
- Respostas somente de heartbeat **não** mantêm a sessão ativa; o último `updatedAt`
  é restaurado para que a expiração por inatividade se comporte normalmente.
- [Tarefas em segundo plano](/automation/tasks) desacopladas podem enfileirar um evento de sistema e despertar o heartbeat quando a sessão principal deve perceber algo rapidamente. Esse despertar não faz da execução do heartbeat uma tarefa em segundo plano.

## Controles de visibilidade

Por padrão, confirmações `HEARTBEAT_OK` são suprimidas enquanto conteúdo de alerta é
entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Precedência: por conta → por canal → padrões do canal → padrões integrados.

### O que cada flag faz

- `showOk`: envia uma confirmação `HEARTBEAT_OK` quando o modelo retorna uma resposta apenas de OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta diferente de OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da UI.

Se **todos os três** forem false, o OpenClaw ignora completamente a execução do heartbeat (sem chamada ao modelo).

### Exemplos por canal vs por conta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Padrões comuns

| Objetivo                                 | Configuração                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativos) | _(nenhuma configuração necessária)_                                           |
| Totalmente silencioso (sem mensagens, sem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Somente indicador (sem mensagens)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs em apenas um canal                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se existir um arquivo `HEARTBEAT.md` no workspace, o prompt padrão diz ao
agente para lê-lo. Pense nele como sua “lista de verificação de heartbeat”: pequena, estável e
segura para incluir a cada 30 minutos.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos
Markdown como `# Heading`), o OpenClaw ignora a execução do heartbeat para economizar chamadas de API.
Esse salto é relatado como `reason=empty-heartbeat-file`.
Se o arquivo estiver ausente, o heartbeat ainda é executado e o modelo decide o que fazer.

Mantenha-o pequeno (checklist curto ou lembretes) para evitar inchaço do prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Blocos `tasks:`

`HEARTBEAT.md` também oferece suporte a um pequeno bloco estruturado `tasks:` para
verificações baseadas em intervalo dentro do próprio heartbeat.

Exemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

Comportamento:

- O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa em relação ao seu próprio `interval`.
- Somente tarefas **vencidas** são incluídas no prompt de heartbeat daquele tick.
- Se nenhuma tarefa estiver vencida, o heartbeat é totalmente ignorado (`reason=no-tasks-due`) para evitar uma chamada desperdiçada ao modelo.
- Conteúdo fora das tarefas em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas vencidas.
- Timestamps da última execução das tarefas são armazenados no estado da sessão (`heartbeatTaskState`), de modo que os intervalos sobrevivem a reinicializações normais.
- Os timestamps das tarefas só avançam após uma execução de heartbeat completar seu caminho normal de resposta. Execuções ignoradas por `empty-heartbeat-file` / `no-tasks-due` não marcam tarefas como concluídas.

O modo de tarefas é útil quando você quer que um único arquivo de heartbeat contenha várias verificações periódicas sem pagar por todas elas a cada tick.

### O agente pode atualizar HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao
agente (em um chat normal) algo como:

- “Atualize `HEARTBEAT.md` para adicionar uma verificação diária do calendário.”
- “Reescreva `HEARTBEAT.md` para que fique mais curto e focado em acompanhamentos da caixa de entrada.”

Se você quiser que isso aconteça de forma proativa, também pode incluir uma linha explícita no
seu prompt de heartbeat, como: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Observação de segurança: não coloque segredos (chaves de API, números de telefone, tokens privados) em
`HEARTBEAT.md` — ele passa a fazer parte do contexto do prompt.

## Despertar manual (sob demanda)

Você pode enfileirar um evento de sistema e acionar um heartbeat imediato com:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se vários agentes tiverem `heartbeat` configurado, um despertar manual executará imediatamente os heartbeats de cada um desses agentes.

Use `--mode next-heartbeat` para aguardar o próximo tick agendado.

## Entrega de raciocínio (opcional)

Por padrão, os heartbeats entregam apenas a carga final de “resposta”.

Se você quiser transparência, ative:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando ativado, os heartbeats também entregarão uma mensagem separada prefixada com
`Reasoning:` (mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente
está gerenciando várias sessões/codexes e você quer ver por que ele decidiu chamar
sua atenção — mas também pode expor mais detalhes internos do que você deseja. Prefira manter isso
desativado em chats de grupo.

## Consciência de custo

Heartbeats executam turnos completos do agente. Intervalos mais curtos consomem mais tokens. Para reduzir custo:

- Use `isolatedSession: true` para evitar enviar o histórico completo da conversa (~100 mil tokens para ~2-5 mil por execução).
- Use `lightContext: true` para limitar os arquivos de bootstrap apenas a `HEARTBEAT.md`.
- Defina um `model` mais barato (por exemplo, `ollama/llama3.2:1b`).
- Mantenha `HEARTBEAT.md` pequeno.
- Use `target: "none"` se quiser apenas atualizações de estado internas.

## Relacionado

- [Automation & Tasks](/automation) — todos os mecanismos de automação em um relance
- [Background Tasks](/automation/tasks) — como o trabalho desacoplado é rastreado
- [Timezone](/concepts/timezone) — como o fuso horário afeta o agendamento do heartbeat
- [Troubleshooting](/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
