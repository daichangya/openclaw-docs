---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltme
    - Şifrelenmiş Matrix geçmişini ve cihaz durumunu taşıma
summary: OpenClaw'ın önceki Matrix Plugin'ini yerinde nasıl yükselttiği; şifreli durum kurtarma sınırları ve el ile kurtarma adımları dahil.
title: Matrix geçişi
x-i18n:
    generated_at: "2026-04-25T13:49:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Bu sayfa, önceki genel `matrix` Plugin'inden mevcut uygulamaya yükseltmeleri kapsar.

Çoğu kullanıcı için yükseltme yerinde yapılır:

- Plugin `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- yapılandırmanız `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Yapılandırma anahtarlarını yeniden adlandırmanız veya Plugin'i yeni bir ad altında yeniden kurmanız gerekmez.

## Geçişin otomatik olarak yaptığı işlemler

Gateway başladığında ve [`openclaw doctor --fix`](/tr/gateway/doctor) çalıştırdığınızda OpenClaw eski Matrix durumunu otomatik olarak onarmayı dener.
Uygulanabilir herhangi bir Matrix geçiş adımı disk üzerindeki durumu değiştirmeden önce, OpenClaw odaklı bir kurtarma anlık görüntüsü oluşturur veya yeniden kullanır.

`openclaw update` kullandığınızda, tam tetikleyici OpenClaw'ın nasıl kurulduğuna bağlıdır:

- kaynak kurulumlar güncelleme akışı sırasında `openclaw doctor --fix` çalıştırır, sonra varsayılan olarak gateway'i yeniden başlatır
- paket yöneticisi kurulumları paketi günceller, etkileşimsiz bir doctor geçişi çalıştırır, sonra başlangıcın Matrix geçişini tamamlayabilmesi için varsayılan gateway yeniden başlatmasına güvenir
- `openclaw update --no-restart` kullanırsanız, başlangıç destekli Matrix geçişi daha sonra `openclaw doctor --fix` çalıştırıp gateway'i yeniden başlatana kadar ertelenir

Otomatik geçiş şunları kapsar:

- `~/Backups/openclaw-migrations/` altında geçiş öncesi anlık görüntü oluşturma veya yeniden kullanma
- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanma
- aynı hesap seçimini ve `channels.matrix` yapılandırmasını koruma
- en eski düz Matrix eşitleme deposunu mevcut hesap kapsamlı konuma taşıma
- hedef hesap güvenli şekilde çözümlenebildiğinde en eski düz Matrix kripto deposunu mevcut hesap kapsamlı konuma taşıma
- bu anahtar yerel olarak mevcutsa, önceki rust kripto deposundan daha önce kaydedilmiş bir Matrix oda anahtarı yedek şifre çözme anahtarını çıkarma
- erişim token'ı daha sonra değiştiğinde, aynı Matrix hesabı, homeserver ve kullanıcı için en eksiksiz mevcut token-hash depolama kökünü yeniden kullanma
- Matrix erişim token'ı değiştiğinde ancak hesap/cihaz kimliği aynı kaldığında, bekleyen şifreli durum geri yükleme meta verileri için kardeş token-hash depolama köklerini tarama
- bir sonraki Matrix başlangıcında yedeklenmiş oda anahtarlarını yeni kripto deposuna geri yükleme

Anlık görüntü ayrıntıları:

- OpenClaw, başarılı bir anlık görüntüden sonra `~/.openclaw/matrix/migration-snapshot.json` konumuna bir işaretleyici dosya yazar; böylece sonraki başlangıç ve onarım geçişleri aynı arşivi yeniden kullanabilir.
- Bu otomatik Matrix geçiş anlık görüntüleri yalnızca yapılandırma + durumu yedekler (`includeWorkspace: false`).
- Matrix yalnızca uyarı düzeyinde geçiş durumuna sahipse, örneğin `userId` veya `accessToken` hâlâ eksikse, OpenClaw henüz anlık görüntü oluşturmaz çünkü uygulanabilir bir Matrix değişikliği yoktur.
- Anlık görüntü adımı başarısız olursa, OpenClaw kurtarma noktası olmadan durumu değiştirmek yerine bu çalıştırma için Matrix geçişini atlar.

Çok hesaplı yükseltmeler hakkında:

- en eski düz Matrix deposu (`~/.openclaw/matrix/bot-storage.json` ve `~/.openclaw/matrix/crypto/`) tek depolu bir düzenden gelmiştir; bu nedenle OpenClaw bunu yalnızca çözümlenmiş bir Matrix hesap hedefine taşıyabilir
- zaten hesap kapsamlı eski Matrix depoları, yapılandırılmış her Matrix hesabı için algılanır ve hazırlanır

## Geçişin otomatik olarak yapamayacağı işlemler

Önceki genel Matrix Plugin'i Matrix oda anahtarı yedeklerini otomatik olarak **oluşturmadı**. Yerel kripto durumunu kalıcılaştırdı ve cihaz doğrulaması istedi, ancak oda anahtarlarınızın homeserver'a yedeklendiğini garanti etmedi.

Bu, bazı şifreli kurulumların yalnızca kısmen taşınabileceği anlamına gelir.

OpenClaw otomatik olarak şunları kurtaramaz:

- hiç yedeklenmemiş yalnızca yerel oda anahtarları
- `homeserver`, `userId` veya `accessToken` henüz mevcut olmadığından hedef Matrix hesabı henüz çözümlenemediğinde şifreli durum
- birden fazla Matrix hesabı yapılandırılmışken ancak `channels.matrix.defaultAccount` ayarlanmamışken tek bir paylaşılan düz Matrix deposunun otomatik geçişi
- standart Matrix paketi yerine depo yoluna sabitlenmiş özel Plugin yolu kurulumları
- eski depo yedeklenmiş anahtarlara sahip olduğu halde şifre çözme anahtarını yerel olarak tutmadığında eksik kurtarma anahtarı

Geçerli uyarı kapsamı:

- özel Matrix Plugin yolu kurulumları hem gateway başlangıcında hem de `openclaw doctor` tarafından gösterilir

Eski kurulumunuzda hiç yedeklenmemiş yalnızca yerel şifreli geçmiş varsa, yükseltmeden sonra bazı eski şifreli mesajlar okunamaz durumda kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw ve Matrix Plugin'ini normal şekilde güncelleyin.
   Başlangıcın Matrix geçişini hemen tamamlayabilmesi için `--no-restart` olmadan düz `openclaw update` tercih edin.
2. Şunu çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

   Matrix'te uygulanabilir geçiş işi varsa, doctor önce geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır ve arşiv yolunu yazdırır.

3. Gateway'i başlatın veya yeniden başlatın.
4. Geçerli doğrulama ve yedek durumunu denetleyin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. OpenClaw size kurtarma anahtarının gerekli olduğunu söylerse, şunu çalıştırın:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Bu cihaz hâlâ doğrulanmamışsa, şunu çalıştırın:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Kurtarma anahtarı kabul ediliyor ve yedek kullanılabilir durumda olduğu halde `Cross-signing verified`
   hâlâ `no` ise, başka bir Matrix istemcisinden öz doğrulamayı tamamlayın:

   ```bash
   openclaw matrix verify self
   ```

   İsteği başka bir Matrix istemcisinde kabul edin, emoji veya ondalık değerleri karşılaştırın
   ve yalnızca eşleşiyorlarsa `yes` yazın. Komut yalnızca
   `Cross-signing verified` değeri `yes` olduktan sonra başarıyla çıkar.

7. Kurtarılamayan eski geçmişi bilerek terk ediyorsanız ve gelecekteki mesajlar için yeni bir yedek tabanı istiyorsanız, şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Henüz sunucu tarafı anahtar yedeği yoksa, gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Şifreli geçiş nasıl çalışır

Şifreli geçiş iki aşamalı bir süreçtir:

1. Başlangıç veya `openclaw doctor --fix`, şifreli geçiş uygulanabilirse geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır.
2. Başlangıç veya `openclaw doctor --fix`, etkin Matrix Plugin kurulumu aracılığıyla eski Matrix kripto deposunu inceler.
3. Bir yedek şifre çözme anahtarı bulunursa, OpenClaw bunu yeni kurtarma anahtarı akışına yazar ve oda anahtarı geri yüklemeyi beklemede olarak işaretler.
4. Bir sonraki Matrix başlangıcında, OpenClaw yedeklenmiş oda anahtarlarını otomatik olarak yeni kripto deposuna geri yükler.

Eski depo hiç yedeklenmemiş oda anahtarları bildirdiğinde, OpenClaw kurtarma başarılı olmuş gibi davranmak yerine uyarı verir.

## Yaygın mesajlar ve anlamları

### Yükseltme ve algılama mesajları

`Matrix plugin upgraded in place.`

- Anlamı: disk üzerindeki eski Matrix durumu algılandı ve mevcut düzene taşındı.
- Yapmanız gereken: aynı çıktı uyarılar da içermiyorsa hiçbir şey.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Anlamı: OpenClaw, Matrix durumunu değiştirmeden önce bir kurtarma arşivi oluşturdu.
- Yapmanız gereken: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Anlamı: OpenClaw mevcut bir Matrix geçiş anlık görüntüsü işaretleyicisi buldu ve yinelenen bir yedek oluşturmak yerine bu arşivi yeniden kullandı.
- Yapmanız gereken: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Anlamı: eski Matrix durumu mevcut, ancak OpenClaw bunu mevcut bir Matrix hesabına eşleyemiyor çünkü Matrix yapılandırılmamış.
- Yapmanız gereken: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: OpenClaw eski durumu buldu, ancak yine de tam geçerli hesap/cihaz kökünü belirleyemiyor.
- Yapmanız gereken: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw paylaşılan tek bir düz Matrix deposu buldu, ancak bunun hangi adlandırılmış Matrix hesabına gitmesi gerektiğini tahmin etmeyi reddediyor.
- Yapmanız gereken: `channels.matrix.defaultAccount` değerini hedef hesap olarak ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Anlamı: yeni hesap kapsamlı konumda zaten bir eşitleme veya kripto deposu var, bu nedenle OpenClaw bunu otomatik olarak üzerine yazmadı.
- Yapmanız gereken: çakışan hedefi el ile kaldırmadan veya taşımadan önce geçerli hesabın doğru hesap olduğunu doğrulayın.

`Failed migrating Matrix legacy sync store (...)` veya `Failed migrating Matrix legacy crypto store (...)`

- Anlamı: OpenClaw eski Matrix durumunu taşımaya çalıştı ancak dosya sistemi işlemi başarısız oldu.
- Yapmanız gereken: dosya sistemi izinlerini ve disk durumunu inceleyin, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Anlamı: OpenClaw eski bir şifreli Matrix deposu buldu, ancak buna bağlanacak mevcut Matrix yapılandırması yok.
- Yapmanız gereken: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: şifreli depo mevcut, ancak OpenClaw bunun hangi geçerli hesap/cihaza ait olduğuna güvenli şekilde karar veremiyor.
- Yapmanız gereken: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri kullanılabilir olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw paylaşılan tek bir düz eski kripto deposu buldu, ancak bunun hangi adlandırılmış Matrix hesabına gitmesi gerektiğini tahmin etmeyi reddediyor.
- Yapmanız gereken: `channels.matrix.defaultAccount` değerini hedef hesap olarak ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Anlamı: OpenClaw eski Matrix durumunu algıladı, ancak geçiş hâlâ eksik kimlik veya kimlik bilgisi verileri nedeniyle engelleniyor.
- Yapmanız gereken: Matrix oturum açmasını veya yapılandırma kurulumunu tamamlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Anlamı: OpenClaw eski şifreli Matrix durumunu buldu, ancak normalde o depoyu inceleyen Matrix Plugin yardımcı giriş noktasını yükleyemedi.
- Yapmanız gereken: Matrix Plugin'ini yeniden kurun veya onarın (`openclaw plugins install @openclaw/matrix` ya da depo checkout'u için `openclaw plugins install ./path/to/local/matrix-plugin`), sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Anlamı: OpenClaw Plugin kökünden kaçan veya Plugin sınır denetimlerinde başarısız olan bir yardımcı dosya yolu buldu; bu nedenle bunu içe aktarmayı reddetti.
- Yapmanız gereken: Matrix Plugin'ini güvenilir bir yoldan yeniden kurun, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Anlamı: OpenClaw, önce kurtarma anlık görüntüsünü oluşturamadığı için Matrix durumunu değiştirmeyi reddetti.
- Yapmanız gereken: yedekleme hatasını çözün, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı geri dönüşü eski düz depolamayı buldu, ancak taşıma başarısız oldu. OpenClaw artık sessizce yeni bir depoyla başlamak yerine bu geri dönüşü durdurur.
- Yapmanız gereken: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu bozulmadan koruyun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix yol kurulumuna sabitlenmiştir, bu nedenle ana hat güncellemeleri bunu otomatik olarak deponun standart Matrix paketiyle değiştirmez.
- Yapmanız gereken: varsayılan Matrix Plugin'ine dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden kurun.

### Şifreli durum kurtarma mesajları

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Anlamı: yedeklenmiş oda anahtarları yeni kripto deposuna başarıyla geri yüklendi.
- Yapmanız gereken: genellikle hiçbir şey.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Anlamı: bazı eski oda anahtarları yalnızca eski yerel depoda vardı ve hiçbir zaman Matrix yedeğine yüklenmemişti.
- Yapmanız gereken: başka bir doğrulanmış istemciden bu anahtarları el ile kurtaramıyorsanız bazı eski şifreli geçmişlerin kullanılamaz kalmasını bekleyin.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Anlamı: yedek mevcut, ancak OpenClaw kurtarma anahtarını otomatik olarak kurtaramadı.
- Yapmanız gereken: `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` komutunu çalıştırın.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Anlamı: OpenClaw eski şifreli depoyu buldu, ancak kurtarmayı hazırlayacak kadar güvenli biçimde inceleyemedi.
- Yapmanız gereken: `openclaw doctor --fix` komutunu yeniden çalıştırın. Tekrarlanırsa, eski durum dizinini bozulmadan koruyun ve başka bir doğrulanmış Matrix istemcisi ile `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` komutunu kullanarak kurtarın.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Anlamı: OpenClaw bir yedek anahtar çakışması algıladı ve geçerli recovery-key dosyasının üzerine otomatik olarak yazmayı reddetti.
- Yapmanız gereken: herhangi bir geri yükleme komutunu yeniden denemeden önce hangi kurtarma anahtarının doğru olduğunu doğrulayın.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Anlamı: bu, eski depolama biçiminin kesin sınırıdır.
- Yapmanız gereken: yedeklenmiş anahtarlar yine de geri yüklenebilir, ancak yalnızca yerel olan şifreli geçmiş kullanılamaz kalabilir.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Anlamı: yeni Plugin geri yüklemeyi denedi ancak Matrix bir hata döndürdü.
- Yapmanız gereken: `openclaw matrix verify backup status` komutunu çalıştırın, sonra gerekirse `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` ile yeniden deneyin.

### El ile kurtarma mesajları

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Anlamı: OpenClaw bir yedek anahtarınızın olması gerektiğini biliyor, ancak bu cihazda etkin değil.
- Yapmanız gereken: `openclaw matrix verify backup restore` çalıştırın veya gerekirse `--recovery-key` verin.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Anlamı: bu cihazda kurtarma anahtarı şu anda kayıtlı değil.
- Yapmanız gereken: önce cihazı kurtarma anahtarınızla doğrulayın, sonra yedeği geri yükleyin.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Anlamı: kayıtlı anahtar etkin Matrix yedeğiyle eşleşmiyor.
- Yapmanız gereken: doğru anahtarla `openclaw matrix verify device "<your-recovery-key>"` komutunu yeniden çalıştırın.

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyorsanız, bunun yerine
geçerli yedek tabanını `openclaw matrix verify backup reset --yes` ile sıfırlayabilirsiniz. Kayıtlı
yedek gizli verisi bozuksa, yeniden başlatmadan sonra yeni yedek anahtarının düzgün yüklenebilmesi için bu sıfırlama gizli depolamayı da yeniden oluşturabilir.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Anlamı: yedek mevcut, ancak bu cihaz henüz çapraz imzalama zincirine yeterince güçlü biçimde güvenmiyor.
- Yapmanız gereken: `openclaw matrix verify device "<your-recovery-key>"` komutunu yeniden çalıştırın.

`Matrix recovery key is required`

- Anlamı: gerekli olduğu bir durumda kurtarma adımını kurtarma anahtarı vermeden denediniz.
- Yapmanız gereken: komutu kurtarma anahtarınızla yeniden çalıştırın.

`Invalid Matrix recovery key: ...`

- Anlamı: verilen anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Yapmanız gereken: Matrix istemcinizdeki veya recovery-key dosyasındaki tam kurtarma anahtarıyla yeniden deneyin.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Anlamı: OpenClaw kurtarma anahtarını uygulayabildi, ancak Matrix bu cihaz için hâlâ tam çapraz imzalama kimlik güvenini kurmadı. Komut çıktısındaki `Recovery key accepted`, `Backup usable`, `Cross-signing verified` ve `Device verified by owner` durumlarını denetleyin.
- Yapmanız gereken: `openclaw matrix verify self` komutunu çalıştırın, isteği başka bir Matrix istemcisinde kabul edin, SAS'i karşılaştırın ve yalnızca eşleşiyorsa `yes` yazın. Komut, başarı bildirmeden önce tam Matrix kimlik güvenini bekler. Geçerli çapraz imzalama kimliğini bilerek değiştirmek istediğinizde yalnızca `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing` kullanın.

`Matrix key backup is not active on this device after loading from secret storage.`

- Anlamı: gizli depolama bu cihazda etkin bir yedek oturumu üretmedi.
- Yapmanız gereken: önce cihazı doğrulayın, sonra `openclaw matrix verify backup status` ile yeniden denetleyin.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Anlamı: bu cihaz, cihaz doğrulaması tamamlanana kadar gizli depolamadan geri yükleme yapamaz.
- Yapmanız gereken: önce `openclaw matrix verify device "<your-recovery-key>"` komutunu çalıştırın.

### Özel Plugin kurulum mesajları

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: Plugin kurulum kaydınız artık mevcut olmayan bir yerel yolu işaret ediyor.
- Yapmanız gereken: `openclaw plugins install @openclaw/matrix` ile yeniden kurun veya depo checkout'u kullanıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin`.

## Şifreli geçmiş hâlâ geri gelmiyorsa

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Yedek başarılı şekilde geri yükleniyor ancak bazı eski odalarda geçmiş hâlâ eksikse, bu eksik anahtarlar büyük olasılıkla önceki Plugin tarafından hiç yedeklenmemiştir.

## Gelecekteki mesajlar için temiz başlamak istiyorsanız

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyor ve ileriye dönük yalnızca temiz bir yedek tabanı istiyorsanız, bu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Bundan sonra cihaz hâlâ doğrulanmamışsa, SAS emoji veya ondalık kodlarını karşılaştırıp eşleştiklerini onaylayarak Matrix istemcinizden doğrulamayı tamamlayın.

## İlgili sayfalar

- [Matrix](/tr/channels/matrix)
- [Doctor](/tr/gateway/doctor)
- [Geçiş yapma](/tr/install/migrating)
- [Plugins](/tr/tools/plugin)
