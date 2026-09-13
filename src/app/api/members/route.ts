import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import { isRequestAuthorized } from "@/lib/auth";
import fs from "fs";
import path from "path";

const localDbPath = path.join(process.cwd(), "src", "data", "db.json");

let memoryMembers: any[] = [];

async function hashMemberPassword(pass: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${pass}:cicekce_member_salt_2026`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

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
  const members = await getSetting("members_store", getLocalMembers());
  if (Array.isArray(members) && members.length > 0) {
    memoryMembers = members;
    saveLocalMembers(members);
    return members;
  }
  return getLocalMembers();
}

async function saveMembersToDb(members: any[]) {
  memoryMembers = members;
  saveLocalMembers(members);
  await setSetting("members_store", members);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");
    const isAuth = await isRequestAuthorized(req);

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

    if (!isAuth) {
      return NextResponse.json(
        { error: "Yetkisiz erişim. Üye listesini görüntülemek için yönetici yetkisi gereklidir." },
        { status: 401 }
      );
    }

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

    if (action === "register" || !action) {
      if (!email || !name) {
        return NextResponse.json({ error: "Lütfen ad soyad ve e-posta giriniz." }, { status: 400 });
      }

      if (!password || String(password).trim().length < 6) {
        return NextResponse.json({ error: "Lütfen en az 6 karakterli bir şifre belirleyiniz." }, { status: 400 });
      }

      const existing = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        return NextResponse.json({ error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var." }, { status: 400 });
      }

      const hashedPassword = await hashMemberPassword(String(password).trim());

      const newMember = {
        id: `mem_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : "",
        password: hashedPassword,
        date: new Date().toLocaleDateString("tr-TR"),
        status: "Aktif",
        orders: 0,
        addresses: address ? [address] : []
      };

      members.unshift(newMember);
      await saveMembersToDb(members);

      // Send Welcome Email
      try {
        const { sendTransactionalEmail, getWelcomeNoticeHtml } = await import("@/lib/email-service");
        const welcomeHtml = getWelcomeNoticeHtml({ name: newMember.name });
        sendTransactionalEmail({
          to: newMember.email,
          subject: "🌸 Çiçekçe Ailesine Hoş Geldiniz! 100 ₺ İndiriminiz Tanımlandı",
          html: welcomeHtml,
        }).catch(() => {});
      } catch (e) {}

      const { password: _, ...safeUser } = newMember;
      return NextResponse.json({ success: true, member: safeUser }, { status: 201 });
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gereklidir." }, { status: 400 });
      }

      const member = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());
      if (!member) {
        return NextResponse.json({ error: "Bu e-posta adresine ait kullanıcı bulunamadı." }, { status: 404 });
      }

      const inputHash = await hashMemberPassword(password);
      const isPasswordCorrect = member.password === password || member.password === inputHash;

      if (!isPasswordCorrect) {
        return NextResponse.json({ error: "Girdiğiniz şifre hatalı." }, { status: 401 });
      }

      // Upgrade plain text password to hash on successful login
      if (member.password === password && member.password !== inputHash) {
        member.password = inputHash;
        await saveMembersToDb(members);
      }

      if (member.status === "Pasif") {
        return NextResponse.json({ error: "Hesabınız askıya alınmıştır. Lütfen destek ile iletişime geçin." }, { status: 403 });
      }

      const { password: _, ...safeUser } = member;
      return NextResponse.json({ success: true, member: safeUser });
    }

    if (action === "update") {
      const { id, updatedData } = body;
      const isAuth = await isRequestAuthorized(req);

      const index = members.findIndex((m) => String(m.id) === String(id));
      if (index === -1) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      }

      const isStatusChange = updatedData?.status !== undefined && updatedData.status !== members[index].status;
      if (isStatusChange && !isAuth) {
        return NextResponse.json({ error: "Yetkisiz işlem: Üye durumu yalnızca yönetici tarafından değiştirilebilir." }, { status: 403 });
      }

      let newPassword = members[index].password;
      if (updatedData?.password) {
        newPassword = await hashMemberPassword(String(updatedData.password).trim());
      }

      members[index] = {
        ...members[index],
        ...(updatedData?.name ? { name: updatedData.name } : {}),
        ...(updatedData?.phone ? { phone: updatedData.phone } : {}),
        ...(updatedData?.email ? { email: updatedData.email } : {}),
        password: newPassword,
        ...(updatedData?.addresses !== undefined ? { addresses: updatedData.addresses } : {}),
        ...(updatedData?.points !== undefined ? { points: updatedData.points } : {}),
        ...(updatedData?.status && isAuth ? { status: updatedData.status } : {})
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
    const isAuth = await isRequestAuthorized(req);
    if (!isAuth) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Üye silmek için yönetici girişi gereklidir." },
        { status: 401 }
      );
    }

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
