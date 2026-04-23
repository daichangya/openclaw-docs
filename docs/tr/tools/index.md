---
read_when:
    - OpenClaw'ın hangi araçları sunduğunu anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya reddetmeniz gerekiyor
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve Plugin''lere genel bakış: aracının neler yapabildiği ve nasıl genişletileceği'
title: Araçlar ve Plugin'ler
x-i18n:
    generated_at: "2026-04-23T09:11:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Araçlar ve Plugin'ler

Aracının metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden gerçekleşir.
Araçlar, aracının dosya okuması, komut çalıştırması, web'de gezinmesi, ileti göndermesi
ve cihazlarla etkileşime girmesini sağlar.

## Araçlar, Skills ve Plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar, aracının çağırdığı şeylerdir">
    Araç, aracının çağırabildiği türlenmiş bir işlevdir (ör. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    Plugin'ler ek araçlar kaydedebilir.

    Aracı, araçları model API'sine gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills, aracıya ne zaman ve nasıl kullanılacağını öğretir">
    Skill, sistem istemine enjekte edilen bir Markdown dosyasıdır (`SKILL.md`).
    Skills, aracısına araçları etkili kullanması için bağlam, kısıtlar ve adım adım yönlendirme verir. Skills çalışma alanınızda, paylaşılan klasörlerde bulunabilir
    veya Plugin'lerin içinde gönderilebilir.

    [Skills başvurusu](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi birlikte paketler">
    Plugin; kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görsel oluşturma, video oluşturma,
    web getirme, web arama ve daha fazlası gibi herhangi bir yetenek kombinasyonunu kaydedebilen bir pakettir. Bazı Plugin'ler **core**'dur (OpenClaw ile birlikte gönderilir), diğerleri **external**'dır (topluluk tarafından npm üzerinde yayımlanır).

    [Plugin'leri kur ve yapılandır](/tr/tools/plugin) | [Kendin oluştur](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir Plugin kurmadan kullanılabilir:

| Araç                                       | Ne yapar                                                             | Sayfa                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell komutları çalıştırır, arka plan süreçlerini yönetir            | [Exec](/tr/tools/exec), [Exec Approvals](/tr/tools/exec-approvals) |
| `code_execution`                           | Sandbox'lı uzak Python analizi çalıştırır                            | [Code Execution](/tr/tools/code-execution)                      |
| `browser`                                  | Chromium tarayıcısını denetler (gezinme, tıklama, ekran görüntüsü)   | [Browser](/tr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web'de arar, X gönderilerini arar, sayfa içeriğini getirir           | [Web](/tr/tools/web), [Web Fetch](/tr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç                                           |                                                              |
| `apply_patch`                              | Çok parça dosya yamaları                                             | [Apply Patch](/tr/tools/apply-patch)                            |
| `message`                                  | Tüm kanallar arasında ileti gönderir                                 | [Agent Send](/tr/tools/agent-send)                              |
| `canvas`                                   | Node Canvas'ı sürer (sunum, eval, anlık görüntü)                     |                                                              |
| `nodes`                                    | Eşleştirilmiş cihazları keşfeder ve hedefler                         |                                                              |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; gateway'i inceler, yamar, yeniden başlatır veya günceller |                                                              |
| `image` / `image_generate`                 | Görselleri analiz eder veya üretir                                   | [Image Generation](/tr/tools/image-generation)                  |
| `music_generate`                           | Müzik parçaları üretir                                               | [Music Generation](/tr/tools/music-generation)                  |
| `video_generate`                           | Videolar üretir                                                      | [Video Generation](/tr/tools/video-generation)                  |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                           | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt aracı orkestrasyonu                    | [Sub-agents](/tr/tools/subagents)                               |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılma     | [Session Tools](/tr/concepts/session-tool)                      |

Görsel çalışmaları için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya varsayılan olmayan başka bir görsel sağlayıcısını hedefliyorsanız, önce o sağlayıcının auth/API anahtarını yapılandırın.

Müzik çalışmaları için `music_generate` kullanın. `google/*`, `minimax/*` veya varsayılan olmayan başka bir müzik sağlayıcısını hedefliyorsanız, önce o sağlayıcının auth/API anahtarını yapılandırın.

Video çalışmaları için `video_generate` kullanın. `qwen/*` veya varsayılan olmayan başka bir video sağlayıcısını hedefliyorsanız, önce o sağlayıcının auth/API anahtarını yapılandırın.

İş akışı güdümlü ses üretimi için ComfyUI gibi bir Plugin bunu kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya olan `tts` aracından ayrıdır.

`session_status`, oturumlar grubundaki hafif durum/geri okuma aracıdır.
Geçerli oturumla ilgili `/status` tarzı soruları yanıtlar ve
isteğe bağlı olarak oturum başına model geçersiz kılması ayarlayabilir; `model=default`, bu
geçersiz kılmayı temizler. `/status` gibi, en son döküm kullanım girdisinden seyrek token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini geriye dönük doldurabilir.

`gateway`, gateway işlemleri için yalnızca sahip tarafından kullanılabilen çalışma zamanı aracıdır:

- düzenlemelerden önce tek bir yol kapsamlı yapılandırma alt ağacı için `config.schema.lookup`
- geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- yalnızca tam yapılandırma değiştirme için `config.apply`
- açık self-update + yeniden başlatma için `update.run`

Kısmi değişiklikler için `config.schema.lookup` ardından `config.patch` tercih edin. `config.apply` yalnızca tüm yapılandırmayı bilerek değiştirirken kullanılmalıdır.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerini değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korunan exec yollarına normalize edilir.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Diffs](/tr/tools/diffs) — diff görüntüleyicisi ve işleyicisi
- [LLM Task](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylarla türlenmiş iş akışı çalışma zamanı
- [Music Generation](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — Markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — kompakt gürültülü `exec` ve `bash` araç sonuçları

## Araç yapılandırması

### İzin ve engelleme listeleri

Aracının hangi araçları çağırabileceğini
yapılandırmadaki `tools.allow` / `tools.deny` ile denetleyin. Engelleme her zaman izni kazanır.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce bir temel izin listesi ayarlar.
Aracı başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | İçerdikleri                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sınırlama yok (ayarlanmamışla aynı)                                                                                                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Yalnızca `session_status`                                                                                                                         |

`coding` ve `messaging` profilleri ayrıca
`bundle-mcp` Plugin anahtarı altındaki yapılandırılmış paket MCP araçlarına da izin verir.
Bir profilin normal yerleşik araçlarını korurken tüm yapılandırılmış MCP araçlarını gizlemesini istiyorsanız `tools.deny: ["bundle-mcp"]` ekleyin.
`minimal` profili paket MCP araçlarını içermez.

### Araç grupları

İzin/engelleme listelerinde `group:*` kısayollarını kullanın:

| Grup               | Araçlar                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için takma ad olarak kabul edilir)                          |
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

`sessions_history`, sınırlandırılmış ve güvenlik filtreli bir geri çağırma görünümü döndürür. Şunları ayıklar:
thinking etiketleri, `<relevant-memories>` iskeleti, düz metin araç çağrısı XML
yükleri (`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil),
düşürülmüş araç çağrısı iskeleti, sızan ASCII/tam genişlik model denetim
token'ları ve yardımcı metnindeki bozuk MiniMax araç çağrısı XML'i; ardından
ham döküm dökümü gibi davranmak yerine redaksiyon/kesme ve olası aşırı büyük satır yer tutucuları uygular.

### Sağlayıcıya özgü kısıtlamalar

Genel varsayılanları
değiştirmeden belirli sağlayıcılar için araçları kısıtlamak üzere `tools.byProvider` kullanın:

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
