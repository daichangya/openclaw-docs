---
read_when:
    - '`openclaw infer` komutlarını ekliyorsunuz veya değiştiriyorsunuz'
    - Kararlı headless yetenek otomasyonu tasarlıyorsunuz
summary: Sağlayıcı destekli model, görsel, ses, TTS, video, web ve embedding iş akışları için infer-first CLI
title: Inference CLI
x-i18n:
    generated_at: "2026-04-23T09:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# Inference CLI

`openclaw infer`, sağlayıcı destekli çıkarım iş akışları için standart headless yüzeydir.

Kasıtlı olarak ham gateway RPC adlarını ve ham agent tool kimliklerini değil, yetenek ailelerini sunar.

## Infer'i bir Skill'e dönüştürün

Bunu bir agent'a kopyalayıp yapıştırın:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

İyi bir infer tabanlı Skill şunları yapmalıdır:

- yaygın kullanıcı niyetlerini doğru infer alt komutuna eşlemek
- kapsadığı iş akışları için birkaç standart infer örneği içermek
- örneklerde ve önerilerde `openclaw infer ...` tercih etmek
- tüm infer yüzeyini Skill gövdesi içinde yeniden belgelemekten kaçınmak

Tipik infer odaklı Skill kapsamı:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Neden infer kullanılmalı

`openclaw infer`, OpenClaw içindeki sağlayıcı destekli çıkarım görevleri için tek ve tutarlı bir CLI sağlar.

Avantajlar:

- Her backend için tek seferlik sarmalayıcılar kurmak yerine, OpenClaw'da zaten yapılandırılmış sağlayıcıları ve modelleri kullanın.
- Model, görsel, ses transkripsiyonu, TTS, video, web ve embedding iş akışlarını tek bir komut ağacı altında tutun.
- Betikler, otomasyon ve agent güdümlü iş akışları için kararlı bir `--json` çıktı biçimi kullanın.
- Görev özünde "çıkarım çalıştırmak" ise birinci taraf OpenClaw yüzeyini tercih edin.
- Çoğu infer komutu için Gateway gerektirmeden normal yerel yolu kullanın.

## Komut ağacı

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Yaygın görevler

Bu tablo, yaygın çıkarım görevlerini karşılık gelen infer komutuna eşler.

| Görev                   | Komut                                                                 | Notlar                                                |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Metin/model prompt'u çalıştır | `openclaw infer model run --prompt "..." --json`                | Varsayılan olarak normal yerel yolu kullanır          |
| Bir görsel oluştur      | `openclaw infer image generate --prompt "..." --json`                 | Mevcut bir dosyadan başlıyorsanız `image edit` kullanın |
| Bir görsel dosyasını açıklayın | `openclaw infer image describe --file ./image.png --json`      | `--model`, görsel destekli bir `<provider/model>` olmalıdır |
| Sesi yazıya dök         | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model`, `<provider/model>` olmalıdır               |
| Konuşma sentezleyin     | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status`, Gateway odaklıdır                       |
| Bir video oluştur       | `openclaw infer video generate --prompt "..." --json`                 |                                                       |
| Bir video dosyasını açıklayın | `openclaw infer video describe --file ./clip.mp4 --json`       | `--model`, `<provider/model>` olmalıdır               |
| Web'de arama yap        | `openclaw infer web search --query "..." --json`                      |                                                       |
| Bir web sayfası getir   | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Embedding oluştur       | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Davranış

- `openclaw infer ...`, bu iş akışları için birincil CLI yüzeyidir.
- Çıktı başka bir komut veya betik tarafından tüketilecekse `--json` kullanın.
- Belirli bir backend gerektiğinde `--provider` veya `--model provider/model` kullanın.
- `image describe`, `audio transcribe` ve `video describe` için `--model`, `<provider/model>` biçimini kullanmalıdır.
- `image describe` için açık bir `--model`, o sağlayıcıyı/modeli doğrudan çalıştırır. Model, model kataloğunda veya sağlayıcı yapılandırmasında görsel destekli olmalıdır.
- Durumsuz yürütme komutları varsayılan olarak yereldir.
- Gateway tarafından yönetilen durum komutları varsayılan olarak Gateway'i kullanır.
- Normal yerel yol, Gateway'in çalışıyor olmasını gerektirmez.

## Model

Sağlayıcı destekli metin çıkarımı ve model/sağlayıcı inceleme için `model` kullanın.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

Notlar:

- `model run`, sağlayıcı/model geçersiz kılmalarının normal agent yürütmesi gibi davranması için agent çalışma zamanını yeniden kullanır.
- `model auth login`, `model auth logout` ve `model auth status`, kaydedilmiş sağlayıcı auth durumunu yönetir.

## Görsel

Üretme, düzenleme ve açıklama için `image` kullanın.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Notlar:

- Mevcut girdi dosyalarıyla başlıyorsanız `image edit` kullanın.
- `image describe` için `--model`, görsel destekli bir `<provider/model>` olmalıdır.
- Yerel Ollama vision modelleri için önce modeli çekin ve `OLLAMA_API_KEY` değişkenini herhangi bir yer tutucu değerle ayarlayın; örneğin `ollama-local`. Bkz. [Ollama](/tr/providers/ollama#vision-and-image-description).

## Ses

Dosya transkripsiyonu için `audio` kullanın.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Notlar:

- `audio transcribe`, gerçek zamanlı oturum yönetimi için değil, dosya transkripsiyonu içindir.
- `--model`, `<provider/model>` olmalıdır.

## TTS

Konuşma sentezi ve TTS sağlayıcı durumu için `tts` kullanın.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Notlar:

- `tts status`, Gateway tarafından yönetilen TTS durumunu yansıttığı için varsayılan olarak Gateway'i kullanır.
- TTS davranışını incelemek ve yapılandırmak için `tts providers`, `tts voices` ve `tts set-provider` kullanın.

## Video

Üretme ve açıklama için `video` kullanın.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Notlar:

- `video describe` için `--model`, `<provider/model>` olmalıdır.

## Web

Arama ve getirme iş akışları için `web` kullanın.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Notlar:

- Kullanılabilir, yapılandırılmış ve seçili sağlayıcıları incelemek için `web providers` kullanın.

## Embedding

Vektör oluşturma ve embedding sağlayıcı incelemesi için `embedding` kullanın.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON çıktısı

Infer komutları, JSON çıktısını paylaşılan bir zarf altında normalleştirir:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Üst düzey alanlar kararlıdır:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Yaygın tuzaklar

```bash
# Kötü
openclaw infer media image generate --prompt "friendly lobster"

# İyi
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Kötü
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# İyi
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Notlar

- `openclaw capability ...`, `openclaw infer ...` için bir takma addır.
