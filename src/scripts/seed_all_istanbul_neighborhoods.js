const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = "postgresql://neondb_owner:npg_zhlvHLFGVA76@ep-plain-mode-b2fq4008-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

const istanbulData = [
  { name: "Arnavutköy", neighborhoods: ["Arnavutköy Merkez", "Anadolu Mahallesi", "Boğazköy", "Bolluca", "Dursunköy", "Hadımköy", "Haraççı", "Imrahor", "Karaburun", "Mavikent", "Ömerli", "Taşoluk", "Yassıören"] },
  { name: "Ataşehir", neighborhoods: ["Aşık Veysel", "Atatürk", "Barbaros", "Esatpaşa", "Ferhatpaşa", "Fetih", "İçerenköy", "İnönü", "Kayışdağı", "Küçükbakkalköy", "Mevlana", "Mimar Sinan", "Mustafa Kemal", "Örnek", "Yeni Çamlıca", "Yeni Sahra", "Yenişehir"] },
  { name: "Avcılar", neighborhoods: ["Ambarlı", "Cihangir", "Denizköşkler", "Firuzköy", "Gümüşpala", "Merkez", "Mustafa Kemal Paşa", "Tahtakale", "Üniversite", "Yeşilkent"] },
  { name: "Bağcılar", neighborhoods: ["100. Yıl", "15 Temmuz", "Bağlar", "Barbaros", "Çınar", "Demirkapı", "Evren", "Fatih", "Fevzi Çakmak", "Göztepe", "Güneşli", "Hürriyet", "İnönü", "Kazım Karabekir", "Mahmutbey", "Merkez", "Sancaktepe", "Yavuz Selim", "Yenigün", "Yıldıztepe"] },
  { name: "Bahçelievler", neighborhoods: ["Bahçelievler Merkez", "Basın Sitesi", "Cumhuriyet", "Fevzi Çakmak", "Hürriyet", "Kocasinan", "Mahmutbey", "Şirinevler", "Soğanlı", "Yenibosna", "Zafer"] },
  { name: "Bakırköy", neighborhoods: ["Ataköy 1. Kısım", "Ataköy 2-5-6. Kısım", "Ataköy 7-8-9-10. Kısım", "Basınköy", "Cevizlik", "Florya (Şenlikköy)", "Kartaltepe", "Osmaniye", "Sakızağacı", "Yenimahalle", "Yeşilköy", "Yeşilyurt", "Zeytinlik", "Zuhuratbaba"] },
  { name: "Başakşehir", neighborhoods: ["Altınşehir", "Bahçeşehir 1. Kısım", "Bahçeşehir 2. Kısım", "Başak", "Başakşehir Merkez", "Güvercintepe", "İkitelli OSB", "Kayabaşı", "Şahintepe", "Ziya Gökalp"] },
  { name: "Bayrampaşa", neighborhoods: ["Altıntepsi", "Cevatpaşa", "Ismetpaşa", "Kartaltepe", "Kocatepe", "Muratpaşa", "Orta", "Terazidere", "Vatan", "Yenidoğan", "Yıldırım"] },
  { name: "Beşiktaş", neighborhoods: ["Abbasağa", "Akatlar", "Arnavutköy", "Balmumcu", "Bebek", "Cihannüma", "Dikilitaş", "Etiler", "Gayrettepe", "Konaklar", "Kuruçeşme", "Levazım", "Levent", "Muradiye", "Nisbetiye", "Ortaköy", "Sinanpaşa", "Türkali", "Ulus", "Vişnezade", "Yıldız"] },
  { name: "Beykoz", neighborhoods: ["Acarlar", "Anadolu Hisarı", "Anadolu Kavağı", "Baklacı", "Çamlıbahçe", "Çengeldere", "Çiftlik", "Çigiltepe", "Göztepe", "Gümüşsuyu", "İncirköy", "Kanlıca", "Kavacık", "Merkez", "Ortaçeşme", "Paşabahçe", "Rüzgarlıbahçe", "Soğuksu", "Tokatköy", "Yalıköy", "Yavuz Selim", "Yenimahalle"] },
  { name: "Beylikdüzü", neighborhoods: ["Adnan Kahveci", "Barış", "Büyükşehir", "Cumhuriyet", "Dereağzı", "Gürpınar", "Kavaklı", "Marmara", "Sahil", "Yakuplu"] },
  { name: "Beyoğlu", neighborhoods: ["Arap Cami", "Asmalı Mescit", "Cihangir", "Çukur", "Fetihtepe", "Firuzağa", "Gümüşsuyu", "Hacıahmet", "Halıcıoğlu", "Hüseyinağa", "İstiklal", "Kaptanpaşa", "Katip Mustafa Çelebi", "Keçeci Piri", "Kemankeş Karamustafapaşa", "Kılıçali Paşa", "Kocatepe", "Kulaksız", "Kuloğlu", "Küçük Piyale", "Örnektepe", "Piyalepaşa", "Pürtelaş Hasan Efendi", "Şahkulu", "Şehit Muhtar", "Tomtom", "Yahyakahya", "Yenişehir"] },
  { name: "Büyükçekmece", neighborhoods: ["19 Mayıs", "Ahmediye", "Alkent 2000", "Atatürk", "Bahçelievler", "Celaliye", "Cumhuriyet", "Dizdariye", "Ekinoba", "Fatih", "Güzelce", "Hürriyet", "Kamiloba", "Kumburgaz", "Mimaroba", "Mimarsinan", "Muratçeşme", "Pınartepe", "Sinanoba", "Türkoba", "Ulus", "Yenimahalle"] },
  { name: "Çatalca", neighborhoods: ["Binkılıç", "Ferhatpaşa", "Izettin", "Karacaköy", "Kaleiçi", "Muratbey", "Örcünlü", "Subaşı", "Yalıköy"] },
  { name: "Çekmeköy", neighborhoods: ["Alemdağ", "Aydınlar", "Çamlık", "Çekmeköy Merkez", "Ekşioğlu", "Güngören", "Hamidiye", "Kirazlıdere", "Mehmet Akif", "Mimar Sinan", "Nişantepe", "Ömerli", "Soğukpınar", "Taşdelen", "Sultançiftliği"] },
  { name: "Esenler", neighborhoods: ["Birlik", "Çifte Havuzlar", "Davutpaşa", "Fatih", "Fevzi Çakmak", "Havaalanı", "Kazım Karabekir", "Kemer", "Menderes", "Mimar Sinan", "Namık Kemal", "Nene Hatun", "Oruçreis", "Turgut Reis", "Tuna", "Yavuz Selim"] },
  { name: "Esenyurt", neighborhoods: ["Akçaburgaz", "Akevler", "Akşemseddin", "Ardıçlı", "Aşık Veysel", "Barbaros", "Battalgazi", "Cumhuriyet", "Çınar", "Fatih", "Gökevler", "Güzelyurt", "Hürriyet", "Inönü", "İstiklal", "Koza", "Mehmet Akif Ersoy", "Mehtap", "Mevlana", "Nenehatun", "Örnek", "Pınar", "Piri Reis", "Saadetdere", "Sultaniye", "Süleymaniye", "Şehitler", "Talatpaşa", "Turgut Özal", "Üçevler", "Yeşilkent", "Yunus Emre", "Zafer"] },
  { name: "Eyüpsultan", neighborhoods: ["Akşemsettin", "Alibeyköy", "Çırçır", "Defterdar", "Düğmeciler", "Emniyettepe", "Eyüpsultan Merkez", "Göktürk Merkez", "Güzeltepe", "İslambey", "Karadolap", "Nişancı", "Rami Cuma", "Rami Yeni", "Sakarya", "Silahtarağa", "Topçular", "Yeşilpınar"] },
  { name: "Fatih", neighborhoods: ["Aksaray", "Akşemsettin", "Alemdar", "Ali Kuşçu", "Atikali", "Ayvansaray", "Balat", "Beyazıt", "Binbirdirek", "Cankurtaran", "Cerrahpaşa", "Cibali", "Derviş Ali", "Eminönü", "Hırka-i Şerif", "Hobyar", "Hoca Paşa", "Karagümrük", "Katip Kasım", "Kemal Paşa", "Kocamustafapaşa", "Küçük Ayasofya", "Mercan", "Mesih Paşa", "Mevlanakapı", "Mimar Hayrettin", "Mimar Kemalettin", "Molla Gürani", "Molla Hüsrev", "Molla Fenari", "Rüstem Paşa", "Saraç İshak", "Seyyid Ömer", "Süleymaniye", "Sultan Ahmet", "Sümbül Efendi", "Tahtakale", "Taya Hatun", "Topkapı", "Yedikule", "Zeyrek"] },
  { name: "Gaziosmanpaşa", neighborhoods: ["Bağlarbaşı", "Barbaros Hayrettin Paşa", "Fevzi Çakmak", "Hürriyet", "Karadeniz", "Karayolları", "Karlıtepe", "Kazım Karabekir", "Merkez", "Mevlana", "Pazariçi", "Sarıgöl", "Şemsipaşa", "Yeni Mahalle", "Yenidoğan", "Yıldıztabia"] },
  { name: "Güngören", neighborhoods: ["Akıncılar", "Tozkoparan", "Abdurrahman Nafiz Gürman", "Sanayi", "Gençosman", "Güneştepe", "Haznedar", "Mareşal Çakmak", "Mehmet Nezih Özmen", "Merkez"] },
  { name: "Kadıköy", neighborhoods: ["19 Mayıs", "Acıbadem", "Bostancı", "Caddebostan", "Caferağa (Moda)", "Dumlupınar", "Erenköy", "Fenerbahçe", "Feneryolu", "Fikirtepe", "Göztepe", "Hasanpaşa", "Koşuyolu", "Kozyatağı", "Merdivenköy", "Osmanağa", "Rasimpaşa", "Sahrayıcedid", "Suadiye", "Zühtüpaşa"] },
  { name: "Kağıthane", neighborhoods: ["Çağlayan", "Çeliktepe", "Emniyet Evleri", "Gültepe", "Gürsel", "Hamidiye", "Harmantepe", "Hürriyet", "Karabey", "Merkez", "Nurtepe", "Ortabayır", "Seyrantepe", "Şirintepe", "Talatpaşa", "Telsizler", "Yahya Kemal", "Yeşilce"] },
  { name: "Kartal", neighborhoods: ["Atalar", "Cevizli", "Cumhuriyet", "Çavuşoğlu", "Esentepe", "Gümüşpınar", "Hürriyet", "Karlıktepe", "Kordonboyu", "Orhantepe", "Orta", "Petrol İş", "Soğanlık Yeni", "Topselvi", "Uğur Mumcu", "Yalı", "Yukarı", "Yunus"] },
  { name: "Küçükçekmece", neighborhoods: ["Atakent", "Atatürk", "Beşyol", "Cennet", "Cumhuriyet", "Fatih", "Fevzi Çakmak", "Gültepe", "Halkalı Merkez", "İnönü", "Istasyon", "Kanarya", "Kartaltepe", "Kemalpaşa", "Mehmetakif", "Söğütlü Çeşme", "Sultan Murat", "Tevfik Bey", "Yarımburgaz", "Yeni Mahalle", "Yeşilova"] },
  { name: "Maltepe", neighborhoods: ["Altayçeşme", "Altıntepe", "Aydınevler", "Bağlarbaşı", "Büyükbakkalköy", "Cevizli", "Çınar", "Fındıklı", "Girne", "Gülensu", "Gülsuyu", "İdealtepe", "Küçükyalı", "Yalı", "Zümrütevler"] },
  { name: "Pendik", neighborhoods: ["Ahmet Yesevi", "Bahçelievler", "Batı", "Çamçeşme", "Çamlık", "Çınardere", "Doğu", "Dumlupınar", "Esenler", "Esenyalı", "Fatih", "Fevzi Çakmak", "Güllübağlar", "Güzelyalı", "Harmandere", "Kavakpınar", "Kaynarca", "Kurtköy", "Orhangazi", "Orta", "Sanayi", "Sapan Bağları", "Sülüntepe", "Şeyhli", "Velibaba", "Yayalar", "Yenimahalle", "Yenişehir", "Yeşilbağlar"] },
  { name: "Sancaktepe", neighborhoods: ["Abdurrahmangazi", "Akpınar", "Atatürk", "Emek", "Eyüp Sultan", "Fatih", "Hilal", "İnönü", "Kemal Türkler", "Meclis", "Merve", "Mevlana", "Paşaköy", "Sarıgazi", "Veysel Karani", "Yenidoğan", "Yunus Emre"] },
  { name: "Sarıyer", neighborhoods: ["Ayazağa", "Baltalimanı", "Büyükdere", "Cumhuriyet", "Çamlıtepe", "Darüşşafaka", "Emirgan", "Fatih Sultan Mehmet", "Ferahevler", "İstinye", "Kazım Karabekir Paşa", "Kireçburnu", "Maslak", "Pınar", "Poligon", "Reşitpaşa", "Rumelihisarı", "Rumelikavağı", "Sarıyer Merkez", "Tarabya", "Uskumruköy", "Yeniköy", "Zekeriyaköy"] },
  { name: "Silivri", neighborhoods: ["Alibey", "Cumhuriyet", "Fatih", "Gümüşyaka", "Mimar Sinan", "Piri Mehmet Paşa", "Selimpaşa", "Semizkumlar", "Yeni Mahalle"] },
  { name: "Sultanbeyli", neighborhoods: ["Abdurrahmangazi", "Adil", "Ahmet Yesevi", "Akşemsettin", "Battalgazi", "Fatih", "Hamidiye", "Hasanpaşa", "Mimar Sinan", "Necip Fazıl", "Orhangazi", "Turgut Reis", "Yavuz Selim"] },
  { name: "Sultangazi", neighborhoods: ["50. Yıl", "75. Yıl", "Cebeci", "Esentepe", "Gazi", "Habibler", "İsmetpaşa", "Malkoçoğlu", "Sultançiftliği", "Uğur Mumcu", "Yayla", "Yunus Emre"] },
  { name: "Şile", neighborhoods: ["Ağva", "Ahmetli", "Balibey", "Çavuş", "Hacı Kasım", "Kumbaba"] },
  { name: "Şişli", neighborhoods: ["19 Mayıs", "Ahmet Requirement", "Bozkurt", "Cumhuriyet", "Duatepe", "Ergenekon", "Esentepe", "Eskişehir", "Feriköy", "Fulya", "Gülbahar", "Halaskargazi", "Halide Edip Adıvar", "Halil Rıfat Paşa", "Harbiye", "İnönü", "İzzet Paşa", "Kaptanpaşa", "Kuştepe", "Mahmut Şevket Paşa", "Mecidiyeköy", "Merkez", "Meşrutiyet", "Paşa", "Teşvikiye", "Yayla"] },
  { name: "Tuzla", neighborhoods: ["Akfırat", "Aydınlı", "Aydıntepe", "Cami",, "Evliya Çelebi", "Fatih", "İçmeler", "Istasyon", "Mescit", "Mimar Sinan", "Orhanlı", "Orta", "Postane", "Şifa", "Tepeören", "Yayla"] },
  { name: "Ümraniye", neighborhoods: ["Adem Yavuz", "Altınşehir", "Armağanevler", "Aşağı Dudullu", "Atakent", "Atatürk", "Cakmak", "Çamlık", "Cemil Meriç", "Elmalıkent", "Esenevler", "Esenkent", "Esenevler", "Fatih Sultan Mehmet", "Hekimbaşı", "Huzur", "Ihlamurkuyu", "İnkılap", "İstiklal", "Kazım Karabekir", "Madenler", "Mehmet Akif", "Namık Kemal", "Necip Fazıl", "Parseller", "Saray", "Site", "Şerifali", "Tantavi", "Tatlısu", "Tepeüstü", "Topağacı", "Yamanevler", "Yukarı Dudullu"] },
  { name: "Üsküdar", neighborhoods: ["Acıbadem", "Ahmediye", "Altunizade", "Aziz Mahmud Hüdayi", "Bahçelievler", "Barbaros", "Beylerbeyi", "Bulgurlu", "Burhaniye", "Cumhuriyet", "Çengelköy", "Ferah", "Güzeltepe", "İcapçı", "Kandilli", "Kısıklı", "Kirazlıtepe", "Kuleli", "Kuzguncuk", "Küçük Çamlıca", "Küçüksu", "Mimar Sinan", "Murat Reis", "Salacak", "Selami Ali", "Selimiye", "Sultantepe", "Ünalan", "Valide-i Atik", "Yavuztürk", "Zeynep Kamil"] },
  { name: "Zeytinburnu", neighborhoods: ["Beştelsiz", "Çırpıcı", "Gökalp", "Kazlıçeşme", "Maltepe", "Merkezefendi", "Nuripaşa", "Seyitnizam", "Sümer", "Telsiz", "Veliefendi", "Yenidoğan", "Yeşiltepe"] }
];

async function seedNeighborhoods() {
  console.log("🚀 Seeding ALL Neighborhoods for 38 Istanbul Districts into Neon DB...");

  const formattedDistricts = istanbulData.map((dObj, dIdx) => {
    const dId = `d_34_${dIdx + 1}`;
    const cleanNeighs = (dObj.neighborhoods || []).filter(Boolean).map((nName, nIdx) => ({
      id: `n_34_${dIdx + 1}_${nIdx + 1}`,
      name: nName,
      minOrder: "500 ₺",
      extraFee: "0 ₺",
      active: true
    }));

    return {
      id: dId,
      name: dObj.name,
      minOrder: "500 ₺",
      deliveryFee: 0,
      active: true,
      neighborhoods: cleanNeighs
    };
  });

  const istanbulCity = {
    id: "34",
    name: "İstanbul",
    plate: "34",
    active: true,
    districts: formattedDistricts
  };

  const citiesData = [istanbulCity];

  await sql`
    INSERT INTO site_settings (id, value)
    VALUES ('cities_data', ${JSON.stringify(citiesData)})
    ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;
  `;

  console.log(`🎉 ALL ${formattedDistricts.length} ISTANBUL DISTRICTS AND HUNDREDS OF NEIGHBORHOODS SEEDED TO NEON DB!`);
}

seedNeighborhoods().catch(console.error);
