import { NextResponse } from "next/server";
import { validateAdminCredentials, createAdminToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve parola zorunludur." },
        { status: 400 }
      );
    }

    const { getSetting } = await import("@/lib/settings-helper");
    const genSettings = await getSetting("general_settings", {});

    const savedPass = genSettings.password ? String(genSettings.password).trim() : null;
    const savedUser = genSettings.username ? String(genSettings.username).trim() : null;
    const savedEmail = genSettings.email ? String(genSettings.email).trim() : null;

    let isValid = false;

    if (savedPass && savedPass.length > 0) {
      // Custom password set by admin in /yonetim/ayarlar
      const validUsernames = [
        savedUser,
        savedEmail,
        "admin",
        "admin@cicekce.com"
      ].filter(Boolean).map(s => String(s).toLowerCase());

      const inputUser = String(login).trim().toLowerCase();
      if (validUsernames.includes(inputUser) && String(password) === savedPass) {
        isValid = true;
      }
    } else {
      isValid = validateAdminCredentials(login, password);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı adı veya parola." },
        { status: 401 }
      );
    }

    const token = await createAdminToken(login);

    const response = NextResponse.json({
      success: true,
      message: "Giriş başarılı.",
      user: { username: login, role: "admin" },
    });

    // Set HttpOnly, secure session cookie
    response.cookies.set({
      name: "admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Giriş işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
