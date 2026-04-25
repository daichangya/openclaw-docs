---
read_when:
    - '`openclaw infer` komutlarını ekleme veya değiştirme'
    - Kararlı başsız yetenek otomasyonu tasarlama
summary: Sağlayıcı destekli model, görsel, ses, TTS, video, web ve embedding iş akışları için önce çıkarım yapan CLI
title: Inference CLI
x-i18n:
    generated_at: "2026-04-25T13:44:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer`, sağlayıcı destekli çıkarım iş akışları için kanonik başsız yüzeydir.

Ham gateway RPC adlarını ve ham ajan araç kimliklerini değil, kasıtlı olarak yetenek ailelerini ortaya çıkarır.

## infer'ı bir skill'e dönüştürün

Bunu bir ajana kopyalayıp yapıştırın:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

İyi bir infer tabanlı skill şunları yapmalıdır:

- yaygın kullanıcı amaçlarını doğru infer alt komutuna eşlemek
- kapsadığı iş akışları için birkaç kanonik infer örneği içermek
- örneklerde ve önerilerde `openclaw infer ...` tercih etmek
- infer yüzeyinin tamamını skill gövdesi içinde yeniden belgelemekten kaçınmak

Tipik infer odaklı skill kapsamı:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Neden infer kullanılır

`openclaw infer`, OpenClaw içindeki sağlayıcı destekli çıkarım görevleri için tek ve tutarlı bir CLI sağlar.

Avantajlar:

- Her arka uç için tek seferlik sarmalayıcılar bağlamak yerine OpenClaw içinde zaten yapılandırılmış sağlayıcıları ve modelleri kullanın.
- Model, görsel, ses transkripsiyonu, TTS, video, web ve embedding iş akışlarını tek bir komut ağacı altında tutun.
- Betikler, otomasyon ve ajan destekli iş akışları için kararlı bir `--json` çıktı biçimi kullanın.
- Görev temelde "çıkarım çalıştırmak" olduğunda birinci taraf OpenClaw yüzeyini tercih edin.
- Çoğu infer komutu için Gateway gerektirmeden normal yerel yolu kullanın.

Uçtan uca sağlayıcı kontrolleri için, daha düşük seviyeli
sağlayıcı testleri yeşil olduktan sonra `openclaw infer ...` tercih edin. Bu, sağlayıcı isteği yapılmadan önce
gönderilen CLI'yi, yapılandırma yüklemeyi,
varsayılan ajan çözümlemeyi, paketlenmiş Plugin etkinleştirmeyi, çalışma zamanı bağımlılığı onarımını
ve paylaşılan yetenek çalışma zamanını çalıştırır.

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
| Bir metin/model istemi çalıştır | `openclaw infer model run --prompt "..." --json`              | Varsayılan olarak normal yerel yolu kullanır          |
| Görsel oluştur          | `openclaw infer image generate --prompt "..." --json`                 | Mevcut bir dosyadan başlıyorsanız `image edit` kullanın |
| Bir görsel dosyasını açıklayın | `openclaw infer image describe --file ./image.png --json`      | `--model`, görsel destekli bir `<provider/model>` olmalıdır |
| Sesi yazıya dök         | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` `<provider/model>` olmalıdır                |
| Konuşma sentezle        | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` Gateway odaklıdır                        |
| Video oluştur           | `openclaw infer video generate --prompt "..." --json`                 | `--resolution` gibi sağlayıcı ipuçlarını destekler    |
| Bir video dosyasını açıklayın | `openclaw infer video describe --file ./clip.mp4 --json`       | `--model` `<provider/model>` olmalıdır                |
| Web'de ara             | `openclaw infer web search --query "..." --json`                      |                                                       |
| Bir web sayfasını getir | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Embedding oluştur       | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Davranış

- `openclaw infer ...`, bu iş akışları için birincil CLI yüzeyidir.
- Çıktı başka bir komut veya betik tarafından tüketilecekse `--json` kullanın.
- Belirli bir arka uç gerekiyorsa `--provider` veya `--model provider/model` kullanın.
- `image describe`, `audio transcribe` ve `video describe` için `--model`, `<provider/model>` biçiminde olmalıdır.
- `image describe` için açık bir `--model`, o sağlayıcı/modeli doğrudan çalıştırır. Model, model kataloğunda veya sağlayıcı yapılandırmasında görsel destekli olmalıdır. `codex/<model>`, sınırlı bir Codex uygulama sunucusu görsel anlama dönüşü çalıştırır; `openai-codex/<model>` ise OpenAI Codex OAuth sağlayıcı yolunu kullanır.
- Durumsuz yürütme komutları varsayılan olarak yereldir.
- Gateway tarafından yönetilen durum komutları varsayılan olarak gateway'dir.
- Normal yerel yol, Gateway'in çalışıyor olmasını gerektirmez.
- `model run` tek seferliktir. Bu komut için ajan çalışma zamanı üzerinden açılan MCP sunucuları, hem yerel hem de `--gateway` yürütmede yanıttan sonra emekliye ayrılır; böylece yinelenen betik çağrıları stdio MCP alt süreçlerini canlı tutmaz.

## Model

Sağlayıcı destekli metin çıkarımı ve model/sağlayıcı incelemesi için `model` kullanın.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Notlar:

- `model run`, sağlayıcı/model geçersiz kılmalarının normal ajan yürütmesi gibi davranması için ajan çalışma zamanını yeniden kullanır.
- `model run` başsız otomasyon için tasarlandığından, komut bittikten sonra oturum başına paketlenmiş MCP çalışma zamanlarını tutmaz.
- `model auth login`, `model auth logout` ve `model auth status`, kaydedilmiş sağlayıcı kimlik doğrulama durumunu yönetir.

## Görsel

Oluşturma, düzenleme ve açıklama için `image` kullanın.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Notlar:

- Mevcut girdi dosyalarından başlıyorsanız `image edit` kullanın.
- Hangi paketlenmiş görsel sağlayıcılarının
  keşfedilebilir, yapılandırılmış, seçilmiş olduğunu ve her sağlayıcının hangi oluşturma/düzenleme yeteneklerini
  sunduğunu doğrulamak için `image providers --json` kullanın.
- Görsel oluşturma değişiklikleri için en dar canlı
  CLI smoke testi olarak `image generate --model <provider/model> --json` kullanın. Örnek:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON yanıtı `ok`, `provider`, `model`, `attempts` ve yazılan
  çıktı yollarını bildirir. `--output` ayarlandığında nihai uzantı,
  sağlayıcının döndürdüğü MIME türünü izleyebilir.

- `image describe` için `--model`, görsel destekli bir `<provider/model>` olmalıdır.
- Yerel Ollama vision modelleri için önce modeli çekin ve örneğin `ollama-local` gibi herhangi bir yer tutucu değere `OLLAMA_API_KEY` ayarlayın. Bkz. [Ollama](/tr/providers/ollama#vision-and-image-description).

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

- `tts status`, Gateway tarafından yönetilen TTS durumunu yansıttığı için varsayılan olarak gateway kullanır.
- TTS davranışını incelemek ve yapılandırmak için `tts providers`, `tts voices` ve `tts set-provider` kullanın.

## Video

Oluşturma ve açıklama için `video` kullanın.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Notlar:

- `video generate`, `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` ve `--timeout-ms` seçeneklerini kabul eder ve bunları video oluşturma çalışma zamanına iletir.
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

- Kullanılabilir, yapılandırılmış ve seçilmiş sağlayıcıları incelemek için `web providers` kullanın.

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

Oluşturulmuş medya komutları için `outputs`, OpenClaw tarafından yazılan dosyaları içerir. Otomasyon için
insan tarafından okunabilir stdout'u ayrıştırmak yerine, bu dizideki `path`, `mimeType`, `size` ve ortama özgü boyutları kullanın.

## Yaygın hatalar

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

## İlgili

- [CLI başvurusu](/tr/cli)
- [Modeller](/tr/concepts/models)
