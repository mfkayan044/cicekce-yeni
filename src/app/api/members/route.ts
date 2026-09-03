import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const localDbPath = path.join(process.cwd(), "src", "data", "db.json");

let memoryMembers: any[] = [
  {
    id: "mem_1",
    name: "Demo Müşteri",
    email: "demo@cicekce.com",
    phone: "0555 111 22 33",
    password: "password123",
    date: "01.01.2026",
    status: "Aktif",
    orders: 2,
    addresses: [
      { id: "a_1", title: "Ev Adresi", city: "İstanbul", district: "Kadıköy", fullAddress: "Moda Cad. No: 12 Daire: 4" }
    ]
  }
];

function getLocalMembers(): any[] {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
      if (Array.isArray(data.members) && data.members.length > 0) {
        return data.members;
      }
    }
  } catch (e) {}
  return memoryMembers;
}

function saveLocalMembers(members: any[]) {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
      data.members = members;
      fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {}
}

async function getMembersFromDb(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("data")
      .eq("id", "members_store")
      .single();

    if (!error && data?.data && Array.isArray(data.data) && data.data.length > 0) {
      memoryMembers = data.data;
      saveLocalMembers(memoryMembers);
      return memoryMembers;
    }
  } catch (e) {
  }
  return getLocalMembers();
}

async function saveMembersToDb(members: any[]) {
  memoryMembers = members;
  saveLocalMembers(members);
  try {
    await supabase.from("site_settings").upsert({
      id: "members_store",
      data: members,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to save members to supabase:", e);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    const members = await getMembersFromDb();

    if (id) {
      const found = members.find((m) => String(m.id) === String(id));
      if (!found) return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });
      const { password, ...safeData } = found;
      return NextResponse.json(safeData);
    }

    if (email) {
      const found = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
      if (!found) return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });
      const { password, ...safeData } = found;
      return NextResponse.json(safeData);
    }

    // Return all for admin
    const safeMembers = members.map(({ password, ...rest }) => rest);
    return NextResponse.json(safeMembers);
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, email, phone, password, address } = body;
    const members = await getMembersFromDb();

    // 1. REGISTER ACTION
    if (action === "register" || !action) {
      if (!email || !name) {
        return NextResponse.json({ error: "Lütfen ad soyad ve e-posta giriniz." }, { status: 400 });
      }

      const existing = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        return NextResponse.json({ error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var." }, { status: 400 });
      }

      const newMember = {
        id: `mem_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : "",
        password: password || "123456",
        date: new Date().toLocaleDateString("tr-TR"),
        status: "Aktif",
        orders: 0,
        addresses: address ? [address] : []
      };

      members.unshift(newMember);
      await saveMembersToDb(members);

      const { password: _, ...safeUser } = newMember;
      return NextResponse.json({ success: true, member: safeUser }, { status: 201 });
    }

    // 2. LOGIN ACTION
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gereklidir." }, { status: 400 });
      }

      const member = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());
      if (!member) {
        return NextResponse.json({ error: "Bu e-posta adresine ait kullanıcı bulunamadı." }, { status: 404 });
      }

      if (member.password && member.password !== password) {
        return NextResponse.json({ error: "Girdiğiniz şifre hatalı." }, { status: 401 });
      }

      if (member.status === "Pasif") {
        return NextResponse.json({ error: "Hesabınız askıya alınmıştır. Lütfen destek ile iletişime geçin." }, { status: 403 });
      }

      const { password: _, ...safeUser } = member;
      return NextResponse.json({ success: true, member: safeUser });
    }

    // 3. UPDATE PROFILE / ADDRESSES
    if (action === "update") {
      const { id, updatedData } = body;
      const index = members.findIndex((m) => String(m.id) === String(id));
      if (index === -1) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      }

      members[index] = {
        ...members[index],
        ...(updatedData.name ? { name: updatedData.name } : {}),
        ...(updatedData.phone ? { phone: updatedData.phone } : {}),
        ...(updatedData.email ? { email: updatedData.email } : {}),
        ...(updatedData.password ? { password: updatedData.password } : {}),
        ...(updatedData.addresses !== undefined ? { addresses: updatedData.addresses } : {}),
        ...(updatedData.status ? { status: updatedData.status } : {})
      };

      await saveMembersToDb(members);
      const { password: _, ...safeUser } = members[index];
      return NextResponse.json({ success: true, member: safeUser });
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "İşlem başarısız" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gereklidir." }, { status: 400 });

    let members = await getMembersFromDb();
    members = members.filter((m) => String(m.id) !== String(id));
    await saveMembersToDb(members);

    return NextResponse.json({ success: true, message: "Üye silindi." });
  } catch (e) {
    return NextResponse.json({ error: "Silme işlemi başarısız" }, { status: 500 });
  }
}
