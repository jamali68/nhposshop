/**
 * ====================================================================
 * گاہک ادھار کھاتہ لاجک - customers.js
 * خالص معیاری جاوا اسکرپٹ (No Frameworks)
 * ====================================================================
 */

let currentSearchTerm = '';

window.addEventListener('DOMContentLoaded', () => {
  renderCommonHeaderAndNav('customers');
  renderCustomersList();
});

function handleCustomerSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('custNameInput').value.trim();
  const phone = document.getElementById('custPhoneInput').value.trim() || '---';
  const amount = parseFloat(document.getElementById('custAmountInput').value) || 0;

  if (!name || amount <= 0) {
    alert('براہ کرم گاہک کا نام اور درست رقم درج کریں!');
    return;
  }

  const data = getTajData();
  const existing = data.customers.find(c => c.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    existing.amount += amount;
    if (phone !== '---') existing.phone = phone;
  } else {
    data.customers.push({
      id: 'cust_' + Date.now(),
      name: name,
      phone: phone,
      amount: amount,
      created: new Date().toLocaleDateString('ur-PK')
    });
  }

  saveTajData(data);
  renderCustomersList();

  document.getElementById('custNameInput').value = '';
  document.getElementById('custPhoneInput').value = '';
  document.getElementById('custAmountInput').value = '';

  alert(`گاہک "${name}" کے کھاتے میں Rs ${amount} کا ادھار کامیابی سے درج ہو گیا!`);
}

function filterCustomers() {
  currentSearchTerm = document.getElementById('searchCustomer').value.toLowerCase().trim();
  renderCustomersList();
}

function renderCustomersList() {
  const data = getTajData();
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  let totalUdhaar = 0;
  const filtered = data.customers.filter(c => {
    if (!currentSearchTerm) return true;
    return c.name.toLowerCase().includes(currentSearchTerm) || (c.phone && c.phone.includes(currentSearchTerm));
  });

  filtered.forEach((cust, index) => {
    totalUdhaar += cust.amount;

    // واٹس ایپ یاد دہانی میسج
    const cleanPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
    const waPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
    const waText = encodeURIComponent(`محترم ${cust.name} صاحب! تاج کریانہ اینڈ موبائل شاپ صادق آباد کی طرف سے یاد دہانی:\nآپ کے کھاتے کا بقایا واجب الادا ادھار Rs ${cust.amount.toLocaleString()} ہے۔ برائے مہربانی تشریف لا کر بقایا ادا فرما دیں۔ شکریہ!`);
    const waLink = cleanPhone ? `https://wa.me/${waPhone}?text=${waText}` : '#';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${cust.name}</strong></td>
      <td><span style="direction: ltr; display: inline-block;">${cust.phone}</span></td>
      <td style="color: #dc2626; font-weight: bold; font-size: 1.1rem;">Rs ${cust.amount.toLocaleString()}</td>
      <td>
        <button class="action-pay-btn" onclick="receiveCustomerPaymentModal(${index})">وصولی درج کریں 💵</button>
      </td>
      <td>
        ${cleanPhone ? `<a href="${waLink}" target="_blank" class="action-pay-btn" style="text-decoration: none; background: #25d366; color: #fff; border: none;">واٹس ایپ یاد دہانی 📲</a>` : '<span style="color:#94a3b8">نمبر نہیں ہے</span>'}
      </td>
      <td>
        <button class="delete-btn" onclick="deleteCustomerRecord(${index})">حذف 🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('statTotalUdhaar').textContent = 'Rs ' + totalUdhaar.toLocaleString();
  document.getElementById('statCustomerCount').textContent = data.customers.length;
}

function receiveCustomerPaymentModal(index) {
  const data = getTajData();
  const cust = data.customers[index];
  const payStr = prompt(`${cust.name} سے وصول شدہ رقم درج کریں:`, cust.amount);
  if (!payStr) return;

  const payAmount = parseFloat(payStr) || 0;
  if (payAmount <= 0) return;

  cust.amount = Math.max(0, cust.amount - payAmount);

  // کیش کاؤنٹر میں خود بخود نقد آمدنی شامل کریں
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  data.cashEntries.unshift({
    id: 'tx_' + Date.now(),
    type: 'in',
    amount: payAmount,
    desc: `ادھار وصولی: ${cust.name}`,
    time: timeStr,
    user: data.currentUser?.username || 'admin'
  });

  saveTajData(data);
  renderCustomersList();
  alert(`Rs ${payAmount} کامیابی سے وصول ہو گئے اور کیش کاؤنٹر میں شامل کر دیے گئے!`);
}

function deleteCustomerRecord(index) {
  if (confirm('کیا آپ واقعی یہ گاہک کھاتہ مکمل حذف کرنا چاہتے ہیں؟')) {
    const data = getTajData();
    data.customers.splice(index, 1);
    saveTajData(data);
    renderCustomersList();
  }
}
