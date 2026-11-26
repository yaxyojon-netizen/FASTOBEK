const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    })
  : null;

// Security PIN
const ADMIN_PIN = process.env.ADMIN_PIN || (process.env.NODE_ENV === 'production' ? null : '7777');

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// FASTO RESTAURANT NFC MENU DATA - ULTRA HIGH RESOLUTION CREATIVE FOOD IMAGES
const fastoMenu = {
  categories: [
    { id: 'fastfood', name: 'FastFood & Lavash', icon: '🌯', poster: '/images/menu_fastfood.png' },
    { id: 'chicken', name: 'Chicken (Tovuq)', icon: '🍗', poster: '/images/menu_chicken.png' },
    { id: 'coffee', name: 'Kofe (Coffee)', icon: '☕', poster: '/images/menu_coffee.png' },
    { id: 'drinks', name: 'Ichimliklar & Muzqaymoq', icon: '🥤', poster: '/images/menu_drinks_ice.png' },
    { id: 'sauces', name: 'Souslar & Qo\'shimchalar', icon: '🥫', poster: '/images/item_souslar.png' }
  ],
  items: [
    // ================= 1. FASTFOOD & LAVASH =================
    {
      id: 'f1',
      categoryId: 'fastfood',
      name: 'Tovuqli Lavash',
      description: 'Qovurilgan shirali tovuq filesi, yangi pomidor, bodring, chipslar va maxsus sous',
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=600&fit=crop',
      price: 24000,
      badge: 'TOP',
      variants: [
        { name: 'Kichik lavash', price: 24000 },
        { name: 'Katta lavash', price: 30000 },
        { name: 'Pishloqli kichik lavash', price: 26000 },
        { name: 'Pishloqli katta lavash', price: 32000 }
      ]
    },
    {
      id: 'f2',
      categoryId: 'fastfood',
      name: 'Go\'shtli Lavash',
      description: 'Grilda pishgan barra mol go\'shti, sabzavotlar, qarsildoq chips va Fasto sousi',
      image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=600&fit=crop',
      price: 30000,
      badge: 'Hit',
      variants: [
        { name: 'Kichik lavash', price: 30000 },
        { name: 'Katta lavash', price: 35000 },
        { name: 'Pishloqli kichik lavash', price: 32000 },
        { name: 'Pishloqli katta lavash', price: 37000 }
      ]
    },
    {
      id: 'f3',
      categoryId: 'fastfood',
      name: 'Tovuqli Burgerlar',
      description: 'Oltinrang qarsildoq tovuq kotleti, erigan pishloq, yangi aysberg salati',
      image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&h=600&fit=crop',
      price: 22000,
      variants: [
        { name: 'Chikenburger', price: 22000 },
        { name: 'Chizburger tovuqli', price: 26000 },
        { name: 'Dablburger tovuqli', price: 28000 },
        { name: 'Dablchizburger tovuqli', price: 30000 }
      ]
    },
    {
      id: 'f4',
      categoryId: 'fastfood',
      name: 'Go\'shtli Burgerlar',
      description: '100% tabiiy mol go\'shti kotleti, erigan cheddar pishlog\'i, pomidor va karamellangan piyoz',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop',
      price: 30000,
      badge: 'Lazzatli',
      variants: [
        { name: 'Gamburger', price: 30000 },
        { name: 'Chizburger go\'shtli', price: 34000 },
        { name: 'Dablburger go\'shtli', price: 45000 },
        { name: 'Dablchizburger go\'shtli', price: 50000 }
      ]
    },
    {
      id: 'f5',
      categoryId: 'fastfood',
      name: 'Hot Dog',
      description: 'Yumshoq qovurilgan bulochka, sersuv dudlangan sosiska, sous va xantal',
      image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&h=600&fit=crop',
      price: 18000,
      variants: [
        { name: 'Classic Hot Dog', price: 18000 },
        { name: 'Korolevskiy Hot Dog', price: 27000 }
      ]
    },
    {
      id: 'f6',
      categoryId: 'fastfood',
      name: 'Kartoshka Fri',
      description: 'Oltin rang, tashqarisi qarsildoq, ichi yumshoq sevimli kartoshka',
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=600&fit=crop',
      price: 13000,
      badge: 'Klassika',
      variants: [
        { name: 'Fri (Klassik)', price: 13000 },
        { name: 'Derevenskiy (Po-derevenski)', price: 18000 }
      ]
    },

    // ================= 2. CHICKEN =================
    {
      id: 'ch1',
      categoryId: 'chicken',
      name: 'Naggetslar (Nuggets)',
      description: 'Mayin tovuq filesidan oltin talqonli qarsildoq naggetslar',
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=600&fit=crop',
      price: 16000,
      badge: 'Sevimli',
      variants: [
        { name: '5 dona', price: 16000 },
        { name: '7 dona', price: 20000 },
        { name: '10 dona', price: 28000 }
      ]
    },
    {
      id: 'ch2',
      categoryId: 'chicken',
      name: 'Stripslar (Strips)',
      description: 'Maxsus Fasto ziravorlarida qovurilgan butun tovuq filesi chiziqchalari',
      image: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=600&fit=crop',
      price: 16000,
      variants: [
        { name: '3 dona', price: 16000 },
        { name: '5 dona', price: 24000 },
        { name: '7 dona', price: 33000 }
      ]
    },
    {
      id: 'ch3',
      categoryId: 'chicken',
      name: 'Qanotchalar',
      description: 'Qarsildoq, xushbo\'y va ishtahaochar qovurilgan tovuq qanotlari',
      image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&h=600&fit=crop',
      price: 19000,
      badge: 'Achchiq',
      variants: [
        { name: '3 dona', price: 19000 },
        { name: '5 dona', price: 29000 },
        { name: '7 dona', price: 40000 }
      ]
    },
    {
      id: 'ch4',
      categoryId: 'chicken',
      name: 'Sirli shariklar',
      description: 'Ichida erigan cho\'ziluvchan mozzarella pishloqli qarsildoq sharchalar',
      image: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&h=600&fit=crop',
      price: 22000,
      badge: 'TOP',
      variants: [
        { name: '5 dona', price: 22000 },
        { name: '7 dona', price: 30000 },
        { name: '10 dona', price: 42000 }
      ]
    },
    {
      id: 'ch5',
      categoryId: 'chicken',
      name: 'Crispy Burger',
      description: 'Katta qarsildoq tovuq filesi, erigan pishloq, yangi aysberg salati',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=600&fit=crop',
      price: 20000,
      variants: [
        { name: 'Crispy (Oddiy)', price: 20000 },
        { name: 'Crispy achchiq (Spicy)', price: 20000 }
      ]
    },
    {
      id: 'ch6',
      categoryId: 'chicken',
      name: 'Twister',
      description: 'Yupqa lavash ichida qarsildoq stripslar, sabzavotlar va mayin sous',
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=600&fit=crop',
      price: 22000,
      variants: [
        { name: 'Twister klassik', price: 22000 },
        { name: 'Twister achchiq', price: 22000 }
      ]
    },
    {
      id: 'ch7',
      categoryId: 'chicken',
      name: 'Boxmaster',
      description: 'Katta to\'yimli lavash: tovuq filesi, pishloq, qarsildoq kartoshkali kotlet va pomidor',
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=600&fit=crop',
      price: 37000,
      badge: 'Katta porsiya',
      variants: [
        { name: 'Boxmaster klassik', price: 37000 },
        { name: 'Boxmaster achchiq', price: 37000 }
      ]
    },
    {
      id: 'ch8',
      categoryId: 'chicken',
      name: 'Klab sendvich',
      description: 'Qovurilgan toster nonida tovuq filesi, tuxum, pishloq va barra pomidor',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=600&fit=crop',
      price: 35000,
      variants: [{ name: 'Standart porsiya', price: 35000 }]
    },
    {
      id: 'ch9',
      categoryId: 'chicken',
      name: 'Saladlar',
      description: 'Yangi sabzavotlardan tayyorlangan yengil va sog\'lom salatlar',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=600&fit=crop',
      price: 10000,
      variants: [
        { name: 'Coleslaw salati', price: 10000 },
        { name: 'Karamli salat', price: 10000 }
      ]
    },

    // ================= 3. COFFEE =================
    {
      id: 'c1',
      categoryId: 'coffee',
      name: 'Espresso (double)',
      description: 'Kuchli va xushbo\'y ikki hissa espresso, qalin oltinrang krema bilan',
      image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&h=600&fit=crop',
      price: 18000,
      badge: 'Klassika',
      variants: [{ name: 'Double', price: 18000 }]
    },
    {
      id: 'c2',
      categoryId: 'coffee',
      name: 'Americano',
      description: 'Klassik espresso va issiq suv uyg\'unligi, tiniq va tetiklantiruvchi ta\'m',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop',
      price: 16000,
      variants: [
        { name: 'M (O\'rtacha)', price: 16000 },
        { name: 'L (Katta)', price: 20000 }
      ]
    },
    {
      id: 'c3',
      categoryId: 'coffee',
      name: 'Cappuccino',
      description: 'Klassik espresso, qaynoq sut va qalin ipakdek sutli ko\'pik san\'ati',
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&h=600&fit=crop',
      price: 16000,
      badge: 'TOP',
      variants: [
        { name: 'S (Kichik)', price: 16000 },
        { name: 'M (O\'rtacha)', price: 20000 },
        { name: 'L (Katta)', price: 24000 }
      ]
    },
    {
      id: 'c4',
      categoryId: 'coffee',
      name: 'Late',
      description: 'Yumshoq sut va nozik espresso qorishmasi, yengil qahva sevuvchilar uchun',
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&h=600&fit=crop',
      price: 16000,
      variants: [
        { name: 'S (Kichik)', price: 16000 },
        { name: 'M (O\'rtacha)', price: 20000 },
        { name: 'L (Katta)', price: 24000 }
      ]
    },
    {
      id: 'c5',
      categoryId: 'coffee',
      name: 'Flat white',
      description: 'Kuchli ikki hissa espresso va ipakdek mayin bug\'langan sut',
      image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&h=600&fit=crop',
      price: 21000,
      variants: [
        { name: 'S (Kichik)', price: 21000 },
        { name: 'M (O\'rtacha)', price: 26000 },
        { name: 'L (Katta)', price: 30000 }
      ]
    },
    {
      id: 'c6',
      categoryId: 'coffee',
      name: 'Raf kofe',
      description: 'Qaymoq va vanil bilan birga ko\'pirtirilgan o\'zgacha shirin va mayin qahva',
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&h=600&fit=crop',
      price: 30000,
      badge: 'Shirin',
      variants: [{ name: 'M (O\'rtacha)', price: 30000 }]
    },
    {
      id: 'c7',
      categoryId: 'coffee',
      name: 'Bumble kofe',
      description: 'Tabiiy apelsin sharbati, karamel, muz va boy espresso qatlamlari',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop',
      price: 18000,
      badge: 'Hit',
      variants: [
        { name: 'M (O\'rtacha)', price: 18000 },
        { name: 'L (Katta)', price: 22000 }
      ]
    },
    {
      id: 'c8',
      categoryId: 'coffee',
      name: 'Hot chocolate (Issiq shokolad)',
      description: 'Haqiqiy shokolad va qaynoq sutdan tayyorlangan quyuq issiq shokolad',
      image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&h=600&fit=crop',
      price: 32000,
      variants: [{ name: 'M (O\'rtacha)', price: 32000 }]
    },
    {
      id: 'c9',
      categoryId: 'coffee',
      name: 'Ice cappuccino',
      description: 'Sovuq muz, qalin sut ko\'pigi va tetiklantiruvchi espresso',
      image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&h=600&fit=crop',
      price: 16000,
      variants: [
        { name: 'M (O\'rtacha)', price: 16000 },
        { name: 'L (Katta)', price: 20000 }
      ]
    },
    {
      id: 'c10',
      categoryId: 'coffee',
      name: 'Ice late',
      description: 'Muzli, tetiklantiruvchi va qatlamli sutli latte',
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop',
      price: 16000,
      variants: [
        { name: 'M (O\'rtacha)', price: 16000 },
        { name: 'L (Katta)', price: 20000 }
      ]
    },
    {
      id: 'c11',
      categoryId: 'coffee',
      name: 'Ice americano',
      description: 'Muzdek tetiklantiruvchi qora kofe',
      image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&h=600&fit=crop',
      price: 16000,
      variants: [
        { name: 'M (O\'rtacha)', price: 16000 },
        { name: 'L (Katta)', price: 20000 }
      ]
    },

    // ================= 4. DRINKS & ICE =================
    {
      id: 'd1',
      categoryId: 'drinks',
      name: 'Ice Tea (Muzli mevali choy)',
      description: 'Tabiiy mevalar, yangi damlangan choy va muz bilan tetiklantiruvchi ichimlik',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop',
      price: 18000,
      badge: 'Hit',
      variants: [
        { name: 'Malina', price: 18000 },
        { name: 'Mango marakuya', price: 19000 },
        { name: 'Lichiy ananas', price: 18000 },
        { name: 'Ananas greypfruit', price: 19000 }
      ]
    },
    {
      id: 'd2',
      categoryId: 'drinks',
      name: 'Limonad',
      description: 'Yangi uzilgan mevalar, laym, yalpiz va muzdek gazlangan suv',
      image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&h=600&fit=crop',
      price: 14000,
      badge: 'Yangi',
      variants: [
        { name: 'Klassik', price: 14000 },
        { name: 'Ananas', price: 17000 },
        { name: 'Qulupnay', price: 17000 },
        { name: 'Uzum', price: 20000 }
      ]
    },
    {
      id: 'd3',
      categoryId: 'drinks',
      name: 'Sutli choy (Boba Milk Tea)',
      description: 'Fasto maxsus tayyorlangan mayin sutli choy, boba va mevali qatlamlar',
      image: 'https://images.unsplash.com/photo-1558857563-b37cf5a4f783?w=600&h=600&fit=crop',
      price: 18000,
      badge: 'Trend',
      variants: [
        { name: 'Qulupnay', price: 18000 },
        { name: 'Qulupnay matcha', price: 20000 },
        { name: 'Oreo', price: 20000 },
        { name: 'Qovun kakos sutli choy', price: 30000 },
        { name: 'Mango kakos sutli choy', price: 30000 }
      ]
    },
    {
      id: 'd4',
      categoryId: 'drinks',
      name: 'Issiq choy (Choynakda)',
      description: 'Tabiiy barra mevalar, ziravorlar va xushbo\'y bargli choy',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&h=600&fit=crop',
      price: 5000,
      variants: [
        { name: 'Qora / ko\'k choy', price: 5000 },
        { name: 'Limon choy', price: 8000 },
        { name: 'Malina', price: 20000 },
        { name: 'Apelsin uzum', price: 20000 },
        { name: 'Mango greypfruit', price: 22000 },
        { name: 'Lichiy apelsin', price: 22000 }
      ]
    },
    {
      id: 'd5',
      categoryId: 'drinks',
      name: 'Fasto Muzqaymoq',
      description: 'Yumshoq italyan qaymoqli muzqaymoq tabiiy mevali siroplar bilan',
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=600&fit=crop',
      price: 18000,
      badge: 'Shirin',
      variants: [
        { name: 'Qulupnay', price: 18000 },
        { name: 'Malina', price: 18000 },
        { name: 'Mango', price: 18000 },
        { name: 'O\'rmon mevalari', price: 18000 },
        { name: 'Ananas', price: 18000 }
      ]
    },

    // ================= 5. SOUSLAR & TOPPINGS =================
    {
      id: 's1',
      categoryId: 'sauces',
      name: 'Sous Ketchup',
      description: 'Klassik quyuq pomidorli sous',
      image: '/images/sauce_ketchup.png',
      price: 3000,
      variants: [{ name: 'Portsiya', price: 3000 }]
    },
    {
      id: 's2',
      categoryId: 'sauces',
      name: 'Sous Sirniy (Pishloqli)',
      description: 'Kremli mayin pishloq sousi',
      image: '/images/sauce_sirniy.png',
      price: 3000,
      variants: [{ name: 'Portsiya', price: 3000 }]
    },
    {
      id: 's3',
      categoryId: 'sauces',
      name: 'Sous Chisnochiniy (Sarimsoqli)',
      description: 'Xushbo\'y sarimsoqli oq sous',
      image: '/images/sauce_chisnochniy.png',
      price: 3000,
      variants: [{ name: 'Portsiya', price: 3000 }]
    },
    {
      id: 's4',
      categoryId: 'sauces',
      name: 'Sous Kislo-sladkiy',
      description: 'Nordon-shirin maxsus sous',
      image: '/images/sauce_kislosladkiy.png',
      price: 3000,
      variants: [{ name: 'Portsiya', price: 3000 }]
    },
    {
      id: 's5',
      categoryId: 'sauces',
      name: 'Xalapeniyo (Jalapeno)',
      description: 'Achchiq marinadlangan xalapenyo qalampirlari',
      image: '/images/sauce_xalapeniyo.png',
      price: 3000,
      variants: [{ name: 'Portsiya', price: 3000 }]
    },
    {
      id: 's6',
      categoryId: 'sauces',
      name: 'Juice ball (20 gr)',
      description: 'Ichimliklar uchun sharbatli mevali portlovchi sharlar',
      image: '/images/topping_juiceball.png',
      price: 3000,
      variants: [{ name: '20 gr', price: 3000 }]
    },
    {
      id: 's7',
      categoryId: 'sauces',
      name: 'Kakos jele (50 gr)',
      description: 'Kokosli mazali jele bo\'laklari',
      image: '/images/topping_kakosjele.png',
      price: 3000,
      variants: [{ name: '50 gr', price: 3000 }]
    }
  ]
};

// In-memory storage is used for local development without a configured database.
let orders = [];
let waiterCalls = [];

function formatOrder(row) {
  const createdAt = new Date(row.created_at);
  return {
    id: row.id,
    table: row.table_number,
    items: row.items,
    total: Number(row.total),
    notes: row.notes,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    timestamp: createdAt.getTime()
  };
}

function formatWaiterCall(row) {
  const createdAt = new Date(row.created_at);
  return {
    id: row.id,
    table: row.table_number,
    reason: row.reason,
    status: row.status,
    time: createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    timestamp: createdAt.getTime()
  };
}

function tashkentDate(timestamp) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(timestamp));
}

async function getOrders() {
  if (!pool) return orders;
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  return result.rows.map(formatOrder);
}

async function getPendingWaiterCalls() {
  if (!pool) return waiterCalls.filter((call) => call.status === 'pending');
  const result = await pool.query(
    "SELECT * FROM waiter_calls WHERE status = 'pending' ORDER BY created_at DESC"
  );
  return result.rows.map(formatWaiterCall);
}

// ================= AUTHENTICATION =================
// Strictly verify PIN header or query or session
function verifyPin(pin) {
  return Boolean(ADMIN_PIN) && pin === ADMIN_PIN;
}

// Client routes
app.get('/', (req, res) => {
  const table = req.query.table || '1';
  res.render('index', { menu: fastoMenu, defaultTable: table });
});

app.get('/api/menu', (req, res) => {
  res.json(fastoMenu);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Client order
app.post('/api/order', asyncHandler(async (req, res) => {
  const { table, items, total, notes, paymentMethod } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Savatcha bo\'sh!' });
  }

  const orderId = 'FST-' + Math.floor(1000 + Math.random() * 9000);
  const newOrder = {
    id: orderId,
    table: table || '1',
    items,
    total,
    notes: notes || '',
    paymentMethod: paymentMethod || 'Naqd pul',
    status: 'new',
    createdAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  };

  if (pool) {
    await pool.query(
      `INSERT INTO orders (id, table_number, items, total, notes, payment_method, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0))`,
      [newOrder.id, newOrder.table, JSON.stringify(newOrder.items), newOrder.total,
        newOrder.notes, newOrder.paymentMethod, newOrder.status, newOrder.timestamp]
    );
  } else {
    orders.unshift(newOrder);
  }
  console.log(`[YANGI BUYURTMA] #${orderId} | Stol: #${newOrder.table} | Jami: ${total} so'm`);

  res.json({
    success: true,
    orderId,
    order: newOrder,
    message: `Buyurtmangiz qabul qilindi! Stol: #${newOrder.table}`
  });
}));

// Client call waiter
app.post('/api/call-waiter', asyncHandler(async (req, res) => {
  const { table, reason } = req.body;
  const call = {
    id: 'call_' + Date.now(),
    table: table || '1',
    reason: reason || 'Ofitsiant kerak',
    status: 'pending',
    time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  };
  if (pool) {
    await pool.query(
      `INSERT INTO waiter_calls (id, table_number, reason, status, created_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))`,
      [call.id, call.table, call.reason, call.status, call.timestamp]
    );
  } else {
    waiterCalls.unshift(call);
  }
  console.log(`[OFITSIANT CHAQIRILDI] Stol: #${call.table} | Sabab: ${call.reason}`);
  res.json({ success: true, message: `Stol #${call.table} uchun ofitsiantga xabar yuborildi!` });
}));

// ================= ADMIN ROUTE WITH LOCK SCREEN =================
// The dashboard is protected by the configured admin PIN.
app.get('/admin', (req, res) => {
  res.render('admin');
});

// Verify PIN API (used by lock screen)
app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (verifyPin(pin)) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Noto\'g\'ri PIN-kod!' });
});

// Protected Admin Data API: Requires X-Admin-Pin header
app.get('/api/admin/data', asyncHandler(async (req, res) => {
  const pinHeader = req.headers['x-admin-pin'] || req.query.pin;
  if (!verifyPin(pinHeader)) {
    return res.status(401).json({ success: false, message: 'Qulflangan. PIN-kod kiriting.' });
  }

  const allOrders = await getOrders();
  const pendingWaiterCalls = await getPendingWaiterCalls();
  const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const today = tashkentDate(Date.now());
  const todayOrders = allOrders.filter((order) => tashkentDate(order.timestamp) === today);
  const totalRevenue = todayOrders
    .filter(o => o.status === 'completed' || o.status === 'ready' || o.status === 'cooking')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  res.json({
    orders: allOrders,
    waiterCalls: pendingWaiterCalls,
    stats: {
      totalOrdersToday: todayOrders.length,
      activeOrdersCount: activeOrders.length,
      revenueToday: totalRevenue,
      pendingCallsCount: pendingWaiterCalls.length
    }
  });
}));

// Protected Order Status API
app.post('/api/admin/order-status', asyncHandler(async (req, res) => {
  const pinHeader = req.headers['x-admin-pin'] || req.body.pin;
  if (!verifyPin(pinHeader)) {
    return res.status(401).json({ success: false, message: 'Ruxsat yo\'q' });
  }

  const { id, status } = req.body;
  let order;
  if (pool) {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    order = result.rows[0] ? formatOrder(result.rows[0]) : null;
  } else {
    order = orders.find((item) => item.id === id);
    if (order) order.status = status;
  }
  if (order) {
    return res.json({ success: true, order });
  }
  res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
}));

// Protected Dismiss Call API
app.post('/api/admin/dismiss-call', asyncHandler(async (req, res) => {
  const pinHeader = req.headers['x-admin-pin'] || req.body.pin;
  if (!verifyPin(pinHeader)) {
    return res.status(401).json({ success: false, message: 'Ruxsat yo\'q' });
  }

  const { id } = req.body;
  if (pool) {
    const result = await pool.query(
      "UPDATE waiter_calls SET status = 'done' WHERE id = $1",
      [id]
    );
    if (result.rowCount > 0) return res.json({ success: true });
  } else {
    const call = waiterCalls.find((item) => item.id === id);
    if (call) {
      call.status = 'done';
      return res.json({ success: true });
    }
  }
  res.status(404).json({ success: false });
}));

app.use((error, req, res, next) => {
  console.error('[SERVER XATOSI]', error);
  if (res.headersSent) return next(error);
  res.status(500).json({ success: false, message: 'Serverda xatolik yuz berdi.' });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production' && !pool) {
    throw new Error('Production muhitida DATABASE_URL sozlanishi shart.');
  }
  if (process.env.NODE_ENV === 'production' && !ADMIN_PIN) {
    throw new Error('Production muhitida ADMIN_PIN sozlanishi shart.');
  }
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        table_number TEXT NOT NULL,
        items JSONB NOT NULL,
        total NUMERIC NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS waiter_calls (
        id TEXT PRIMARY KEY,
        table_number TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Fasto NFC Menu Server is running on port ${PORT}`);
  });
}

startServer().catch(async (error) => {
  console.error('[SERVER ISHGA TUSHMADI]', error);
  if (pool) await pool.end();
  process.exitCode = 1;
});
