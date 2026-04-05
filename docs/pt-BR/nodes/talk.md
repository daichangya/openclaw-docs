---
read_when:
    - Implementando o modo Talk no macOS/iOS/Android
    - Alterando comportamento de voz/TTS/interrupção
summary: 'Modo Talk: conversas contínuas por voz com TTS da ElevenLabs'
title: Modo Talk
x-i18n:
    generated_at: "2026-04-05T12:46:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Modo Talk

O modo Talk é um loop contínuo de conversa por voz:

1. Escutar a fala
2. Enviar a transcrição ao modelo (sessão principal, `chat.send`)
3. Aguardar a resposta
4. Falar a resposta por meio do provedor Talk configurado (`talk.speak`)

## Comportamento (macOS)

- **Overlay sempre ativo** enquanto o modo Talk estiver habilitado.
- Transições de fase **Escutando → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), a transcrição atual é enviada.
- As respostas são **gravadas no WebChat** (igual a digitar).
- **Interromper ao falar** (padrão ativado): se o usuário começar a falar enquanto o assistente estiver falando, interrompemos a reprodução e registramos o timestamp da interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar sua resposta com **uma única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` aplica-se apenas à resposta atual.
- Sem `once`, a voz se torna o novo padrão do modo Talk.
- A linha JSON é removida antes da reprodução TTS.

Chaves compatíveis:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configuração (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Padrões:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando não definido, o Talk mantém a janela padrão de pausa da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)
- `voiceId`: usa como fallback `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (ou a primeira voz da ElevenLabs quando a chave de API está disponível)
- `modelId`: usa `eleven_v3` como padrão quando não definido
- `apiKey`: usa `ELEVENLABS_API_KEY` como fallback (ou o profile do shell do gateway, se disponível)
- `outputFormat`: usa `pcm_44100` como padrão no macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming MP3)

## UI do macOS

- Toggle na barra de menus: **Talk**
- Aba de configuração: grupo **Talk Mode** (voice id + toggle de interrupção)
- Overlay:
  - **Escutando**: nuvem pulsa com o nível do microfone
  - **Pensando**: animação de afundamento
  - **Falando**: anéis radiantes
  - Clique na nuvem: parar de falar
  - Clique no X: sair do modo Talk

## Observações

- Requer permissões de Fala + Microfone.
- Usa `chat.send` com a chave de sessão `main`.
- O gateway resolve a reprodução do Talk por meio de `talk.speak` usando o provedor Talk ativo. O Android usa TTS local do sistema como fallback apenas quando esse RPC não está disponível.
- `stability` para `eleven_v3` é validado como `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado como `0..4` quando definido.
- O Android oferece suporte aos formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming AudioTrack de baixa latência.
