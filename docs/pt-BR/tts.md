---
read_when:
    - Habilitar conversão de texto em fala para respostas
    - Configurar provedores ou limites de TTS
    - Usar comandos /tts
summary: Conversão de texto em fala (TTS) para respostas de saída
title: Text-to-Speech (caminho legado)
x-i18n:
    generated_at: "2026-04-05T12:57:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# Conversão de texto em fala (TTS)

O OpenClaw pode converter respostas de saída em áudio usando ElevenLabs, Microsoft, MiniMax ou OpenAI.
Ele funciona em qualquer lugar onde o OpenClaw possa enviar áudio.

## Serviços compatíveis

- **ElevenLabs** (provedor principal ou de fallback)
- **Microsoft** (provedor principal ou de fallback; a implementação agrupada atual usa `node-edge-tts`)
- **MiniMax** (provedor principal ou de fallback; usa a API T2A v2)
- **OpenAI** (provedor principal ou de fallback; também usado para resumos)

### Observações sobre a fala da Microsoft

O provedor de fala da Microsoft agrupado atualmente usa o serviço online de
TTS neural do Microsoft Edge por meio da biblioteca `node-edge-tts`. É um serviço hospedado (não
local), usa endpoints da Microsoft e não requer chave de API.
O `node-edge-tts` expõe opções de configuração de fala e formatos de saída, mas
nem todas as opções são compatíveis com o serviço. Configurações legadas e entrada por diretiva
usando `edge` continuam funcionando e são normalizadas para `microsoft`.

Como esse caminho é um serviço web público sem SLA nem cota publicados,
trate-o como melhor esforço. Se você precisar de limites garantidos e suporte, use OpenAI
ou ElevenLabs.

## Chaves opcionais

Se você quiser usar OpenAI, ElevenLabs ou MiniMax:

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

A fala da Microsoft **não** requer uma chave de API.

Se vários provedores estiverem configurados, o provedor selecionado será usado primeiro e os demais serão opções de fallback.
O resumo automático usa o `summaryModel` configurado (ou `agents.defaults.model.primary`),
portanto esse provedor também deve estar autenticado se você habilitar resumos.

## Links de serviços

- [Guia de Text-to-Speech da OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API de áudio da OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Text to Speech da ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação da ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída do Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Ele vem habilitado por padrão?

Não. O auto‑TTS fica **desativado** por padrão. Habilite-o na configuração com
`messages.tts.auto` ou por sessão com `/tts always` (alias: `/tts on`).

Quando `messages.tts.provider` não está definido, o OpenClaw escolhe o primeiro
provedor de fala configurado na ordem de seleção automática do registro.

## Configuração

A configuração de TTS fica em `messages.tts` em `openclaw.json`.
O schema completo está em [Configuração do Gateway](/pt-BR/gateway/configuration).

### Configuração mínima (habilitar + provedor)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI principal com fallback para ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft principal (sem chave de API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Desabilitar a fala da Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Limites personalizados + caminho de preferências

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Responder com áudio apenas após uma mensagem de voz recebida

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Desabilitar o resumo automático para respostas longas

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Depois execute:

```
/tts summary off
```

### Observações sobre os campos

- `auto`: modo de auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envia áudio apenas após uma mensagem de voz recebida.
  - `tagged` envia áudio apenas quando a resposta inclui tags `[[tts]]`.
- `enabled`: alternador legado (doctor migra isso para `auto`).
- `mode`: `"final"` (padrão) ou `"all"` (inclui respostas de ferramenta/bloco).
- `provider`: id do provedor de fala, como `"elevenlabs"`, `"microsoft"`, `"minimax"` ou `"openai"` (o fallback é automático).
- Se `provider` estiver **não definido**, o OpenClaw usará o primeiro provedor de fala configurado na ordem de seleção automática do registro.
- O legado `provider: "edge"` continua funcionando e é normalizado para `microsoft`.
- `summaryModel`: modelo barato opcional para resumo automático; o padrão é `agents.defaults.model.primary`.
  - Aceita `provider/model` ou um alias de modelo configurado.
- `modelOverrides`: permite que o modelo emita diretivas de TTS (ativado por padrão).
  - `allowProvider` usa `false` por padrão (troca de provedor é opt-in).
- `providers.<id>`: configurações de propriedade do provedor, indexadas pelo id do provedor de fala.
- Blocos legados de provedor direto (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) são migrados automaticamente para `messages.tts.providers.<id>` no carregamento.
- `maxTextLength`: limite rígido para entrada de TTS (caracteres). `/tts audio` falha se for excedido.
- `timeoutMs`: tempo limite da solicitação (ms).
- `prefsPath`: substitui o caminho local do JSON de preferências (provedor/limite/resumo).
- Valores de `apiKey` usam fallback para variáveis de ambiente (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: substitui a URL base da API da ElevenLabs.
- `providers.openai.baseUrl`: substitui o endpoint de TTS da OpenAI.
  - Ordem de resolução: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Valores fora do padrão são tratados como endpoints de TTS compatíveis com OpenAI, portanto nomes personalizados de modelo e voz são aceitos.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 de 2 letras (ex.: `en`, `de`)
- `providers.elevenlabs.seed`: inteiro `0..4294967295` (determinismo de melhor esforço)
- `providers.minimax.baseUrl`: substitui a URL base da API MiniMax (padrão `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modelo de TTS (padrão `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificador de voz (padrão `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocidade de reprodução `0.5..2.0` (padrão 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (padrão 1.0; deve ser maior que 0).
- `providers.minimax.pitch`: deslocamento de tom `-12..12` (padrão 0).
- `providers.microsoft.enabled`: permite o uso da fala da Microsoft (padrão `true`; sem chave de API).
- `providers.microsoft.voice`: nome da voz neural da Microsoft (ex.: `en-US-MichelleNeural`).
- `providers.microsoft.lang`: código do idioma (ex.: `en-US`).
- `providers.microsoft.outputFormat`: formato de saída da Microsoft (ex.: `audio-24khz-48kbitrate-mono-mp3`).
  - Consulte os formatos de saída do Microsoft Speech para ver valores válidos; nem todos os formatos são compatíveis com o transporte agrupado baseado em Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: strings de porcentagem (ex.: `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: grava legendas em JSON ao lado do arquivo de áudio.
- `providers.microsoft.proxy`: URL de proxy para solicitações de fala da Microsoft.
- `providers.microsoft.timeoutMs`: substituição do tempo limite da solicitação (ms).
- `edge.*`: alias legado para as mesmas configurações da Microsoft.

## Substituições controladas pelo modelo (ativadas por padrão)

Por padrão, o modelo **pode** emitir diretivas de TTS para uma única resposta.
Quando `messages.tts.auto` é `tagged`, essas diretivas são necessárias para acionar o áudio.

Quando habilitado, o modelo pode emitir diretivas `[[tts:...]]` para substituir a voz
em uma única resposta, além de um bloco opcional `[[tts:text]]...[[/tts:text]]` para
fornecer tags expressivas (risadas, indicações de canto etc.) que devem aparecer apenas no
áudio.

Diretivas `provider=...` são ignoradas, a menos que `modelOverrides.allowProvider: true`.

Exemplo de payload de resposta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Chaves de diretiva disponíveis (quando habilitadas):

- `provider` (id do provedor de fala registrado, por exemplo `openai`, `elevenlabs`, `minimax` ou `microsoft`; requer `allowProvider: true`)
- `voice` (voz da OpenAI) ou `voiceId` (ElevenLabs / MiniMax)
- `model` (modelo de TTS da OpenAI, id do modelo da ElevenLabs ou modelo MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume do MiniMax, 0-10)
- `pitch` (tom do MiniMax, -12 a 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Desabilitar todas as substituições do modelo:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Allowlist opcional (habilita a troca de provedor mantendo outros controles configuráveis):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferências por usuário

Os comandos slash gravam substituições locais em `prefsPath` (padrão:
`~/.openclaw/settings/tts.json`, substituível com `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Campos armazenados:

- `enabled`
- `provider`
- `maxLength` (limite para resumo; padrão 1500 caracteres)
- `summarize` (padrão `true`)

Eles substituem `messages.tts.*` para esse host.

## Formatos de saída (fixos)

- **Feishu / Matrix / Telegram / WhatsApp**: mensagem de voz Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps é um bom equilíbrio para mensagem de voz.
- **Outros canais**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1kHz / 128kbps é o equilíbrio padrão para clareza de fala.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, taxa de amostragem de 32kHz). O formato de nota de voz não é compatível de forma nativa; use OpenAI ou ElevenLabs para mensagens de voz Opus garantidas.
- **Microsoft**: usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte agrupado aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Os valores de formato de saída seguem os formatos de saída do Microsoft Speech (incluindo Ogg/WebM Opus).
  - O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de
    mensagens de voz Opus garantidas.
  - Se o formato de saída da Microsoft configurado falhar, o OpenClaw tenta novamente com MP3.

Os formatos de saída de OpenAI/ElevenLabs são fixos por canal (veja acima).

## Comportamento do auto-TTS

Quando habilitado, o OpenClaw:

- ignora TTS se a resposta já contiver mídia ou uma diretiva `MEDIA:`.
- ignora respostas muito curtas (< 10 caracteres).
- resume respostas longas quando habilitado usando `agents.defaults.model.primary` (ou `summaryModel`).
- anexa o áudio gerado à resposta.

Se a resposta exceder `maxLength` e o resumo estiver desativado (ou não houver chave de API para o
modelo de resumo), o áudio
será ignorado e a resposta de texto normal será enviada.

## Diagrama de fluxo

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Uso do comando slash

Há um único comando: `/tts`.
Consulte [Comandos slash](/tools/slash-commands) para detalhes de habilitação.

Observação sobre o Discord: `/tts` é um comando interno do Discord, então o OpenClaw registra
`/voice` como o comando nativo ali. O texto `/tts ...` continua funcionando.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Observações:

- Os comandos exigem um remetente autorizado (regras de allowlist/proprietário ainda se aplicam).
- `commands.text` ou o registro de comandos nativos deve estar habilitado.
- `off|always|inbound|tagged` são alternadores por sessão (`/tts on` é um alias de `/tts always`).
- `limit` e `summary` são armazenados nas preferências locais, não na configuração principal.
- `/tts audio` gera uma resposta de áudio pontual (não ativa o TTS).
- `/tts status` inclui visibilidade do fallback para a tentativa mais recente:
  - fallback com sucesso: `Fallback: <primary> -> <used>` mais `Attempts: ...`
  - falha: `Error: ...` mais `Attempts: ...`
  - diagnósticos detalhados: `Attempt details: provider:outcome(reasonCode) latency`
- Falhas de API da OpenAI e da ElevenLabs agora incluem detalhes de erro do provedor analisados e o id da solicitação (quando retornado pelo provedor), o que aparece em erros/logs de TTS.

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um anexo de áudio para
entrega na resposta. Quando o canal é Feishu, Matrix, Telegram ou WhatsApp,
o áudio é entregue como mensagem de voz, e não como anexo de arquivo.

## RPC do Gateway

Métodos do Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
