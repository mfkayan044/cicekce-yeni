import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";

const defaultCities = [
  {
    id: "34",
    name: "İstanbul",
    plate: "34",
    active: true,
    districts: [
      { id: "d_34_1", name: "Kadıköy", minOrder: "500 ₺", deliveryFee: 0, active: true },
      { id: "d_34_2", name: "Beşiktaş", minOrder: "500 ₺", deliveryFee: 0, active: true },
      { id: "d_34_3", name: "Şişli", minOrder: "500 ₺", deliveryFee: 0, active: true },
      { id: "d_34_4", name: "Üsküdar", minOrder: "500 ₺", deliveryFee: 0, active: true },
      { id: "d_34_5", name: "Ataşehir", minOrder: "500 ₺", deliveryFee: 0, active: true }
    ]
  },
  {
    id: "07",
    name: "Antalya",
    plate: "07",
    active: true,
    districts: [
      { id: "d_07_1", name: "Muratpaşa", minOrder: "400 ₺", deliveryFee: 0, active: true },
      { id: "d_07_2", name: "Konyaaltı", minOrder: "400 ₺", deliveryFee: 0, active: true },
      { id: "d_07_3", name: "Kepez", minOrder: "400 ₺", deliveryFee: 0, active: true }
    ]
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isStorefront = searchParams.get("storefront") === "true";
    const cityId = searchParams.get("cityId");

    let cities: any[] = await getSetting("cities_data", defaultCities);

    if (cityId) {
      const found = cities.find((c: any) => String(c.id) === String(cityId) || String(c.plate) === String(cityId));
      return NextResponse.json(found || null);
    }

    if (isStorefront) {
      cities = cities
        .filter((c: any) => c.active !== false)
        .map((c: any) => {
          const activeDistricts = (c.districts || []).filter((d: any) => d.active !== false);
          return { ...c, districts: activeDistricts };
        })
        .filter((c: any) => c.districts.length > 0);
    }

    return NextResponse.json(cities);
  } catch (error) {
    return NextResponse.json(defaultCities);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let cities: any[] = await getSetting("cities_data", defaultCities);

    if (body.action === "update_district_fee" && body.cityId && body.districtId) {
      cities = cities.map((c: any) => {
        if (String(c.id) === String(body.cityId)) {
          const updatedDistricts = (c.districts || []).map((d: any) => {
            if (String(d.id) === String(body.districtId)) {
              return {
                ...d,
                deliveryFee: body.deliveryFee !== undefined ? body.deliveryFee : (d.deliveryFee || 0),
                minOrder: body.minOrder !== undefined ? body.minOrder : (d.minOrder || "0 ₺")
              };
            }
            return d;
          });
          return { ...c, districts: updatedDistricts };
        }
        return c;
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true });
    }

    if (body.action === "toggle_district" && body.cityId && body.id) {
      cities = cities.map((c: any) => {
        if (String(c.id) === String(body.cityId)) {
          const updatedDistricts = (c.districts || []).map((d: any) =>
            String(d.id) === String(body.id) ? { ...d, active: !d.active } : d
          );
          return { ...c, districts: updatedDistricts };
        }
        return c;
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true });
    }

    if (body.action === "delete_district" && body.cityId && body.id) {
      cities = cities.map((c: any) => {
        if (String(c.id) === String(body.cityId)) {
          const updatedDistricts = (c.districts || []).filter((d: any) => String(d.id) !== String(body.id));
          return { ...c, districts: updatedDistricts };
        }
        return c;
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true });
    }

    if (body.action === "add_district" && body.cityId && body.name) {
      const newDist = {
        id: "d_" + Date.now(),
        name: body.name,
        minOrder: body.minOrder || "0 ₺",
        deliveryFee: Number(body.deliveryFee || 0),
        active: true,
      };
      cities = cities.map((c: any) => {
        if (String(c.id) === String(body.cityId)) {
          return { ...c, districts: [...(c.districts || []), newDist] };
        }
        return c;
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true, district: newDist });
    }

    // General city upsert
    const idx = cities.findIndex((c: any) => String(c.id) === String(body.id));
    if (idx >= 0) {
      cities[idx] = { ...cities[idx], ...body };
    } else {
      cities.push(body);
    }
    await setSetting("cities_data", cities);

    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update region" }, { status: 500 });
  }
}
