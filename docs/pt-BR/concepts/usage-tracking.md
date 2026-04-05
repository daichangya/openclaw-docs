---
read_when:
    - Você está conectando superfícies de uso/cota de provedores
    - Você precisa explicar o comportamento do rastreamento de uso ou os requisitos de autenticação
summary: Superfícies de rastreamento de uso e requisitos de credenciais
title: Rastreamento de uso
x-i18n:
    generated_at: "2026-04-05T12:40:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Rastreamento de uso

## O que é

- Obtém uso/cota do provedor diretamente dos endpoints de uso deles.
- Sem custos estimados; apenas as janelas reportadas pelo provedor.
- A saída de status legível por humanos é normalizada para `X% left`, mesmo quando uma
  API upstream reporta cota consumida, cota restante ou apenas contagens brutas.
- `/status` no nível da sessão e `session_status` podem recorrer à entrada de uso mais recente
  da transcrição quando o snapshot da sessão ao vivo é esparso. Esse
  fallback preenche contadores ausentes de tokens/cache, pode recuperar o rótulo
  do modelo de runtime ativo e prefere o total maior orientado a prompt quando
  metadados da sessão estão ausentes ou são menores. Valores ao vivo existentes e diferentes de zero ainda prevalecem.

## Onde aparece

- `/status` em chats: cartão de status rico em emoji com tokens de sessão + custo estimado (somente chave de API). O uso do provedor aparece para o **provedor do modelo atual** quando disponível como uma janela normalizada `X% left`.
- `/usage off|tokens|full` em chats: rodapé de uso por resposta (OAuth mostra apenas tokens).
- `/usage cost` em chats: resumo local de custo agregado dos logs de sessão do OpenClaw.
- CLI: `openclaw status --usage` imprime um detalhamento completo por provedor.
- CLI: `openclaw channels list` imprime o mesmo snapshot de uso junto com a configuração do provedor (use `--no-usage` para ignorar).
- Barra de menus do macOS: seção “Usage” em Context (somente se disponível).

## Provedores + credenciais

- **Anthropic (Claude)**: tokens OAuth em perfis de autenticação.
- **GitHub Copilot**: tokens OAuth em perfis de autenticação.
- **Gemini CLI**: tokens OAuth em perfis de autenticação.
  - O uso em JSON recai para `stats`; `stats.cached` é normalizado em
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth em perfis de autenticação (`accountId` é usado quando presente).
- **MiniMax**: chave de API ou perfil de autenticação OAuth do MiniMax. O OpenClaw trata
  `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota do MiniMax,
  prefere OAuth MiniMax armazenado quando presente e, caso contrário, recai para
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  Os campos brutos `usage_percent` / `usagePercent` do MiniMax significam cota **restante**,
  então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando
  presentes.
  - Os rótulos de janela do plano de codificação vêm dos campos de horas/minutos do provedor quando
    presentes e, em seguida, recaem para o intervalo `start_time` / `end_time`.
  - Se o endpoint do plano de codificação retornar `model_remains`, o OpenClaw prefere a
    entrada do modelo de chat, deriva o rótulo da janela a partir dos timestamps quando os campos explícitos
    `window_hours` / `window_minutes` estiverem ausentes e inclui o nome do modelo
    no rótulo do plano.
- **Xiaomi MiMo**: chave de API via env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: chave de API via env/config/auth store.

O uso fica oculto quando nenhuma autenticação utilizável de uso do provedor pode ser resolvida. Provedores
podem fornecer lógica de autenticação de uso específica de plugin; caso contrário, o OpenClaw recai para
credenciais OAuth/chave de API correspondentes de perfis de autenticação, variáveis de ambiente
ou configuração.
