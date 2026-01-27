// =========================
// UI & TABLE
// =========================

function createTableRow(record, rowNumber) {
    const tr = document.createElement('tr');
    tr.dataset.itemId = record.id;
    tr.className = 'hover:bg-gray-50 transition-colors border-b';

    const date = record.tanggal_surat
        ? new Date(record.tanggal_surat)
        : new Date(record.created_at);

    const formattedDate = date.toLocaleDateString('id-ID');

    tr.innerHTML = `
        <td class="px-6 py-4 text-sm font-semibold">${rowNumber}</td>
        <td class="px-6 py-4 text-sm font-semibold text-yellow-600">${record.nomor_surat}</td>
        <td class="px-6 py-4 text-sm">${record.perihal || '-'}</td>
        <td class="px-6 py-4 text-sm font-mono">${record.kode_surat || '-'}</td>
        <td class="px-6 py-4 text-sm">${formattedDate}</td>
        <td class="px-6 py-4 text-sm">${record.tujuan_surat || '-'}</td>
        <td class="px-6 py-4 text-center">
            <button class="copy-btn px-3 py-1 text-xs" data-nomor="${record.nomor_surat}">📋</button>
            <button class="delete-btn px-3 py-1 text-xs text-red-600" data-id="${record.id}">🗑️</button>
        </td>
    `;
    return tr;
}

function renderHistory(data) {
    const tableBody = document.getElementById('table-body');
    const emptyState = document.getElementById('empty-state');

    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        emptyState.classList.remove('hidden');
        updateSummary([]);
        return;
    }

    emptyState.classList.add('hidden');

    data.forEach((record, i) => {
        tableBody.appendChild(createTableRow(record, i + 1));
    });

    updateSummary(data);
    attachActionListeners();
}

function attachActionListeners() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = () => copyToClipboard(btn.dataset.nomor);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => deleteRecord(btn.dataset.id);
    });
}

// =========================
// SUMMARY
// =========================

function updateSummary(data) {
    document.getElementById('total-surat').textContent = data.length;
    document.getElementById('nomor-terakhir').textContent =
        data[0]?.nomor_surat || '-';
}

// =========================
// DELETE
// =========================

async function deleteRecord(id) {
    const record = allRecords.find(r => r.id === id);
    if (!record) return;

    if (!confirm('Hapus surat ini?')) return;

    const res = await removeRecord(record);
    if (res?.isOk) {
        showNotification('Surat berhasil dihapus', 'success');
    } else {
        showNotification('Anda tidak punya izin menghapus', 'error');
    }
}

// =========================
// COPY
// =========================

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showNotification('Nomor surat disalin', 'success'))
        .catch(() => showNotification('Gagal menyalin', 'error'));
}

// =========================
// NOTIFICATION
// =========================

function showNotification(message, type = 'success') {
    const div = document.createElement('div');
    div.className = 'notification glass-card p-4 rounded-xl';

    div.style.background = type === 'success'
        ? 'linear-gradient(135deg,#d4af37,#c19a2e)'
        : '#fee';

    div.textContent = message;
    document.getElementById('notification-container').appendChild(div);

    setTimeout(() => div.remove(), 3000);
}
