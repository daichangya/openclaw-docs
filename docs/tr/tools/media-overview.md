---
read_when:
    - Medya yeteneklerine genel bakış arıyorsunuz
    - Hangi medya sağlayıcısını yapılandıracağınıza karar verme
    - Asenkron medya üretiminin nasıl çalıştığını anlama
summary: Medya üretimi, anlama ve konuşma yetenekleri için birleşik açılış sayfası
title: Medyaya genel bakış
x-i18n:
    generated_at: "2026-04-25T13:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Medya Üretimi ve Anlama

OpenClaw görseller, videolar ve müzik üretir, gelen medyayı (görseller, ses, video) anlar ve yanıtları metinden sese ile yüksek sesle konuşur. Tüm medya yetenekleri araç odaklıdır: aracı bunları ne zaman kullanacağına konuşmaya göre karar verir ve her araç yalnızca en az bir arka plan sağlayıcısı yapılandırıldığında görünür.

## Yetenekler bir bakışta

| Yetenek              | Araç             | Sağlayıcılar                                                                                  | Ne yapar                                               |
| -------------------- | ---------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Görsel üretimi       | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                              | Metin prompt'larından veya referanslardan görseller oluşturur ya da düzenler |
| Video üretimi        | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI   | Metinden, görsellerden veya mevcut videolardan videolar oluşturur |
| Müzik üretimi        | `music_generate` | ComfyUI, Google, MiniMax                                                                       | Metin prompt'larından müzik veya ses parçaları oluşturur |
| Metinden sese (TTS)  | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo   | Giden yanıtları konuşulan sese dönüştürür              |
| Medya anlama         | (otomatik)       | Herhangi bir görsel/ses yetenekli model sağlayıcısı artı CLI geri dönüşleri                    | Gelen görselleri, sesi ve videoyu özetler              |

## Sağlayıcı yetenek matrisi

Bu tablo, hangi sağlayıcıların platform genelinde hangi medya yeteneklerini desteklediğini gösterir.

| Sağlayıcı   | Görsel | Video | Müzik | TTS | STT / Yazıya Dökme | Gerçek Zamanlı Ses | Medya Anlama |
| ----------- | ------ | ----- | ----- | --- | ------------------ | ------------------ | ------------ |
| Alibaba     |        | Evet  |       |     |                    |                    |              |
| BytePlus    |        | Evet  |       |     |                    |                    |              |
| ComfyUI     | Evet   | Evet  | Evet  |     |                    |                    |              |
| Deepgram    |        |       |       |     | Evet               | Evet               |              |
| ElevenLabs  |        |       |       | Evet| Evet               |                    |              |
| fal         | Evet   | Evet  |       |     |                    |                    |              |
| Google      | Evet   | Evet  | Evet  | Evet|                    | Evet               | Evet         |
| Gradium     |        |       |       | Evet|                    |                    |              |
| Local CLI   |        |       |       | Evet|                    |                    |              |
| Microsoft   |        |       |       | Evet|                    |                    |              |
| MiniMax     | Evet   | Evet  | Evet  | Evet|                    |                    |              |
| Mistral     |        |       |       |     | Evet               |                    |              |
| OpenAI      | Evet   | Evet  |       | Evet| Evet               | Evet               | Evet         |
| Qwen        |        | Evet  |       |     |                    |                    |              |
| Runway      |        | Evet  |       |     |                    |                    |              |
| SenseAudio  |        |       |       |     | Evet               |                    |              |
| Together    |        | Evet  |       |     |                    |                    |              |
| Vydra       | Evet   | Evet  |       | Evet|                    |                    |              |
| xAI         | Evet   | Evet  |       | Evet| Evet               |                    | Evet         |
| Xiaomi MiMo | Evet   |       |       | Evet|                    |                    | Evet         |

<Note>
Medya anlama, sağlayıcı config'inizde kayıtlı herhangi bir görsel yetenekli veya ses yetenekli modeli kullanır. Yukarıdaki tablo, özel medya-anlama desteği olan sağlayıcıları vurgular; çok modlu modellere sahip çoğu LLM sağlayıcısı (Anthropic, Google, OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında gelen medyayı da anlayabilir.
</Note>

## Asenkron üretim nasıl çalışır

Video ve müzik üretimi arka plan görevleri olarak çalışır çünkü sağlayıcı işlemesi genellikle 30 saniyeden birkaç dakikaya kadar sürer. Aracı `video_generate` veya `music_generate` çağırdığında, OpenClaw isteği sağlayıcıya gönderir, hemen bir görev kimliği döndürür ve işi görev defterinde izler. Aracı iş çalışırken diğer mesajlara yanıt vermeye devam eder. Sağlayıcı işi bitirdiğinde OpenClaw aracıyı uyandırır; böylece tamamlanan medyayı özgün kanala geri gönderebilir. Görsel üretimi ve TTS eşzamanlıdır ve yanıtla birlikte satır içinde tamamlanır.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio ve xAI, yapılandırıldığında
toplu `tools.media.audio` yolu üzerinden gelen sesi yazıya dökebilir.
Deepgram, ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call
akış STT sağlayıcılarını da kaydeder; böylece canlı telefon sesi tamamlanmış kaydı beklemeden
seçili sağlayıcıya yönlendirilebilir.

Google, OpenClaw'ın görsel, video, müzik, toplu TTS, arka uç gerçek zamanlı
ses ve medya anlama yüzeylerine eşlenir. OpenAI, OpenClaw'ın görsel,
video, toplu TTS, toplu STT, Voice Call akış STT, arka uç gerçek zamanlı ses
ve bellek embedding yüzeylerine eşlenir. xAI şu anda OpenClaw'ın görsel, video,
arama, kod yürütme, toplu TTS, toplu STT ve Voice Call akış STT
yüzeylerine eşlenir. xAI Realtime ses, yukarı akışta bir yetenektir, ancak
paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar OpenClaw içinde
kaydedilmez.

## Hızlı bağlantılar

- [Image Generation](/tr/tools/image-generation) -- görsel üretme ve düzenleme
- [Video Generation](/tr/tools/video-generation) -- metinden videoya, görselden videoya ve videodan videoya
- [Music Generation](/tr/tools/music-generation) -- müzik ve ses parçaları oluşturma
- [Text-to-Speech](/tr/tools/tts) -- yanıtları konuşulan sese dönüştürme
- [Media Understanding](/tr/nodes/media-understanding) -- gelen görselleri, sesi ve videoyu anlama

## İlgili

- [Image generation](/tr/tools/image-generation)
- [Video generation](/tr/tools/video-generation)
- [Music generation](/tr/tools/music-generation)
- [Text-to-speech](/tr/tools/tts)
