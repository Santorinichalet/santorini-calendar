import { db } from './firebase-config.js';
async function loadMonthBookings(monthIndex) {
  const year = 2025;
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const startKey = `${year}-${monthStr}-01`;
  const endKey   = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  const bookings = {};

  const snapshot = await db.collection("calendar2025")
    .where(firebase.firestore.FieldPath.documentId(), ">=", startKey)
    .where(firebase.firestore.FieldPath.documentId(), "<=", endKey)
    .get();

  snapshot.forEach(doc => {
    bookings[doc.id] = doc.data();
  });

  renderMonth(monthIndex, bookings);
}

    // المتغيرات العالمية
    let currentPeriod = null;
    let currentDateKey = null;
    let currentBookingData = null;
    let currentExpenseDocId = null;
    let expensesList = [];
    let expenseTypes = ['كهرباء','ماء','رواتب','تنظيف','انترنت','صيانة','أخرى'];


    // إظهار وإخفاء حقل العربون
    function toggleDepositGroup(show) {
      const group = document.getElementById('depositGroup');
      group.style.display = show ? 'flex' : 'none';
      if (!show) {
        document.getElementById('deposit').value = '';
        document.getElementById('remaining').textContent = '';
      }
    }

    // تحديث المتبقي عند إدخال المبلغ والعربون
    function updateRemaining() {
      const amount = parseFloat(document.getElementById('amount').value) || 0;
      const deposit = parseFloat(document.getElementById('deposit').value) || 0;
      const remaining = amount - deposit;
      document.getElementById('remaining').textContent = remaining > 0 ? `المتبقي: ${remaining}` : '';
    }

    // تحديث عرض الحجوزات في اليوم
    function renderBookings(dayEl, data) {
      dayEl.querySelectorAll('.booking-line').forEach(el => el.remove());
      if (!data) return;

      ['morning', 'evening', 'fullDay', 'overnight'].forEach(period => {
        if (data[period] && data[period].status && data[period].status.trim() !== 'متاح') {
          const div = document.createElement('div');
          div.className = 'booking-line ' + (data[period].status === 'محجوز' ? 'red' : 'orange');
          let text = '';
          switch (period) {
case 'morning': text = data[period].timePeriod ? `${data[period].timePeriod}` : ''; break;
case 'evening': text = data[period].timePeriod ? `${data[period].timePeriod}` : ''; break;

            case 'fullDay': text = 'كامل'; break;
            case 'overnight': text = 'مبيت'; break;
          }
          div.textContent = text;
          dayEl.appendChild(div);
        }
      });
    }

    // تحديث قائمة المصروفات في النافذة
    function renderExpenses() {
      const expenseListDiv = document.getElementById('expenseList');
      expenseListDiv.innerHTML = '';
      let total = 0;

      expensesList.forEach(exp => {
        total += parseFloat(exp.amount);
        const div = document.createElement('div');
        div.textContent = `${exp.type} : ${exp.amount} ر.ع`;
        expenseListDiv.appendChild(div);
      });

      // المجموع النهائي
      const totalDiv = document.createElement('div');
      totalDiv.style.fontWeight = 'bold';
      totalDiv.style.marginTop = '10px';
      totalDiv.textContent = `المجموع: ${total.toFixed(2)} ر.ع`;
      expenseListDiv.appendChild(totalDiv);
    }

    // حفظ المصروفات في فايرستور
    function saveExpenses() {
      if (!currentExpenseDocId) return;
      db.collection("expenses").doc(currentExpenseDocId).set({ items: expensesList })
        .then(() => renderExpenses())
        .catch(e => alert('خطأ في حفظ المصروفات: ' + e.message));
    }

    // تحميل بيانات المصروفات ونوعياتها
    async function loadExpenses(month) {
      currentExpenseDocId = `expenses-2025-${month}`;
      expensesList = [];
      document.getElementById('expenseList').innerHTML = '';
      document.getElementById('expenseTypeInput').style.display = 'none';
      document.getElementById('expenseTypeSelect').style.display = 'block';

      // تحميل أنواع المصروفات في القائمة المنسدلة (دمج أنواع ثابتة مع التي في المصروفات)
      const allTypes = [...new Set([...expenseTypes])];

      // تحميل بيانات المصروفات من فايرستور
      try {
        const doc = await db.collection("expenses").doc(currentExpenseDocId).get();
        if (doc.exists) {
          expensesList = doc.data().items || [];
          expensesList.forEach(exp => {
            if (!allTypes.includes(exp.type)) allTypes.push(exp.type);
          });
        }
      } catch(e) {
        alert('خطأ في تحميل المصروفات: ' + e.message);
      }

      // ملء القائمة المنسدلة بأنواع المصروفات
      const select = document.getElementById('expenseTypeSelect');
      select.innerHTML = '<option value="" disabled selected>اختر نوع المصروف</option>';
      allTypes.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        select.appendChild(opt);
      });

      renderExpenses();
      showPopup('expensesPopup');
    }

    // حدث تغيير اختيار نوع المصروف (إظهار حقل إدخال جديد إذا اخترت "أخرى")
    document.getElementById('expenseTypeSelect').addEventListener('change', (e) => {
      if (e.target.value === 'أخرى') {
        document.getElementById('expenseTypeInput').style.display = 'block';
        document.getElementById('expenseTypeInput').value = '';
        e.target.style.display = 'none';
      }
    });

document.getElementById('saveExpense').addEventListener('click', () => {
  let type = document.getElementById('expenseTypeSelect').value;
  if (!type) {
    type = document.getElementById('expenseTypeInput').value.trim();
    if (!type) {
      alert('يرجى إدخال نوع المصروف');
      return;
    }
  } else if (type === 'أخرى') {
    // خذ النص المدخل بدل "أخرى"
    type = document.getElementById('expenseTypeInput').value.trim();
    if (!type) {
      alert('يرجى إدخال نوع المصروف');
      return;
    }
  }
  
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  if (isNaN(amount) || amount <= 0) {
    alert('يرجى إدخال مبلغ صالح');
    return;
  }

  // تحديث أو إضافة المصروف
  const existingIndex = expensesList.findIndex(exp => exp.type === type);
  if (existingIndex !== -1) {
    expensesList[existingIndex].amount += amount;
  } else {
    expensesList.push({ type, amount });
  }

  if (!expenseTypes.includes(type)) expenseTypes.push(type);

  // تنظيف الحقول
  document.getElementById('expenseAmount').value = '';
  document.getElementById('expenseTypeInput').style.display = 'none';
  document.getElementById('expenseTypeInput').value = '';
  document.getElementById('expenseTypeSelect').style.display = 'block';
  document.getElementById('expenseTypeSelect').value = '';

  saveExpenses();
});

document.getElementById('deleteExpense').addEventListener('click', () => {
  let type = document.getElementById('expenseTypeSelect').value;
  
  if (!type || type === 'أخرى') {
    type = document.getElementById('expenseTypeInput').value.trim();
    if (!type) {
      alert('يرجى إدخال نوع المصروف');
      return;
    }
  }

  const amount = parseFloat(document.getElementById('expenseAmount').value);
  if (isNaN(amount) || amount <= 0) {
    alert('يرجى إدخال مبلغ صالح');
    return;
  }

  const existingIndex = expensesList.findIndex(exp => exp.type === type);
  if (existingIndex !== -1) {
    expensesList[existingIndex].amount -= amount;
    if (expensesList[existingIndex].amount <= 0) {
      expensesList.splice(existingIndex, 1);
      const typeStillExists = expensesList.some(exp => exp.type === type);
      if (!typeStillExists) {
        expenseTypes = expenseTypes.filter(t => t !== type);
      }
    }
    saveExpenses();
  } else {
    alert('نوع المصروف غير موجود');
  }

  // تنظيف الحقول
  document.getElementById('expenseAmount').value = '';
  document.getElementById('expenseTypeInput').style.display = 'none';
  document.getElementById('expenseTypeInput').value = '';
  document.getElementById('expenseTypeSelect').style.display = 'block';
  document.getElementById('expenseTypeSelect').value = '';
});


    // فتح نافذة المصروفات من زر الشهر
    function openExpenses(month) {
      loadExpenses(month);
    }

    // إظهار وإخفاء النافذة
    function showPopup(id) {
      document.getElementById(id).style.display = 'block';
    }
    function closePopup(id) {
      document.getElementById(id).style.display = 'none';
    }

    // تحديث المتبقي عند إدخال المبلغ والعربون
    document.getElementById('amount').addEventListener('input', updateRemaining);
    document.getElementById('deposit').addEventListener('input', updateRemaining);

    // عند تغيير نوع الحجز (عرض حقل العربون إذا عربون)
    document.getElementById('status').addEventListener('change', (e) => {
      toggleDepositGroup(e.target.value === 'عربون');
      if (e.target.value === 'متاح') {
        document.getElementById('amount').value = '';
        document.getElementById('deposit').value = '';
        document.getElementById('remaining').textContent = '';
        document.getElementById('guestName').value = '';
        document.getElementById('guestPhone').value = '';
        document.getElementById('notes').value = '';
      }
    });

    // عرض/إخفاء حقل الفترة الزمنية عند اختيار الفترة
    const periodSelect = document.getElementById('periodSelect');
    const timePeriodInput = document.getElementById('timePeriod');
    const timePeriodLabel = document.getElementById('timePeriodLabel');

    periodSelect.addEventListener('change', (e) => {
      currentPeriod = e.target.value;

      if (!currentPeriod) {
        clearBookingFields();
        return;
      }

      const periodData = (currentBookingData && currentBookingData[currentPeriod]) ? currentBookingData[currentPeriod] : null;

      if (!periodData) {
        clearBookingFields(false);
      } else {
        document.getElementById('status').value = periodData.status || '';
        document.getElementById('amount').value = periodData.amount || '';
        document.getElementById('deposit').value = periodData.deposit || '';
        updateRemaining();
        document.getElementById('guestName').value = periodData.guestName || '';
        document.getElementById('guestPhone').value = periodData.guestPhone || '';
        document.getElementById('notes').value = periodData.notes || '';
      }

      if (currentPeriod === 'morning' || currentPeriod === 'evening') {
        timePeriodInput.value = periodData ? (periodData.timePeriod || '') : '';
        timePeriodInput.style.display = 'block';
        timePeriodLabel.style.display = 'block';
      } else {
        timePeriodInput.value = '';
        timePeriodInput.style.display = 'none';
        timePeriodLabel.style.display = 'none';
      }

      toggleDepositGroup(periodData && periodData.status === 'عربون');

      if (periodData && (periodData.status === 'محجوز' || periodData.status === 'عربون')) {
        document.getElementById('showBookingCard').style.display = 'block';
      } else {
        document.getElementById('showBookingCard').style.display = 'none';
      }
    });

    function clearBookingFields(clearAll = true) {
      if (clearAll) {
        document.getElementById('status').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('deposit').value = '';
        document.getElementById('remaining').textContent = '';
        document.getElementById('guestName').value = '';
        document.getElementById('guestPhone').value = '';
        document.getElementById('notes').value = '';
      }
      timePeriodInput.value = '';
      timePeriodInput.style.display = (currentPeriod === 'morning' || currentPeriod === 'evening') ? 'block' : 'none';
      timePeriodLabel.style.display = (currentPeriod === 'morning' || currentPeriod === 'evening') ? 'block' : 'none';
      toggleDepositGroup(false);
      document.getElementById('showBookingCard').style.display = 'none';
    }

    // عند الضغط على يوم في التقويم لفتح نافذة الحجز
    document.addEventListener('click', (e) => {
      const dayEl = e.target.classList.contains('day') ? e.target : e.target.closest('.day');
      if (!dayEl) return;

      currentDateKey = dayEl.getAttribute('data-date');
      currentBookingData = null;
      currentPeriod = null;

      showPopup('bookingPopup');
      document.getElementById('bookingPopup').setAttribute('data-date', currentDateKey);

      periodSelect.value = '';
      clearBookingFields();

      // تحميل بيانات الحجز لليوم من Firebase
      db.collection("calendar2025").doc(currentDateKey).get().then(doc => {
        if (doc.exists) {
          currentBookingData = doc.data();
        } else {
          currentBookingData = {};
        }
      });
    });

    // حفظ بيانات الحجز في Firestore
document.getElementById('saveBooking').addEventListener('click', async () => {
  if (!currentDateKey) {
    alert('يرجى اختيار اليوم!');
    return;
  }
  if (!currentPeriod) {
    alert('يرجى اختيار الفترة!');
    return;
  }

  const status = document.getElementById('status').value;
  if (!status) {
    alert('يرجى اختيار نوع الحجز!');
    return;
  }

  if (status === 'متاح') {
    const confirmDelete = confirm('هل أنت متأكد من حذف الحجز لهذه الفترة؟');
    if (!confirmDelete) return;

    try {
      const docRef = db.collection("calendar2025").doc(currentDateKey);
      // احذف الفترة المحددة
      await docRef.update({ [currentPeriod]: firebase.firestore.FieldValue.delete() });
      toast('تم حذف الحجز بنجاح', 'success');
      // إعادة تحميل بيانات اليوم لعرض الحجوزات المتبقية
      const dayEl = document.querySelector(`.day[data-date='${currentDateKey}']`);
      const updatedDoc = await docRef.get();
      const newData = updatedDoc.exists ? updatedDoc.data() : {};
      if (dayEl) renderBookings(dayEl, newData);
      // إخفاء بطاقة الحجز
      document.getElementById('showBookingCard').style.display = 'none';
      currentBookingData = newData;
      closePopup('bookingPopup');
    } catch (e) {
      toast('حدث خطأ أثناء حذف الحجز', 'error');
      console.error(e);
    }
    return;

    try {
      const docRef = db.collection("calendar2025").doc(currentDateKey);

      await docRef.update({
        [currentPeriod]: firebase.firestore.FieldValue.delete()
      });

      alert('تم حذف الحجز بنجاح');
      currentBookingData = null;

      const dayEl = document.querySelector(`.day[data-date='${currentDateKey}']`);
      if (dayEl) renderBookings(dayEl, {});

      document.getElementById('showBookingCard').style.display = 'none';
      closePopup('bookingPopup');
    } catch (e) {
      alert('حدث خطأ أثناء حذف الحجز');
      console.error(e);
    }
    return;
  }

  // باقي حفظ الحجز العادي
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  if ((status === 'محجوز' || status === 'عربون') && amount <= 0) {
    alert('يرجى إدخال مبلغ صحيح!');
    return;
  }

  const periodData = {
    status,
    amount,
    deposit: status === 'عربون' ? (parseFloat(document.getElementById('deposit').value) || 0) : 0,
    guestName: document.getElementById('guestName').value.trim(),
    guestPhone: document.getElementById('guestPhone').value.trim(),
    notes: document.getElementById('notes').value.trim(),
    timePeriod: (currentPeriod === 'morning' || currentPeriod === 'evening') ? timePeriodInput.value.trim() : ''
  };

  const updatedData = {...(currentBookingData || {})};
  updatedData[currentPeriod] = periodData;

  try {
    await db.collection("calendar2025").doc(currentDateKey).set(updatedData);
    alert('تم حفظ البيانات بنجاح');
    currentBookingData = updatedData;

    const dayEl = document.querySelector(`.day[data-date='${currentDateKey}']`);
    if (dayEl) renderBookings(dayEl, currentBookingData);

    document.getElementById('showBookingCard').style.display = 'block';
  } catch (e) {
    alert('حدث خطأ أثناء الحفظ');
    console.error(e);
  }
});


    // عرض بطاقة الحجز
    function showBookingCard() {
      if (!currentPeriod || !currentBookingData || !currentBookingData[currentPeriod]) return;

      const data = currentBookingData[currentPeriod];
      const cardContent = document.getElementById('bookingCardContent');
      const periodNames = {morning: 'صباح', evening: 'مساء', fullDay: 'يوم كامل', overnight: 'مبيت'};

      cardContent.innerHTML = `
        <p><strong>نوع الحجز:</strong> ${data.status}</p>
        <p><strong>الفترة:</strong> ${periodNames[currentPeriod]}</p>
        <p><strong>الفترة الزمنية:</strong> ${data.timePeriod || 'لا توجد'}</p>
        <p><strong>السعر:</strong> ${data.amount} ريال عماني</p>
        ${data.status === 'عربون' ? `<p><strong>العربون:</strong> ${data.deposit} ريال عماني</p>` : ''}
        <p><strong>اسم الضيف:</strong> ${data.guestName}</p>
        <p><strong>رقم الهاتف:</strong> ${data.guestPhone}</p>
        <p><strong>ملاحظات:</strong> ${data.notes || 'لا توجد'}</p>
      `;

      showPopup('bookingCardPopup');
    }

    // زر عرض بطاقة الحجز
    document.getElementById('showBookingCard').addEventListener('click', showBookingCard);

    // تهيئة swiper للأشهر
    let swiper = null;
    document.addEventListener('DOMContentLoaded', () => {
      const monthsList = ['يناير 2025','فبراير 2025','مارس 2025','أبريل 2025','مايو 2025','يونيو 2025','يوليو 2025','أغسطس 2025','سبتمبر 2025','أكتوبر 2025','نوفمبر 2025','ديسمبر 2025'];
      const weekdays = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const initialMonthIndex = currentYear === 2025 ? currentMonth : 0;
      const monthsContainer = document.getElementById('monthsContainer');

      monthsList.forEach((month, index) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        const daysInMonth = new Date(2025, index + 1, 0).getDate();
const firstDay = new Date(2025, index, 1).getDay(); // 0 = الأحد, 1 = الاثنين…

let calendarGrid = '';

// أضف الأيام الفارغة قبل بداية الشهر
for (let i = 0; i < firstDay; i++) {
  calendarGrid += `<div class='day empty'></div>`;
}

// أضف الأيام الفعلية
for (let i = 1; i <= daysInMonth; i++) {
  const isToday = (index === currentMonth && currentYear === 2025 && i === currentDay);
  const dateKey = `2025-${String(index + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
  calendarGrid += `
    <div class='day${isToday ? " today" : ""}' data-date='${dateKey}'>
      <div class="day-number">${i}</div>
    </div>
  `;
}


        slide.innerHTML = `
          <div class="month-title">${month}</div>
          <div class="weekday-row">${weekdays.map(w => `<div>${w}</div>`).join('')}</div>
          <div class="calendar-grid">${calendarGrid}</div>
          <div class="month-buttons">
            <button onclick="openExpenses('${String(index+1).padStart(2,'0')}')">💰 المصروفات</button>
            <button onclick="showPopup('reportPopup')">📊 التقرير</button>
          </div>`;

        monthsContainer.appendChild(slide);

        // تحميل بيانات الحجوزات للأيام من فايرستور
        for (let i = 1; i <= daysInMonth; i++) {
          const dateKey = `2025-${String(index + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          db.collection("calendar2025").doc(dateKey).get().then(doc => {
            if (doc.exists) {
              const dayEl = slide.querySelector(`.day[data-date='${dateKey}']`);
              if (dayEl) renderBookings(dayEl, doc.data());
            }
          });
        }
      });

      swiper = new Swiper('.swiper', {
        slidesPerView: 'auto',
        centeredSlides: true,
        spaceBetween: 0,
        loop: true,
        effect: 'slide',
      });
      swiper.slideToLoop(initialMonthIndex, 0);
    });

    // زر "اليوم"
    document.getElementById('goToToday').addEventListener('click', () => {
      if (swiper) {
        const today = new Date();
        const monthIndex = today.getMonth();
        swiper.slideToLoop(monthIndex, 500);
      }
    });

    // زر عرض التقرير
    document.getElementById('generateReportBtn').addEventListener('click', async () => {
      const fromDateStr = document.getElementById('reportFromDate').value;
      const toDateStr = document.getElementById('reportToDate').value;
      const reportDiv = document.getElementById('reportContent');

      if (!fromDateStr || !toDateStr) {
        alert('يرجى اختيار تاريخي البداية والنهاية.');
        return;
      }
      if (fromDateStr > toDateStr) {
        alert('تاريخ "من" يجب أن يكون قبل أو يساوي تاريخ "إلى".');
        return;
      }

      reportDiv.innerHTML = 'جاري تحميل التقرير...';

      try {
        const fromDate = new Date(fromDateStr);
        const toDate = new Date(toDateStr);

        const oneDayMs = 24 * 60 * 60 * 1000;
        const totalDays = Math.floor((toDate - fromDate) / oneDayMs) + 1;

        let bookedDays = 0;
        let depositDays = 0;
        let totalIncome = 0;

        for (let i = 0; i < totalDays; i++) {
          const date = new Date(fromDate.getTime() + i * oneDayMs);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dayKey = `${year}-${month}-${day}`;

          const doc = await db.collection("calendar2025").doc(dayKey).get();
          if (doc.exists) {
            const data = doc.data();
            ['morning', 'evening', 'fullDay', 'overnight'].forEach(period => {
              if (data[period] && data[period].status) {
                if (data[period].status === 'محجوز') {
                  bookedDays++;
                  totalIncome += parseFloat(data[period].amount) || 0;
                } else if (data[period].status === 'عربون') {
                  depositDays++;
                  totalIncome += parseFloat(data[period].deposit) || 0;
                }
              }
            });
          }
        }

        function getMonthsBetween(start, end) {
          const months = [];
          let current = new Date(start.getFullYear(), start.getMonth(), 1);
          const last = new Date(end.getFullYear(), end.getMonth(), 1);
          while (current <= last) {
            months.push(String(current.getMonth() + 1).padStart(2, '0'));
            current.setMonth(current.getMonth() + 1);
          }
          return months;
        }

        const monthsInRange = getMonthsBetween(fromDate, toDate);

        let totalExpenses = 0;
        for (const month of monthsInRange) {
          const expensesDocId = `expenses-2025-${month}`;
          const expensesDoc = await db.collection("expenses").doc(expensesDocId).get();
          if (expensesDoc.exists) {
            const items = expensesDoc.data().items || [];
            totalExpenses += items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
          }
        }

        const netProfit = totalIncome - totalExpenses;

        reportDiv.innerHTML = `
          <p><strong>عدد الأيام المحجوزة:</strong> ${bookedDays}</p>
          <p><strong>عدد الأيام بعربون:</strong> ${depositDays}</p>
          <p><strong>إجمالي الدخل:</strong> ${totalIncome.toFixed(2)} ر.ع</p>
          <p><strong>إجمالي المصروفات:</strong> ${totalExpenses.toFixed(2)} ر.ع</p>
          <p><strong>صافي الأرباح:</strong> ${netProfit.toFixed(2)} ر.ع</p>
        `;

      } catch (error) {
        reportDiv.innerHTML = `<p style="color:red;">حدث خطأ أثناء تحميل التقرير: ${error.message}</p>`;
      }
    });
function toast(message, type = 'info') {
  const div = document.createElement('div');
  div.textContent = message;
  div.style.position = 'fixed';
  div.style.bottom = '20px';
  div.style.right = '20px';
  div.style.background = type === 'success' ? '#28a745' : (type === 'error' ? '#dc3545' : '#007bff');
  div.style.color = 'white';
  div.style.padding = '10px 20px';
  div.style.borderRadius = '8px';
  div.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
  div.style.zIndex = 9999;
  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}
(async () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const dateKey = `${y}-${m}-${d}`;

  const doc = await db.collection('calendar2025').doc(dateKey).get();

  if (doc.exists) {
    const data = doc.data();

    const hasBooking = Object.keys(data).some(period => {
      const p = data[period];
      return p.status && p.status !== 'متاح';
    });

    if (hasBooking) {
      // إشعار داخل الصفحة
      alert(`📅 لديك حجز اليوم (${dateKey})`);

      // إشعار سطح المكتب
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        new Notification('📅 لديك حجز اليوم!', {
          body: `تاريخ: ${dateKey}`,
          icon: 'https://i.ibb.co/271BVWXd/Santorini-Logo.png'
        });
      }
    }
  }
})();

