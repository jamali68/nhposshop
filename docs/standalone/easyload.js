/**
 * ====================================================================
 * ایزی لوڈ لاجک فائل - easyload.js
 * خالص معیاری جاوا اسکرپٹ (No Frameworks)
 * ====================================================================
 */

// صفحہ لوڈ ہوتے ہی چلائیں
window.addEventListener('DOMContentLoaded', () => {
  renderCommonHeaderAndNav('easyload');
  renderEasyloadData();
});

// کمیشن پریویو اپڈیٹ کریں (2.5%)
function updateCommissionPreview() {
  const amount = parseFloat(document.getElementById('loadAmountInput').value) || 0;
  const comm = Math.round(amount * 0.025);
  document.getElementById('commissionPreview').value = 'Rs ' + comm;
}

// نیا ایزی لوڈ درج کرنا
function submitNewEasyload(e) {
  e.preventDefault();

  const network = document.getElementById('networkSelect').value;
  const phone = document.getElementById('customerPhone').value.trim();
  const amount = parseFloat(document.getElementById('loadAmountInput').value) || 0;

  if (!phone || amount < 50) {
    alert('براہ کرم درست موبائل نمبر اور کم از کم 50 روپے کا لوڈ لکھیں!');
    return;
  }

  const commission = Math.round(amount * 0.025);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const data = getTajData();

  // 1. ایزی لوڈ ریکارڈ میں شامل کریں
  data.easyloadRecords.unshift({
    id: 'load_' + Date.now(),
    network: network,
    phone: phone,
    amount: amount,
    commission: commission,
    time: timeStr
  });

  // 2. دکان کے کیش کاؤنٹر میں خود بخود نقد آمدنی درج کریں
  data.cashEntries.unshift({
    id: 'tx_' + Date.now(),
    type: 'in',
    amount: amount,
    desc: `ایزی لوڈ (${network}): ${phone}`,
    time: timeStr,
    user: data.currentUser?.username || 'admin'
  });

  saveTajData(data);
  renderEasyloadData();

  // فارم کلئیر کریں
  document.getElementById('customerPhone').value = '';
  document.getElementById('loadAmountInput').value = '';
  document.getElementById('commissionPreview').value = 'Rs 0';

  alert(`Rs ${amount} کا ${network} ایزی لوڈ کامیابی سے درج ہو گیا اور کیش کاؤنٹر میں شامل کر دیا گیا!`);
}

// ایزی لوڈ ریکارڈ اور سمری دکھانا
function renderEasyloadData() {
  const data = getTajData();
  const tbody = document.getElementById('easyloadTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  let totalLoad = 0;
  let totalComm = 0;

  data.easyloadRecords.forEach((item, index) => {
    totalLoad += item.amount;
    totalComm += item.commission;

    // واٹس ایپ میسج لنک
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
    const waText = encodeURIComponent(`تاج کریانہ اینڈ موبائل شاپ صادق آباد:\nمحترم کسٹمر، آپ کے نمبر ${item.phone} پر Rs ${item.amount} کا ${item.network} ایزی لوڈ کامیابی سے ہو گیا ہے۔ شکریہ!`);
    const waLink = `https://wa.me/${waPhone}?text=${waText}`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.time}</td>
      <td><span class="badge-in">${item.network}</span></td>
      <td><strong style="direction: ltr; display: inline-block;">${item.phone}</strong></td>
      <td style="font-weight: bold; color: #1e3a8a;">Rs ${item.amount.toLocaleString()}</td>
      <td style="color: #059669; font-weight: bold;">Rs ${item.commission}</td>
      <td>
        <a href="${waLink}" target="_blank" class="action-pay-btn" style="text-decoration: none; margin-left: 5px;">واٹس ایپ 💬</a>
        <button class="delete-btn" onclick="deleteEasyloadItem(${index})">حذف 🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('statTotalLoad').textContent = 'Rs ' + totalLoad.toLocaleString();
  document.getElementById('statTotalCommission').textContent = 'Rs ' + totalComm.toLocaleString();
  document.getElementById('statLoadCount').textContent = data.easyloadRecords.length;
}

// سنگل ایزی لوڈ ڈیلیٹ کریں
function deleteEasyloadItem(index) {
  if (confirm('کیا آپ واقعی یہ ایزی لوڈ ریکارڈ حذف کرنا چاہتے ہیں؟')) {
    const data = getTajData();
    data.easyloadRecords.splice(index, 1);
    saveTajData(data);
    renderEasyloadData();
  }
}

// آج کا تمام ایزی لوڈ خالی کریں
function clearTodayEasyload() {
  if (confirm('کیا آپ واقعی آج کا تمام ایزی لوڈ ریکارڈ کلئیر کرنا چاہتے ہیں؟')) {
    const data = getTajData();
    data.easyloadRecords = [];
    saveTajData(data);
    renderEasyloadData();
  }
}
