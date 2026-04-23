---
read_when:
    - TUI için yeni başlayan dostu bir adım adım açıklama istiyorsunuz.
    - TUI özelliklerinin, komutlarının ve kısayollarının tam listesine ihtiyacınız var.
summary: 'Terminal UI (TUI): Gateway''e bağlanın veya yerel olarak gömülü modda çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-04-23T09:13:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (Terminal UI)

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
- `--local`, `--url`, `--token` veya `--password` ile birleştirilemez.
- Yerel mod gömülü agent çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway'e özgü özellikler kullanılamaz.

## Neler görürsünüz

- Başlık: bağlantı URL'si, geçerli agent, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, assistant yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalıştırma durumu (bağlanıyor, çalışıyor, akış, boşta, hata).
- Alt bilgi: bağlantı durumu + agent + oturum + model + think/fast/verbose/trace/reasoning + token sayıları + deliver.
- Girdi: otomatik tamamlama içeren metin düzenleyici.

## Zihinsel model: agent'lar + oturumlar

- Agent'lar benzersiz slug'lardır (ör. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli agent'a aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` olarak saklanır.
  - `/session main` yazarsanız TUI bunu `agent:<currentAgent>:main` olarak genişletir.
  - `/session agent:other:main` yazarsanız o agent oturumuna açıkça geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her agent'ın birçok oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli agent + oturum her zaman alt bilgide görünür.

## Gönderme + teslim

- Mesajlar Gateway'e gönderilir; provider'lara teslim varsayılan olarak kapalıdır.
- Dönüş teslimini açın:
  - `/deliver on`
  - veya Ayarlar panelinden
  - veya `openclaw tui --deliver` ile başlatın

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeler ve oturum geçersiz kılmasını ayarlar.
- Agent seçici: farklı bir agent seçer.
- Oturum seçici: yalnızca geçerli agent için oturumları gösterir.
- Ayarlar: deliver, araç çıktısı genişletmesi ve thinking görünürlüğünü açıp kapatır.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girdiyi temizle (çıkmak için iki kez basın)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: agent seçici
- Ctrl+P: oturum seçici
- Ctrl+O: araç çıktısı genişletmesini aç/kapat
- Ctrl+T: thinking görünürlüğünü aç/kapat (geçmişi yeniden yükler)

## Slash komutları

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

- `/auth [provider]`, TUI içinde provider kimlik doğrulama/login akışını açar.

Diğer Gateway slash komutları (örneğin `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Slash komutları](/tr/tools/slash-commands).

## Yerel shell komutları

- Yerel TUI host'unda yerel bir shell komutu çalıştırmak için satırı `!` ile başlatın.
- TUI, oturum başına bir kez yerel yürütmeye izin vermek için sorar; reddetmek, oturum için `!` kullanımını devre dışı bırakır.
- Komutlar TUI çalışma dizininde yeni, etkileşimsiz bir shell içinde çalışır (`cd`/env kalıcı değildir).
- Yerel shell komutları ortamlarında `OPENCLAW_SHELL=tui-local` alır.
- Tek başına `!` normal mesaj olarak gönderilir; baştaki boşluklar yerel exec'i tetiklemez.

## Yerel TUI'den yapılandırmaları onarın

Geçerli yapılandırma zaten doğrulanıyorsa ve
gömülü agent'ın aynı makinede bunu incelemesini, belgelerle karşılaştırmasını
ve çalışan bir Gateway'e bağlı olmadan kaymayı onarmaya yardımcı olmasını istiyorsanız yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure`
veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma
korumasını atlamaz.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Agent'a neyi kontrol etmesini istediğinizi sorun, örneğin:

```text
Gateway auth yapılandırmamı belgelerle karşılaştır ve en küçük düzeltmeyi öner.
```

3. Tam kanıt ve doğrulama için yerel shell komutlarını kullanın:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Dar değişiklikleri `openclaw config set` veya `openclaw configure` ile uygulayın, sonra `!openclaw config validate` komutunu yeniden çalıştırın.
5. Doctor otomatik bir migration veya onarım önerirse bunu gözden geçirin ve `!openclaw doctor --fix` çalıştırın.

İpuçları:

- `openclaw.json` dosyasını elle düzenlemek yerine `openclaw config set` veya `openclaw configure` tercih edin.
- `openclaw docs "<query>"`, aynı makineden canlı docs dizininde arama yapar.
- `openclaw config validate --json`, yapılandırılmış şema ve SecretRef/çözülebilirlik hatalarını istediğinizde faydalıdır.

## Araç çıktısı

- Araç çağrıları bağımsız değişkenler + sonuçlarla birlikte kartlar olarak gösterilir.
- Ctrl+O, daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta akış olarak gelir.

## Terminal renkleri

- TUI, hem koyu hem açık terminallerde okunabilir kalması için assistant gövde metnini terminalinizin varsayılan ön plan renginde tutar.
- Terminaliniz açık arka plan kullanıyorsa ve otomatik algılama yanlışsa, `openclaw tui` başlatmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlanırken TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akışlı yanıtlar tamamlanana kadar yerinde güncellenir.
- TUI ayrıca daha zengin araç kartları için agent araç olaylarını da dinler.

## Bağlantı ayrıntıları

- TUI, Gateway'e `mode: "tui"` olarak kaydolur.
- Yeniden bağlanmalarda bir sistem mesajı gösterilir; olay boşlukları günlüğe yansıtılır.

## Seçenekler

- `--local`: Yerel gömülü agent çalışma zamanına karşı çalıştır
- `--url <url>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırma veya `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token'ı (gerekliyse)
- `--password <password>`: Gateway parolası (gerekliyse)
- `--session <key>`: Oturum anahtarı (varsayılan: `main`, kapsam global ise `global`)
- `--deliver`: Assistant yanıtlarını provider'a teslim et (varsayılan kapalı)
- `--thinking <level>`: Gönderimler için thinking düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra ilk mesajı gönder
- `--timeout-ms <ms>`: Agent zaman aşımı, ms cinsinden (varsayılan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

Not: `--url` ayarladığınızda TUI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça geçin. Açık kimlik bilgileri eksikse hata oluşur.
Yerel modda `--url`, `--token` veya `--password` geçmeyin.

## Sorun giderme

Mesaj gönderdikten sonra çıktı yoksa:

- Gateway'in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI içinde `/status` çalıştırın.
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`.
- Agent'ın çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Bir sohbet kanalında mesaj bekliyorsanız teslimi etkinleştirin (`/deliver on` veya `--deliver`).

## Bağlantı sorun giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide agent yok: `openclaw agents list` ve yönlendirme yapılandırmanızı kontrol edin.
- Boş oturum seçici: global kapsamda olabilirsiniz veya henüz oturumunuz yoktur.

## İlgili

- [Control UI](/tr/web/control-ui) — web tabanlı denetim arayüzü
- [Config](/tr/cli/config) — `openclaw.json` dosyasını inceleyin, doğrulayın ve düzenleyin
- [Doctor](/tr/cli/doctor) — yönlendirmeli onarım ve migration kontrolleri
- [CLI Başvurusu](/tr/cli) — tam CLI komut başvurusu
