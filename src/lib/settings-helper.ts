import { supabase } from "@/lib/supabase";
import { initialDbData } from "@/lib/initial-db";

const inMemorySettingsCache: Record<string, any> = { ...initialDbData };

export async function getSetting(key: string, defaultVal: any = {}): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", key)
      .single();

    if (!error && data && data.value) {
      inMemorySettingsCache[key] = data.value;
      return data.value;
    }
  } catch (e) {}

  return inMemorySettingsCache[key] || defaultVal;
}

export async function setSetting(key: string, value: any): Promise<boolean> {
  try {
    inMemorySettingsCache[key] = value;

    const { error } = await supabase
      .from("site_settings")
      .upsert({
        id: key,
        value,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch (e) {
    return false;
  }
}
