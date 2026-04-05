---
read_when:
    - Você quer pesquisar na documentação ativa do OpenClaw pelo terminal
summary: Referência da CLI para `openclaw docs` (pesquisar no índice ativo da documentação)
title: docs
x-i18n:
    generated_at: "2026-04-05T12:37:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Pesquise no índice ativo da documentação.

Argumentos:

- `[query...]`: termos de pesquisa a enviar ao índice ativo da documentação

Exemplos:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Observações:

- Sem consulta, `openclaw docs` abre o ponto de entrada de pesquisa da documentação ativa.
- Consultas com várias palavras são repassadas como uma única solicitação de pesquisa.
