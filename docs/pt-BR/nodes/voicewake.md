---
read_when:
    - Alterar o comportamento ou os padrões das palavras de ativação por voz
    - Adicionar novas plataformas de nó que precisam de sincronização de palavra de ativação
summary: Palavras de ativação por voz globais (de propriedade do Gateway) e como elas sincronizam entre nós
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T12:46:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (palavras de ativação globais)

O OpenClaw trata **palavras de ativação** como uma única lista global de propriedade do **Gateway**.

- Não há **palavras de ativação personalizadas por nó**.
- **Qualquer UI de nó/app pode editar** a lista; as alterações são persistidas pelo Gateway e transmitidas para todos.
- macOS e iOS mantêm alternâncias locais de **Voice Wake ativado/desativado** (a UX local + permissões diferem).
- O Android atualmente mantém o Voice Wake desativado e usa um fluxo manual de microfone na aba Voice.

## Armazenamento (host do Gateway)

As palavras de ativação são armazenadas na máquina do gateway em:

- `~/.openclaw/settings/voicewake.json`

Formato:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocolo

### Métodos

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` com parâmetros `{ triggers: string[] }` → `{ triggers: string[] }`

Observações:

- Triggers são normalizados (espaços removidos nas bordas, vazios descartados). Listas vazias recorrem aos padrões.
- Limites são aplicados por segurança (limites de contagem/comprimento).

### Eventos

- Payload de `voicewake.changed`: `{ triggers: string[] }`

Quem recebe:

- Todos os clientes WebSocket (app macOS, WebChat etc.)
- Todos os nós conectados (iOS/Android) e também no momento da conexão do nó como um push inicial de “estado atual”.

## Comportamento do cliente

### App macOS

- Usa a lista global para bloquear triggers de `VoiceWakeRuntime`.
- Editar “Trigger words” nas configurações de Voice Wake chama `voicewake.set` e depois depende da transmissão para manter outros clientes sincronizados.

### Nó iOS

- Usa a lista global para detecção de trigger no `VoiceWakeManager`.
- Editar Wake Words em Settings chama `voicewake.set` (via Gateway WS) e também mantém a detecção local de palavras de ativação responsiva.

### Nó Android

- O Voice Wake está atualmente desativado no runtime/Settings do Android.
- A voz no Android usa captura manual de microfone na aba Voice em vez de triggers por palavra de ativação.
