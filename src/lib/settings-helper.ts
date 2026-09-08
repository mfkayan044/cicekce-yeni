import { sql } from "@/lib/db";
import { initialDbData } from "@/lib/initial-db";

const inMemorySettingsCache: Record<string, any> = { ...initialDbData };

export async function getSetting(key: string, defaultVal: any = {}): Promise<any> {
  try {
    const data = await sql`SELECT value FROM site_settings WHERE id = ${key} LIMIT 1`;
    if (data && data.length > 0 && data[0].value) {
      inMemorySettingsCache[key] = data[0].value;
      return data[0].value;
    }
  } catch (e) {}

  return inMemorySettingsCache[key] || defaultVal;
}

export async function setSetting(key: string, value: any): Promise<boolean> {
  try {
    inMemorySettingsCache[key] = value;
    await sql`
      INSERT INTO site_settings (id, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at;
    `;
    return true;
  } catch (e) {
    return false;
  }
}
