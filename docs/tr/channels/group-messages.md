---
read_when:
    - Grup mesajı kurallarını veya bahsetmeleri değiştirme
summary: WhatsApp grup mesajı işleme için davranış ve yapılandırma (`mentionPatterns` yüzeyler arasında paylaşılır)
title: Grup mesajları
x-i18n:
    generated_at: "2026-04-25T13:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Clawd'un WhatsApp gruplarında bulunmasını, yalnızca pinglendiğinde uyanmasını ve bu iş parçacığını kişisel DM oturumundan ayrı tutmasını sağlama.

Not: `agents.list[].groupChat.mentionPatterns` artık Telegram/Discord/Slack/iMessage tarafından da kullanılıyor; bu belge WhatsApp'a özgü davranışa odaklanır. Çok ajanlı kurulumlarda `agents.list[].groupChat.mentionPatterns` değerini her ajan için ayarlayın (veya genel yedek olarak `messages.groupChat.mentionPatterns` kullanın).

## Mevcut uygulama (2025-12-03)

- Etkinleştirme modları: `mention` (varsayılan) veya `always`. `mention`, bir ping gerektirir (gerçek WhatsApp @-bahsetmeleri için `mentionedJids`, güvenli regex kalıpları veya metnin herhangi bir yerindeki botun E.164 numarası). `always`, ajanı her mesajda uyandırır ancak yalnızca anlamlı bir katkı sunabiliyorsa yanıt vermelidir; aksi halde tam sessiz belirteci `NO_REPLY` / `no_reply` döndürür. Varsayılanlar yapılandırmada (`channels.whatsapp.groups`) ayarlanabilir ve grup bazında `/activation` ile geçersiz kılınabilir. `channels.whatsapp.groups` ayarlandığında, grup izin listesi olarak da işlev görür (tüm gruplara izin vermek için `"*"` ekleyin).
- Grup ilkesi: `channels.whatsapp.groupPolicy`, grup mesajlarının kabul edilip edilmeyeceğini kontrol eder (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` kullanır (yedek: açıkça belirtilmiş `channels.whatsapp.allowFrom`). Varsayılan `allowlist`tir (gönderenleri ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` biçimindedir; böylece `/verbose on`, `/trace on` veya `/think high` gibi komutlar (bağımsız mesajlar olarak gönderildiğinde) o grupla sınırlı olur; kişisel DM durumu etkilenmez. Heartbeat'ler grup iş parçacıkları için atlanır.
- Bağlam ekleme: çalıştırmayı tetiklememiş **yalnızca bekleyen** grup mesajları (varsayılan 50), `[Chat messages since your last reply - for context]` altında önek olarak eklenir; tetikleyen satır ise `[Current message - respond to this]` altında yer alır. Oturumda zaten bulunan mesajlar yeniden eklenmez.
- Gönderenin görünür kılınması: artık her grup toplu işlemi `[from: Gönderen Adı (+E164)]` ile biter; böylece Pi kimin konuştuğunu bilir.
- Geçici/view-once: metin/bahsetmeler çıkarılmadan önce bunları açarız; böylece içlerindeki pingler de yine tetikler.
- Grup sistem istemi: grup oturumunun ilk dönüşünde (ve `/activation` modu her değiştiğinde) sistem istemine şu gibi kısa bir açıklama ekleriz: `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Meta veriler yoksa bile ajana bunun bir grup sohbeti olduğunu yine de söyleriz.

## Yapılandırma örneği (WhatsApp)

WhatsApp, metin gövdesindeki görsel `@` işaretini kaldırsa bile görünen adla pinglerin çalışması için `~/.openclaw/openclaw.json` dosyasına bir `groupChat` bloğu ekleyin:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Notlar:

- Regex'ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli-regex koruma önlemlerini kullanır; geçersiz kalıplar ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Birisi kişiye dokunduğunda WhatsApp yine `mentionedJids` aracılığıyla kanonik bahsetmeleri gönderir; bu nedenle sayı yedeğine nadiren ihtiyaç duyulur ancak yararlı bir güvenlik ağıdır.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numara (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir. Geçerli etkinleştirme modunu görmek için gruba bağımsız bir mesaj olarak `/status` gönderin.

## Nasıl kullanılır

1. WhatsApp hesabınızı (OpenClaw'ı çalıştıran hesap) gruba ekleyin.
2. `@openclaw …` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece yalnızca izin verilen gönderenler bunu tetikleyebilir.
3. Ajan istemi, son grup bağlamını ve sondaki `[from: …]` işaretleyicisini içerecektir; böylece doğru kişiye hitap edebilir.
4. Oturum düzeyi yönergeler (`/verbose on`, `/trace on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydedilmeleri için bunları bağımsız mesajlar olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Manuel smoke testi:
  - Grupta bir `@openclaw` pingi gönderin ve gönderen adına referans veren bir yanıtı doğrulayın.
  - İkinci bir ping gönderin ve geçmiş bloğunun eklendiğini, ardından sonraki dönüşte temizlendiğini doğrulayın.
- `from: <groupJid>` ve `[from: …]` son ekini gösteren `inbound web message` girdilerini görmek için Gateway günlüklerini (`--verbose` ile çalıştırın) kontrol edin.

## Bilinen hususlar

- Gürültülü yayınları önlemek için Heartbeat'ler gruplarda kasıtlı olarak atlanır.
- Yankı bastırma, birleştirilmiş toplu iş dizesini kullanır; bahsetme olmadan aynı metni iki kez gönderirseniz yalnızca ilki yanıt alır.
- Oturum deposu girdileri, oturum deposunda (`varsayılan olarak ~/.openclaw/agents/<agentId>/sessions/sessions.json`) `agent:<agentId>:whatsapp:group:<jid>` olarak görünür; eksik bir giriş yalnızca grubun henüz bir çalıştırmayı tetiklemediği anlamına gelir.
- Gruplardaki yazıyor göstergeleri `agents.defaults.typingMode` ayarını izler (varsayılan: bahsetme olmadığında `message`).

## İlgili

- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Yayın grupları](/tr/channels/broadcast-groups)
