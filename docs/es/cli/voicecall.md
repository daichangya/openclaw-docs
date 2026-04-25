---
read_when:
    - Usas el plugin Voicecall y quieres los puntos de entrada de la CLI
    - Quieres ejemplos rápidos para `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Referencia de la CLI para `openclaw voicecall` (superficie de comandos del plugin de llamadas de voz)
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T13:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` es un comando proporcionado por un plugin. Solo aparece si el plugin de llamadas de voz está instalado y habilitado.

Documentación principal:

- Plugin de llamadas de voz: [Voice Call](/es/plugins/voice-call)

## Comandos habituales

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` muestra comprobaciones de preparación legibles para humanos de forma predeterminada. Usa `--json` para
scripts:

```bash
openclaw voicecall setup --json
```

Para proveedores externos (`twilio`, `telnyx`, `plivo`), la configuración debe resolver una URL pública de
Webhook desde `publicUrl`, un túnel o exposición mediante Tailscale. Se rechaza una alternativa de servicio privada/local loopback
porque los operadores no pueden alcanzarla.

`smoke` ejecuta las mismas comprobaciones de preparación. No realizará una llamada telefónica real
a menos que estén presentes tanto `--to` como `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # simulación
openclaw voicecall smoke --to "+15555550123" --yes  # llamada notify en vivo
```

## Exponer Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota de seguridad: expón el endpoint de Webhook solo a redes en las que confíes. Prefiere Tailscale Serve frente a Funnel siempre que sea posible.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Plugin de llamadas de voz](/es/plugins/voice-call)
