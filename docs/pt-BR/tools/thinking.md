---
read_when:
    - Ajustar a análise de diretivas ou os padrões de thinking, modo rápido ou detalhado
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-04-21T19:21:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Níveis de raciocínio (diretivas /think)

## O que isso faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelos Codex e esforço do Anthropic Claude Opus 4.7)
  - adaptive → raciocínio adaptativo gerenciado pelo provedor (compatível com Claude 4.6 no Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → raciocínio máximo do provedor (atualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest` é mapeado para `high`.
- Observações sobre provedores:
  - Menus e seletores de raciocínio são orientados por perfis de provedor. Plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como o binário `on`.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provedor/modelo que os suportam. Diretivas digitadas para níveis não compatíveis são rejeitadas com as opções válidas desse modelo.
  - Níveis incompatíveis já armazenados são remapeados pelo ranking do perfil do provedor. `adaptive` recua para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` recuam para o maior nível compatível diferente de off no modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de raciocínio está definido.
  - Anthropic Claude Opus 4.7 não usa raciocínio adaptativo por padrão. O padrão de esforço da API permanece sob controle do provedor, a menos que você defina explicitamente um nível de raciocínio.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para raciocínio adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de raciocínio e `xhigh` é a configuração de esforço do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; isso é mapeado para o mesmo caminho de esforço máximo controlado pelo provedor.
  - Modelos OpenAI GPT mapeiam `/think` por meio do suporte específico do modelo ao esforço da Responses API. `/think off` envia `reasoning.effort: "none"` apenas quando o modelo de destino suporta isso; caso contrário, o OpenClaw omite a carga de raciocínio desativado em vez de enviar um valor não compatível.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina explicitamente o raciocínio nos parâmetros do modelo ou da solicitação. Isso evita vazamentos de deltas `reasoning_content` do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) suporta apenas raciocínio binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o raciocínio está ativado, o Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas àquela mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível, `low` para outros modelos do catálogo marcados como compatíveis com raciocínio, `off` caso contrário.

## Definir um padrão de sessão

- Envie uma mensagem que seja **somente** a diretiva (espaços em branco são permitidos), por exemplo `/think:medium` ou `/t high`.
- Isso permanece para a sessão atual (por remetente por padrão); é limpo por `/think:off` ou por redefinição por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando será rejeitado com uma dica e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de raciocínio.

## Aplicação por agente

- **Pi incorporado**: o nível resolvido é passado para o runtime em processo do agente Pi.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Uma mensagem contendo apenas a diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/somente diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido é mapeado para processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia a mesma flag `service_tier=priority` em Codex Responses. O OpenClaw mantém um único alternador `/fast` compartilhado entre ambos os caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido é mapeado para níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão de modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção de nível de serviço Anthropic para URLs base de proxy não Anthropic.

## Diretivas detalhadas (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna o modo detalhado da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela interface de Sessões escolhendo `inherit`.
- A diretiva inline afeta apenas aquela mensagem; os padrões da sessão/globais se aplicam caso contrário.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível detalhado atual.
- Quando o modo detalhado está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta começa (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos de detalhes brutos de erro ficam ocultos, a menos que o modo detalhado seja `on` ou `full`.
- Quando o modo detalhado é `full`, as saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um comprimento seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramenta subsequentes respeitarão a nova configuração.

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- A diretiva inline afeta apenas aquela mensagem; os padrões da sessão/globais se aplicam caso contrário.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível atual de rastreamento.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de rastreamento/depuração pertencentes ao Plugin, como resumos de depuração do Active Memory.
- Linhas de rastreamento podem aparecer em `/status` e como uma mensagem de diagnóstico complementar após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem contendo apenas a diretiva alterna se blocos de raciocínio são mostrados nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio para a bolha de rascunho do Telegram enquanto a resposta está sendo gerada, depois envia a resposta final sem o raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de raciocínio.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo de probe do Heartbeat é o prompt de heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de heartbeats).
- A entrega do Heartbeat usa por padrão apenas a carga final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## Interface do chat web

- O seletor de raciocínio do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração da sessão de entrada quando a página é carregada.
- Escolher outro nível grava a substituição da sessão imediatamente via `sessions.patch`; não espera o próximo envio e não é uma substituição única `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do perfil de raciocínio do provedor do modelo ativo da sessão.
- O seletor usa `thinkingOptions` retornado pela linha de sessão do gateway. A interface do navegador não mantém sua própria lista regex de provedores; os plugins controlam os conjuntos de níveis específicos do modelo.
- `/think:<level>` continua funcionando e atualiza o mesmo nível de sessão armazenado, para que diretivas de chat e o seletor permaneçam sincronizados.

## Perfis de provedor

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis e o padrão do modelo.
- Cada nível do perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas do Gateway expõem `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem o mesmo perfil que a validação de runtime usa.
