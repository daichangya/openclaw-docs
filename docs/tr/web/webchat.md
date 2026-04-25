---
read_when:
    - WebChat erişimini hata ayıklama veya yapılandırma
summary: Sohbet UI'si için local loopback WebChat statik barındırıcısı ve Gateway WS kullanımı
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Durum: macOS/iOS SwiftUI sohbet UI'si doğrudan Gateway WebSocket'ine bağlanır.

## Nedir

- Gateway için yerel bir sohbet UI'si (gömülü tarayıcı ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Belirleyici yönlendirme: yanıtlar her zaman WebChat'e geri gider.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat UI'sini (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (varsayılan olarak paylaşılan gizli anahtar,
   local loopback üzerinde bile).

## Nasıl çalışır (davranış)

- UI, Gateway WebSocket'ine bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history`, kararlılık için sınırlandırılmıştır: Gateway uzun metin alanlarını kesebilir, ağır meta verileri atlayabilir ve büyük boyutlu girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history` ayrıca görüntüleme için normalize edilir: yalnızca çalışma zamanına ait OpenClaw bağlamı,
  gelen zarf sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]`
  gibi satır içi teslim yönergesi etiketleri, düz metin araç çağrısı XML
  yükleri (bunlara `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahildir) ve
  sızmış ASCII/tam genişlik model denetim belirteçleri görünür metinden çıkarılır,
  ayrıca görünür metninin tamamı yalnızca tam sessiz
  belirteç `NO_REPLY` / `no_reply` olan assistant girdileri atlanır.
- `chat.inject`, doğrudan transkripte bir assistant notu ekler ve bunu UI'ye yayınlar (ajan çalıştırması yok).
- İptal edilen çalıştırmalar, UI'de kısmi assistant çıktısını görünür bırakabilir.
- Gateway, arabelleğe alınmış çıktı mevcut olduğunda iptal edilmiş kısmi assistant metnini transkript geçmişine kalıcı olarak yazar ve bu girdileri iptal meta verileriyle işaretler.
- Geçmiş her zaman gateway'den alınır (yerel dosya izleme yoktur).
- Gateway'e ulaşılamıyorsa WebChat salt okunurdur.

## Control UI ajan araçları paneli

- Control UI `/agents` Araçlar panelinin iki ayrı görünümü vardır:
  - **Şu Anda Kullanılabilir**, `tools.effective(sessionKey=...)` kullanır ve geçerli
    oturumun çalışma zamanında gerçekten neleri kullanabildiğini gösterir; buna çekirdek, Plugin ve kanal sahipli araçlar dahildir.
  - **Araç Yapılandırması**, `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    katalog anlambilimine odaklı kalır.
- Çalışma zamanı kullanılabilirliği oturum kapsamlıdır. Aynı ajan üzerindeki oturumları değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliğini ima etmez; etkili erişim yine de ilke
  önceliğini (`allow`/`deny`, ajan başına ve sağlayıcı/kanal geçersiz kılmaları) izler.

## Uzak kullanım

- Uzak mod, gateway WebSocket'ini SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için en yüksek karakter sayısı. Bir transkript girdisi bu sınırı aştığında Gateway uzun metin alanlarını keser ve büyük boyutlu iletileri bir yer tutucuyla değiştirebilir. Varsayılanı tek bir `chat.history` çağrısı için geçersiz kılmak üzere istemci tarafından istek başına `maxChars` da gönderilebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtar WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcı Control UI sohbet sekmesi etkinleştirildiğinde Tailscale
  Serve kimlik üst bilgilerini kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığı olan **loopback olmayan** proxy kaynağının arkasındaki tarayıcı istemcileri için reverse-proxy kimlik doğrulaması (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Gösterge paneli](/tr/web/dashboard)
