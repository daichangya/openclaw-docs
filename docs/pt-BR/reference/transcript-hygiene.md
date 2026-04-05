---
read_when:
    - Você está depurando rejeições de requisições do provider ligadas ao formato do transcript
    - Você está alterando a sanitização de transcript ou a lógica de reparo de chamadas de tool
    - Você está investigando incompatibilidades de id de chamadas de tool entre providers
summary: 'Referência: regras de sanitização e reparo de transcript específicas por provider'
title: Higiene de transcript
x-i18n:
    generated_at: "2026-04-05T12:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiene de transcript (correções de provider)

Este documento descreve **correções específicas por provider** aplicadas a transcripts antes de uma execução
(compilação do contexto do modelo). Esses ajustes são **em memória** e usados para atender a
requisitos rígidos de providers. Essas etapas de higiene **não** reescrevem o transcript JSONL
armazenado em disco; no entanto, uma etapa separada de reparo de arquivo de sessão pode reescrever
arquivos JSONL malformados removendo linhas inválidas antes de a sessão ser carregada. Quando ocorre
um reparo, o arquivo original recebe backup ao lado do arquivo de sessão.

O escopo inclui:

- Sanitização de id de chamadas de tool
- Validação de entrada de chamadas de tool
- Reparo de pareamento de resultados de tool
- Validação / ordenação de turnos
- Limpeza de assinaturas de pensamento
- Sanitização de payload de imagem
- Marcação de procedência de entrada do usuário (para prompts roteados entre sessões)

Se você precisar de detalhes sobre armazenamento de transcript, consulte:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Onde isso é executado

Toda a higiene de transcript é centralizada no embedded runner:

- Seleção de política: `src/agents/transcript-policy.ts`
- Aplicação de sanitização/reparo: `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/google.ts`

A política usa `provider`, `modelApi` e `modelId` para decidir o que aplicar.

Separadamente da higiene de transcript, arquivos de sessão são reparados (se necessário) antes do carregamento:

- `repairSessionFileIfNeeded` em `src/agents/session-file-repair.ts`
- Chamado de `run/attempt.ts` e `compact.ts` (embedded runner)

---

## Regra global: sanitização de imagem

Payloads de imagem são sempre sanitizados para evitar rejeição do lado do provider por causa de limites
de tamanho (redução de escala/recompressão de imagens base64 grandes demais).

Isso também ajuda a controlar a pressão de tokens causada por imagens em modelos compatíveis com visão.
Dimensões máximas menores geralmente reduzem o uso de tokens; dimensões maiores preservam mais detalhes.

Implementação:

- `sanitizeSessionMessagesImages` em `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` em `src/agents/tool-images.ts`
- O lado máximo da imagem pode ser configurado com `agents.defaults.imageMaxDimensionPx` (padrão: `1200`).

---

## Regra global: chamadas de tool malformadas

Blocos de chamada de tool do assistant que não têm nem `input` nem `arguments` são removidos
antes da compilação do contexto do modelo. Isso evita rejeições do provider causadas por chamadas de tool
parcialmente persistidas (por exemplo, após uma falha por limite de taxa).

Implementação:

- `sanitizeToolCallInputs` em `src/agents/session-transcript-repair.ts`
- Aplicado em `sanitizeSessionHistory` em `src/agents/pi-embedded-runner/google.ts`

---

## Regra global: procedência de entrada entre sessões

Quando um agente envia um prompt para outra sessão via `sessions_send` (incluindo
etapas de resposta/announce entre agentes), o OpenClaw persiste o turno de usuário criado com:

- `message.provenance.kind = "inter_session"`

Esses metadados são gravados no momento do append ao transcript e não alteram a role
(`role: "user"` permanece por compatibilidade com providers). Leitores de transcript podem usar
isso para evitar tratar prompts internos roteados como instruções criadas pelo usuário final.

Durante a reconstrução de contexto, o OpenClaw também adiciona em memória um pequeno marcador
`[Inter-session message]` no início desses turnos de usuário, para que o modelo possa distingui-los de
instruções externas do usuário final.

---

## Matriz de providers (comportamento atual)

**OpenAI / OpenAI Codex**

- Apenas sanitização de imagem.
- Remove assinaturas de raciocínio órfãs (itens independentes de raciocínio sem um bloco de conteúdo seguinte) em transcripts do OpenAI Responses/Codex.
- Sem sanitização de id de chamadas de tool.
- Sem reparo de pareamento de resultados de tool.
- Sem validação nem reordenação de turnos.
- Sem resultados sintéticos de tool.
- Sem remoção de assinaturas de pensamento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitização de id de chamadas de tool: alfanumérico estrito.
- Reparo de pareamento de resultados de tool e resultados sintéticos de tool.
- Validação de turnos (alternância de turnos no estilo Gemini).
- Correção de ordenação de turnos do Google (adiciona antes um pequeno bootstrap de usuário se o histórico começar com assistant).
- Antigravity Claude: normaliza assinaturas de thinking; remove blocos de thinking sem assinatura.

**Anthropic / Minimax (compatível com Anthropic)**

- Reparo de pareamento de resultados de tool e resultados sintéticos de tool.
- Validação de turnos (mescla turnos consecutivos de usuário para satisfazer alternância estrita).

**Mistral (incluindo detecção baseada em model-id)**

- Sanitização de id de chamadas de tool: strict9 (alfanumérico com comprimento 9).

**OpenRouter Gemini**

- Limpeza de assinatura de pensamento: remove valores `thought_signature` que não sejam base64 (mantém base64).

**Todo o restante**

- Apenas sanitização de imagem.

---

## Comportamento histórico (pré-2026.1.22)

Antes da versão 2026.1.22, o OpenClaw aplicava várias camadas de higiene de transcript:

- Uma extensão **transcript-sanitize** era executada em toda compilação de contexto e podia:
  - Reparar pareamento de uso/resultado de tool.
  - Sanitizar ids de chamadas de tool (incluindo um modo não estrito que preservava `_`/`-`).
- O runner também executava sanitização específica por provider, o que duplicava trabalho.
- Mutações adicionais ocorriam fora da política de provider, incluindo:
  - Remoção de tags `<final>` do texto do assistant antes da persistência.
  - Remoção de turnos vazios de erro do assistant.
  - Corte de conteúdo do assistant após chamadas de tool.

Essa complexidade causava regressões entre providers (notadamente no pareamento
`call_id|fc_id` do `openai-responses`). A limpeza de 2026.1.22 removeu a extensão, centralizou
a lógica no runner e tornou a OpenAI **intocada** além da sanitização de imagem.
