import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultCareData = {
  badge: "🌸 Çiçekçe Canlı Çiçek Bakım Rehberi",
  title: "Çiçeklerinizin Ömrünü Uzatacak Altın İpuçları",
  subtitle: "Tebrikler! Sevdiklerinizden veya kendinize hediye aldığınız taze çiçeklerinizin haftalarca canlı ve taze kalması için ihtiyacınız olan bakım rehberi.",
  tips: {
    buket: [
      {
        id: "b1",
        title: "1. Açılı Sap Kesimi Yapın",
        desc: "Çiçeklerinizi vazoya yerleştirmeden önce sap uçlarını keskin bir bıçak veya makasla 45 derece açıyla 2 cm kadar kesin. Bu işlem çiçeklerin suyu emme yüzeyini maksimuma çıkarır.",
        icon: "Scissors",
        color: "amber"
      },
      {
        id: "b2",
        title: "2. Suyu 2 Günde Bir Yenileyin",
        desc: "Vazodaki suyu 2 günde bir taze soğuk su ile değiştirin. Suyu yenilerken vazo içini iyice yıkayın ve sap uçlarını tekrar 1 cm kadar çapraz kesin.",
        icon: "Droplets",
        color: "blue"
      },
      {
        id: "b3",
        title: "3. Doğrudan Güneşten Koruyun",
        desc: "Çiçeklerinizi doğrudan yakıcı güneş ışığı, klima esintisi veya kalorifer peteği yanına koymayın. Serin ve aydınlık ortamlar çiçeğin ömrünü iki katına çıkarır.",
        icon: "Sun",
        color: "yellow"
      },
      {
        id: "b4",
        title: "4. Alt Yaprakları Temizleyin",
        desc: "Vazo suyu seviyesinin altında kalan yaprakları temizleyin. Suda kalan yapraklar çürüyerek suda bakteri üremesine ve çiçeklerin erken solmasına sebep olur.",
        icon: "CheckCircle2",
        color: "emerald"
      }
    ],
    orkide: [
      {
        id: "o1",
        title: "Daldırma Usulü Sulama",
        desc: "Orkideleri haftada 1 kez saksısıyla birlikte oda sıcaklığındaki su dolu kaba 10-15 dakika daldırarak sulayın. Suyun süzülmesini bekleyip şeffaf saksısına koyun.",
        icon: "Droplets",
        color: "purple"
      },
      {
        id: "o2",
        title: "Şeffaf Saksı & Kök Işığı",
        desc: "Orkide kökleri fotosentez yapar. Bu nedenle orkidenin şeffaf iç saksısını çıkarmayın. Kökler yeşil ise su ihtiyacı yoktur, griye dönünce sulayın.",
        icon: "Sun",
        color: "amber"
      }
    ],
    saksi: [
      {
        id: "s1",
        title: "Toprak Nem Kontrolü",
        desc: "Saksı çiçeklerinizi sulamadan önce parmağınızı 2 cm toprağa batırarak kontrol edin. Toprak nemli ise sulamayı erteleyin, kuru ise bolca sulayın.",
        icon: "Droplets",
        color: "emerald"
      },
      {
        id: "s2",
        title: "Yaprak Tozunu Alın",
        desc: "Büyük yapraklı saksı bitkilerinin yapraklarını nemli bir bezle silerek tozunu alın. Bu işlem bitkinin daha rahat nefes almasını sağlar.",
        icon: "Sun",
        color: "yellow"
      }
    ]
  }
};

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(careData: any) {
  try {
    const db = readDb();
    db.flowerCareSettings = careData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const local = readDb().flowerCareSettings || defaultCareData;
    const settings = await getSetting("flower_care_data", local);
    return NextResponse.json(settings || defaultCareData);
  } catch (e) {
    return NextResponse.json(defaultCareData);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await setSetting("flower_care_data", body);
    writeDbAndTs(body);
    return NextResponse.json({ success: true, data: body });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save flower care settings" }, { status: 500 });
  }
}
