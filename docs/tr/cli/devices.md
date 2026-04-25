---
read_when:
    - Cihaz eşleştirme isteklerini onaylıyorsunuz
    - Cihaz belirteçlerini döndürmeniz veya iptal etmeniz gerekiyor
summary: '`openclaw devices` için CLI başvurusu (cihaz eşleştirme + belirteç döndürme/iptal etme)'
title: Cihazlar
x-i18n:
    generated_at: "2026-04-25T13:43:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Cihaz eşleştirme isteklerini ve cihaz kapsamlı belirteçleri yönetin.

## Komutlar

### `openclaw devices list`

Bekleyen eşleştirme isteklerini ve eşleştirilmiş cihazları listeleyin.

```
openclaw devices list
openclaw devices list --json
```

Bekleyen istek çıktısı, cihaz zaten eşleştirilmişse cihazın mevcut
onaylı erişiminin yanında istenen erişimi gösterir. Bu, kapsam/rol
yükseltmelerini eşleştirmenin kaybolmuş gibi görünmesi yerine açık hale getirir.

### `openclaw devices remove <deviceId>`

Tek bir eşleştirilmiş cihaz girdisini kaldırın.

Eşleştirilmiş bir cihaz belirteciyle kimlik doğrulaması yaptıysanız, admin olmayan çağıranlar
yalnızca **kendi** cihaz girdilerini kaldırabilir. Başka bir cihazı kaldırmak
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
atlanırsa veya `--latest` geçirilirse, OpenClaw yalnızca seçilen bekleyen
isteği yazdırır ve çıkar; ayrıntıları doğruladıktan sonra tam istek kimliğiyle
onayı yeniden çalıştırın.

Not: Bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/public
key) yeniden eşleştirme denerse, OpenClaw önceki bekleyen girdinin yerine geçer ve yeni bir
`requestId` verir. Geçerli kimliği kullanmak için onaydan hemen önce `openclaw devices list` çalıştırın.

Cihaz zaten eşleştirilmişse ve daha geniş kapsamlar veya daha geniş bir rol
istiyorsa, OpenClaw mevcut onayı yerinde tutar ve yeni bir bekleyen yükseltme
isteği oluşturur. `openclaw devices list` içindeki `Requested` ve `Approved` sütunlarını inceleyin
veya onaylamadan önce tam yükseltmeyi önizlemek için `openclaw devices approve --latest` kullanın.

Gateway açıkça
`gateway.nodes.pairing.autoApproveCidrs` ile yapılandırılmışsa, eşleşen istemci IP'lerinden gelen ilk kez yapılan `role: node`
istekleri bu listede görünmeden önce onaylanabilir. Bu ilke
varsayılan olarak devre dışıdır ve operator/browser istemcilerine veya yükseltme isteklerine asla uygulanmaz.

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

Belirli bir rol için bir cihaz belirtecini döndürün (isteğe bağlı olarak kapsamları güncelleyerek).
Hedef rol, bu cihazın onaylı eşleştirme sözleşmesinde zaten mevcut olmalıdır;
döndürme yeni ve onaylanmamış bir rol oluşturamaz.
`--scope` atlanırsa, daha sonra depolanan döndürülmüş belirteçle yapılan yeniden bağlantılar
bu belirtecin önbelleğe alınmış onaylı kapsamlarını yeniden kullanır. Açık `--scope`
değerleri geçirirseniz, bunlar gelecekteki önbelleğe alınmış belirteç yeniden bağlantıları için
depolanan kapsam kümesi olur.
Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz belirteçlerini döndürebilir.
Ayrıca, açık `--scope` değerleri çağıran oturumunun kendi
operator kapsamları içinde kalmalıdır; döndürme, çağıranın zaten sahip olduğundan daha geniş bir operator belirteci oluşturamaz.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Yeni belirteç yükünü JSON olarak döndürür.

### `openclaw devices revoke --device <id> --role <role>`

Belirli bir rol için bir cihaz belirtecini iptal edin.

Admin olmayan eşleştirilmiş cihaz çağıranları yalnızca **kendi** cihaz belirteçlerini iptal edebilir.
Başka bir cihazın belirtecini iptal etmek için `operator.admin` gerekir.

```
openclaw devices revoke --device <deviceId> --role node
```

İptal sonucunu JSON olarak döndürür.

## Ortak seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırılmışsa varsayılan olarak `gateway.remote.url` kullanılır).
- `--token <token>`: Gateway belirteci (gerekiyorsa).
- `--password <password>`: Gateway parolası (parola kimlik doğrulaması).
- `--timeout <ms>`: RPC zaman aşımı.
- `--json`: JSON çıktısı (betikler için önerilir).

Not: `--url` ayarladığınızda, CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgileri eksikse hata oluşur.

## Notlar

- Belirteç döndürme yeni bir belirteç döndürür (hassas). Bunu bir gizli anahtar gibi ele alın.
- Bu komutlar `operator.pairing` (veya `operator.admin`) kapsamı gerektirir.
- `gateway.nodes.pairing.autoApproveCidrs`, yalnızca yeni node cihaz eşleştirmesi için isteğe bağlı bir Gateway ilkesidir; CLI onay yetkisini değiştirmez.
- Belirteç döndürme, bu cihaz için onaylanan eşleştirme rol kümesi ve onaylı kapsam temeli içinde kalır. Başıboş bir önbelleğe alınmış belirteç girdisi yeni bir döndürme hedefi vermez.
- Eşleştirilmiş cihaz belirteç oturumları için, cihazlar arası yönetim yalnızca admin'e açıktır:
  `remove`, `rotate` ve `revoke`, çağıran `operator.admin` yetkisine sahip değilse
  yalnızca kendine uygulanabilir.
- `devices clear` kasıtlı olarak `--yes` ile korunur.
- Eşleştirme kapsamı local loopback üzerinde kullanılamıyorsa (ve açık `--url` geçirilmemişse), list/approve yerel bir eşleştirme geri dönüşünü kullanabilir.
- `devices approve`, belirteç oluşturmadan önce açık bir istek kimliği gerektirir; `requestId` atlamak veya `--latest` geçirmek yalnızca en yeni bekleyen isteği önizler.

## Belirteç sapması kurtarma denetim listesi

Control UI veya diğer istemciler `AUTH_TOKEN_MISMATCH` ya da `AUTH_DEVICE_TOKEN_MISMATCH` ile başarısız olmaya devam ettiğinde bunu kullanın.

1. Geçerli gateway belirteç kaynağını doğrulayın:

```bash
openclaw config get gateway.auth.token
```

2. Eşleştirilmiş cihazları listeleyin ve etkilenen cihaz kimliğini belirleyin:

```bash
openclaw devices list
```

3. Etkilenen cihaz için operator belirtecini döndürün:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Döndürme yeterli değilse, bayat eşleştirmeyi kaldırın ve yeniden onaylayın:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Geçerli paylaşılan belirteç/parola ile istemci bağlantısını yeniden deneyin.

Notlar:

- Normal yeniden bağlantı kimlik doğrulama önceliği önce açık paylaşılan belirteç/parola, sonra açık `deviceToken`, ardından depolanan cihaz belirteci, ardından bootstrap belirtecidir.
- Güvenilir `AUTH_TOKEN_MISMATCH` kurtarması, tek bir sınırlı yeniden deneme için paylaşılan belirteci ve depolanan cihaz belirtecini birlikte geçici olarak gönderebilir.

İlgili:

- [Dashboard auth troubleshooting](/tr/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/tr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## İlgili

- [CLI reference](/tr/cli)
- [Nodes](/tr/nodes)
