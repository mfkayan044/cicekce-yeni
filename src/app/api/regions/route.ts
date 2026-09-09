import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isStorefront = searchParams.get("storefront") === "true";
    const cityId = searchParams.get("cityId");
    const districtId = searchParams.get("districtId");

    let cities: any[] = await getSetting("cities_data", []);

    if (districtId) {
      for (const c of cities) {
        const foundDist = (c.districts || []).find((d: any) => String(d.id) === String(districtId));
        if (foundDist) {
          return NextResponse.json({ city: c, district: foundDist }, { headers: noCacheHeaders });
        }
      }
      return NextResponse.json(null, { headers: noCacheHeaders });
    }

    if (cityId) {
      const found = cities.find((c: any) => String(c.id) === String(cityId) || String(c.plate) === String(cityId));
      return NextResponse.json(found || null, { headers: noCacheHeaders });
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

    return NextResponse.json(cities, { headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json([], { headers: noCacheHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let cities: any[] = await getSetting("cities_data", []);

    // 1. TOGGLE CITY
    if (body.action === "toggle_city" && body.id) {
      cities = cities.map((c: any) =>
        String(c.id) === String(body.id) ? { ...c, active: !c.active } : c
      );
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true }, { headers: noCacheHeaders });
    }

    // 2. DELETE CITY
    if (body.action === "delete_city" && body.id) {
      cities = cities.filter((c: any) => String(c.id) !== String(body.id));
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true }, { headers: noCacheHeaders });
    }

    // 3. ADD CITY
    if (body.action === "add_city" && body.name) {
      const newCity = {
        id: body.plate || String(Date.now()),
        plate: body.plate || String(cities.length + 1).padStart(2, "0"),
        name: body.name,
        active: true,
        districts: []
      };
      cities.push(newCity);
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true, city: newCity }, { headers: noCacheHeaders });
    }

    // 4. UPDATE DISTRICT FEE & MIN ORDER
    if (body.action === "update_district_fee" && body.cityId && body.districtId) {
      cities = cities.map((c: any) => {
        if (String(c.id) === String(body.cityId)) {
          const updatedDistricts = (c.districts || []).map((d: any) => {
            if (String(d.id) === String(body.districtId)) {
              return {
                ...d,
                deliveryFee: body.deliveryFee !== undefined ? Number(body.deliveryFee) : (d.deliveryFee || 0),
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
      return NextResponse.json({ success: true }, { headers: noCacheHeaders });
    }

    // 5. TOGGLE DISTRICT
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
      return NextResponse.json({ success: true }, { headers: noCacheHeaders });
    }

    // 6. DELETE DISTRICT
    if (body.action === "delete_district" && body.cityId && body.id) {
      cities = cities.map((c: any) => {
        if (String(c.id) === String(body.cityId)) {
          const updatedDistricts = (c.districts || []).filter((d: any) => String(d.id) !== String(body.id));
          return { ...c, districts: updatedDistricts };
        }
        return c;
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true }, { headers: noCacheHeaders });
    }

    // 7. ADD DISTRICT
    if (body.action === "add_district" && body.cityId && body.name) {
      const newDist = {
        id: "d_" + Date.now(),
        name: body.name,
        minOrder: body.minOrder || "0 ₺",
        deliveryFee: Number(body.deliveryFee || 0),
        active: true,
        neighborhoods: []
      };
      cities = cities.map((c: any) => {
        if (String(c.id) === String(body.cityId)) {
          return { ...c, districts: [...(c.districts || []), newDist] };
        }
        return c;
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true, district: newDist }, { headers: noCacheHeaders });
    }

    // 8. TOGGLE NEIGHBORHOOD
    if (body.action === "toggle_neighborhood" && body.id) {
      cities = cities.map((c: any) => {
        const updatedDistricts = (c.districts || []).map((d: any) => {
          const updatedNeighs = (d.neighborhoods || []).map((n: any) =>
            String(n.id) === String(body.id) ? { ...n, active: !n.active } : n
          );
          return { ...d, neighborhoods: updatedNeighs };
        });
        return { ...c, districts: updatedDistricts };
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true }, { headers: noCacheHeaders });
    }

    // 9. DELETE NEIGHBORHOOD
    if (body.action === "delete_neighborhood" && body.id) {
      cities = cities.map((c: any) => {
        const updatedDistricts = (c.districts || []).map((d: any) => {
          const updatedNeighs = (d.neighborhoods || []).filter((n: any) => String(n.id) !== String(body.id));
          return { ...d, neighborhoods: updatedNeighs };
        });
        return { ...c, districts: updatedDistricts };
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true }, { headers: noCacheHeaders });
    }

    // 10. ADD NEIGHBORHOOD
    if (body.action === "add_neighborhood" && body.districtId && body.name) {
      const newNeigh = {
        id: "n_" + Date.now(),
        name: body.name,
        minOrder: body.minOrder || "300 ₺",
        extraFee: body.extraFee || "0 ₺",
        active: true
      };
      cities = cities.map((c: any) => {
        const updatedDistricts = (c.districts || []).map((d: any) => {
          if (String(d.id) === String(body.districtId)) {
            return { ...d, neighborhoods: [...(d.neighborhoods || []), newNeigh] };
          }
          return d;
        });
        return { ...c, districts: updatedDistricts };
      });
      await setSetting("cities_data", cities);
      return NextResponse.json({ success: true, neighborhood: newNeigh }, { headers: noCacheHeaders });
    }

    // General city upsert fallback
    const idx = cities.findIndex((c: any) => String(c.id) === String(body.id));
    if (idx >= 0) {
      cities[idx] = { ...cities[idx], ...body };
    } else {
      cities.push(body);
    }
    await setSetting("cities_data", cities);

    return NextResponse.json(body, { status: 201, headers: noCacheHeaders });
  } catch (error) {
    console.error("POST /api/regions error:", error);
    return NextResponse.json({ error: "Failed to update region" }, { status: 500, headers: noCacheHeaders });
  }
}
