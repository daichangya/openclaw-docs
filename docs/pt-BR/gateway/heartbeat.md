---
read_when:
    - Ajustando a cadência ou as mensagens do Heartbeat
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
summary: Mensagens de polling de Heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-04-22T05:34:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** Veja [Automation & Tasks](/pt-BR/automation) para orientações sobre quando usar cada um.

O Heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa
destacar qualquer coisa que precise de atenção sem te encher de mensagens.

O Heartbeat é um turno agendado da sessão principal — ele **não** cria registros de [tarefas em segundo plano](/pt-BR/automation/tasks).
Os registros de tarefa são para trabalho desacoplado (execuções de ACP, subagentes, jobs de Cron isolados).

Solução de problemas: [Scheduled Tasks](/pt-BR/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

1. Deixe os heartbeats ativados (o padrão é `30m`, ou `1h` para autenticação Anthropic OAuth/token, incluindo reutilização do Claude CLI) ou defina sua própria cadência.
2. Crie um pequeno checklist em `HEARTBEAT.md` ou um bloco `tasks:` no workspace do agente (opcional, mas recomendado).
3. Decida para onde as mensagens de heartbeat devem ir (`target: "none"` é o padrão; defina `target: "last"` para encaminhar ao último contato).
4. Opcional: ative a entrega do raciocínio do heartbeat para transparência.
5. Opcional: use contexto bootstrap leve se as execuções do heartbeat precisarem apenas de `HEARTBEAT.md`.
6. Opcional: ative sessões isoladas para evitar enviar o histórico completo da conversa a cada heartbeat.
7. Opcional: restrinja os heartbeats a horas ativas (hora local).

Exemplo de configuração:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
        directPolicy: "allow", // padrão: permite destinos diretos/DM; defina "block" para suprimir
        lightContext: true, // opcional: injeta apenas HEARTBEAT.md dos arquivos bootstrap
        isolatedSession: true, // opcional: sessão nova a cada execução (sem histórico de conversa)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: envia também uma mensagem separada `Reasoning:`
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando o modo de autenticação detectado for Anthropic OAuth/token, incluindo reutilização do Claude CLI). Defina `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` por agente; use `0m` para desativar.
- Corpo do prompt (configurável por `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt do heartbeat é enviado **literalmente** como a mensagem do usuário. O
  prompt do sistema inclui uma seção “Heartbeat” apenas quando os heartbeats estão ativados para o
  agente padrão, e a execução é marcada internamente.
- Quando os heartbeats são desativados com `0m`, execuções normais também omitem `HEARTBEAT.md`
  do contexto bootstrap para que o modelo não veja instruções exclusivas de heartbeat.
- As horas ativas (`heartbeat.activeHours`) são verificadas no fuso horário configurado.
  Fora da janela, os heartbeats são ignorados até o próximo tick dentro da janela.

## Para que serve o prompt de heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em segundo plano**: “Consider outstanding tasks” incentiva o agente a revisar
  acompanhamentos pendentes (caixa de entrada, calendário, lembretes, trabalho enfileirado) e destacar qualquer item urgente.
- **Check-in humano**: “Checkup sometimes on your human during day time” incentiva
  uma mensagem ocasional e leve do tipo “precisa de algo?”, mas evita spam noturno
  usando seu fuso horário local configurado (veja [/concepts/timezone](/pt-BR/concepts/timezone)).

O Heartbeat pode reagir a [tarefas em segundo plano](/pt-BR/automation/tasks) concluídas, mas uma execução de heartbeat em si não cria um registro de tarefa.

Se você quiser que um heartbeat faça algo muito específico (por exemplo, “verificar estatísticas do Gmail PubSub”
ou “verificar a integridade do gateway”), defina `agents.defaults.heartbeat.prompt` (ou
`agents.list[].heartbeat.prompt`) com um corpo personalizado (enviado literalmente).

## Contrato de resposta

- Se nada precisar de atenção, responda com **`HEARTBEAT_OK`**.
- Durante execuções de heartbeat, o OpenClaw trata `HEARTBEAT_OK` como confirmação quando ele aparece
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
        every: "30m", // padrão: 30m (0m desativa)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // padrão: false (entrega mensagem separada `Reasoning:` quando disponível)
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma sessão nova (sem histórico de conversa)
        target: "last", // padrão: none | opções: last | none | <id do canal> (core ou plugin, por exemplo "bluebubbles")
        to: "+15551234567", // opcional: substituição específica do canal
        accountId: "ops-bot", // opcional: id de canal com múltiplas contas
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // máximo de caracteres permitidos após HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global do heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se qualquer agente tiver um bloco `heartbeat`, **somente esses agentes** executarão heartbeats.
- `channels.defaults.heartbeat` define padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com múltiplas contas) substitui por canal.

### Heartbeats por agente

Se qualquer entrada de `agents.list[]` incluir um bloco `heartbeat`, **somente esses agentes**
executarão heartbeats. O bloco por agente é mesclado por cima de `agents.defaults.heartbeat`
(assim você pode definir padrões compartilhados uma vez e substituí-los por agente).

Exemplo: dois agentes, apenas o segundo agente executa heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
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
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemplo de horas ativas

Restrinja os heartbeats ao horário comercial em um fuso horário específico:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcional; usa seu userTimezone se definido, caso contrário usa o fuso do host
        },
      },
    },
  },
}
```

Fora dessa janela (antes das 9h ou depois das 22h no horário do leste dos EUA), os heartbeats são ignorados. O próximo tick agendado dentro da janela será executado normalmente.

### Configuração 24/7

Se você quiser que os heartbeats sejam executados o dia todo, use um destes padrões:

- Omita `activeHours` completamente (sem restrição de janela de tempo; este é o comportamento padrão).
- Defina uma janela de dia inteiro: `activeHours: { start: "00:00", end: "24:00" }`.

Não defina `start` e `end` com o mesmo horário (por exemplo `08:00` até `08:00`).
Isso é tratado como uma janela de largura zero, então os heartbeats são sempre ignorados.

### Exemplo com múltiplas contas

Use `accountId` para direcionar uma conta específica em canais com múltiplas contas, como Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcional: encaminha para um tópico/thread específico
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

### Observações sobre os campos

- `every`: intervalo do heartbeat (string de duração; unidade padrão = minutos).
- `model`: substituição opcional do modelo para execuções de heartbeat (`provider/model`).
- `includeReasoning`: quando ativado, também entrega a mensagem separada `Reasoning:` quando disponível (mesmo formato de `/reasoning on`).
- `lightContext`: quando true, as execuções de heartbeat usam contexto bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat é executado em uma sessão nova, sem histórico de conversa anterior. Usa o mesmo padrão de isolamento do Cron `sessionTarget: "isolated"`. Reduz drasticamente o custo de tokens por heartbeat. Combine com `lightContext: true` para a máxima economia. O roteamento de entrega ainda usa o contexto da sessão principal.
- `session`: chave de sessão opcional para execuções de heartbeat.
  - `main` (padrão): sessão principal do agente.
  - Chave de sessão explícita (copie de `openclaw sessions --json` ou da [CLI de sessões](/cli/sessions)).
  - Formatos de chave de sessão: veja [Sessions](/pt-BR/concepts/session) e [Groups](/pt-BR/channels/groups).
- `target`:
  - `last`: entrega ao último canal externo usado.
  - canal explícito: qualquer id de canal ou plugin configurado, por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`.
  - `none` (padrão): executa o heartbeat, mas **não entrega** externamente.
- `directPolicy`: controla o comportamento de entrega direta/DM:
  - `allow` (padrão): permite entrega de heartbeat direta/DM.
  - `block`: suprime entrega direta/DM (`reason=dm-blocked`).
- `to`: substituição opcional do destinatário (id específico do canal, por exemplo E.164 para WhatsApp ou um id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.
- `accountId`: id de conta opcional para canais com múltiplas contas. Quando `target: "last"`, o id da conta é aplicado ao último canal resolvido se ele oferecer suporte a contas; caso contrário, é ignorado. Se o id da conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.
- `prompt`: substitui o corpo do prompt padrão (não é mesclado).
- `ackMaxChars`: máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `activeHours`: restringe execuções de heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para início do dia), `end` (HH:MM exclusivo; `24:00` é permitido para fim do dia) e `timezone` opcional.
  - Omitido ou `"user"`: usa seu `agents.defaults.userTimezone` se definido; caso contrário, usa o fuso horário do sistema host.
  - `"local"`: sempre usa o fuso horário do sistema host.
  - Qualquer identificador IANA (por exemplo `America/New_York`): usado diretamente; se for inválido, volta ao comportamento `"user"` acima.
  - `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
  - Fora da janela ativa, os heartbeats são ignorados até o próximo tick dentro da janela.

## Comportamento de entrega

- Os heartbeats são executados por padrão na sessão principal do agente (`agent:<id>:<mainKey>`),
  ou em `global` quando `session.scope = "global"`. Defina `session` para substituir por uma
  sessão de canal específica (Discord/WhatsApp/etc.).
- `session` afeta apenas o contexto da execução; a entrega é controlada por `target` e `to`.
- Para entregar a um canal/destinatário específico, defina `target` + `to`. Com
  `target: "last"`, a entrega usa o último canal externo dessa sessão.
- As entregas de heartbeat permitem destinos diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios para destinos diretos enquanto ainda executa o turno de heartbeat.
- Se a fila principal estiver ocupada, o heartbeat será ignorado e tentado novamente mais tarde.
- Se `target` não for resolvido para nenhum destino externo, a execução ainda acontece, mas nenhuma
  mensagem de saída é enviada.
- Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desativados, a execução será ignorada antecipadamente como `reason=alerts-disabled`.
- Se apenas a entrega de alertas estiver desativada, o OpenClaw ainda poderá executar o heartbeat, atualizar os carimbos de data/hora das tarefas vencidas, restaurar o carimbo de data/hora de inatividade da sessão e suprimir o payload do alerta externo.
- Se o destino de heartbeat resolvido oferecer suporte a indicador de digitação, o OpenClaw mostrará digitação enquanto
  a execução do heartbeat estiver ativa. Isso usa o mesmo destino para o qual o heartbeat
  enviaria a saída do chat, e é desativado por `typingMode: "never"`.
- Respostas exclusivas de heartbeat **não** mantêm a sessão ativa; o último `updatedAt`
  é restaurado para que a expiração por inatividade se comporte normalmente.
- [Tarefas em segundo plano](/pt-BR/automation/tasks) desacopladas podem enfileirar um evento do sistema e despertar o heartbeat quando a sessão principal precisar perceber algo rapidamente. Esse despertar não faz com que a execução do heartbeat se torne uma tarefa em segundo plano.

## Controles de visibilidade

Por padrão, confirmações `HEARTBEAT_OK` são suprimidas, enquanto o conteúdo de alerta é
entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Oculta HEARTBEAT_OK (padrão)
      showAlerts: true # Mostra mensagens de alerta (padrão)
      useIndicator: true # Emite eventos de indicador (padrão)
  telegram:
    heartbeat:
      showOk: true # Mostra confirmações OK no Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprime a entrega de alertas para esta conta
```

Precedência: por conta → por canal → padrões do canal → padrões internos.

### O que cada sinalizador faz

- `showOk`: envia uma confirmação `HEARTBEAT_OK` quando o modelo retorna uma resposta apenas de OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta não-OK.
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
      showOk: true # todas as contas do Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suprime alertas apenas para a conta ops
  telegram:
    heartbeat:
      showOk: true
```

### Padrões comuns

| Objetivo                                 | Configuração                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativados) | _(nenhuma configuração necessária)_                                                      |
| Totalmente silencioso (sem mensagens, sem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Somente indicador (sem mensagens)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs em apenas um canal                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se existir um arquivo `HEARTBEAT.md` no workspace, o prompt padrão instrui o
agente a lê-lo. Pense nele como sua “lista de verificação de heartbeat”: pequena, estável e
segura para incluir a cada 30 minutos.

Em execuções normais, `HEARTBEAT.md` só é injetado quando a orientação de heartbeat está
ativada para o agente padrão. Desativar a cadência do heartbeat com `0m` ou
definir `includeSystemPromptSection: false` o omite do contexto bootstrap
normal.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos
markdown como `# Heading`), o OpenClaw ignora a execução do heartbeat para economizar chamadas de API.
Essa ignorada é reportada como `reason=empty-heartbeat-file`.
Se o arquivo estiver ausente, o heartbeat ainda será executado e o modelo decidirá o que fazer.

Mantenha-o pequeno (checklist curto ou lembretes) para evitar inchar o prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Lista de verificação de heartbeat

- Verificação rápida: há algo urgente nas caixas de entrada?
- Se for de dia, faça um check-in leve se não houver mais nada pendente.
- Se uma tarefa estiver bloqueada, anote _o que está faltando_ e pergunte ao Peter na próxima vez.
```

### Blocos `tasks:`

`HEARTBEAT.md` também oferece suporte a um pequeno bloco estruturado `tasks:` para
verificações baseadas em intervalos dentro do próprio heartbeat.

Exemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Verifique se há emails urgentes não lidos e destaque qualquer coisa sensível ao tempo."
- name: calendar-scan
  interval: 2h
  prompt: "Verifique se há reuniões próximas que precisem de preparação ou acompanhamento."

# Instruções adicionais

- Mantenha os alertas curtos.
- Se nada precisar de atenção após todas as tarefas vencidas, responda HEARTBEAT_OK.
```

Comportamento:

- O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa com base em seu próprio `interval`.
- Apenas tarefas **vencidas** são incluídas no prompt de heartbeat desse tick.
- Se nenhuma tarefa estiver vencida, o heartbeat será completamente ignorado (`reason=no-tasks-due`) para evitar uma chamada desnecessária ao modelo.
- Conteúdo que não seja tarefa em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas vencidas.
- Os carimbos de data/hora da última execução das tarefas são armazenados no estado da sessão (`heartbeatTaskState`), para que os intervalos sobrevivam a reinicializações normais.
- Os carimbos de data/hora das tarefas só avançam depois que uma execução de heartbeat conclui seu fluxo normal de resposta. Execuções ignoradas de `empty-heartbeat-file` / `no-tasks-due` não marcam tarefas como concluídas.

O modo de tarefas é útil quando você quer que um único arquivo de heartbeat contenha várias verificações periódicas sem pagar por todas elas a cada tick.

### O agente pode atualizar o HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao
agente (em um chat normal) algo como:

- “Atualize `HEARTBEAT.md` para adicionar uma verificação diária do calendário.”
- “Reescreva `HEARTBEAT.md` para que fique mais curto e focado em acompanhamentos da caixa de entrada.”

Se você quiser que isso aconteça de forma proativa, também pode incluir uma linha explícita no
seu prompt de heartbeat, como: “Se a lista de verificação ficar desatualizada, atualize HEARTBEAT.md
com uma versão melhor.”

Observação de segurança: não coloque segredos (chaves de API, números de telefone, tokens privados) em
`HEARTBEAT.md` — ele se torna parte do contexto do prompt.

## Despertar manual (sob demanda)

Você pode enfileirar um evento do sistema e acionar um heartbeat imediato com:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se vários agentes tiverem `heartbeat` configurado, um despertar manual executará imediatamente os
heartbeats de cada um desses agentes.

Use `--mode next-heartbeat` para aguardar o próximo tick agendado.

## Entrega de raciocínio (opcional)

Por padrão, os heartbeats entregam apenas o payload final de “resposta”.

Se você quiser transparência, ative:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando ativado, os heartbeats também entregarão uma mensagem separada prefixada com
`Reasoning:` (mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente
está gerenciando várias sessões/codexes e você quer ver por que ele decidiu te avisar
— mas também pode expor mais detalhes internos do que você deseja. Prefira manter isso
desativado em chats em grupo.

## Consciência de custo

Os heartbeats executam turnos completos do agente. Intervalos mais curtos consomem mais tokens. Para reduzir custo:

- Use `isolatedSession: true` para evitar enviar todo o histórico da conversa (~100 mil tokens para ~2–5 mil por execução).
- Use `lightContext: true` para limitar os arquivos bootstrap somente a `HEARTBEAT.md`.
- Defina um `model` mais barato (por exemplo `ollama/llama3.2:1b`).
- Mantenha `HEARTBEAT.md` pequeno.
- Use `target: "none"` se você quiser apenas atualizações internas de estado.

## Relacionado

- [Automation & Tasks](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Background Tasks](/pt-BR/automation/tasks) — como o trabalho desacoplado é rastreado
- [Timezone](/pt-BR/concepts/timezone) — como o fuso horário afeta o agendamento do heartbeat
- [Troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
