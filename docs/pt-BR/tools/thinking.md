---
read_when:
    - Ajustando o parsing ou os padrões de thinking, fast-mode ou verbose directives
summary: Sintaxe de diretiva para `/think`, `/fast`, `/verbose`, `/trace` e visibilidade do raciocínio
title: Níveis de thinking
x-i18n:
    generated_at: "2026-04-21T13:39:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Níveis de thinking (/think directives)

## O que faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelos Codex e esforço do Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptativo gerenciado pelo provedor (compatível com Claude 4.6 em Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → raciocínio máximo do provedor (atualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mapeiam para `xhigh`.
  - `highest` mapeia para `high`.
- Observações sobre provedores:
  - Menus e seletores de thinking são orientados por perfis de provedor. Plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como `on` binário.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provedor/modelo que os oferecem. Diretivas digitadas para níveis não compatíveis são rejeitadas com as opções válidas desse modelo.
  - Níveis incompatíveis já armazenados, incluindo valores antigos de `max` após trocar de modelo, são remapeados para o maior nível compatível do modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de thinking está definido.
  - Anthropic Claude Opus 4.7 não usa thinking adaptativo por padrão. O padrão de esforço da sua API continua sendo de propriedade do provedor, a menos que você defina explicitamente um nível de thinking.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para thinking adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de thinking e `xhigh` é a configuração de esforço do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; ele mapeia para o mesmo caminho de esforço máximo de propriedade do provedor.
  - Modelos OpenAI GPT mapeiam `/think` por meio do suporte específico do modelo a esforço da Responses API. `/think off` envia `reasoning.effort: "none"` apenas quando o modelo de destino oferece suporte a isso; caso contrário, o OpenClaw omite a carga de raciocínio desabilitado em vez de enviar um valor incompatível.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina explicitamente o thinking em parâmetros do modelo ou da solicitação. Isso evita vazamento de deltas `reasoning_content` do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) só oferece suporte a thinking binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando thinking está habilitado, o Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas a essa mensagem).
2. Substituição de sessão (definida ao enviar uma mensagem somente com diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível, `low` para outros modelos de catálogo marcados como compatíveis com raciocínio, `off` caso contrário.

## Definir um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaços em branco permitidos), por exemplo `/think:medium` ou `/t high`.
- Isso persiste para a sessão atual (por remetente por padrão); é limpo por `/think:off` ou pela redefinição por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo `/thinking big`), o comando é rejeitado com uma dica e o estado da sessão permanece inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de thinking.

## Aplicação por agente

- **Pi incorporado**: o nível resolvido é passado para o runtime em processo do agente Pi.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Uma mensagem somente com diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/somente diretiva
  2. Substituição de sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido mapeia para processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia o mesmo sinalizador `service_tier=priority` em Codex Responses. O OpenClaw mantém um único alternador `/fast` compartilhado entre os dois caminhos de autenticação.
- Para solicitações diretas públicas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido mapeia para service tiers da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos do modelo Anthropic `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda pula a injeção de service tier da Anthropic para URLs base de proxy não Anthropic.

## Verbose directives (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem somente com diretiva alterna o verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita de sessão; limpe-a pela UI de Sessões escolhendo `inherit`.
- A diretiva inline afeta apenas essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível atual de verbose.
- Quando o verbose está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, com prefixo `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta inicia (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta continuam visíveis no modo normal, mas sufixos brutos de detalhe de erro ficam ocultos, a menos que verbose seja `on` ou `full`.
- Quando verbose é `full`, saídas de ferramenta também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramenta subsequentes respeitarão a nova configuração.

## Plugin trace directives (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem somente com diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- A diretiva inline afeta apenas essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível atual de trace.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de trace/debug pertencentes ao Plugin, como resumos de depuração de Active Memory.
- Linhas de trace podem aparecer em `/status` e como uma mensagem de diagnóstico de acompanhamento após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem somente com diretiva alterna se blocos de thinking são mostrados nas respostas.
- Quando habilitado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio para a bolha de rascunho do Telegram enquanto a resposta está sendo gerada e, em seguida, envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de raciocínio.
- Ordem de resolução: diretiva inline, depois substituição de sessão, depois padrão por agente (`agents.list[].reasoningDefault`) e depois fallback (`off`).

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sonda Heartbeat é o prompt Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem Heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de Heartbeats).
- A entrega de Heartbeat usa por padrão apenas a carga final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## UI do chat Web

- O seletor de thinking do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração da sessão de entrada quando a página é carregada.
- Escolher outro nível grava a substituição da sessão imediatamente via `sessions.patch`; ele não espera o próximo envio e não é uma substituição one-shot `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do perfil de thinking do provedor do modelo ativo da sessão.
- O seletor usa `thinkingOptions` retornado pela linha de sessão do gateway. A UI do navegador não mantém sua própria lista regex de provedores; os Plugins são donos dos conjuntos de níveis específicos por modelo.
- `/think:<level>` continua funcionando e atualiza o mesmo nível de sessão armazenado, para que as diretivas do chat e o seletor permaneçam sincronizados.

## Perfis de provedor

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis e o padrão do modelo.
- Cada nível do perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas do Gateway expõem `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem o mesmo perfil que a validação de runtime usa.
