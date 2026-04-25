---
read_when:
    - OpenClaw'ın hangi araçları sunduğunu anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya reddetmeniz gerekiyor
    - Yerleşik araçlar, Skills ve plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve plugin''lerine genel bakış: agent''in neler yapabildiği ve nasıl genişletileceği'
title: Araçlar ve plugin'ler
x-i18n:
    generated_at: "2026-04-25T13:58:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

Agent'in metin üretmenin ötesinde yaptığı her şey **tools** aracılığıyla gerçekleşir.
Tools, agent'in dosya okumasını, komut çalıştırmasını, web'de gezinmesini, mesaj göndermesini ve cihazlarla etkileşime girmesini sağlar.

## Tools, Skills ve plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Tools, agent'in çağırdığı şeylerdir">
    Tool, agent'in çağırabildiği türlendirilmiş bir işlevdir (ör. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    plugin'ler ek araçlar kaydedebilir.

    Agent, tool'ları model API'sine gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills, agent'e ne zaman ve nasıl kullanılacağını öğretir">
    Skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, agent'e araçları etkili kullanması için bağlam, kısıtlamalar ve
    adım adım yönlendirme sağlar. Skills çalışma alanınızda, paylaşılan klasörlerde
    bulunabilir veya plugin'lerin içinde gelebilir.

    [Skills reference](/tr/tools/skills) | [Creating skills](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi birlikte paketler">
    Plugin, herhangi bir yetenek birleşimini kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı yazıya dökme,
    gerçek zamanlı ses, medya anlama, görüntü oluşturma, video oluşturma,
    web fetch, web arama ve daha fazlası. Bazı plugin'ler **core**'dur (OpenClaw ile
    birlikte gelir), diğerleri **external**'dır (topluluk tarafından npm'de yayımlanır).

    [Install and configure plugins](/tr/tools/plugin) | [Build your own](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir plugin kurmadan kullanılabilir:

| Tool                                       | Ne yapar                                                              | Sayfa                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell komutlarını çalıştırır, arka plan süreçlerini yönetir           | [Exec](/tr/tools/exec), [Exec Approvals](/tr/tools/exec-approvals) |
| `code_execution`                           | Sandbox içinde uzak Python analizi çalıştırır                         | [Code Execution](/tr/tools/code-execution)                      |
| `browser`                                  | Bir Chromium tarayıcısını kontrol eder (gezinti, tıklama, ekran görüntüsü) | [Browser](/tr/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`    | Web'de arama yapar, X gönderilerini arar, sayfa içeriğini getirir     | [Web](/tr/tools/web), [Web Fetch](/tr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç                                            |                                                              |
| `apply_patch`                              | Çok parçalı dosya yamaları                                            | [Apply Patch](/tr/tools/apply-patch)                            |
| `message`                                  | Tüm kanallarda mesaj gönderir                                         | [Agent Send](/tr/tools/agent-send)                              |
| `canvas`                                   | Node Canvas'ı sürer (sunum, eval, anlık görüntü)                      |                                                              |
| `nodes`                                    | Eşlenmiş cihazları keşfeder ve hedefler                               |                                                              |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; gateway'i inceler, yamalar, yeniden başlatır veya günceller |                                              |
| `image` / `image_generate`                 | Görüntüleri analiz eder veya oluşturur                                | [Image Generation](/tr/tools/image-generation)                  |
| `music_generate`                           | Müzik parçaları oluşturur                                             | [Music Generation](/tr/tools/music-generation)                  |
| `video_generate`                           | Videolar oluşturur                                                    | [Video Generation](/tr/tools/video-generation)                  |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                            | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt agent orkestrasyonu                     | [Sub-agents](/tr/tools/subagents)                               |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılması    | [Session Tools](/tr/concepts/session-tool)                      |

Görüntü işleri için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya varsayılan olmayan başka bir görüntü sağlayıcısını hedefliyorsanız önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Müzik işleri için `music_generate` kullanın. `google/*`, `minimax/*` veya varsayılan olmayan başka bir müzik sağlayıcısını hedefliyorsanız önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Video işleri için `video_generate` kullanın. `qwen/*` veya varsayılan olmayan başka bir video sağlayıcısını hedefliyorsanız önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

İş akışı odaklı ses üretimi için, ComfyUI gibi bir plugin bunu kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya olan `tts`'den ayrıdır.

`session_status`, oturumlar grubundaki hafif durum/geri okuma aracıdır.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve isteğe bağlı olarak
oturum başına model geçersiz kılması ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, son transcript kullanım girdisinden
seyrek token/önbellek sayaçlarını ve etkin runtime model etiketini geriye dönük doldurabilir.

`gateway`, gateway işlemleri için yalnızca sahip tarafından kullanılabilen runtime aracıdır:

- Düzenlemelerden önce yol kapsamlı tek bir yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatma ile kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değiştirme için `config.apply`
- Açık kendi kendini güncelleme + yeniden başlatma için `update.run`

Kısmi değişiklikler için `config.schema.lookup`, sonra `config.patch` tercih edin.
`config.apply` yalnızca tüm yapılandırmayı kasıtlı olarak değiştirdiğinizde kullanılmalıdır.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Diffs](/tr/tools/diffs) — diff görüntüleyici ve oluşturucu
- [LLM Task](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylarla türlendirilmiş iş akışı runtime'ı
- [Music Generation](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown-first iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

## Araç yapılandırması

### İzin ve ret listeleri

Agent'in hangi araçları çağırabileceğini yapılandırmada `tools.allow` / `tools.deny`
ile denetleyin. Ret her zaman izne üstün gelir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

Açık bir allowlist çağrılabilir hiçbir araca çözülmezse OpenClaw kapalı davranır.
Örneğin `tools.allow: ["query_db"]` yalnızca yüklü bir plugin gerçekten
`query_db` kaydediyorsa çalışır. Hiçbir yerleşik, plugin veya paketlenmiş MCP aracı
allowlist ile eşleşmezse çalışma, araç sonuçları uydurabilecek salt metin çalışmasına
devam etmek yerine model çağrısından önce durur.

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce temel bir allowlist ayarlar.
Agent başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | İçerdikleri                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Kısıtlama yok (ayarlanmamışla aynı)                                                                                                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Yalnızca `session_status`                                                                                                                         |

`coding` ve `messaging` profilleri ayrıca `bundle-mcp` plugin anahtarı altındaki
yapılandırılmış bundle MCP araçlarına izin verir.
Bir profilin normal yerleşik araçlarını korurken tüm yapılandırılmış MCP araçlarını gizlemesini istiyorsanız `tools.deny: ["bundle-mcp"]` ekleyin.
`minimal` profili bundle MCP araçlarını içermez.

### Araç grupları

İzin/ret listelerinde `group:*` kısaltmalarını kullanın:

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
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (plugin araçları hariç)                                                    |

`sessions_history`, sınırlı ve güvenlik filtreli bir geri çağırma görünümü döndürür. Düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin tool-call XML yüklerini
(` <tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil),
düşürülmüş tool-call iskeletini, sızmış ASCII/tam genişlikte model denetim
token'larını ve bozuk MiniMax tool-call XML'ini yardımcı metninden çıkarır, sonra
ham transcript dökümü gibi davranmak yerine
redaksiyon/kısaltma ve olası büyük satır yer tutucularını uygular.

### Sağlayıcıya özgü kısıtlamalar

Genel varsayılanları değiştirmeden belirli sağlayıcılar için araçları kısıtlamak üzere `tools.byProvider` kullanın:

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
