import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isStorefront = searchParams.get("storefront") === "true";
    const cityId = searchParams.get("cityId");

    const { data, error } = await supabase.from("cities").select("*").order("created_at", { ascending: true });
    if (error) throw error;

    let cities = data || [];

    if (cityId) {
      const found = cities.find((c: any) => String(c.id) === String(cityId) || String(c.plate) === String(cityId));
      return NextResponse.json(found || null);
    }

    if (isStorefront) {
      cities = cities
        .filter((c: any) => c.active !== false)
        .map((c: any) => {
          const activeDistricts = (c.districts || [])
            .filter((d: any) => d.active !== false)
            .map((d: any) => ({
              ...d,
              neighborhoods: (d.neighborhoods || []).filter((n: any) => n.active !== false)
            }));
          return { ...c, districts: activeDistricts };
        })
        .filter((c: any) => c.districts.length > 0);
    }

    return NextResponse.json(cities);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch regions from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. UPDATE DISTRICT DELIVERY FEE / MIN ORDER
    if (body.action === "update_district_fee" && body.cityId && body.districtId) {
      const { data: city } = await supabase.from("cities").select("*").eq("id", body.cityId).single();
      if (city) {
        const updatedDistricts = (city.districts || []).map((d: any) => {
          if (String(d.id) === String(body.districtId)) {
            return {
              ...d,
              deliveryFee: body.deliveryFee !== undefined ? body.deliveryFee : (d.deliveryFee || 0),
              minOrder: body.minOrder !== undefined ? body.minOrder : (d.minOrder || "0 ₺")
            };
          }
          return d;
        });
        await supabase.from("cities").update({ districts: updatedDistricts }).eq("id", body.cityId);
        return NextResponse.json({ success: true, districts: updatedDistricts });
      }
    }

    // 2. TOGGLE DISTRICT ACTIVE
    if (body.action === "toggle_district" && body.cityId && body.id) {
      const { data: city } = await supabase.from("cities").select("*").eq("id", body.cityId).single();
      if (city) {
        const updatedDistricts = (city.districts || []).map((d: any) =>
          String(d.id) === String(body.id) ? { ...d, active: !d.active } : d
        );
        await supabase.from("cities").update({ districts: updatedDistricts }).eq("id", body.cityId);
        return NextResponse.json({ success: true, districts: updatedDistricts });
      }
    }

    // 3. DELETE DISTRICT
    if (body.action === "delete_district" && body.cityId && body.id) {
      const { data: city } = await supabase.from("cities").select("*").eq("id", body.cityId).single();
      if (city) {
        const updatedDistricts = (city.districts || []).filter((d: any) => String(d.id) !== String(body.id));
        await supabase.from("cities").update({ districts: updatedDistricts }).eq("id", body.cityId);
        return NextResponse.json({ success: true, districts: updatedDistricts });
      }
    }

    // 4. ADD DISTRICT
    if (body.action === "add_district" && body.cityId && body.name) {
      const { data: city } = await supabase.from("cities").select("*").eq("id", body.cityId).single();
      if (city) {
        const newDist = {
          id: "d_" + Date.now(),
          name: body.name,
          minOrder: body.minOrder || "0 ₺",
          deliveryFee: Number(body.deliveryFee || 0),
          active: true,
          neighborhoods: [
            { id: "n_1_" + Date.now(), name: "Merkez Mah.", active: true },
            { id: "n_2_" + Date.now(), name: "Cumhuriyet Mah.", active: true }
          ]
        };
        const currentDistricts = city.districts || [];
        currentDistricts.push(newDist);
        await supabase.from("cities").update({ districts: currentDistricts }).eq("id", body.cityId);
        return NextResponse.json({ success: true, district: newDist });
      }
    }

    // 5. GENERAL CITY UPSERT
    const { data, error } = await supabase.from("cities").upsert(body, { onConflict: "id" }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update region in Supabase" }, { status: 500 });
  }
}
