---
read_when:
    - TUI için yeni başlayanlara uygun adım adım bir rehber istiyorsunuz
    - TUI özelliklerinin, komutlarının ve kısayollarının tam listesine ihtiyacınız var
summary: 'Terminal UI (TUI): Gateway''e bağlanın veya yerel olarak gömülü modda çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-04-25T14:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## Hızlı başlangıç

### Gateway modu

1. Gateway'i başlatın.

```bash
openclaw gateway
```

2. TUI'yi açın.

```bash
openclaw tui
```

3. Bir mesaj yazın ve Enter'a basın.

Uzak Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway'iniz parola kimlik doğrulaması kullanıyorsa `--password` kullanın.

### Yerel mod

TUI'yi Gateway olmadan çalıştırın:

```bash
openclaw chat
# veya
openclaw tui --local
```

Notlar:

- `openclaw chat` ve `openclaw terminal`, `openclaw tui --local` için takma addır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- Yerel mod, gömülü aracı çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway'e özgü özellikler kullanılamaz.
- `openclaw` ve `openclaw crestodian` da bu TUI kabuğunu kullanır; Crestodian, yerel kurulum ve onarım sohbet arka ucu olarak kullanılır.

## Gördükleriniz

- Üst bilgi: bağlantı URL'si, geçerli aracı, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalıştırma durumu (bağlanıyor, çalışıyor, akıyor, boşta, hata).
- Alt bilgi: bağlantı durumu + aracı + oturum + model + think/fast/verbose/trace/reasoning + belirteç sayıları + deliver.
- Girdi: otomatik tamamlamalı metin düzenleyici.

## Zihinsel model: aracılar + oturumlar

- Aracılar benzersiz slug'lardır (ör. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli aracıya aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` olarak saklanır.
  - `/session main` yazarsanız, TUI bunu `agent:<currentAgent>:main` olarak genişletir.
  - `/session agent:other:main` yazarsanız, açıkça o aracı oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her aracının birçok oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli aracı + oturum her zaman alt bilgide görünür.

## Gönderme + teslim

- Mesajlar Gateway'e gönderilir; sağlayıcılara teslim varsayılan olarak kapalıdır.
- Teslimi açmak için:
  - `/deliver on`
  - veya Ayarlar paneli
  - veya `openclaw tui --deliver` ile başlatın

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeler ve oturum geçersiz kılmasını ayarlar.
- Aracı seçici: farklı bir aracı seçin.
- Oturum seçici: yalnızca geçerli aracı için oturumları gösterir.
- Ayarlar: deliver, araç çıktısı genişletme ve düşünme görünürlüğünü açıp kapatın.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girdiyi temizle (çıkmak için iki kez bas)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: aracı seçici
- Ctrl+P: oturum seçici
- Ctrl+O: araç çıktısı genişletmeyi aç/kapat
- Ctrl+T: düşünme görünürlüğünü aç/kapat (geçmişi yeniden yükler)

## Eğik çizgi komutları

Çekirdek:

- `/help`
- `/status`
- `/agent <id>` (veya `/agents`)
- `/session <key>` (veya `/sessions`)
- `/model <provider/model>` (veya `/models`)

Oturum denetimleri:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (takma ad: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Oturum yaşam döngüsü:

- `/new` veya `/reset` (oturumu sıfırla)
- `/abort` (etkin çalıştırmayı iptal et)
- `/settings`
- `/exit`

Yalnızca yerel mod:

- `/auth [provider]`, sağlayıcı kimlik doğrulama/oturum açma akışını TUI içinde açar.

Diğer Gateway eğik çizgi komutları (örneğin `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

## Yerel kabuk komutları

- TUI ana bilgisayarında yerel kabuk komutu çalıştırmak için bir satırın başına `!` ekleyin.
- TUI, yerel yürütmeye izin vermek için oturum başına bir kez sorar; reddederseniz o oturum için `!` devre dışı kalır.
- Komutlar TUI çalışma dizininde yeni, etkileşimli olmayan bir kabukta çalışır (`cd`/env kalıcı değildir).
- Yerel kabuk komutları ortamlarında `OPENCLAW_SHELL=tui-local` alır.
- Tek başına `!`, normal mesaj olarak gönderilir; baştaki boşluklar yerel exec'i tetiklemez.

## Yerel TUI'den yapılandırmaları onarma

Geçerli yapılandırma zaten doğrulanıyorsa ve
gömülü aracının aynı makinede bunu incelemesini, belgelerle karşılaştırmasını
ve çalışan bir Gateway'e bağımlı olmadan sapmaları onarmaya yardımcı olmasını istiyorsanız yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa, önce `openclaw configure`
veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma
korumasını atlamaz.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Aracıya neyi kontrol etmesini istediğinizi sorun, örneğin:

```text
Gateway kimlik doğrulama yapılandırmamı belgelerle karşılaştır ve en küçük düzeltmeyi öner.
```

3. Kesin kanıt ve doğrulama için yerel kabuk komutlarını kullanın:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` veya `openclaw configure` ile dar değişiklikler uygulayın, ardından `!openclaw config validate` komutunu yeniden çalıştırın.
5. Doctor otomatik taşıma veya onarım önerirse, bunu gözden geçirin ve `!openclaw doctor --fix` çalıştırın.

İpuçları:

- `openclaw.json` dosyasını elle düzenlemek yerine `openclaw config set` veya `openclaw configure` tercih edin.
- `openclaw docs "<query>"`, aynı makineden canlı dokümantasyon dizininde arama yapar.
- `openclaw config validate --json`, yapılandırılmış şema ve SecretRef/çözümlenebilirlik hataları istediğinizde kullanışlıdır.

## Araç çıktısı

- Araç çağrıları argümanlar + sonuçlarla kartlar olarak gösterilir.
- Ctrl+O, daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken, kısmi güncellemeler aynı karta akar.

## Terminal renkleri

- TUI, hem koyu hem açık terminallerin okunabilir kalması için asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar.
- Terminaliniz açık arka plan kullanıyorsa ve otomatik algılama yanlışsa, `openclaw tui` başlatmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlantıda TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akan yanıtlar sonlandırılana kadar yerinde güncellenir.
- TUI ayrıca daha zengin araç kartları için aracı araç olaylarını dinler.

## Bağlantı ayrıntıları

- TUI, Gateway'e `mode: "tui"` olarak kaydolur.
- Yeniden bağlanmalar sistem mesajı gösterir; olay boşlukları günlüğe yansıtılır.

## Seçenekler

- `--local`: Yerel gömülü aracı çalışma zamanına karşı çalıştır
- `--url <url>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırma veya `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token'ı (gerekiyorsa)
- `--password <password>`: Gateway parolası (gerekiyorsa)
- `--session <key>`: Oturum anahtarı (varsayılan: `main`, kapsam global olduğunda `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya teslim et (varsayılan kapalı)
- `--thinking <level>`: Gönderimler için düşünme düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra başlangıç mesajı gönder
- `--timeout-ms <ms>`: Aracı zaman aşımı ms cinsinden (varsayılan olarak `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

Not: `--url` ayarladığınızda TUI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça geçin. Açık kimlik bilgileri eksikse bu bir hatadır.
Yerel modda `--url`, `--token` veya `--password` geçmeyin.

## Sorun giderme

Mesaj gönderdikten sonra çıktı yok:

- Gateway'in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI içinde `/status` çalıştırın.
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`.
- Aracının çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Bir sohbet kanalında mesajlar bekliyorsanız teslimi etkinleştirin (`/deliver on` veya `--deliver`).

## Bağlantı sorun giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide aracı yok: `openclaw agents list` ve yönlendirme yapılandırmanızı kontrol edin.
- Boş oturum seçici: global kapsamda olabilirsiniz veya henüz hiç oturumunuz olmayabilir.

## İlgili

- [Control UI](/tr/web/control-ui) — web tabanlı denetim arayüzü
- [Yapılandırma](/tr/cli/config) — `openclaw.json` dosyasını inceleyin, doğrulayın ve düzenleyin
- [Doctor](/tr/cli/doctor) — rehberli onarım ve taşıma denetimleri
- [CLI Başvurusu](/tr/cli) — tam CLI komut başvurusu
