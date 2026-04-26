---
read_when:
    - Chcesz używać syntezy Azure Speech dla odpowiedzi wychodzących
    - Potrzebujesz natywnego wyjścia notatek głosowych Ogg Opus z Azure Speech
summary: Synteza mowy Azure AI Speech dla odpowiedzi OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:39:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech to provider syntezy mowy Azure AI Speech. W OpenClaw
syntetyzuje wychodzące audio odpowiedzi domyślnie jako MP3, natywne Ogg/Opus dla notatek
głosowych oraz audio mulaw 8 kHz dla kanałów telefonicznych, takich jak Voice Call.

OpenClaw używa bezpośrednio Azure Speech REST API z SSML i wysyła
należący do providera format wyjściowy przez `X-Microsoft-OutputFormat`.

| Szczegół               | Wartość                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Strona internetowa     | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentacja           | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Uwierzytelnianie       | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Domyślny głos          | `en-US-JennyNeural`                                                                                            |
| Domyślny plik wyjściowy | `audio-24khz-48kbitrate-mono-mp3`                                                                             |
| Domyślny plik notatki głosowej | `ogg-24khz-16bit-mono-opus`                                                                           |

## Pierwsze kroki

<Steps>
  <Step title="Utwórz zasób Azure Speech">
    W portalu Azure utwórz zasób Speech. Skopiuj **KEY 1** z
    Resource Management > Keys and Endpoint oraz skopiuj lokalizację zasobu,
    na przykład `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Wybierz Azure Speech w messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Wyślij wiadomość">
    Wyślij odpowiedź przez dowolny podłączony kanał. OpenClaw syntetyzuje audio
    za pomocą Azure Speech i dostarcza MP3 dla standardowego audio lub Ogg/Opus, gdy
    kanał oczekuje notatki głosowej.
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja                  | Ścieżka                                                    | Opis                                                                                                   |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Klucz zasobu Azure Speech. Zapasowo używa `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` lub `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Region zasobu Azure Speech. Zapasowo używa `AZURE_SPEECH_REGION` lub `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Opcjonalne nadpisanie endpointu/base URL Azure Speech.                                                 |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Opcjonalne nadpisanie base URL Azure Speech.                                                           |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure voice `ShortName` (domyślnie `en-US-JennyNeural`).                                               |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Kod języka SSML (domyślnie `en-US`).                                                                   |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Format wyjściowy pliku audio (domyślnie `audio-24khz-48kbitrate-mono-mp3`).                            |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Format wyjściowy notatki głosowej (domyślnie `ogg-24khz-16bit-mono-opus`).                             |

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Azure Speech używa klucza zasobu Speech, a nie klucza Azure OpenAI. Klucz
    jest wysyłany jako `Ocp-Apim-Subscription-Key`; OpenClaw wyprowadza
    `https://<region>.tts.speech.microsoft.com` z `region`, chyba że
    podasz `endpoint` lub `baseUrl`.
  </Accordion>
  <Accordion title="Nazwy głosów">
    Używaj wartości `ShortName` głosu Azure Speech, na przykład
    `en-US-JennyNeural`. Bundlowany provider może listować głosy przez
    ten sam zasób Speech i filtruje głosy oznaczone jako deprecated lub retired.
  </Accordion>
  <Accordion title="Wyjścia audio">
    Azure akceptuje formaty wyjściowe takie jak `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` i `riff-24khz-16bit-mono-pcm`. OpenClaw
    żąda Ogg/Opus dla celów `voice-note`, aby kanały mogły wysyłać natywne
    dymki głosowe bez dodatkowej konwersji MP3.
  </Accordion>
  <Accordion title="Alias">
    `azure` jest akceptowane jako alias providera dla istniejących PR i konfiguracji użytkowników,
    ale nowa konfiguracja powinna używać `azure-speech`, aby uniknąć pomyłek z providerami modeli
    Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Synteza mowy" href="/pl/tools/tts" icon="waveform-lines">
    Przegląd TTS, providerzy i konfiguracja `messages.tts`.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełne odniesienie do konfiguracji, w tym ustawienia `messages.tts`.
  </Card>
  <Card title="Providerzy" href="/pl/providers" icon="grid">
    Wszystkie bundlowane providery OpenClaw.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
</CardGroup>
