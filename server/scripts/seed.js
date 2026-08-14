require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const { sentimentFromRating } = require('../src/services/sentiment');
const { toSqliteUtc } = require('../src/utils/hash');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

const CATEGORY_KEYS = [
  'food_quality', 'poor_service', 'long_wait', 'low_quality', 'high_price',
  'cleanliness', 'atmosphere', 'limited_variety', 'unprofessional_staff', 'other',
];

const SAMPLE_COMMENTS = {
  negative: [
    'חיכינו יותר מדי זמן להזמנה ואף אחד לא התנצל.',
    'האוכל הגיע קר והמנה לא הייתה כמו בתמונה.',
    'השירות היה לא קשוב, קראנו למלצר כמה פעמים.',
    'המחיר גבוה ביחס לכמות ולאיכות שקיבלנו.',
  ],
  neutral: [
    'הביקור היה בסדר, לא משהו מיוחד.',
    'האוכל טעים אבל המקום היה רועש מדי.',
    'שירות סביר, יכול להיות יותר טוב.',
  ],
  positive: [
    'ארוחה מצוינת, נחזור בהחלט!',
    'השירות היה אדיב ומקצועי, תודה רבה.',
    'האוכל היה טרי וטעים מאוד, ממליצים בחום.',
    'חוויה נהדרת מהרגע שנכנסנו ועד שיצאנו.',
  ],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function seedAdmin() {
  const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    console.log(`[seed] Admin user already exists (${normalizedEmail}), skipping.`);
    return existing.id;
  }
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
    .run(normalizedEmail, passwordHash, 'מנהל ראשי', 'super_admin');
  console.log(`[seed] Created super_admin user: ${normalizedEmail} / ${ADMIN_PASSWORD}`);
  return result.lastInsertRowid;
}

function seedRestaurantAndBranches() {
  const restaurantName = 'אהרוני\'ס';
  const restaurantSlug = 'demo-chain';
  let restaurant = db.prepare('SELECT * FROM restaurants WHERE name = ?').get(restaurantName);
  if (restaurant) {
    console.log(`[seed] Restaurant "${restaurantName}" already exists, skipping restaurant/branch creation.`);
    const branches = db.prepare('SELECT * FROM branches WHERE restaurant_id = ?').all(restaurant.id);
    return { restaurant, branches };
  }

  const result = db
    .prepare('INSERT INTO restaurants (name, slug, primary_color, accent_color, default_rating_threshold) VALUES (?, ?, ?, ?, ?)')
    .run(restaurantName, restaurantSlug, '#E84C89', '#FCD34D', 4);
  restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(result.lastInsertRowid);
  console.log(`[seed] Created restaurant "${restaurantName}" (id=${restaurant.id}, slug=${restaurantSlug})`);

  const branchDefs = [
    { name: 'שרונה מרקט — תל אביב', slug: 'sarona', reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJfYZdfeRLHRURhyjg5s6_g1o' },
    { name: 'ביג פאשן גלילות — רמת השרון', slug: 'glilot', reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJZbingd9JHRURTBEu-DuAFtg' },
    { name: 'צים אורבן — גני תקווה', slug: 'ganei-tikva', reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJg2k01rY1HRURVeFneTCM0W8' },
  ];

  const branches = branchDefs.map((def) => {
    const r = db
      .prepare(
        `INSERT INTO branches (restaurant_id, name, slug, review_url, rating_threshold, manager_email)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(restaurant.id, def.name, def.slug, def.reviewUrl, 4, 'branch-manager@example.com');
    console.log(`[seed] Created branch "${def.name}" (slug=${def.slug})`);
    return db.prepare('SELECT * FROM branches WHERE id = ?').get(r.lastInsertRowid);
  });

  return { restaurant, branches };
}

function seedResponses(branches, count) {
  const existingCount = db
    .prepare('SELECT COUNT(*) as c FROM responses WHERE branch_id IN (' + branches.map(() => '?').join(',') + ')')
    .get(...branches.map((b) => b.id)).c;

  if (existingCount > 0) {
    console.log(`[seed] Responses already exist for seeded branches (${existingCount}), skipping dummy data.`);
    return;
  }

  const insert = db.prepare(
    `INSERT INTO responses (branch_id, rating, source, categories, comment, customer_name, customer_phone, customer_email,
       contact_consent, redirected_out, sentiment, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const statuses = ['pending', 'in_progress', 'resolved', 'closed'];
  const sources = ['table-1', 'table-2', 'table-5', 'invoice', 'counter'];
  const names = ['דנה', 'יוסי', 'מאיה', 'אורי', 'שירה', 'רועי', 'נועה', 'איתי', null, null];

  const tx = db.transaction(() => {
    for (let i = 0; i < count; i += 1) {
      const branch = pick(branches);
      const rating = randomInt(1, 5);
      const sentiment = sentimentFromRating(rating);
      const isLow = rating < branch.rating_threshold;
      const daysAgo = randomInt(0, 13);
      const hour = randomInt(8, 22);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      createdAt.setHours(hour, randomInt(0, 59), 0, 0);

      let categories = null;
      let comment = null;
      let name = null;
      let phone = null;
      let email = null;
      let consent = 0;

      if (isLow) {
        const numCategories = randomInt(0, 3);
        const shuffled = [...CATEGORY_KEYS].sort(() => Math.random() - 0.5);
        categories = JSON.stringify(shuffled.slice(0, numCategories));
        comment = Math.random() > 0.3 ? pick(SAMPLE_COMMENTS[sentiment] || SAMPLE_COMMENTS.negative) : null;
        if (Math.random() > 0.5) {
          name = pick(names) || 'לקוח/ה';
          phone = Math.random() > 0.5 ? `05${randomInt(0, 9)}${randomInt(1000000, 9999999)}` : null;
          email = !phone ? `customer${i}@example.com` : null;
          consent = 1;
        }
      } else if (sentiment === 'neutral' && Math.random() > 0.6) {
        comment = pick(SAMPLE_COMMENTS.neutral);
      }

      insert.run(
        branch.id,
        rating,
        pick(sources),
        categories,
        comment,
        name,
        phone,
        email,
        consent,
        isLow ? 0 : 1,
        sentiment,
        isLow ? pick(statuses) : 'closed',
        toSqliteUtc(createdAt)
      );
    }
  });

  tx();
  console.log(`[seed] Inserted ${count} dummy responses across ${branches.length} branches.`);
}

function seedBranchManager(branches) {
  const email = 'branch-manager@example.com'.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing || !branches.length) return;
  const passwordHash = bcrypt.hashSync('Manager123!', 10);
  db.prepare('INSERT INTO users (email, password_hash, name, role, restaurant_id, branch_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    email, passwordHash, `מנהל סניף ${branches[0].name}`, 'branch_manager', branches[0].restaurant_id, branches[0].id
  );
  console.log(`[seed] Created branch_manager user: ${email} / Manager123!`);
}

function seedRestaurantAdmin(restaurant) {
  const email = 'restaurant-admin@example.com'.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return;
  const passwordHash = bcrypt.hashSync('Restaurant123!', 10);
  db.prepare('INSERT INTO users (email, password_hash, name, role, restaurant_id) VALUES (?, ?, ?, ?, ?)').run(
    email, passwordHash, 'מנהל רשת הדוגמה', 'restaurant_admin', restaurant.id
  );
  console.log(`[seed] Created restaurant_admin user: ${email} / Restaurant123!`);
}

function main() {
  const skipDummy = process.argv.includes('--no-dummy');

  console.log('[seed] Starting database seed...');
  seedAdmin();
  const { restaurant, branches } = seedRestaurantAndBranches();
  seedRestaurantAdmin(restaurant);
  seedBranchManager(branches);

  if (!skipDummy) {
    seedResponses(branches, 50);
  } else {
    console.log('[seed] Skipped dummy responses (--no-dummy flag).');
  }

  console.log('[seed] Done.');
  console.log('');
  console.log('Login credentials:');
  console.log(`  super_admin      -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('  restaurant_admin -> restaurant-admin@example.com / Restaurant123!');
  console.log('  branch_manager   -> branch-manager@example.com / Manager123!');
}

main();
