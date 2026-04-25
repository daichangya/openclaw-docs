---
read_when:
    - OpenClaw için Zalo Personal'ı ayarlama
    - Zalo Personal girişini veya mesaj akışını hata ayıklama
summary: Yerel zca-js (QR ile giriş) üzerinden Zalo kişisel hesap desteği, yetenekler ve yapılandırma
title: Zalo personal
x-i18n:
    generated_at: "2026-04-25T13:42:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Durum: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla bir **kişisel Zalo hesabını** otomatikleştirir.

> **Uyarı:** Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına/banlanmasına yol açabilir. Riski size aittir.

## Paketlenmiş plugin

Zalo Personal, mevcut OpenClaw sürümlerinde paketlenmiş bir plugin olarak sunulur; bu nedenle normal paketli derlemelerde ayrı bir kurulum gerekmez.

Eski bir derlemeyi veya Zalo Personal'ı içermeyen özel bir kurulumu kullanıyorsanız, bunu elle kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalouser`
- Veya kaynak checkout üzerinden: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Hızlı kurulum (başlangıç)

1. Zalo Personal plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketli OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Giriş yapın (QR ile, Gateway makinesinde):
   - `openclaw channels login --channel zalouser`
   - QR kodunu Zalo mobil uygulamasıyla tarayın.
3. Kanalı etkinleştirin:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).
5. DM erişimi varsayılan olarak eşleştirme kullanır; ilk temas sırasında eşleştirme kodunu onaylayın.

## Nedir

- Tamamen `zca-js` aracılığıyla süreç içinde çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları JS API üzerinden doğrudan gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin mevcut olmadığı “kişisel hesap” kullanım senaryoları için tasarlanmıştır.

## Adlandırma

Kanal kimliği `zalouser` olarak belirlenmiştir; bunun **kişisel bir Zalo kullanıcı hesabını** (resmi olmayan şekilde) otomatikleştirdiğini açıkça belirtir. `zalo` adını gelecekte olası resmi bir Zalo API entegrasyonu için ayırıyoruz.

## Kimlikleri bulma (directory)

Eşleri/grupları ve kimliklerini keşfetmek için directory CLI'ı kullanın:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Sınırlar

- Giden metin yaklaşık 2000 karaktere bölünür (Zalo istemci sınırları).
- Akış varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

`channels.zalouser.dmPolicy` şunları destekler: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom`, kullanıcı kimliklerini veya adlarını kabul eder. Kurulum sırasında adlar, plugin'in süreç içi kişi araması kullanılarak kimliklere çözümlenir.

Onaylamak için:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Bir izin listesiyle kısıtlamak için:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; mümkün olduğunda adlar başlangıçta kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplarda botu hangi göndericilerin tetikleyebileceğini denetler)
- Tüm grupları engelleyin: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listelerini sorabilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi günlüğe yazar.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimlik üzerinden yapılır. Çözümlenmemiş adlar, `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmedikçe kimlik doğrulama için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değişebilir grup adı eşleştirmesini yeniden etkinleştiren acil durum uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa çalışma zamanı, grup gönderici denetimleri için `allowFrom` değerine geri döner.
- Gönderici denetimleri hem normal grup mesajlarına hem de kontrol komutlarına uygulanır (örneğin `/new`, `/reset`).

Örnek:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Grup mention geçitlemesi

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının mention gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup kimliği/adı -> normalize grup slug'ı -> `*` -> varsayılan (`true`).
- Bu, hem izin listesine alınmış gruplara hem de açık grup moduna uygulanır.
- Bir bot mesajını alıntılamak, grup etkinleştirmesi için örtük bir mention sayılır.
- Yetkili kontrol komutları (örneğin `/new`) mention geçitlemesini atlayabilir.
- Bir grup mesajı mention gerektiği için atlandığında, OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
- Grup geçmişi sınırı varsayılan olarak `messages.groupChat.historyLimit` değerini kullanır (yedek: `50`). Bunu hesap başına `channels.zalouser.historyLimit` ile geçersiz kılabilirsiniz.

Örnek:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Çoklu hesap

Hesaplar, OpenClaw durumundaki `zalouser` profillerine eşlenir. Örnek:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Yazma durumu, tepkiler ve teslim alındı onayları

- OpenClaw, bir yanıtı göndermeden önce bir yazma olayı gönderir (best-effort).
- Kanal işlemlerinde `zalouser` için `react` mesaj tepki işlemi desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Reactions](/tr/tools/reactions)
- Olay meta verisi içeren gelen mesajlarda, OpenClaw delivered + seen onayları gönderir (best-effort).

## Sorun giderme

**Giriş kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden giriş yapın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom`/`groups` içinde sayısal kimlikler veya tam arkadaş/grup adları kullanın.

**Eski CLI tabanlı kurulumdan yükselttiniz:**

- Eski harici `zca` süreç varsayımlarını kaldırın.
- Kanal artık harici CLI ikili dosyaları olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Kanal Genel Bakışı](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
