const financeForm = document.getElementById('finance-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const typeInput = document.getElementById('type');
const transactionList = document.getElementById('transaction-list');
const totalBalanceDisplay = document.getElementById('total-balance');

// Ambil elemen input tanggal baru
const dateInput = document.getElementById('transaction-date');

const dayIncomeEle = document.getElementById('day-income');
const dayExpenseEle = document.getElementById('day-expense');
const weekIncomeEle = document.getElementById('week-income');
const weekExpenseEle = document.getElementById('week-expense');
const monthIncomeEle = document.getElementById('month-income');
const monthExpenseEle = document.getElementById('month-expense');
const yearIncomeEle = document.getElementById('year-income');
const yearExpenseEle = document.getElementById('year-expense');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'Semua';

// Fungsi bantu untuk mengatur tanggal default form ke hari ini
function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
}

// --- MENGHITUNG REKAPITULASI WAKTU ---
function calculateTimeBasics() {
    const now = new Date();
    
    let rekap = {
        day: { income: 0, expense: 0 },
        week: { income: 0, expense: 0 },
        month: { income: 0, expense: 0 },
        year: { income: 0, expense: 0 }
    };

    // Deteksi awal minggu ini (Hari Senin jam 00:00)
    const currentDay = now.getDay(); 
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    transactions.forEach(t => {
        // Menggunakan t.date (tanggal kustom), jika data lama belum punya, fallback ke t.id (timestamp)
        const tDate = t.date ? new Date(t.date) : new Date(t.id);
        const nominal = t.amount;
        const isIncome = t.type === 'income';

        // A. Cek Harian
        if (tDate.toDateString() === now.toDateString()) {
            if (isIncome) rekap.day.income += nominal;
            else rekap.day.expense += nominal;
        }

        // B. Cek Mingguan
        if (tDate.getTime() >= startOfWeek.getTime() && tDate.getTime() <= now.getTime()) {
            if (isIncome) rekap.week.income += nominal;
            else rekap.week.expense += nominal;
        }

        // C. Cek Bulanan
        if (tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
            if (isIncome) rekap.month.income += nominal;
            else rekap.month.expense += nominal;
        }

        // D. Cek Tahunan
        if (tDate.getFullYear() === now.getFullYear()) {
            if (isIncome) rekap.year.income += nominal;
            else rekap.year.expense += nominal;
        }
    });

    dayIncomeEle.innerText = 'Rp ' + rekap.day.income.toLocaleString('id-ID');
    dayExpenseEle.innerText = 'Rp ' + rekap.day.expense.toLocaleString('id-ID');
    weekIncomeEle.innerText = 'Rp ' + rekap.week.income.toLocaleString('id-ID');
    weekExpenseEle.innerText = 'Rp ' + rekap.week.expense.toLocaleString('id-ID');
    monthIncomeEle.innerText = 'Rp ' + rekap.month.income.toLocaleString('id-ID');
    monthExpenseEle.innerText = 'Rp ' + rekap.month.expense.toLocaleString('id-ID');
    yearIncomeEle.innerText = 'Rp ' + rekap.year.income.toLocaleString('id-ID');
    yearExpenseEle.innerText = 'Rp ' + rekap.year.expense.toLocaleString('id-ID');
}

// Fungsi utama memperbarui tampilan ringkasan daftar (DOM)
function updateDOM(filterKeyword = 'Semua') {
    transactionList.innerHTML = '';
    let totalBalance = 0;

    // Urutkan transaksi dari tanggal terbaru ke terlama agar riwayat rapi
    transactions.sort((a, b) => new Date(b.date || b.id) - new Date(a.date || a.id));

    transactions.forEach((transaction) => {
        const isIncome = transaction.type === 'income';
        
        if (isIncome) {
            totalBalance += transaction.amount;
        } else {
            totalBalance -= transaction.amount;
        }

        if (filterKeyword !== 'Semua' && transaction.category !== filterKeyword) {
            return; 
        }

        const sign = isIncome ? '+' : '-';
        const li = document.createElement('li');
        li.classList.add('transaction-item', transaction.type);

        const formattedAmount = 'Rp ' + transaction.amount.toLocaleString('id-ID');
        
        // Format tampilan tanggal riwayat agar mudah dibaca (Contoh: 23 Mei 2026)
        const dateObj = transaction.date ? new Date(transaction.date) : new Date(transaction.id);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        li.innerHTML = `
            <div>
                <strong>${transaction.description}</strong> 
                <span class="category-badge">${transaction.category}</span>
                <p style="font-size: 0.75rem; color: #888; margin-top: 2px;">📅 ${formattedDate}</p>
                <p style="font-size: 0.85rem; color: #666; margin-top: 4px;">${sign} ${formattedAmount}</p>
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">✕</button>
        `;

        transactionList.appendChild(li);
    });

    totalBalanceDisplay.innerText = 'Rp ' + totalBalance.toLocaleString('id-ID');
    totalBalanceDisplay.style.color = totalBalance < 0 ? 'var(--danger)' : 'white';

    calculateTimeBasics();
}

function filterTransactions(category, buttonElement) {
    currentFilter = category;
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    updateDOM(currentFilter);
}

function addTransaction(e) {
    e.preventDefault();

    const newTransaction = {
        id: Date.now(), 
        description: descriptionInput.value,
        amount: parseInt(amountInput.value),
        date: dateInput.value, // Menyimpan string tanggal kustom (YYYY-MM-DD)
        category: categoryInput.value,
        type: typeInput.value
    };

    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Reset Form input
    descriptionInput.value = '';
    amountInput.value = '';
    categoryInput.value = 'Umum';
    typeInput.value = 'income';
    setDefaultDate(); // Setel ulang tanggal form ke hari ini

    updateDOM(currentFilter);
}

function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateDOM(currentFilter);
}

function exportToCSV() {
    if (transactions.length === 0) {
        alert("Belum ada data transaksi untuk diunduh!");
        return;
    }

    let csvContent = "ID,Tanggal,Nama Transaksi,Kategori,Jenis,Jumlah\n";
    transactions.forEach(transaction => {
        const jenis = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const tDate = transaction.date || new Date(transaction.id).toISOString().split('T')[0];
        const baris = `${transaction.id},${tDate},"${transaction.description}",${transaction.category},${jenis},${transaction.amount}\n`;
        csvContent += baris;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Keuangan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

financeForm.addEventListener('submit', addTransaction);
document.getElementById('download-csv-btn').addEventListener('click', exportToCSV);

// Inisialisasi awal tanggal form dan render halaman
setDefaultDate();
updateDOM();
