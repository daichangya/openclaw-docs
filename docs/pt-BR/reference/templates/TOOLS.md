---
read_when:
    - Inicializando um workspace manualmente
summary: Template de workspace para TOOLS.md
title: Template de TOOLS.md
x-i18n:
    generated_at: "2026-04-05T12:52:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Notas locais

Skills definem _como_ as tools funcionam. Este arquivo é para as suas especificidades — o que é exclusivo da sua configuração.

## O que vai aqui

Coisas como:

- Nomes e localizações de câmeras
- Hosts e aliases de SSH
- Vozes preferidas para TTS
- Nomes de alto-falantes/salas
- Apelidos de dispositivos
- Qualquer coisa específica do ambiente

## Exemplos

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Por que separar?

Skills são compartilhadas. Sua configuração é sua. Mantê-las separadas significa que você pode atualizar Skills sem perder suas notas e compartilhar Skills sem expor sua infraestrutura.

---

Adicione o que for útil para você fazer seu trabalho. Esta é a sua cola.
