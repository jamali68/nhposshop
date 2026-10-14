/**
 * ====================================================================
 * روزنامچہ کیش کاؤنٹر لاجک - app.js
 * خالص معیاری جاوا اسکرپٹ (No Frameworks)
 * دکان: تاج کریانہ اینڈ موبائل شاپ (صادق آباد)
 * ====================================================================
 */

// صفحہ لوڈ ہوتے ہی چلائیں
window.addEventListener('DOMContentLoaded', () => {
  renderCommonHeaderAndNav('cashbook');
  renderCashbook();
});

// نئی کیش انٹری شامل کرنا
function handleCashEntry(event) {
  event.preventDefault();

  const type = document.getElementById('cashType').value;
  const amount = parseFloat(document.getElementById('cashAmount').value) || 0;
  const desc = document.getElementById('cashDesc').value.trim();

  if (amount <= 0 || !desc) {
    alert('براہ کرم درست رقم اور تفصیل درج کریں!');
    return;
  }

  const data = getTajData();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  data.cashEntries.unshift({
    id: 'tx_' + Date.now(),
    type: type, // 'in' | 'out' | 'opening'
    amount: amount,
    desc: desc,
    time: timeStr,
    user: data.currentUser?.name || 'دکان کا مالک'
  });

  saveTajData(data);
  renderCashbook();

  // فارم خالی کریں
  document.getElementById('cashAmount').value = '';
  document.getElementById('cashDesc').value = '';
}

// کیش بک ٹیبل اور سمری رینڈر کریں
function renderCashbook() {
  const data = getTajData();
  const tbody = document.getElementById('cashbookTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  let totalIn = 0;
  let totalOut = 0;
  let openingCash = 0;

  data.cashEntries.forEach((item, index) => {
    if (item.type === 'in') totalIn += item.amount;
    if (item.type === 'out') totalOut += item.amount;
    if (item.type === 'opening') openingCash += item.amount;

    const row = document.createElement('tr');
    
    let typeBadge = '';
    if (item.type === 'in') typeBadge = '<span class="badge-in">آمدنی (In)</span>';
    else if (item.type === 'out') typeBadge = '<span class="badge-out">خرچ (Out)</span>';
    else typeBadge = '<span class="badge-opening">اوپننگ (Opening)</span>';

    row.innerHTML = `
      <td>${item.time}</td>
      <td>${typeBadge}</td>
      <td><strong>${item.desc}</strong></td>
      <td><span style="font-size:0.8rem; color:#64748b;">${item.user || 'مالک'}</span></td>
      <td style="font-weight: bold; color: ${item.type === 'out' ? '#dc2626' : '#059669'};">Rs ${item.amount.toLocaleString()}</td>
      <td><button class="delete-btn" onclick="deleteCashEntry(${index})">حذف 🗑️</button></td>
    `;
    tbody.appendChild(row);
  });

  const netCash = (openingCash + totalIn) - totalOut;

  document.getElementById('statOpeningCash').textContent = 'Rs ' + openingCash.toLocaleString();
  document.getElementById('statTotalIn').textContent = 'Rs ' + totalIn.toLocaleString();
  document.getElementById('statTotalOut').textContent = 'Rs ' + totalOut.toLocaleString();
  document.getElementById('statNetCash').textContent = 'Rs ' + netCash.toLocaleString();
}

// کیش انٹری ڈیلیٹ کریں
function deleteCashEntry(index) {
  if (confirm('کیا آپ واقعی یہ کیش انٹری ڈیلیٹ کرنا چاہتے ہیں؟')) {
    const data = getTajData();
    data.cashEntries.splice(index, 1);
    saveTajData(data);
    renderCashbook();
  }
}
