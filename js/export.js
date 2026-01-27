// =========================
// EXPORT PDF
// =========================

function exportToPDF() {
    if (!allRecords.length) {
        showNotification('Tidak ada data', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('RIWAYAT SURAT RUTAN KELAS IIB SABANG', 14, 20);

    const rows = allRecords.map((r, i) => ([
        i + 1,
        r.nomor_surat,
        r.perihal || '-',
        r.kode_surat || '-',
        r.tanggal_surat || '-',
        r.tujuan_surat || '-'
    ]));

    doc.autoTable({
        head: [['No', 'Nomor', 'Perihal', 'Kode', 'Tanggal', 'Tujuan']],
        body: rows,
        startY: 30
    });

    doc.save('Riwayat_Surat.pdf');
    showNotification('PDF berhasil dibuat', 'success');
}

// =========================
// EXPORT EXCEL
// =========================

function exportToExcel() {
    if (!allRecords.length) {
        showNotification('Tidak ada data', 'error');
        return;
    }

    let csv = 'No,Nomor,Perihal,Kode,Tanggal,Tujuan\n';

    allRecords.forEach((r, i) => {
        csv += `${i + 1},"${r.nomor_surat}","${r.perihal || '-'}","${r.kode_surat || '-'}","${r.tanggal_surat || '-'}","${r.tujuan_surat || '-'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Riwayat_Surat.csv';
    a.click();

    URL.revokeObjectURL(url);
    showNotification('Excel berhasil diunduh', 'success');
}
