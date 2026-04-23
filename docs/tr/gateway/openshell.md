---
read_when:
    - Yerel Docker yerine bulut tarafından yönetilen sandbox'lar istiyorsunuz
    - OpenShell Plugin'ini kuruyorsunuz
    - Mirror ve remote çalışma alanı kipleri arasında seçim yapmanız gerekiyor
summary: OpenClaw ajanları için yönetilen sandbox arka ucu olarak OpenShell kullanın
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T09:02:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell, OpenClaw için yönetilen bir sandbox arka ucudur. Docker container'larını
yerel olarak çalıştırmak yerine OpenClaw, sandbox yaşam döngüsünü
SSH tabanlı komut yürütmeyle uzak ortamlar sağlayan `openshell` CLI'ye devreder.

OpenShell Plugin'i, genel [SSH arka ucu](/tr/gateway/sandboxing#ssh-backend) ile aynı çekirdek SSH taşımasını ve uzak dosya sistemi
köprüsünü yeniden kullanır. Buna OpenShell'e özgü yaşam döngüsü (`sandbox create/get/delete`, `sandbox ssh-config`)
ve isteğe bağlı `mirror` çalışma alanı kipini ekler.

## Önkoşullar

- `openshell` CLI kurulu ve `PATH` üzerinde olmalı (veya
  `plugins.entries.openshell.config.command` ile özel bir yol ayarlayın)
- Sandbox erişimi olan bir OpenShell hesabı
- Sunucuda çalışan OpenClaw Gateway

## Hızlı başlangıç

1. Plugin'i etkinleştirin ve sandbox arka ucunu ayarlayın:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Gateway'i yeniden başlatın. Sonraki ajan dönüşünde OpenClaw bir OpenShell
   sandbox'ı oluşturur ve araç yürütmeyi bunun üzerinden yönlendirir.

3. Doğrulayın:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Çalışma alanı kipleri

Bu, OpenShell kullanırken verilmesi gereken en önemli karardır.

### `mirror`

**Yerel çalışma alanının
kanonik kalmasını** istediğinizde `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw, yerel çalışma alanını OpenShell sandbox'ına eşzamanlar.
- `exec` sonrasında OpenClaw, uzak çalışma alanını tekrar yerel çalışma alanına eşzamanlar.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı
  dönüşler arasında doğruluk kaynağı olarak kalır.

Şunlar için en uygunudur:

- Dosyaları OpenClaw dışında yerel olarak düzenliyorsunuz ve bu değişikliklerin
  sandbox içinde otomatik görünmesini istiyorsunuz.
- OpenShell sandbox'ının Docker arka ucu gibi olabildiğince benzer davranmasını istiyorsunuz.
- Sunucu çalışma alanının her `exec` dönüşünden sonra sandbox yazılarını yansıtmasını istiyorsunuz.

Ödünleşim: her `exec` öncesi ve sonrası ek eşzamanlama maliyeti.

### `remote`

**OpenShell çalışma alanının kanonik hâle gelmesini**
istediğinizde `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk kez oluşturulduğunda OpenClaw, uzak çalışma alanını
  yerel çalışma alanından bir kez tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch`
  doğrudan uzak OpenShell çalışma alanına karşı çalışır.
- OpenClaw, uzak değişiklikleri tekrar yerel çalışma alanına eşzamanlamaz.
- İstem zamanındaki medya okumaları yine çalışır; çünkü dosya ve medya araçları sandbox köprüsü üzerinden okur.

Şunlar için en uygunudur:

- Sandbox öncelikli olarak uzak tarafta yaşamalıysa.
- Dönüş başına daha düşük eşzamanlama yükü istiyorsanız.
- Sunucuda yerel düzenlemelerin sessizce uzak sandbox durumunun üstüne yazmasını istemiyorsanız.

Önemli: ilk tohumlamadan sonra OpenClaw dışında sunucuda dosya düzenlerseniz,
uzak sandbox bu değişiklikleri **görmez**. Yeniden tohumlamak için
`openclaw sandbox recreate` kullanın.

### Kip seçimi

|                          | `mirror`                    | `remote`                   |
| ------------------------ | --------------------------- | -------------------------- |
| **Kanonik çalışma alanı** | Yerel sunucu               | Uzak OpenShell             |
| **Eşzamanlama yönü**     | Çift yönlü (her `exec`)     | Tek seferlik tohumlama     |
| **Dönüş başına yük**     | Daha yüksek (yükle + indir) | Daha düşük (doğrudan uzak işlemler) |
| **Yerel düzenlemeler görünür mü?** | Evet, sonraki `exec` ile | Hayır, yeniden oluşturmaya kadar |
| **En uygun kullanım**    | Geliştirme iş akışları      | Uzun çalışan ajanlar, CI   |

## Yapılandırma başvurusu

Tüm OpenShell yapılandırması `plugins.entries.openshell.config` altında yaşar:

| Anahtar                  | Tür                      | Varsayılan    | Açıklama                                              |
| ------------------------ | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                   | `"mirror"` veya `"remote"` | `"mirror"`  | Çalışma alanı eşzamanlama kipi                        |
| `command`                | `string`                 | `"openshell"` | `openshell` CLI'nin yolu veya adı                    |
| `from`                   | `string`                 | `"openclaw"`  | İlk oluşturma için sandbox kaynağı                    |
| `gateway`                | `string`                 | —             | OpenShell Gateway adı (`--gateway`)                  |
| `gatewayEndpoint`        | `string`                 | —             | OpenShell Gateway uç nokta URL'si (`--gateway-endpoint`) |
| `policy`                 | `string`                 | —             | Sandbox oluşturma için OpenShell ilke ID'si           |
| `providers`              | `string[]`               | `[]`          | Sandbox oluşturulurken bağlanacak sağlayıcı adları    |
| `gpu`                    | `boolean`                | `false`       | GPU kaynakları iste                                   |
| `autoProviders`          | `boolean`                | `true`        | Sandbox oluşturma sırasında `--auto-providers` geçir  |
| `remoteWorkspaceDir`     | `string`                 | `"/sandbox"`  | Sandbox içindeki birincil yazılabilir çalışma alanı   |
| `remoteAgentWorkspaceDir`| `string`                 | `"/agent"`    | Ajan çalışma alanı bağlama yolu (salt okunur erişim için) |
| `timeoutSeconds`         | `number`                 | `120`         | `openshell` CLI işlemleri için zaman aşımı            |

Sandbox düzeyi ayarlar (`mode`, `scope`, `workspaceAccess`) diğer tüm arka uçlarda olduğu gibi
`agents.defaults.sandbox` altında yapılandırılır. Tam matris için bkz.
[Sandboxing](/tr/gateway/sandboxing).

## Örnekler

### Minimal uzak kurulum

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### GPU ile mirror kipi

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### Özel Gateway ile ajan başına OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Yaşam döngüsü yönetimi

OpenShell sandbox'ları normal sandbox CLI üzerinden yönetilir:

```bash
# Tüm sandbox çalışma zamanlarını listele (Docker + OpenShell)
openclaw sandbox list

# Etkin ilkeyi incele
openclaw sandbox explain

# Yeniden oluştur (uzak çalışma alanını siler, sonraki kullanımda yeniden tohumlar)
openclaw sandbox recreate --all
```

`remote` kipi için **recreate özellikle önemlidir**: bu, o kapsam için kanonik
uzak çalışma alanını siler. Sonraki kullanım, yerel çalışma alanından
yeni bir uzak çalışma alanı tohumlar.

`mirror` kipi için recreate, esas olarak uzak yürütme ortamını sıfırlar; çünkü
yerel çalışma alanı kanonik kalır.

### Ne zaman recreate yapılmalı

Şunlardan herhangi birini değiştirdikten sonra recreate yapın:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Güvenlik sertleştirmesi

OpenShell, çalışma alanı kök fd'sini sabitler ve her
okumadan önce sandbox kimliğini yeniden denetler; böylece symlink değişimleri veya yeniden bağlanmış çalışma alanı,
okumaları amaçlanan uzak çalışma alanı dışına yönlendiremez.

## Mevcut sınırlamalar

- Sandbox tarayıcı, OpenShell arka ucunda desteklenmez.
- `sandbox.docker.binds`, OpenShell için geçerli değildir.
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları yalnızca Docker
  arka ucuna uygulanır.

## Nasıl çalışır

1. OpenClaw, `openshell sandbox create` çağırır (yapılandırıldığı şekilde `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` bayraklarıyla).
2. OpenClaw, sandbox için SSH bağlantı
   ayrıntılarını almak üzere `openshell sandbox ssh-config <name>` çağırır.
3. Çekirdek, SSH yapılandırmasını geçici bir dosyaya yazar ve genel SSH arka ucuyla aynı uzak dosya sistemi köprüsünü kullanarak
   bir SSH oturumu açar.
4. `mirror` kipinde: `exec` öncesi yerelden uzağa eşzamanla, çalıştır, `exec` sonrası geri eşzamanla.
5. `remote` kipinde: oluştururken bir kez tohumla, ardından doğrudan uzak
   çalışma alanında çalış.

## Ayrıca bkz.

- [Sandboxing](/tr/gateway/sandboxing) -- kipler, kapsamlar ve arka uç karşılaştırması
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- engellenen araçları ayıklama
- [Çoklu Ajan Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar
- [Sandbox CLI](/tr/cli/sandbox) -- `openclaw sandbox` komutları
