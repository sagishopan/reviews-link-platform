# Reviews Link Platform

פלטפורמה לניהול דירוגי לקוחות במסעדות: עמוד דירוג בסריקת QR, ניתוב אוטומטי לביקורות גוגל/אחר בדירוג גבוה, וטופס משוב פנימי בדירוג נמוך + פאנל ניהול.

## מבנה הפרויקט

```
/
├── server/           Express API + SQLite, מגיש גם את קבצי ה-build של הלקוח
│   ├── src/
│   │   ├── db/            סכמה וחיבור למסד הנתונים (better-sqlite3)
│   │   ├── middleware/     אימות JWT, הרשאות, הגבלת קצב
│   │   ├── routes/
│   │   │   ├── auth.js         התחברות
│   │   │   ├── public.js       עמוד דירוג ציבורי (ללא אימות)
│   │   │   └── admin/          כל נתיבי פאנל הניהול (מוגנים)
│   │   ├── services/       שכבת התראות (Email/WhatsApp/Webhook), סנטימנט
│   │   └── utils/          עזרים: sanitize קלט, hash, סינון תגובות
│   └── scripts/seed.js    יצירת מסד + משתמשים + נתוני דמה
├── client/           (יתווסף בשלב הבא) React + Vite + Tailwind
├── package.json      workspaces root - מתקין ובונה את שני הצדדים יחד
└── railway.json       תצורת פריסה ל-Railway
```

## התקנה מקומית

דרישות: Node.js 18 ומעלה.

```bash
# 1. התקנת תלויות (root, server, client - דרך npm workspaces)
npm install

# 2. יצירת קובץ סביבה
cp server/.env.example server/.env
# ערכו את server/.env ולוודאו שיש JWT_SECRET אקראי וארוך

# 3. יצירת מסד הנתונים + משתמשים + נתוני דמה
npm run seed

# 4. הרצת השרת במצב פיתוח
npm run dev:server
```

השרת יעלה בכתובת `http://localhost:4000`. בשלב זה (לפני בניית הלקוח) בקשות לנתיבים שאינם `/api/*` יחזירו הודעת טקסט פשוטה במקום את האתר - זה צפוי, הלקוח ייבנה בשלב הבא.

### בדיקת ה-API

```bash
# בריאות כללית - מידע על סניף לדוגמה
curl http://localhost:4000/api/public/branches/tel-aviv

# התחברות כמנהל ראשי
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

## משתמשי דמה שנוצרים על ידי סקריפט ה-seed

| תפקיד | אימייל | סיסמה |
|---|---|---|
| super_admin | admin@example.com | Admin123! |
| restaurant_admin | restaurant-admin@example.com | Restaurant123! |
| branch_manager | branch-manager@example.com | Manager123! |

**חשוב:** יש להחליף את הסיסמאות האלה בסביבת production (או להגדיר `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` לפני ההרצה הראשונה).

נוצרת גם רשת לדוגמה ("רשת הדוגמה") עם שני סניפים (`tel-aviv`, `haifa`) ו-50 תגובות דמה פרוסות על פני 14 הימים האחרונים, לבדיקת לוח המחוונים.

## משתני סביבה (`server/.env`)

```
PORT=4000
DATABASE_PATH=./data/reviews.db
JWT_SECRET=               # חובה להחליף לערך אקראי וארוך
JWT_EXPIRES_IN=7d
BASE_URL=http://localhost:4000

RATING_RATE_LIMIT_PER_HOUR=5

NOTIFY_EMAIL_ENABLED=false
RESEND_API_KEY=
NOTIFY_FROM_EMAIL=

NOTIFY_WHATSAPP_ENABLED=false
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=

NOTIFY_WEBHOOK_ENABLED=false
WEBHOOK_URL=
```

כל ערוץ התראה (Email / WhatsApp / Webhook) דולק בנפרד גם ברמת השרת (env) וגם ברמת הסניף (בפאנל הניהול) - שני התנאים צריכים להתקיים כדי שהתראה תישלח.

## פריסה ל-Railway

1. חברו את הריפו ל-Railway (או `railway up`).
2. הוסיפו Volume וחברו אותו לנתיב כמו `/data`, והגדירו `DATABASE_PATH=/data/reviews.db` - כך מסד הנתונים ישרוד דיפלוי מחדש (SQLite הוא קובץ יחיד על הדיסק, לא DB מנוהל).
3. הגדירו את שאר משתני הסביבה (`JWT_SECRET`, `BASE_URL` לפי הדומיין שתקבלו מ-Railway, ופרטי ערוצי ההתראה אם רלוונטי).
4. Railway יריץ `npm install && npm run build` בבנייה, ו-`npm run start` בהרצה (מוגדר ב-`railway.json`).
5. לאחר הדיפלוי הראשון הריצו פעם אחת `npm run seed` (למשל דרך `railway run npm run seed`) כדי ליצור את המשתמש הראשי.

## הרצת הלקוח במצב פיתוח

```bash
npm run dev:client   # http://localhost:5173 - מגיש גם את /admin
npm run dev:server   # http://localhost:4000 - ה-API (Vite מפנה אליו /api)
```

עמוד הלקוח: `http://localhost:5173/r/<restaurant-slug>` (לדוגמה `/r/demo-chain` עם נתוני הדמו).
פאנל הניהול: `http://localhost:5173/admin/login`.

## סטטוס נוכחי

✅ שלב 1 - מסד נתונים + שרת
✅ שלב 2 - צד לקוח (בחירת סניף, עמוד דירוג, טופס משוב תלת-שלבי)
✅ שלב 3 - פאנל ניהול (דשבורד, פידבק, אנליטיקות, עסקים שלי + QR, הגדרות)
⏳ שלב 4 - מודולים אופציונליים (מועדון לקוחות, גלגל מזל) - טרם התחיל
