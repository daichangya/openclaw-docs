---
read_when:
    - Você usa o plugin de chamadas de voz e quer os pontos de entrada da CLI
    - Você quer exemplos rápidos para `voicecall call|continue|status|tail|expose`
summary: Referência da CLI para `openclaw voicecall` (superfície de comando do plugin de chamadas de voz)
title: voicecall
x-i18n:
    generated_at: "2026-04-05T12:38:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` é um comando fornecido por plugin. Ele só aparece se o plugin de chamadas de voz estiver instalado e ativado.

Documentação principal:

- Plugin de chamadas de voz: [Voice Call](/plugins/voice-call)

## Comandos comuns

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Expondo webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Observação de segurança: exponha o endpoint do webhook apenas a redes nas quais você confia. Prefira Tailscale Serve em vez de Funnel sempre que possível.
