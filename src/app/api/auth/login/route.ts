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

    const dynamicUser = genSettings.username || process.env.ADMIN_USER || "admin";
    const dynamicPass = genSettings.password || process.env.ADMIN_PASSWORD || "123456";
    const dynamicEmail = genSettings.email || "admin@cicekce.com";

    const isValid =
      validateAdminCredentials(login, password) ||
      ((login === dynamicUser || login === dynamicEmail) && password === dynamicPass);

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
