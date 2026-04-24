---
read_when:
    - Você quer fazer uma chamada de voz de saída a partir do OpenClaw
    - Você está configurando ou desenvolvendo o plugin de chamada de voz
summary: 'Plugin de chamada de voz: chamadas de saída + entrada via Twilio/Telnyx/Plivo (instalação do plugin + configuração + CLI)'
title: Plugin de chamada de voz
x-i18n:
    generated_at: "2026-04-24T09:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Chamada de Voz (plugin)

Chamadas de voz para o OpenClaw via um plugin. Compatível com notificações de saída e
conversas de múltiplas interações com políticas de entrada.

Provedores atuais:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferência XML + fala com GetInput)
- `mock` (desenvolvimento/sem rede)

Modelo mental rápido:

- Instalar o plugin
- Reiniciar o Gateway
- Configurar em `plugins.entries.voice-call.config`
- Usar `openclaw voicecall ...` ou a ferramenta `voice_call`

## Onde ele é executado (local vs remoto)

O plugin de Chamada de Voz é executado **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure o plugin na **máquina que executa o Gateway** e depois reinicie o Gateway para carregá-lo.

## Instalação

### Opção A: instalar via npm (recomendado)

```bash
openclaw plugins install @openclaw/voice-call
```

Reinicie o Gateway em seguida.

### Opção B: instalar a partir de uma pasta local (desenvolvimento, sem cópia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie o Gateway em seguida.

## Configuração

Defina a configuração em `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // ou "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // ou TWILIO_FROM_NUMBER para Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chave pública do Webhook do Telnyx do Telnyx Mission Control Portal
            // (string Base64; também pode ser definida via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Segurança de Webhook (recomendado para túneis/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposição pública (escolha uma)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcional; usa o primeiro provedor de transcrição em tempo real registrado quando não definido
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional se OPENAI_API_KEY estiver definido
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // opcional; usa o primeiro provedor de voz em tempo real registrado quando não definido
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Observações:

- Twilio/Telnyx exigem uma URL de Webhook **acessível publicamente**.
- Plivo exige uma URL de Webhook **acessível publicamente**.
- `mock` é um provedor local para desenvolvimento (sem chamadas de rede).
- Se configurações mais antigas ainda usarem `provider: "log"`, `twilio.from` ou chaves legadas `streaming.*` do OpenAI, execute `openclaw doctor --fix` para reescrevê-las.
- O Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` seja `true`.
- `skipSignatureVerification` é apenas para testes locais.
- Se você usa o plano gratuito do ngrok, defina `publicUrl` para a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks do Twilio com assinaturas inválidas **apenas** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Use apenas para desenvolvimento local.
- URLs do plano gratuito do ngrok podem mudar ou adicionar comportamento intersticial; se `publicUrl` mudar, as assinaturas do Twilio falharão. Para produção, prefira um domínio estável ou o funnel do Tailscale.
- `realtime.enabled` inicia conversas completas de voz para voz; não o habilite junto com `streaming.enabled`.
- Padrões de segurança de streaming:
  - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
- `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
- `streaming.maxPendingConnectionsPerIp` limita sockets pré-início não autenticados por IP de origem.
- `streaming.maxConnections` limita o total de sockets abertos de fluxo de mídia (pendentes + ativos).
- O fallback em tempo de execução ainda aceita essas chaves antigas de voice-call por enquanto, mas o caminho de reescrita é `openclaw doctor --fix` e o shim de compatibilidade é temporário.

## Conversas de voz em tempo real

`realtime` seleciona um provedor de voz em tempo real full duplex para áudio de chamada ao vivo.
Ele é separado de `streaming`, que apenas encaminha áudio para provedores
de transcrição em tempo real.

Comportamento atual em tempo de execução:

- `realtime.enabled` é compatível com Twilio Media Streams.
- `realtime.enabled` não pode ser combinado com `streaming.enabled`.
- `realtime.provider` é opcional. Quando não definido, Chamada de Voz usa o primeiro
  provedor de voz em tempo real registrado.
- Os provedores de voz em tempo real incluídos incluem Google Gemini Live (`google`) e
  OpenAI (`openai`), registrados por seus plugins de provedor.
- A configuração bruta de propriedade do provedor fica em `realtime.providers.<providerId>`.
- Se `realtime.provider` apontar para um provedor não registrado, ou nenhum provedor
  de voz em tempo real estiver registrado, Chamada de Voz registra um aviso e ignora
  a mídia em tempo real em vez de falhar o plugin inteiro.

Padrões de tempo real do Google Gemini Live:

- Chave de API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` ou
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Fale brevemente e pergunte antes de usar ferramentas.",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Use OpenAI em vez disso:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Veja [Provedor Google](/pt-BR/providers/google) e [Provedor OpenAI](/pt-BR/providers/openai)
para opções específicas de voz em tempo real do provedor.

## Transcrição por streaming

`streaming` seleciona um provedor de transcrição em tempo real para áudio de chamada ao vivo.

Comportamento atual em tempo de execução:

- `streaming.provider` é opcional. Quando não definido, Chamada de Voz usa o primeiro
  provedor de transcrição em tempo real registrado.
- Os provedores de transcrição em tempo real incluídos incluem Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrados por seus plugins de provedor.
- A configuração bruta de propriedade do provedor fica em `streaming.providers.<providerId>`.
- Se `streaming.provider` apontar para um provedor não registrado, ou nenhum provedor
  de transcrição em tempo real estiver registrado, Chamada de Voz registra um aviso e
  ignora o streaming de mídia em vez de falhar o plugin inteiro.

Padrões de transcrição por streaming do OpenAI:

- Chave de API: `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Padrões de transcrição por streaming do xAI:

- Chave de API: `streaming.providers.xai.apiKey` ou `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional se OPENAI_API_KEY estiver definido
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Use xAI em vez disso:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // opcional se XAI_API_KEY estiver definido
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Chaves legadas ainda são migradas automaticamente por `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Limpador de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um Webhook
terminal (por exemplo, chamadas em modo notify que nunca são concluídas). O padrão é `0`
(desabilitado).

Faixas recomendadas:

- **Produção:** `120`–`300` segundos para fluxos no estilo notify.
- Mantenha esse valor **maior que `maxDurationSeconds`** para que chamadas normais
  possam terminar. Um bom ponto de partida é `maxDurationSeconds + 30–60` segundos.

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Segurança de Webhook

Quando um proxy ou túnel fica na frente do Gateway, o plugin reconstrói a
URL pública para verificação de assinatura. Essas opções controlam quais cabeçalhos
encaminhados são confiáveis.

`webhookSecurity.allowedHosts` cria uma lista de permissões de hosts a partir de cabeçalhos de encaminhamento.

`webhookSecurity.trustForwardingHeaders` confia em cabeçalhos encaminhados sem uma lista de permissões.

`webhookSecurity.trustedProxyIPs` só confia em cabeçalhos encaminhados quando o IP
remoto da requisição corresponde à lista.

A proteção contra repetição de Webhook está habilitada para Twilio e Plivo. Requisições
de Webhook válidas repetidas são confirmadas, mas ignoradas para efeitos colaterais.

Interações de conversa do Twilio incluem um token por interação em callbacks de `<Gather>`, então
callbacks de fala antigos/repetidos não podem satisfazer uma interação de transcrição pendente mais nova.

Requisições de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os
cabeçalhos de assinatura exigidos pelo provedor estão ausentes.

O Webhook de voice-call usa o perfil compartilhado de corpo pré-autenticação (64 KB / 5 segundos)
mais um limite por IP de requisições em andamento antes da verificação de assinatura.

Exemplo com um host público estável:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS para chamadas

O Voice Call usa a configuração central `messages.tts` para
transmissão de fala em chamadas. Você pode substituí-la na configuração do plugin com o
**mesmo formato** — ela faz deep merge com `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Observações:

- Chaves legadas `tts.<provider>` dentro da configuração do plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são migradas automaticamente para `tts.providers.<provider>` no carregamento. Prefira o formato `providers` na configuração versionada.
- **Microsoft speech é ignorado para chamadas de voz** (o áudio de telefonia precisa de PCM; o transporte atual da Microsoft não expõe saída PCM para telefonia).
- O TTS central é usado quando o streaming de mídia do Twilio está habilitado; caso contrário, as chamadas recorrem às vozes nativas do provedor.
- Se um stream de mídia do Twilio já estiver ativo, o Voice Call não recorre ao TwiML `<Say>`. Se o TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia recorre a um provedor secundário, o Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.

### Mais exemplos

Usar apenas o TTS central (sem substituição):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Substituir por ElevenLabs apenas para chamadas (manter o padrão central em outros lugares):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Substituir apenas o modelo OpenAI para chamadas (exemplo de deep merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Chamadas de entrada

A política de entrada usa `disabled` por padrão. Para habilitar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Olá! Como posso ajudar?",
}
```

`inboundPolicy: "allowlist"` é uma verificação de identificador de chamadas de baixa garantia. O plugin
normaliza o valor `From` fornecido pelo provedor e o compara com `allowFrom`.
A verificação do Webhook autentica a entrega do provedor e a integridade da carga, mas
ela não comprova a propriedade do número do chamador em PSTN/VoIP. Trate `allowFrom` como
um filtro de identificador de chamadas, não como uma identidade forte do chamador.

As respostas automáticas usam o sistema de agentes. Ajuste com:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de saída falada

Para respostas automáticas, o Voice Call anexa um contrato rígido de saída falada ao prompt do sistema:

- `{"spoken":"..."}`

Depois, o Voice Call extrai o texto de fala de forma defensiva:

- Ignora cargas marcadas como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON em bloco delimitado ou chaves `"spoken"` inline.
- Recorre a texto simples e remove parágrafos iniciais que provavelmente sejam de planejamento/meta.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita o vazamento de texto de planejamento para o áudio.

### Comportamento de inicialização da conversa

Para chamadas de saída em modo `conversation`, o tratamento da primeira mensagem está vinculado ao estado de reprodução ao vivo:

- A limpeza da fila por interrupção e a resposta automática são suprimidas apenas enquanto a saudação inicial estiver sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada volta para `listening` e a mensagem inicial permanece na fila para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream sem atraso extra.

### Período de tolerância para desconexão de stream do Twilio

Quando um stream de mídia do Twilio é desconectado, o Voice Call espera `2000ms` antes de encerrar automaticamente a chamada:

- Se o stream se reconectar durante essa janela, o encerramento automático é cancelado.
- Se nenhum stream for registrado novamente após o período de tolerância, a chamada será encerrada para evitar chamadas ativas travadas.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # resume a latência por interação a partir dos logs
openclaw voicecall expose --mode funnel
```

`latency` lê `calls.jsonl` do caminho de armazenamento padrão do voice-call. Use
`--file <path>` para apontar para um log diferente e `--last <n>` para limitar a análise
aos últimos N registros (padrão 200). A saída inclui p50/p90/p99 para a
latência por interação e tempos de espera em escuta.

## Ferramenta do agente

Nome da ferramenta: `voice_call`

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Este repositório inclui um documento de Skill correspondente em `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Relacionados

- [Texto para fala](/pt-BR/tools/tts)
- [Modo de fala](/pt-BR/nodes/talk)
- [Ativação por voz](/pt-BR/nodes/voicewake)
