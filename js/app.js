const defaultConfig = {
    hero_title: "RUMAH TAHANAN NEGARA\nKELAS IIB SABANG",
    hero_subtitle: "Sistem Penomoran Surat Digital yang Modern dan Efisien",
    about_title: "Tentang Rutan Sabang",
    about_content: "Rumah Tahanan Negara Kelas IIB Sabang berdiri sejak tahun 1985...",
    welcome_title: "Sambutan Kepala Rutan",
    welcome_content: "Selamat datang di sistem penomoran surat digital...",
    app_desc_title: "Fungsi Aplikasi"
};

let allRecords = [];
let recordCount = 0;

async function loadFromServer() {
    const { data, error } = await sb
        .from("surat")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        showNotification("Gagal memuat data", "error");
        return;
    }

    allRecords = data;
    recordCount = data.length;
    renderHistory(allRecords);
}

async function getNextSequenceFor(dateObj) {
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const pattern = `%/RUTAN-SBG/PK/${month}/${year}`;

    const { data } = await sb
        .from("surat")
        .select("nomor_surat")
        .like("nomor_surat", pattern)
        .order("created_at", { ascending: false })
        .limit(1);

    if (!data || data.length === 0) return 1;
    return parseInt(data[0].nomor_surat.split('/')[0]) + 1;
}

async function generateNomorSurat(tgl) {
    const d = new Date(tgl);
    const seq = await getNextSequenceFor(d);
    return `${String(seq).padStart(3, '0')}/RUTAN-SBG/PK/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

async function saveRecord(r) {
    await sb.from("surat").insert([r]);
    await loadFromServer();
}

document.addEventListener('DOMContentLoaded', () => {
    loadFromServer();
});
