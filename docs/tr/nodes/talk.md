---
read_when:
    - macOS/iOS/Android üzerinde Konuşma modu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yapılandırılmış TTS sağlayıcılarıyla kesintisiz sesli konuşmalar'
title: Konuşma modu
x-i18n:
    generated_at: "2026-04-25T13:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

Konuşma modu, kesintisiz bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transcript'i modele gönder (ana oturum, `chat.send`)
3. Yanıtı bekle
4. Bunu yapılandırılmış Konuşma sağlayıcısı üzerinden seslendir (`talk.speak`)

## Davranış (macOS)

- Konuşma modu etkin olduğunda **her zaman açık kaplama**.
- **Dinleme → Düşünme → Konuşma** faz geçişleri.
- **Kısa bir duraklamada** (sessizlik penceresi), geçerli transcript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazarak yazmakla aynı şekilde).
- **Konuşmada kesme** (varsayılan olarak açık): kullanıcı asistan konuşurken konuşmaya başlarsa, oynatmayı durdururuz ve sonraki istem için kesme zaman damgasını not ederiz.

## Yanıtlarda ses yönergeleri

Asistan, sesi denetlemek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca geçerli yanıta uygulanır.
- `once` yoksa ses, Konuşma modu için yeni varsayılan olur.
- JSON satırı, TTS oynatımından önce çıkarılır.

Desteklenen anahtarlar:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Yapılandırma (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Varsayılanlar:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: ayarlanmadığında Konuşma, transcript'i göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS` ve Android'de `700 ms`, iOS'ta `900 ms`)
- `provider`: etkin Konuşma sağlayıcısını seçer. macOS yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.
- `providers.<provider>.voiceId`: ElevenLabs için `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerlerine geri döner (veya API anahtarı varsa ilk ElevenLabs sesi).
- `providers.elevenlabs.modelId`: ayarlanmadığında varsayılan `eleven_v3`.
- `providers.mlx.modelId`: ayarlanmadığında varsayılan `mlx-community/Soprano-80M-bf16`.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` değerine geri döner (veya varsa Gateway shell profiline).
- `outputFormat`: macOS/iOS'ta varsayılan `pcm_44100`, Android'de `pcm_24000` olur (`mp3_*` ayarlarsanız MP3 akışı zorlanır)

## macOS arayüzü

- Menü çubuğu geçişi: **Talk**
- Yapılandırma sekmesi: **Talk Mode** grubu (voice id + kesme anahtarı)
- Kaplama:
  - **Listening**: mikrofon seviyesiyle titreşen bulut
  - **Thinking**: aşağı çöken animasyon
  - **Speaking**: yayılan halkalar
  - Buluta tıklama: konuşmayı durdur
  - X'e tıklama: Konuşma modundan çık

## Notlar

- Speech + Microphone izinleri gerekir.
- `main` oturum anahtarına karşı `chat.send` kullanır.
- Gateway, Konuşma oynatımını etkin Konuşma sağlayıcısını kullanarak `talk.speak` üzerinden çözümler. Android, yalnızca bu RPC kullanılamadığında yerel sistem TTS'ine geri döner.
- macOS yerel MLX oynatımı, varsa paketlenmiş `openclaw-mlx-tts` yardımcı aracını veya `PATH` üzerindeki bir çalıştırılabilir dosyayı kullanır. Geliştirme sırasında özel bir yardımcı ikili dosyasını işaret etmek için `OPENCLAW_MLX_TTS_BIN` ayarlayın.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` değerlerine doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier`, ayarlandığında `0..4` aralığına doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıkış biçimlerini destekler.

## İlgili

- [Voice wake](/tr/nodes/voicewake)
- [Audio and voice notes](/tr/nodes/audio)
- [Media understanding](/tr/nodes/media-understanding)
