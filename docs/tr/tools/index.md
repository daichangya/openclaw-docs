---
read_when:
    - OpenClaw'ın hangi araçları sağladığını anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya reddetmeniz gerekiyor
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve plugin''lerine genel bakış: ajanın neler yapabildiği ve nasıl genişletileceği'
title: Araçlar ve Plugin'ler
x-i18n:
    generated_at: "2026-04-22T08:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6edb9e13b72e6345554f25c8d8413d167a69501e6626828d9aa3aac6907cd092
    source_path: tools/index.md
    workflow: 15
---

# Araçlar ve Plugin'ler

Ajanın metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden gerçekleşir.
Araçlar, ajanın dosya okumasını, komut çalıştırmasını, web'de gezinmesini, ileti
göndermesini ve cihazlarla etkileşime girmesini sağlar.

## Araçlar, Skills ve Plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar ajanın çağırdığı şeylerdir">
    Araç, ajanın çağırabildiği türlendirilmiş bir işlevdir (ör. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    Plugin'ler ek araçlar kaydedebilir.

    Ajan araçları, model API'sine gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills ajana ne zaman ve nasıl olduğunu öğretir">
    Skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, aracı etkili biçimde kullanmak için ajana bağlam, kısıtlar ve
    adım adım rehberlik sağlar. Skills çalışma alanınızda, paylaşılan klasörlerde
    bulunabilir veya Plugin'lerin içinde gelebilir.

    [Skills başvurusu](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi bir arada paketler">
    Plugin; kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görsel üretimi, video üretimi,
    web getirme, web arama ve daha fazlası gibi yeteneklerin herhangi bir
    birleşimini kaydedebilen bir pakettir. Bazı Plugin'ler **core**'dur (OpenClaw ile
    birlikte gelir), diğerleri **external**'dır (topluluk tarafından npm üzerinde yayımlanır).

    [Plugin'leri kurun ve yapılandırın](/tr/tools/plugin) | [Kendi Plugin'inizi oluşturun](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir Plugin kurmadan kullanılabilir:

| Araç                                       | Ne yapar                                                              | Sayfa                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Kabuk komutları çalıştırır, arka plan süreçlerini yönetir             | [Exec](/tr/tools/exec)                         |
| `code_execution`                           | Korumalı uzak Python analizini çalıştırır                             | [Kod Çalıştırma](/tr/tools/code-execution)     |
| `browser`                                  | Bir Chromium tarayıcısını denetler (gezinme, tıklama, ekran görüntüsü alma) | [Tarayıcı](/tr/tools/browser)                  |
| `web_search` / `x_search` / `web_fetch`    | Web'de arama yapar, X gönderilerinde arama yapar, sayfa içeriği getirir | [Web](/tr/tools/web)                          |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç işlemleri                                  |                                             |
| `apply_patch`                              | Çok parçalı dosya yamaları                                            | [Yama Uygula](/tr/tools/apply-patch)           |
| `message`                                  | Tüm kanallar arasında ileti gönderir                                  | [Ajan Gönderimi](/tr/tools/agent-send)         |
| `canvas`                                   | node Canvas'ı sürer (sunma, değerlendirme, anlık görüntü alma)        |                                             |
| `nodes`                                    | Eşleştirilmiş cihazları keşfeder ve hedefler                          |                                             |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; gateway'i inceler, yamalar, yeniden başlatır veya günceller |                                             |
| `image` / `image_generate`                 | Görselleri analiz eder veya üretir                                    | [Görsel Üretimi](/tr/tools/image-generation)   |
| `music_generate`                           | Müzik parçaları üretir                                                | [Müzik Üretimi](/tr/tools/music-generation)    |
| `video_generate`                           | Videolar üretir                                                       | [Video Üretimi](/tr/tools/video-generation)    |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                            | [TTS](/tr/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt ajan orkestrasyonu                      | [Alt ajanlar](/tr/tools/subagents)             |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılması    | [Oturum Araçları](/tr/concepts/session-tool)   |

Görsel çalışmaları için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya varsayılan olmayan başka bir görsel sağlayıcısını hedefliyorsanız önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Müzik çalışmaları için `music_generate` kullanın. `google/*`, `minimax/*` veya varsayılan olmayan başka bir müzik sağlayıcısını hedefliyorsanız önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Video çalışmaları için `video_generate` kullanın. `qwen/*` veya varsayılan olmayan başka bir video sağlayıcısını hedefliyorsanız önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

İş akışı odaklı ses üretimi için ComfyUI gibi bir Plugin bunu kaydediyorsa
`music_generate` kullanın. Bu, metinden konuşmaya dönüştürme olan `tts`'den ayrıdır.

`session_status`, oturumlar grubundaki hafif durum/geri okuma aracıdır.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve isteğe bağlı olarak
oturum başına model geçersiz kılması ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, en son transkript kullanım girdisinden
seyrek token/önbellek sayaçlarını ve etkin çalışma zamanı modeli etiketini
geriye dönük doldurabilir.

`gateway`, gateway işlemleri için yalnızca sahip tarafından kullanılabilen çalışma zamanı aracıdır:

- Düzenlemelerden önce tek bir yol kapsamlı yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değişimi için `config.apply`
- Açık kendi kendini güncelleme + yeniden başlatma için `update.run`

Kısmi değişikliklerde önce `config.schema.lookup`, sonra `config.patch` tercih edin.
`config.apply` seçeneğini yalnızca tüm yapılandırmayı bilerek değiştirdiğinizde kullanın.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerini değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize edilir.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Diffs](/tr/tools/diffs) — diff görüntüleyici ve oluşturucu
- [LLM Task](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON kullanan LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylara sahip türlendirilmiş iş akışı çalışma zamanı
- [Müzik Üretimi](/tr/tools/music-generation) — iş akışı destekli sağlayıcılara sahip paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

## Araç yapılandırması

### İzin ve ret listeleri

Ajanın hangi araçları çağırabileceğini yapılandırmada `tools.allow` / `tools.deny`
üzerinden denetleyin. Ret her zaman izni geçersiz kılar.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce temel bir izin listesi ayarlar.
Ajan başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | İçerdikleri                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Kısıtlama yoktur (ayarlanmamışla aynıdır)                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`   | yalnızca `session_status`                                                                                                                        |

### Araç grupları

İzin/ret listelerinde `group:*` kısayollarını kullanın:

| Grup               | Araçlar                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için bir takma ad olarak kabul edilir)                     |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (Plugin araçları hariç)                                                    |

`sessions_history`, sınırlı ve güvenlik filtreli bir geri çağırma görünümü döndürür. Şunları ayıklar:
thinking etiketleri, `<relevant-memories>` iskelesi, düz metin araç çağrısı XML
yükleri (şunlar dahil: `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları),
düşürülmüş araç çağrısı iskelesi, sızmış ASCII/tam genişlikli model denetim
token'ları ve asistan metnindeki hatalı MiniMax araç çağrısı XML'i; ardından
ham transkript dökümü gibi davranmak yerine redaksiyon/kısaltma ve olası aşırı büyük satır yer tutucuları uygular.

### Sağlayıcıya özgü kısıtlamalar

Genel varsayılanları değiştirmeden belirli sağlayıcılar için araçları kısıtlamak üzere
`tools.byProvider` kullanın:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
