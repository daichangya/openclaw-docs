---
read_when:
    - Ao depurar indicadores de integridade do app para Mac
summary: Como o app do macOS informa os estados de integridade do gateway/Baileys
title: Verificações de Integridade (macOS)
x-i18n:
    generated_at: "2026-04-05T12:47:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Verificações de Integridade no macOS

Como ver se o canal vinculado está íntegro a partir do app da barra de menus.

## Barra de menus

- O ponto de status agora reflete a integridade do Baileys:
  - Verde: vinculado + socket aberto recentemente.
  - Laranja: conectando/tentando novamente.
  - Vermelho: desconectado ou falha na sondagem.
- A linha secundária mostra "vinculado · autenticação há 12 min" ou exibe o motivo da falha.
- O item de menu "Executar verificação de integridade" dispara uma sondagem sob demanda.

## Configurações

- A guia Geral ganha um cartão de Integridade mostrando: idade da autenticação vinculada, caminho/contagem do armazenamento de sessão, horário da última verificação, último erro/código de status e botões para Executar verificação de integridade / Mostrar logs.
- Usa um snapshot em cache para que a UI carregue instantaneamente e tenha fallback de forma adequada quando estiver offline.
- A **guia Canais** exibe o status do canal + controles para WhatsApp/Telegram (QR de login, logout, sondagem, última desconexão/erro).

## Como a sondagem funciona

- O app executa `openclaw health --json` via `ShellExecutor` a cada ~60s e sob demanda. A sondagem carrega as credenciais e informa o status sem enviar mensagens.
- Armazene o último snapshot válido e o último erro separadamente para evitar oscilações; mostre o timestamp de cada um.

## Em caso de dúvida

- Você ainda pode usar o fluxo da CLI em [Integridade do gateway](/pt-BR/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) e acompanhar `/tmp/openclaw/openclaw-*.log` para `web-heartbeat` / `web-reconnect`.
