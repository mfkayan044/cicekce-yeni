const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cksauvgjodsduhxtnqwm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2F1dmdqb2RzZHVoeHRucXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzE0OTUsImV4cCI6MjEwMzg0NzQ5NX0.4a5gB69LbXyG9zVE9AxKGp_BGDL9cTn3QSs4zj6Oirc';

const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = path.join(__dirname, '..', 'data', 'db.json');

async function seedData() {
  console.log("Reading local db.json data...");
  const raw = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(raw);

  // 1. Seed Products
  if (db.products && db.products.length > 0) {
    console.log(`Seeding ${db.products.length} products to Supabase...`);
    const formattedProducts = db.products.map(p => ({
      id: String(p.id),
      slug: p.slug,
      title: p.title,
      category: p.category,
      category_slug: p.categorySlug || p.category_slug,
      price: String(p.price),
      old_price: p.oldPrice || p.old_price,
      discount: p.discount,
      image: p.image,
      code: p.code,
      stock: p.stock !== false,
      featured: p.featured === true,
      description: p.description
    }));

    const { error } = await supabase.from('products').upsert(formattedProducts, { onConflict: 'id' });
    if (error) console.error("Products seed error:", error.message);
    else console.log("✓ Products seeded successfully!");
  }

  // 2. Seed Categories
  if (db.categories && db.categories.length > 0) {
    console.log(`Seeding ${db.categories.length} categories to Supabase...`);
    const formattedCategories = db.categories.map(c => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug,
      image: c.image,
      display_order: c.order || c.display_order || 0
    }));

    const { error } = await supabase.from('categories').upsert(formattedCategories, { onConflict: 'id' });
    if (error) console.error("Categories seed error:", error.message);
    else console.log("✓ Categories seeded successfully!");
  }

  // 3. Seed Orders
  if (db.orders && db.orders.length > 0) {
    console.log(`Seeding ${db.orders.length} orders to Supabase...`);
    const formattedOrders = db.orders.map(o => ({
      id: String(o.id),
      date: o.date || new Date().toLocaleString("tr-TR"),
      status: o.status || "Yeni Sipariş",
      customer_name: o.customerName || o.customer_name,
      customer_phone: o.customerPhone || o.customer_phone,
      customer_email: o.customerEmail || o.customer_email,
      recipient_name: o.recipientName || o.recipient_name,
      recipient_phone: o.recipientPhone || o.recipient_phone,
      address: o.address,
      delivery_date: o.deliveryDate || o.delivery_date,
      delivery_time: o.deliveryTime || o.delivery_time,
      items: o.items || [],
      addons: o.addons || [],
      card_note: o.cardNote || o.card_note,
      is_anonymous: o.isAnonymous === true,
      payment_method: o.paymentMethod || o.payment_method,
      total_amount: o.totalAmount || o.total_amount || o.totalPrice,
      prepared_photo: o.preparedPhoto || o.prepared_photo,
      customer_approval_status: o.customerApprovalStatus || o.customer_approval_status
    }));

    const { error } = await supabase.from('orders').upsert(formattedOrders, { onConflict: 'id' });
    if (error) console.error("Orders seed error:", error.message);
    else console.log("✓ Orders seeded successfully!");
  }

  // 4. Seed Cities/Regions
  if (db.cities && db.cities.length > 0) {
    console.log(`Seeding ${db.cities.length} active cities/regions to Supabase...`);
    const formattedCities = db.cities.map(c => ({
      id: String(c.id),
      plate: String(c.plate || c.id),
      name: c.name,
      active: c.active !== false,
      districts: c.districts || []
    }));

    const { error } = await supabase.from('cities').upsert(formattedCities, { onConflict: 'id' });
    if (error) console.error("Cities seed error:", error.message);
    else console.log("✓ Cities & Regions seeded successfully!");
  }

  // 5. Seed Extras (Ek Ürünler)
  if (db.extras && db.extras.length > 0) {
    console.log(`Seeding ${db.extras.length} extra gifts to Supabase...`);
    const formattedExtras = db.extras.map(e => ({
      id: String(e.id),
      display_order: e.order || 0,
      active: e.active !== false,
      image: e.image,
      price: String(e.price),
      names: e.names || { tr: e.name || "Ek Hediye" }
    }));

    const { error } = await supabase.from('extras').upsert(formattedExtras, { onConflict: 'id' });
    if (error) console.error("Extras seed error:", error.message);
    else console.log("✓ Extras seeded successfully!");
  }

  // 6. Seed Currencies
  if (db.currencySettings && db.currencySettings.currencies) {
    console.log(`Seeding currencies to Supabase...`);
    const formattedCurrencies = db.currencySettings.currencies.map(c => ({
      id: String(c.id || c.code),
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      rate: Number(c.rate),
      auto_sync: db.currencySettings.autoSync !== false
    }));

    const { error } = await supabase.from('currencies').upsert(formattedCurrencies, { onConflict: 'id' });
    if (error) console.error("Currencies seed error:", error.message);
    else console.log("✓ Currencies seeded successfully!");
  }

  // 7. Seed Delivery Slots
  if (db.deliverySlots && db.deliverySlots.length > 0) {
    console.log(`Seeding ${db.deliverySlots.length} delivery slots to Supabase...`);
    const formattedSlots = db.deliverySlots.map(s => ({
      id: String(s.id),
      slot: s.slot || s.range || '15:00 - 18:00',
      range: s.range || s.slot || '15:00 - 18:00',
      extra_fee: Number(s.extraFee || 0),
      same_day_cutoff: s.sameDayCutoff || s.cutoff,
      active: s.active !== false
    }));

    const { error } = await supabase.from('delivery_slots').upsert(formattedSlots, { onConflict: 'id' });
    if (error) console.error("Delivery slots seed error:", error.message);
    else console.log("✓ Delivery slots seeded successfully!");
  }

  // 8. Seed Reviews
  if (db.reviews && db.reviews.length > 0) {
    console.log(`Seeding ${db.reviews.length} reviews to Supabase...`);
    const formattedReviews = db.reviews.map(r => ({
      id: String(r.id),
      product: r.product,
      author: r.author,
      rating: Number(r.rating || 5),
      text: r.text,
      status: r.status || "Onaylandı",
      is_google: r.isGoogle === true,
      source: r.source || "Web"
    }));

    const { error } = await supabase.from('reviews').upsert(formattedReviews, { onConflict: 'id' });
    if (error) console.error("Reviews seed error:", error.message);
    else console.log("✓ Reviews seeded successfully!");
  }

  console.log("All data seeding finished!");
}

seedData();
