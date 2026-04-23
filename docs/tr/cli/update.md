---
read_when:
    - Bir kaynak çalışma kopyasını güvenli biçimde güncellemek istiyorsunuz
    - '`--update` kısayol davranışını anlamanız gerekiyor'
summary: '`openclaw update` için CLI başvurusu (nispeten güvenli kaynak güncellemesi + otomatik Gateway yeniden başlatma)'
title: güncelleme
x-i18n:
    generated_at: "2026-04-23T09:01:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw'ı güvenli biçimde güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

Kurulumu **npm/pnpm/bun** üzerinden yaptıysanız (**genel kurulum**, git meta verisi yok),
güncellemeler [Güncelleme](/tr/install/updating) içindeki paket yöneticisi akışıyla yapılır.

## Kullanım

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Seçenekler

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; yapılandırmada kalıcı olarak saklanır).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` değerine eşlenir.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, Plugin'leri eşitlemeden veya yeniden başlatmadan önce planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizle.
- `--json`: makine tarafından okunabilir `UpdateRunResult` JSON'u yazdırır; buna,
  güncelleme sonrası Plugin eşitlemesi sırasında npm Plugin yapıt kayması
  algılandığında `postUpdate.plugins.integrityDrifts` da dahildir.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1200 sn).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı)

Not: sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA'sını (kaynak çalışma kopyaları için), ayrıca güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON'u yazdırır.
- `--timeout <seconds>`: denetimler için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış
(varsayılan olarak yeniden başlatılır). Git çalışma kopyası olmadan `dev` seçerseniz,
bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1200`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw ayrıca
kurulum yöntemini de uyumlu tutar:

- `dev` → bir git çalışma kopyasının var olmasını sağlar (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  bunu günceller ve genel CLI'ı bu çalışma kopyasından kurar.
- `stable` → npm'den `latest` kullanarak kurar.
- `beta` → npm dist-tag `beta` etiketini tercih eder, ancak beta yoksa
  veya mevcut stable sürümden daha eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma üzerinden etkinleştirildiğinde) aynı güncelleme yolunu yeniden kullanır.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan önce
hedef paket sürümünü çözümler. Kurulu sürüm hedefle tam olarak eşleşiyorsa
ve kalıcı hâle getirilmesi gereken bir güncelleme kanalı değişikliği yoksa,
komut paket kurulumu, Plugin eşitlemesi, tamamlanma yenilemesi
veya Gateway yeniden başlatma işleri yapılmadan atlanmış olarak çıkar.

## Git çalışma kopyası akışı

Kanallar:

- `stable`: en son beta olmayan etiketi teslim alır, ardından build + doctor çalıştırır.
- `beta`: en son `-beta` etiketini tercih eder, ancak beta yoksa veya daha eskiyse
  en son stable etikete geri döner.
- `dev`: `main` dalını teslim alır, ardından fetch + rebase yapar.

Yüksek seviye:

1. Temiz bir çalışma ağacı gerektirir (commit edilmemiş değişiklik yok).
2. Seçilen kanala (etiket veya dal) geçer.
3. Upstream'i getirir (`dev` için yalnızca).
4. Yalnızca dev: geçici bir çalışma ağacında ön kontrol lint + TypeScript build çalıştırır; uç nokta başarısız olursa, en yeni temiz build'i bulmak için en fazla 10 commit geri gider.
5. Seçilen commit üzerine rebase yapar (yalnızca `dev`).
6. Bağımlılıkları depo paket yöneticisiyle kurar. pnpm çalışma kopyalarında güncelleyici, pnpm çalışma alanı içinde `npm run build` çalıştırmak yerine isteğe bağlı olarak `pnpm` önyüklemesi yapar (`corepack` önce, ardından geçici `npm install pnpm@10` geri dönüşü).
7. Build alır + Control UI build alır.
8. Son “güvenli güncelleme” denetimi olarak `openclaw doctor` çalıştırır.
9. Plugin'leri etkin kanalla eşitler (`dev` paketlenmiş Plugin'leri kullanır; `stable`/`beta` npm kullanır) ve npm ile kurulmuş Plugin'leri günceller.

Tam olarak sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü depolanmış kurulum kaydından
farklı olan bir yapıta çözülürse, `openclaw update` bu Plugin yapıtı
güncellemesini kurmak yerine iptal eder. Yeni yapıta güvendiğinizi doğruladıktan sonra
yalnızca açıkça yeniden kurun veya güncelleyin.

pnpm önyüklemesi yine de başarısız olursa, güncelleyici artık çalışma kopyası içinde `npm run build`
denemek yerine paket yöneticisine özgü bir hatayla erken durur.

## `--update` kısayolu

`openclaw --update`, `openclaw update` komutuna yeniden yazılır (kabuklar ve başlatıcı betikleri için kullanışlıdır).

## Ayrıca bkz.

- `openclaw doctor` (git çalışma kopyalarında önce update çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI başvurusu](/tr/cli)
