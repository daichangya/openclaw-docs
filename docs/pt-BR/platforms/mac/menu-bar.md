---
read_when:
    - Ao ajustar a UI da barra de menus do Mac ou a lógica de status
summary: Lógica de status da barra de menus e o que é exibido aos usuários
title: Barra de Menus
x-i18n:
    generated_at: "2026-04-05T12:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Lógica de Status da Barra de Menus

## O que é exibido

- Exibimos o estado atual de trabalho do agente no ícone da barra de menus e na primeira linha de status do menu.
- O status de integridade fica oculto enquanto o trabalho está ativo; ele retorna quando todas as sessões ficam ociosas.
- O bloco “Nodes” no menu lista apenas **dispositivos** (nodes pareados via `node.list`), não entradas de cliente/presença.
- Uma seção “Uso” aparece em Context quando snapshots de uso do provedor estão disponíveis.

## Modelo de estado

- Sessões: os eventos chegam com `runId` (por execução) mais `sessionKey` no payload. A sessão “principal” é a chave `main`; se ela estiver ausente, usamos a sessão atualizada mais recentemente como fallback.
- Prioridade: a principal sempre vence. Se a principal estiver ativa, seu estado será exibido imediatamente. Se a principal estiver ociosa, a sessão não principal ativa mais recente será exibida. Não alternamos no meio da atividade; só trocamos quando a sessão atual fica ociosa ou a principal se torna ativa.
- Tipos de atividade:
  - `job`: execução de comando de alto nível (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` com `toolName` e `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (substituição de depuração)

### `ActivityKind` → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- padrão → 🛠️

### Mapeamento visual

- `idle`: criatura normal.
- `workingMain`: badge com glifo, tonalidade completa, animação de perna “em atividade”.
- `workingOther`: badge com glifo, tonalidade suave, sem correria.
- `overridden`: usa o glifo/tonalidade escolhidos independentemente da atividade.

## Texto da linha de status (menu)

- Enquanto o trabalho está ativo: `<Função da sessão> · <rótulo da atividade>`
  - Exemplos: `Principal · exec: pnpm test`, `Outra · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Quando está ocioso: volta ao resumo de integridade.

## Ingestão de eventos

- Origem: eventos `agent` do canal de controle (`ControlChannel.handleAgentEvent`).
- Campos analisados:
  - `stream: "job"` com `data.state` para início/parada.
  - `stream: "tool"` com `data.phase`, `name`, `meta`/`args` opcionais.
- Rótulos:
  - `exec`: primeira linha de `args.command`.
  - `read`/`write`: caminho abreviado.
  - `edit`: caminho mais o tipo de mudança inferido a partir de `meta`/contagens do diff.
  - fallback: nome da ferramenta.

## Substituição de depuração

- Configurações ▸ Depuração ▸ seletor “Substituição de ícone”:
  - `System (auto)` (padrão)
  - `Working: main` (por tipo de ferramenta)
  - `Working: other` (por tipo de ferramenta)
  - `Idle`
- Armazenado via `@AppStorage("iconOverride")`; mapeado para `IconState.overridden`.

## Checklist de testes

- Dispare um job da sessão principal: verifique se o ícone muda imediatamente e se a linha de status mostra o rótulo da principal.
- Dispare um job de uma sessão não principal enquanto a principal estiver ociosa: o ícone/status mostra a não principal; permanece estável até ela terminar.
- Inicie a principal enquanto outra estiver ativa: o ícone muda para a principal instantaneamente.
- Rajadas rápidas de ferramentas: garanta que o badge não oscile (tolerância TTL nos resultados das ferramentas).
- A linha de integridade reaparece quando todas as sessões ficam ociosas.
