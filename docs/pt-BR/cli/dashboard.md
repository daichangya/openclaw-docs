---
read_when:
    - Você quer abrir a UI de Controle com seu token atual
    - Você quer imprimir a URL sem iniciar um navegador
summary: Referência da CLI para `openclaw dashboard` (abrir a UI de Controle)
title: dashboard
x-i18n:
    generated_at: "2026-04-05T12:37:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Abra a UI de Controle usando sua autenticação atual.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Observações:

- `dashboard` resolve SecretRefs configurados em `gateway.auth.token` quando possível.
- Para tokens gerenciados por SecretRef (resolvidos ou não resolvidos), `dashboard` imprime/copia/abre uma URL sem token para evitar expor segredos externos na saída do terminal, no histórico da área de transferência ou nos argumentos de inicialização do navegador.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas não estiver resolvido neste caminho de comando, o comando imprime uma URL sem token e orientações explícitas de correção em vez de incorporar um placeholder de token inválido.
