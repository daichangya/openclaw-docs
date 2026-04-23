---
read_when:
    - Medya yeteneklerine genel bir bakış arıyorsunuz
    - Hangi medya sağlayıcısını yapılandıracağınıza karar veriyorsunuz
    - Eşzamansız medya üretiminin nasıl çalıştığını anlama
summary: Medya üretimi, anlama ve konuşma yetenekleri için birleşik açılış sayfası
title: Medya Genel Bakışı
x-i18n:
    generated_at: "2026-04-23T09:11:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Medya Üretimi ve Anlama

OpenClaw görseller, videolar ve müzik üretir; gelen medyayı (görseller, ses, video) anlar; ve yanıtları text-to-speech ile yüksek sesle okur. Tüm medya yetenekleri araç güdümlüdür: agent bunları konuşmaya göre ne zaman kullanacağına karar verir ve her araç yalnızca en az bir destekleyici sağlayıcı yapılandırıldığında görünür.

## Yeteneklere hızlı bakış

| Yetenek              | Araç             | Sağlayıcılar                                                                                 | Ne yapar                                                |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Görsel üretimi       | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Metin prompt'larından veya referanslardan görseller oluşturur ya da düzenler |
| Video üretimi        | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Metinden, görsellerden veya mevcut videolardan videolar oluşturur |
| Müzik üretimi        | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Metin prompt'larından müzik veya ses parçaları oluşturur |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Giden yanıtları konuşulan sese dönüştürür               |
| Medya anlama         | (otomatik)       | Herhangi bir vision/ses destekli model sağlayıcısı, ayrıca CLI fallback'leri                 | Gelen görselleri, sesi ve videoyu özetler               |

## Sağlayıcı yetenek matrisi

Bu tablo, sağlayıcıların platform genelinde hangi medya yeteneklerini desteklediğini gösterir.

| Sağlayıcı  | Görsel | Video | Müzik | TTS | STT / Transkripsiyon | Medya Anlama |
| ---------- | ------ | ----- | ----- | --- | -------------------- | ------------ |
| Alibaba    |        | Evet  |       |     |                      |              |
| BytePlus   |        | Evet  |       |     |                      |              |
| ComfyUI    | Evet   | Evet  | Evet  |     |                      |              |
| Deepgram   |        |       |       |     | Evet                 |              |
| ElevenLabs |        |       |       | Evet| Evet                 |              |
| fal        | Evet   | Evet  |       |     |                      |              |
| Google     | Evet   | Evet  | Evet  |     |                      | Evet         |
| Microsoft  |        |       |       | Evet|                      |              |
| MiniMax    | Evet   | Evet  | Evet  | Evet|                      |              |
| Mistral    |        |       |       |     | Evet                 |              |
| OpenAI     | Evet   | Evet  |       | Evet| Evet                 | Evet         |
| Qwen       |        | Evet  |       |     |                      |              |
| Runway     |        | Evet  |       |     |                      |              |
| Together   |        | Evet  |       |     |                      |              |
| Vydra      | Evet   | Evet  |       |     |                      |              |
| xAI        | Evet   | Evet  |       | Evet| Evet                 | Evet         |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kaydedilmiş herhangi bir vision destekli veya ses destekli modeli kullanır. Yukarıdaki tablo, özel medya anlama desteği olan sağlayıcıları vurgular; multimodal modellere sahip çoğu LLM sağlayıcısı (Anthropic, Google, OpenAI vb.) da etkin yanıt modeli olarak yapılandırıldığında gelen medyayı anlayabilir.
</Note>

## Eşzamansız üretim nasıl çalışır

Video ve müzik üretimi arka plan görevleri olarak çalışır çünkü sağlayıcı işlemesi genellikle 30 saniyeden birkaç dakikaya kadar sürer. Agent `video_generate` veya `music_generate` çağırdığında OpenClaw isteği sağlayıcıya gönderir, hemen bir görev kimliği döndürür ve işi görev defterinde izler. İş çalışırken agent diğer mesajlara yanıt vermeye devam eder. Sağlayıcı tamamladığında OpenClaw agent'ı uyandırır; böylece biten medyayı özgün kanala geri gönderebilir. Görsel üretimi ve TTS eşzamanlıdır ve yanıtla birlikte satır içi tamamlanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI, yapılandırıldığında toplu
`tools.media.audio` yolu üzerinden gelen sesi yazıya dökebilir. Deepgram,
ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call akışlı STT sağlayıcıları da kaydeder; böylece canlı telefon sesi tamamlanmış bir kaydı beklemeden seçilen satıcıya iletilebilir.

OpenAI, OpenClaw'ın görsel, video, toplu TTS, toplu STT, Voice Call
akışlı STT, gerçek zamanlı ses ve bellek embedding yüzeylerine eşlenir. xAI şu anda
OpenClaw'ın görsel, video, arama, kod yürütme, toplu TTS, toplu STT
ve Voice Call akışlı STT yüzeylerine eşlenir. xAI Realtime voice, upstream bir
yetenektir; ancak paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil edebilene kadar OpenClaw'da kaydedilmez.

## Hızlı bağlantılar

- [Görsel Üretimi](/tr/tools/image-generation) -- görsel üretme ve düzenleme
- [Video Üretimi](/tr/tools/video-generation) -- metinden videoya, görselden videoya ve videodan videoya
- [Müzik Üretimi](/tr/tools/music-generation) -- müzik ve ses parçaları oluşturma
- [Text-to-Speech](/tr/tools/tts) -- yanıtları konuşulan sese dönüştürme
- [Medya Anlama](/tr/nodes/media-understanding) -- gelen görselleri, sesi ve videoyu anlama
