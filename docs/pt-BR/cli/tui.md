---
read_when:
    - Você quer uma UI de terminal para o Gateway (compatível com acesso remoto)
    - Você quer passar url/token/session por scripts
summary: Referência da CLI para `openclaw tui` (UI de terminal conectada ao Gateway)
title: tui
x-i18n:
    generated_at: "2026-04-05T12:38:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Abra a UI de terminal conectada ao Gateway.

Relacionado:

- Guia da TUI: [TUI](/web/tui)

Observações:

- `tui` resolve SecretRefs configuradas de autenticação do gateway para autenticação por token/senha quando possível (provedores `env`/`file`/`exec`).
- Quando iniciado de dentro de um diretório de workspace de agente configurado, a TUI seleciona automaticamente esse agente para o padrão de chave de sessão (a menos que `--session` seja explicitamente `agent:<id>:...`).

## Exemplos

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# quando executado dentro de um workspace de agente, infere esse agente automaticamente
openclaw tui --session bugfix
```
