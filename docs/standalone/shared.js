/**
 * ====================================================================
 * تاج پی او ایس - Taj POS Pro (Shared Logic & Multi-User State)
 * زبان: خالص معیاری جاوا اسکرپٹ (JavaScript)
 * مطابقت: لوکل ہوسٹ، گٹ ہب پیجز اور نیٹلی فائی پر 100% سپورٹڈ
 * ====================================================================
 */

// 1. مرکزی ڈیٹا لوڈ اور محفوظ کرنے کے فنکشنز
function getTajData() {
  const defaultData = {
    shopName: 'تاج کریانہ اینڈ موبائل شاپ',
    shopAddress: 'صادق آباد، پنجاب',
    shopPhone: '0300-1234567',
    users: [
      { id: '1', username: 'admin', name: 'دکان کا مالک (Admin)', role: 'owner', pin: '1234' },
      { id: '2', username: 'staff1', name: 'کیشیئر / سیلزمین', role: 'staff', pin: '1122' }
    ],
    currentUser: { username: 'admin', name: 'دکان کا مالک', role: 'owner' },
    cashEntries: [
      { id: '1', type: 'opening', amount: 5000, desc: 'صبح کا اوپننگ کیش', time: '08:00 AM', user: 'admin' },
      { id: '2', type: 'in', amount: 1500, desc: 'کاؤنٹر کیش سیل', time: '09:30 AM', user: 'admin' },
      { id: '3', type: 'out', amount: 350, desc: 'دکان کا بل / چائے خرچ', time: '11:00 AM', user: 'admin' }
    ],
    customers: [
      { id: '1', name: 'محمد راشد بھائی', phone: '0301-7654321', amount: 2450, history: [] },
      { id: '2', name: 'طارق کریانہ کسٹمر', phone: '0345-1239876', amount: 850, history: [] }
    ],
    wholesalers: [
      { id: '1', name: 'مدینہ گھی اینڈ آئل ایجنسی', phone: '0300-9876543', amount: 14500, history: [] },
      { id: '2', name: 'یونی لیور سپلائر صادق آباد', phone: '0302-8877665', amount: 9200, history: [] }
    ],
    easyloadRecords: [
      { id: '1', network: 'Jazz', phone: '0300-1122334', amount: 300, commission: 8, time: '10:15 AM' },
      { id: '2', network: 'Telenor', phone: '0345-9988776', amount: 500, commission: 13, time: '11:45 AM' }
    ],
    bottles: [
      { id: '1', name: 'کوکاکولا 250ml ریگولر', full: 48, empty: 24, crates: 3 },
      { id: '2', name: 'پیپسی 250ml شیشہ بوتل', full: 24, empty: 48, crates: 3 },
      { id: '3', name: 'سپرائٹ 1.5 لیٹر پیٹ بوتل', full: 18, empty: 0, crates: 3 }
    ]
  };

  const stored = localStorage.getItem('taj_pos_standalone_data');
  if (!stored) {
    localStorage.setItem('taj_pos_standalone_data', JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Data parsing error', e);
    return defaultData;
  }
}

function saveTajData(data) {
  localStorage.setItem('taj_pos_standalone_data', JSON.stringify(data));
}

// 2. موجودہ صارف اور ملٹی یوزر سیکیورٹی
function getCurrentUser() {
  const data = getTajData();
  return data.currentUser || { username: 'admin', name: 'دکان کا مالک', role: 'owner' };
}

function switchUser(role) {
  const data = getTajData();
  if (role === 'staff') {
    data.currentUser = { username: 'staff1', name: 'سیلزمین / کیشیئر', role: 'staff' };
    alert('آپ اب بطور "سیلزمین (اسٹاف)" لاگ ان ہیں۔');
  } else {
    const pin = prompt('مالک (Admin) پن کوڈ درج کریں:', '1234');
    if (pin === '1234') {
      data.currentUser = { username: 'admin', name: 'دکان کا مالک', role: 'owner' };
      alert('خوش آمدید! آپ بطور "دکان کا مالک" لاگ ان ہو چکے ہیں۔');
    } else {
      alert('غلط پن کوڈ! صرف دکان کا مالک اس موڈ میں داخل ہو سکتا ہے۔');
      return;
    }
  }
  saveTajData(data);
  location.reload();
}

// 3. بیک اپ اور ری سٹور
function exportTajBackup() {
  const data = getTajData();
  const dateStr = new Date().toISOString().split('T')[0];
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Taj_POS_Backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importTajBackup(fileInput) {
  const file = fileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && typeof parsed === 'object') {
        saveTajData(parsed);
        alert('بیک اپ کامیابی سے بحال (Restore) ہو گیا!');
        location.reload();
      } else {
        alert('درست بیک اپ فائل منتخب کریں۔');
      }
    } catch (err) {
      alert('بیک اپ فائل پڑھنے میں خرابی: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// 4. خودکار نیویگیشن بار اور ہیڈر رینڈر کریں
function renderCommonHeaderAndNav(activePage) {
  const currentUser = getCurrentUser();
  const data = getTajData();
  const now = new Date();
  const dateStr = now.toLocaleDateString('ur-PK', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });

  // ہیڈر HTML
  const headerHTML = `
    <header class="app-header">
      <div class="header-container">
        <div class="logo-area">
          <div class="taj-crown-icon">👑</div>
          <div>
            <h1 class="shop-title">${data.shopName}</h1>
            <p class="shop-subtitle">${data.shopAddress} | فون: ${data.shopPhone}</p>
          </div>
        </div>
        <div class="header-right">
          <span class="user-badge ${currentUser.role === 'owner' ? 'badge-owner' : 'badge-staff'}">
            👤 ${currentUser.name} (${currentUser.role === 'owner' ? 'مالک' : 'اسٹاف'})
          </span>
          <button class="switch-user-btn" onclick="switchUser('${currentUser.role === 'owner' ? 'staff' : 'owner'}')">
            🔄 ${currentUser.role === 'owner' ? 'اسٹاف لاگ ان' : 'مالک لاگ ان'}
          </button>
          <span class="live-date-badge">${dateStr}</span>
          <button class="backup-btn" onclick="exportTajBackup()">💾 بیک اپ ڈاؤن لوڈ</button>
        </div>
      </div>
    </header>
    <nav class="nav-tabs">
      <a href="index.html" class="tab-link ${activePage === 'cashbook' ? 'active' : ''}">💵 روزنامچہ کیش</a>
      <a href="billing.html" class="tab-link ${activePage === 'billing' ? 'active' : ''}">🧾 فوری سیل و رسید</a>
      <a href="customers.html" class="tab-link ${activePage === 'customers' ? 'active' : ''}">👥 گاہک ادھار کھاتہ</a>
      <a href="wholesalers.html" class="tab-link ${activePage === 'wholesalers' ? 'active' : ''}">🏢 ہول سیلر کھاتہ</a>
      <a href="easyload.html" class="tab-link ${activePage === 'easyload' ? 'active' : ''}">📱 ایزی لوڈ و کمیشن</a>
      <a href="bottles.html" class="tab-link ${activePage === 'bottles' ? 'active' : ''}">🍾 بوتلیں و کریٹ</a>
    </nav>
  `;

  const target = document.getElementById('headerNavPlaceholder');
  if (target) {
    target.innerHTML = headerHTML;
  }
}
