---
read_when:
    - '`openclaw browser` kullanıyorsunuz ve yaygın görevler için örnekler istiyorsunuz'
    - Başka bir makinede çalışan bir tarayıcıyı bir Node ana bilgisayarı üzerinden denetlemek istiyorsunuz
    - Chrome MCP aracılığıyla yerel olarak oturum açılmış Chrome'unuza bağlanmak istiyorsunuz
summary: '`openclaw browser` için CLI başvurusu (yaşam döngüsü, profiller, sekmeler, eylemler, durum ve hata ayıklama)'
title: Tarayıcı
x-i18n:
    generated_at: "2026-04-25T13:43:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw'ın tarayıcı denetim yüzeyini yönetin ve tarayıcı eylemlerini çalıştırın (yaşam döngüsü, profiller, sekmeler, anlık görüntüler, ekran görüntüleri, gezinme, giriş, durum öykünmesi ve hata ayıklama).

İlgili:

- Tarayıcı aracı + API: [Tarayıcı aracı](/tr/tools/browser)

## Yaygın bayraklar

- `--url <gatewayWsUrl>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırmadan alınır).
- `--token <token>`: Gateway token'ı (gerekliyse).
- `--timeout <ms>`: istek zaman aşımı (ms).
- `--expect-final`: son bir Gateway yanıtı bekler.
- `--browser-profile <name>`: bir tarayıcı profili seçer (varsayılan yapılandırmadan alınır).
- `--json`: makine tarafından okunabilir çıktı (desteklendiği yerlerde).

## Hızlı başlangıç (yerel)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Ajanlar aynı hazır olma denetimini `browser({ action: "doctor" })` ile çalıştırabilir.

## Hızlı sorun giderme

`start`, `not reachable after start` hatasıyla başarısız olursa önce CDP hazır olma durumunu giderin. `start` ve `tabs` başarılı olup `open` veya `navigate` başarısız olursa, tarayıcı denetim düzlemi sağlıklıdır ve hata genellikle gezinme SSRF politikasıdır.

Minimal sıra:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Ayrıntılı kılavuz: [Tarayıcı sorun giderme](/tr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Yaşam döngüsü

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Notlar:

- `attachOnly` ve uzak CDP profilleri için `openclaw browser stop`, OpenClaw tarayıcı sürecini kendisi başlatmamış olsa bile etkin denetim oturumunu kapatır ve geçici öykünme geçersiz kılmalarını temizler.
- Yerel yönetilen profiller için `openclaw browser stop`, oluşturulan tarayıcı sürecini durdurur.
- `openclaw browser start --headless` yalnızca o başlatma isteğine uygulanır ve yalnızca OpenClaw yerel yönetilen bir tarayıcı başlattığında etkilidir. `browser.headless` veya profil yapılandırmasını yeniden yazmaz ve zaten çalışan bir tarayıcı için etkisizdir.
- `DISPLAY` veya `WAYLAND_DISPLAY` bulunmayan Linux ana makinelerinde, `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` veya `browser.profiles.<name>.headless=false` görünür bir tarayıcıyı açıkça istemedikçe, yerel yönetilen profiller otomatik olarak başsız çalışır.

## Komut yoksa

`openclaw browser` bilinmeyen bir komutsa, `~/.openclaw/openclaw.json` içindeki `plugins.allow` değerini kontrol edin.

`plugins.allow` mevcut olduğunda, paketlenmiş tarayıcı Plugin'i açıkça listelenmelidir:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Plugin izin listesi `browser` değerini dışlıyorsa, `browser.enabled=true` CLI alt komutunu geri getirmez.

İlgili: [Tarayıcı aracı](/tr/tools/browser#missing-browser-command-or-tool)

## Profiller

Profiller, adlandırılmış tarayıcı yönlendirme yapılandırmalarıdır. Pratikte:

- `openclaw`: ayrılmış bir OpenClaw tarafından yönetilen Chrome örneğini başlatır veya ona bağlanır (yalıtılmış kullanıcı veri dizini).
- `user`: mevcut oturum açılmış Chrome oturumunuzu Chrome DevTools MCP üzerinden denetler.
- özel CDP profilleri: yerel veya uzak bir CDP uç noktasını işaret eder.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Belirli bir profil kullanın:

```bash
openclaw browser --browser-profile work tabs
```

## Sekmeler

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs`, önce `suggestedTargetId`, sonra `t1` gibi kararlı `tabId`, isteğe bağlı etiket ve ham `targetId` döndürür. Ajanlar `focus`, `close`, anlık görüntüler ve eylemler için `suggestedTargetId` değerini geri iletmelidir. `open --label`, `tab new --label` veya `tab label` ile bir etiket atayabilirsiniz; etiketler, sekme kimlikleri, ham hedef kimlikleri ve benzersiz hedef kimliği öneklerinin tümü kabul edilir.

## Anlık görüntü / ekran görüntüsü / eylemler

Anlık görüntü:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Ekran görüntüsü:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Notlar:

- `--full-page` yalnızca sayfa yakalamaları içindir; `--ref` veya `--element` ile birleştirilemez.
- `existing-session` / `user` profilleri sayfa ekran görüntülerini ve anlık görüntü çıktısından `--ref` ekran görüntülerini destekler, ancak CSS `--element` ekran görüntülerini desteklemez.
- `--labels`, geçerli anlık görüntü ref'lerini ekran görüntüsünün üzerine bindirir.
- `snapshot --urls`, keşfedilen bağlantı hedeflerini yapay zeka anlık görüntülerine ekler; böylece ajanlar yalnızca bağlantı metninden tahmin etmek yerine doğrudan gezinme hedeflerini seçebilir.

Gezinme/tıklama/yazma (ref tabanlı UI otomasyonu):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Dosya + iletişim kutusu yardımcıları:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Yönetilen Chrome profilleri, normal tıklamayla tetiklenen indirmeleri OpenClaw indirmeler dizinine kaydeder (varsayılan olarak `/tmp/openclaw/downloads` veya yapılandırılmış geçici kök). Ajanın belirli bir dosyayı beklemesi ve yolunu döndürmesi gerektiğinde `waitfordownload` veya `download` kullanın; bu açık bekleyiciler sonraki indirmenin sahipliğini alır.

## Durum ve depolama

Görüntü alanı + öykünme:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Çerezler + depolama:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Hata ayıklama

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## MCP üzerinden mevcut Chrome

Yerleşik `user` profilini kullanın veya kendi `existing-session` profilinizi oluşturun:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Bu yol yalnızca host içindir. Docker, başsız sunucular, Browserless veya diğer uzak kurulumlar için bunun yerine bir CDP profili kullanın.

Mevcut existing-session sınırları:

- anlık görüntü güdümlü eylemler CSS seçicileri değil, ref'leri kullanır
- `browser.actionTimeoutMs`, çağıranlar `timeoutMs` belirtmediğinde desteklenen `act` istekleri için varsayılanı 60000 ms yapar; çağrı başına `timeoutMs` yine önceliklidir
- `click` yalnızca sol tıklamadır
- `type`, `slowly=true` desteğine sahip değildir
- `press`, `delayMs` desteğine sahip değildir
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımı geçersiz kılmalarını reddeder
- `select` yalnızca tek bir değeri destekler
- `wait --load networkidle` desteklenmez
- dosya yüklemeleri `--ref` / `--input-ref` gerektirir, CSS `--element` desteği yoktur ve şu anda aynı anda tek dosyayı destekler
- iletişim kutusu kancaları `--timeout` desteğine sahip değildir
- ekran görüntüleri sayfa yakalamalarını ve `--ref` destekler, ancak CSS `--element` desteklemez
- `responsebody`, indirme yakalama, PDF dışa aktarma ve toplu eylemler hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir

## Uzak tarayıcı denetimi (node host proxy)

Gateway tarayıcıyla aynı makinede çalışmıyorsa, Chrome/Brave/Edge/Chromium bulunan makinede bir **node host** çalıştırın. Gateway tarayıcı eylemlerini bu node'a proxy'ler (ayrı bir tarayıcı denetim sunucusu gerekmez).

Otomatik yönlendirmeyi denetlemek için `gateway.nodes.browser.mode`, birden fazla node bağlıysa belirli bir node'u sabitlemek için `gateway.nodes.browser.node` kullanın.

Güvenlik + uzak kurulum: [Tarayıcı aracı](/tr/tools/browser), [Uzak erişim](/tr/gateway/remote), [Tailscale](/tr/gateway/tailscale), [Güvenlik](/tr/gateway/security)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Tarayıcı](/tr/tools/browser)
