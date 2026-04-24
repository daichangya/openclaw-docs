---
read_when:
    - Medya yeteneklerine genel bir bakış mı arıyorsunuz?
    - Hangi medya sağlayıcısını yapılandıracağınıza karar verme
    - Eşzamansız medya üretiminin nasıl çalıştığını anlama
summary: Medya üretimi, anlama ve konuşma özellikleri için birleşik açılış sayfası
title: Medyaya genel bakış
x-i18n:
    generated_at: "2026-04-24T10:25:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# Medya Üretimi ve Anlama

OpenClaw görüntüler, videolar ve müzik üretir, gelen medyayı (görüntü, ses, video) anlar ve metinden konuşmaya ile yanıtları sesli olarak okur. Tüm medya yetenekleri araç odaklıdır: aracı bunları ne zaman kullanacağına konuşmaya göre karar verir ve her araç yalnızca en az bir arka uç sağlayıcı yapılandırıldığında görünür.

## Bir bakışta yetenekler

| Yetenek              | Araç             | Sağlayıcılar                                                                                 | Ne yapar                                                |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Görüntü üretimi      | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Metin istemlerinden veya referanslardan görüntü oluşturur ya da düzenler |
| Video üretimi        | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Metinden, görüntülerden veya mevcut videolardan videolar oluşturur |
| Müzik üretimi        | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Metin istemlerinden müzik veya ses parçaları oluşturur  |
| Metinden konuşmaya (TTS) | `tts`        | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                          | Giden yanıtları konuşulan sese dönüştürür               |
| Medya anlama         | (otomatik)       | Herhangi bir görüntü/ses destekli model sağlayıcısı ve CLI yedekleri                         | Gelen görüntüleri, sesleri ve videoları özetler         |

## Sağlayıcı yetenek matrisi

Bu tablo, platform genelinde hangi sağlayıcıların hangi medya yeteneklerini desteklediğini gösterir.

| Sağlayıcı | Görüntü | Video | Müzik | TTS | STT / Transkripsiyon | Gerçek Zamanlı Ses | Medya Anlama |
| --------- | ------- | ----- | ----- | --- | -------------------- | ------------------ | ------------ |
| Alibaba   |         | Evet  |       |     |                      |                    |              |
| BytePlus  |         | Evet  |       |     |                      |                    |              |
| ComfyUI   | Evet    | Evet  | Evet  |     |                      |                    |              |
| Deepgram  |         |       |       |     | Evet                 |                    |              |
| ElevenLabs |        |       |       | Evet | Evet                |                    |              |
| fal       | Evet    | Evet  |       |     |                      |                    |              |
| Google    | Evet    | Evet  | Evet  | Evet |                     | Evet               | Evet         |
| Microsoft |         |       |       | Evet |                     |                    |              |
| MiniMax   | Evet    | Evet  | Evet  | Evet |                     |                    |              |
| Mistral   |         |       |       |     | Evet                 |                    |              |
| OpenAI    | Evet    | Evet  |       | Evet | Evet                | Evet               | Evet         |
| Qwen      |         | Evet  |       |     |                      |                    |              |
| Runway    |         | Evet  |       |     |                      |                    |              |
| Together  |         | Evet  |       |     |                      |                    |              |
| Vydra     | Evet    | Evet  |       |     |                      |                    |              |
| xAI       | Evet    | Evet  |       | Evet | Evet                |                    | Evet         |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kayıtlı olan herhangi bir görüntü destekli veya ses destekli modeli kullanır. Yukarıdaki tablo, özel medya anlama desteğine sahip sağlayıcıları vurgular; çok kipli modellere sahip çoğu LLM sağlayıcısı (Anthropic, Google, OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında gelen medyayı da anlayabilir.
</Note>

## Eşzamansız üretim nasıl çalışır

Video ve müzik üretimi, sağlayıcı işlemesi genellikle 30 saniye ile birkaç dakika sürdüğü için arka plan görevleri olarak çalışır. Aracı `video_generate` veya `music_generate` çağırdığında, OpenClaw isteği sağlayıcıya gönderir, hemen bir görev kimliği döndürür ve işi görev defterinde izler. İş çalışırken aracı diğer mesajlara yanıt vermeye devam eder. Sağlayıcı tamamladığında OpenClaw aracıyı uyandırır, böylece tamamlanan medyayı özgün kanala geri gönderebilir. Görüntü üretimi ve TTS eşzamanlıdır ve yanıtla satır içi olarak tamamlanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI yapılandırıldığında gelen
sesi toplu `tools.media.audio` yolu üzerinden transkribe edebilir. Deepgram,
ElevenLabs, Mistral, OpenAI ve xAI ayrıca Sesli Arama akış STT
sağlayıcılarını da kaydeder; böylece canlı telefon sesi, tamamlanmış bir
kaydı beklemeden seçilen satıcıya iletilebilir.

Google, OpenClaw'ın görüntü, video, müzik, toplu TTS, arka uç gerçek zamanlı
ses ve medya anlama yüzeylerine eşlenir. OpenAI, OpenClaw'ın görüntü,
video, toplu TTS, toplu STT, Sesli Arama akış STT, arka uç gerçek zamanlı ses
ve bellek yerleştirme yüzeylerine eşlenir. xAI şu anda OpenClaw'ın görüntü, video,
arama, kod yürütme, toplu TTS, toplu STT ve Sesli Arama akış STT
yüzeylerine eşlenir. xAI Realtime voice yukarı akışta bir yetenektir, ancak
paylaşılan gerçek zamanlı ses sözleşmesi bunu temsil edene kadar
OpenClaw içinde kaydedilmez.

## Hızlı bağlantılar

- [Görüntü Üretimi](/tr/tools/image-generation) -- görüntü oluşturma ve düzenleme
- [Video Üretimi](/tr/tools/video-generation) -- metinden videoya, görüntüden videoya ve videodan videoya
- [Müzik Üretimi](/tr/tools/music-generation) -- müzik ve ses parçaları oluşturma
- [Metinden Konuşmaya](/tr/tools/tts) -- yanıtları konuşulan sese dönüştürme
- [Medya Anlama](/tr/nodes/media-understanding) -- gelen görüntüleri, sesleri ve videoları anlama

## İlgili

- [Görüntü üretimi](/tr/tools/image-generation)
- [Video üretimi](/tr/tools/video-generation)
- [Müzik üretimi](/tr/tools/music-generation)
- [Metinden konuşmaya](/tr/tools/tts)
