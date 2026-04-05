---
read_when:
    - Alterar o comportamento do ícone da barra de menus
summary: Estados e animações do ícone da barra de menus do OpenClaw no macOS
title: Ícone da barra de menus
x-i18n:
    generated_at: "2026-04-05T12:47:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Estados do ícone da barra de menus

Autor: steipete · Atualizado em: 2025-12-06 · Escopo: app macOS (`apps/macos`)

- **Inativo:** Animação normal do ícone (piscar, mexida ocasional).
- **Pausado:** O item de status usa `appearsDisabled`; sem movimento.
- **Acionador de voz (orelhas grandes):** O detector de ativação por voz chama `AppState.triggerVoiceEars(ttl: nil)` quando a palavra de ativação é ouvida, mantendo `earBoostActive=true` enquanto a fala é capturada. As orelhas aumentam de escala (1,9x), ganham aberturas circulares para melhor legibilidade e depois retornam com `stopVoiceEars()` após 1s de silêncio. Disparado apenas pelo pipeline de voz no app.
- **Em execução (agente em execução):** `AppState.isWorking=true` aciona um micromovimento de “corridinha de rabo/pernas”: movimento mais rápido das pernas e leve deslocamento enquanto o trabalho está em andamento. Atualmente é alternado em torno das execuções de agente do WebChat; adicione a mesma alternância em outras tarefas longas ao conectá-las.

Pontos de integração

- Ativação por voz: o runtime/testador chama `AppState.triggerVoiceEars(ttl: nil)` no acionamento e `stopVoiceEars()` após 1s de silêncio para corresponder à janela de captura.
- Atividade do agente: defina `AppStateStore.shared.setWorking(true/false)` em torno dos intervalos de trabalho (isso já é feito na chamada do agente WebChat). Mantenha os intervalos curtos e redefina em blocos `defer` para evitar animações presas.

Formas e tamanhos

- O ícone base é desenhado em `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- A escala das orelhas tem como padrão `1.0`; o reforço de voz define `earScale=1.9` e alterna `earHoles=true` sem mudar o quadro geral (imagem de modelo de 18×18 pt renderizada em um buffer Retina de 36×36 px).
- A corridinha usa movimento das pernas de até ~1.0 com um pequeno balanço horizontal; ela é aditiva a qualquer movimento inativo existente.

Notas comportamentais

- Não há alternância externa por CLI/broker para orelhas/em execução; mantenha isso interno aos próprios sinais do app para evitar oscilações acidentais.
- Mantenha os TTLs curtos (&lt;10s) para que o ícone retorne rapidamente ao estado base se uma tarefa travar.
