---
read_when:
    - Ajustando pensamento, modo rápido ou parsing/padrões da diretiva verbose
summary: Sintaxe de diretiva para /think, /fast, /verbose, /trace e visibilidade de raciocínio
title: Níveis de pensamento
x-i18n:
    generated_at: "2026-04-21T05:44:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fbcb2feb14331e000ae0bcb908f060dba0ce900d6628a42e87e98502b13f6e9
    source_path: tools/thinking.md
    workflow: 15
---

# Níveis de pensamento (/think directives)

## O que faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelos Codex e esforço do Anthropic Claude Opus 4.7)
  - adaptive → pensamento adaptativo gerenciado pelo provedor (compatível com Claude 4.6 em Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mapeiam para `xhigh`.
  - `highest`, `max` mapeiam para `high`.
- Observações sobre provedores:
  - `adaptive` só é anunciado em menus e seletores nativos de comando para provedores/modelos que declaram suporte a pensamento adaptativo. Ele continua aceito como diretiva digitada por compatibilidade com configs e aliases existentes.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de pensamento é definido.
  - Anthropic Claude Opus 4.7 não usa pensamento adaptativo por padrão. O padrão de esforço da API continua pertencendo ao provedor, a menos que você defina explicitamente um nível de pensamento.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para pensamento adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de pensamento e `xhigh` é a configuração de esforço do Opus 4.7.
  - Modelos OpenAI GPT mapeiam `/think` pelo suporte específico do modelo a esforço da Responses API. `/think off` envia `reasoning.effort: "none"` apenas quando o modelo de destino oferece suporte; caso contrário, o OpenClaw omite a carga de raciocínio desativado em vez de enviar um valor não compatível.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina explicitamente thinking nos params do modelo ou da solicitação. Isso evita vazamento de deltas `reasoning_content` do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) só oferece suporte a thinking binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando thinking está ativado, o Moonshot só aceita `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas àquela mensagem).
2. Override de sessão (definido ao enviar uma mensagem que contém só a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na config).
4. Padrão global (`agents.defaults.thinkingDefault` na config).
5. Fallback: `adaptive` para modelos Anthropic Claude 4.6, `off` para Anthropic Claude Opus 4.7, salvo configuração explícita, `low` para outros modelos compatíveis com raciocínio, `off` nos demais casos.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaços em branco permitidos), por exemplo `/think:medium` ou `/t high`.
- Isso permanece na sessão atual (por padrão, por remetente); é limpo por `/think:off` ou por reset por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo `/thinking big`), o comando será rejeitado com uma dica e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de pensamento.

## Aplicação por agente

- **PI incorporado**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Uma mensagem contendo só a diretiva alterna um override de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/contendo só diretiva
  2. Override de sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Config por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido mapeia para processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia a mesma flag `service_tier=priority` em Codex Responses. O OpenClaw mantém um único toggle `/fast` compartilhado entre os dois caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido mapeia para service tiers da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Params explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção de service tier da Anthropic para URLs base de proxy não Anthropic.

## Diretivas verbose (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo só a diretiva alterna o verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena um override explícito de sessão; limpe-o pela UI de Sessions escolhendo `inherit`.
- A diretiva inline afeta apenas aquela mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verbose atual.
- Quando verbose está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam de volta cada chamada de ferramenta como sua própria mensagem apenas de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta começa (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos brutos com detalhes de erro ficam ocultos, a menos que verbose esteja em `on` ou `full`.
- Quando verbose é `full`, saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramenta subsequentes respeitarão a nova configuração.

## Diretivas de trace de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo só a diretiva alterna a saída de trace de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- A diretiva inline afeta apenas aquela mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível atual de trace.
- `/trace` é mais restrito do que `/verbose`: ele expõe apenas linhas de trace/debug pertencentes ao Plugin, como resumos de depuração de Active Memory.
- Linhas de trace podem aparecer em `/status` e como uma mensagem de diagnóstico de acompanhamento após a resposta normal do assistente.

## Visibilidade de raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem contendo só a diretiva alterna se blocos de pensamento são mostrados nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): faz streaming do raciocínio na bolha de rascunho do Telegram enquanto a resposta está sendo gerada, depois envia a resposta final sem o raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de raciocínio.
- Ordem de resolução: diretiva inline, depois override de sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

## Relacionados

- A documentação do modo elevado está em [Elevated mode](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sonda de Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de Heartbeats).
- A entrega de Heartbeat usa por padrão apenas a carga final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## UI de chat web

- O seletor de thinking do chat web espelha o nível armazenado da sessão a partir do session store/config de entrada quando a página é carregada.
- Escolher outro nível grava o override de sessão imediatamente via `sessions.patch`; não espera o próximo envio e não é um override único `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do modelo ativo da sessão: `adaptive` para Claude 4.6 em Anthropic, `off` para Anthropic Claude Opus 4.7, salvo configuração, `low` para outros modelos compatíveis com raciocínio, `off` nos demais casos.
- O seletor permanece ciente do provedor:
  - a maioria dos provedores mostra `off | minimal | low | medium | high`
  - Anthropic/Bedrock Claude 4.6 mostra `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 mostra `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI mostra binário `off | on`
- `/think:<level>` continua funcionando e atualiza o mesmo nível armazenado da sessão, para que diretivas de chat e o seletor permaneçam sincronizados.
