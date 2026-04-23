---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz token'larını döndürmeniz veya iptal etmeniz gerekiyor
summary: '`openclaw devices` için CLI başvurusu (cihaz eşleştirme + token döndürme/iptal etme)'
title: cihazlar
x-i18n:
    generated_at: "2026-04-23T09:00:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Cihaz eşleştirme isteklerini ve cihaza özgü token'ları yönetin.

## Komutlar

### `openclaw devices list`

Bekleyen eşleştirme isteklerini ve eşleştirilmiş cihazları listeleyin.

```
openclaw devices list
openclaw devices list --json
```

Bekleyen istek çıktısı, cihaz zaten eşleştirilmişse istenen erişimi cihazın geçerli
onaylanmış erişiminin yanında gösterir. Bu, kapsam/rol
yükseltmelerini eşleştirmenin kaybolmuş gibi görünmesi yerine açık hâle getirir.

### `openclaw devices remove <deviceId>`

Bir eşleştirilmiş cihaz girişini kaldırın.

Eşleştirilmiş bir cihaz token'ı ile kimlik doğrulaması yaptığınızda admin olmayan çağıranlar
yalnızca **kendi** cihaz girişlerini kaldırabilir. Başka bir cihazı kaldırmak
için `operator.admin` gerekir.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Eşleştirilmiş cihazları toplu olarak temizleyin.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Bekleyen bir cihaz eşleştirme isteğini tam `requestId` ile onaylayın. `requestId`
atlanırsa veya `--latest` verilirse OpenClaw yalnızca seçilen bekleyen
isteği yazdırır ve çıkar; ayrıntıları doğruladıktan sonra tam istek kimliğiyle
onayı yeniden çalıştırın.

Not: bir cihaz değiştirilmiş auth ayrıntılarıyla (rol/kapsamlar/public
anahtar) eşleştirmeyi yeniden denerse OpenClaw önceki bekleyen girdinin yerine geçer ve yeni bir
`requestId` oluşturur. Geçerli kimliği kullanmak için onaylamadan hemen önce `openclaw devices list` çalıştırın.

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol istiyorsa,
OpenClaw mevcut onayı yerinde tutar ve yeni bir bekleyen yükseltme
isteği oluşturur. `openclaw devices list` içindeki `Requested` ile `Approved` sütunlarını inceleyin
veya onaylamadan önce tam yükseltmeyi önizlemek için `openclaw devices approve --latest` kullanın.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Bekleyen bir cihaz eşleştirme isteğini reddedin.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Belirli bir rol için bir cihaz token'ını döndürün (isteğe bağlı olarak kapsamları güncelleyerek).
Hedef rol, o cihazın onaylanmış eşleştirme sözleşmesinde zaten bulunmalıdır;
döndürme yeni, onaylanmamış bir rol oluşturamaz.
`--scope` atlanırsa saklanan döndürülmüş token ile sonraki yeniden bağlantılar
o token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık `--scope` değerleri verirseniz bunlar
gelecekteki önbelleğe alınmış token yeniden bağlantıları için saklanan kapsam kümesi olur.
Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını döndürebilir.
Ayrıca, açık `--scope` değerleri çağıran oturumun kendi
operator kapsamları içinde kalmalıdır; döndürme çağıranın zaten sahip olduğundan daha geniş bir operator token'ı oluşturamaz.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Yeni token payload'unu JSON olarak döndürür.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için bir cihaz token'ını iptal edin.

Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz token'larını iptal edebilir.
Başka bir cihazın token'ını iptal etmek için `operator.admin` gerekir.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Yaygın seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırıldıysa varsayılan olarak `gateway.remote.url` kullanılır).
- `--token <token>`: Gateway token'ı (gerekiyorsa).
- `--password <password>`: Gateway parolası (parola auth).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betikler için önerilir).

Not: `--url` ayarladığınızda CLI, config veya ortam kimlik bilgilerine fallback yapmaz.
`--token` veya `--password` değerini açıkça verin. Açık kimlik bilgileri eksikse hata oluşur.

## Notlar

- Token döndürme yeni bir token döndürür (hassas). Bunu gizli olarak değerlendirin.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir.
- Token döndürme, o cihaz için onaylanmış eşleştirme rol kümesi ve onaylı kapsam
  tabanı içinde kalır. Yanlışlıkla kalmış bir önbelleğe alınmış token girdisi yeni bir
  döndürme hedefi vermez.
- Eşleştirilmiş cihaz token oturumları için cihazlar arası yönetim yalnızca admin'e özeldir:
  `remove`, `rotate` ve `revoke`, çağıran
  `operator.admin` yetkisine sahip olmadıkça yalnızca kendisi içindir.
- `devices clear` kasıtlı olarak `--yes` ile korunur.
- Yerel local loopback üzerinde eşleştirme kapsamı kullanılamıyorsa (ve açık `--url` verilmemişse), list/approve yerel bir eşleştirme fallback'i kullanabilir.
- `devices approve`, token oluşturmadan önce açık bir istek kimliği gerektirir; `requestId` atlamak veya `--latest` vermek yalnızca en yeni bekleyen isteği önizler.

## Token kayması kurtarma denetim listesi

Control UI veya başka istemciler `AUTH_TOKEN_MISMATCH` ya da `AUTH_DEVICE_TOKEN_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

1. Geçerli gateway token kaynağını doğrulayın:

```bash
openclaw config get gateway.auth.token
```

2. Eşleştirilmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

```bash
openclaw devices list
```

3. Etkilenen cihaz için operator token'ını döndürün:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Döndürme yeterli değilse eski eşleştirmeyi kaldırın ve yeniden onaylayın:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Geçerli paylaşılan token/parola ile istemci bağlantısını yeniden deneyin.

Notlar:

- Normal yeniden bağlantı auth önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'dır.
- Güvenilen `AUTH_TOKEN_MISMATCH` kurtarması, tek sınırlandırılmış yeniden deneme için paylaşılan token ile saklanan cihaz token'ını birlikte geçici olarak gönderebilir.

İlgili:

- [Dashboard auth troubleshooting](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)
