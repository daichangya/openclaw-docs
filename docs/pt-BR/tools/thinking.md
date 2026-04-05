---
read_when:
    - Ajustar a análise de diretivas ou os padrões de raciocínio, modo rápido ou verbose
summary: Sintaxe de diretivas para /think, /fast, /verbose e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-04-05T12:56:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Níveis de raciocínio (diretivas /think)

## O que faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (somente modelos GPT-5.2 + Codex)
  - adaptive → orçamento adaptativo de raciocínio gerenciado pelo provedor (compatível com a família de modelos Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest`, `max` são mapeados para `high`.
- Observações sobre provedores:
  - Os modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível de raciocínio explícito é definido.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina explicitamente o raciocínio nos parâmetros do modelo ou da solicitação. Isso evita deltas vazados de `reasoning_content` do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) só oferece suporte a raciocínio binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o raciocínio está habilitado, o Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente àquela mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem somente com diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: `adaptive` para modelos Anthropic Claude 4.6, `low` para outros modelos com capacidade de raciocínio, `off` caso contrário.

## Definir um padrão de sessão

- Envie uma mensagem que seja **somente** a diretiva (espaços em branco permitidos), por exemplo `/think:medium` ou `/t high`.
- Isso permanece na sessão atual (por padrão, por remetente); é limpo por `/think:off` ou redefinição por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando será rejeitado com uma dica e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de raciocínio.

## Aplicação por agente

- **Pi incorporado**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Uma mensagem somente com diretiva alterna uma substituição de modo rápido na sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/somente-diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido é mapeado para processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia a mesma flag `service_tier=priority` em Codex Responses. O OpenClaw mantém um único alternador `/fast` compartilhado entre os dois caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido é mapeado para níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção de nível de serviço Anthropic para URLs base de proxy que não sejam Anthropic.

## Diretivas verbose (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem somente com diretiva alterna o verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela UI de Sessions escolhendo `inherit`.
- A diretiva inline afeta somente aquela mensagem; os padrões de sessão/globais se aplicam nos demais casos.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verbose atual.
- Quando verbose está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramentas são enviados assim que cada ferramenta é iniciada (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta continuam visíveis no modo normal, mas sufixos brutos com detalhes de erro ficam ocultos, a menos que verbose esteja em `on` ou `full`.
- Quando verbose está em `full`, as saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramentas subsequentes respeitarão a nova configuração.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem somente com diretiva alterna se blocos de raciocínio são mostrados nas respostas.
- Quando habilitado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio na bolha de rascunho do Telegram enquanto a resposta está sendo gerada e, em seguida, envia a resposta final sem o raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de raciocínio.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`) e, por fim, fallback (`off`).

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sonda de heartbeat é o prompt de heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de heartbeats).
- A entrega de heartbeat usa por padrão apenas a carga final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI do chat web

- O seletor de raciocínio do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração da sessão de entrada quando a página é carregada.
- Escolher outro nível grava a substituição da sessão imediatamente via `sessions.patch`; não espera o próximo envio e não é uma substituição única `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do modelo ativo da sessão: `adaptive` para Claude 4.6 em Anthropic/Bedrock, `low` para outros modelos com capacidade de raciocínio, `off` caso contrário.
- O seletor permanece ciente do provedor:
  - a maioria dos provedores mostra `off | minimal | low | medium | high | adaptive`
  - Z.AI mostra `off | on` binário
- `/think:<level>` continua funcionando e atualiza o mesmo nível armazenado da sessão, para que as diretivas de chat e o seletor permaneçam sincronizados.
