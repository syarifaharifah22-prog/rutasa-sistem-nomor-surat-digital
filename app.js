/* =========================================================
   SUPABASE CONFIG
   ========================================================= */
const SUPABASE_URL = "https://zclcbusqbttvzyhhnrti.supabase.co";
const SUPABASE_KEY = "sb_publishable_F6fdeEqRppFS_3d64ij9Gg_WnpOUksa";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================================================
   ROLE (ADMIN / USER)
   set admin sementara via:
   localStorage.setItem("role", "admin");
   ========================================================= */
const isAdmin = localStorage.getItem("role") === "admin";

/* =========================================================
   GLOBAL STATE
   ========================================================= */
let allRecords = [];

/* =========================================================
   DOM ELEMENTS
   ========================================================= */
const perihalInput = document.getElementById("perihal");
const kodeSuratInput = document.getElementById("kode-surat");
const tanggalInput = document.getElementById("tanggal-surat");
const tujuanInput = document.getElementById("tujuan-surat");
const keteranganInput = document.getElementById("keterangan");
const historyTableBody = document.getElementById("table-body");

/* =========================================================
   INIT APP
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    // set tanggal hari ini
    if (tanggalInput) tanggalInput.valueAsDate = new Date();

    showSection("home");
    loadFromServer();

    document
        .getElementById("letter-form")
        ?.addEventListener("submit", submitForm);

    document
        .getElementById("export-pdf-btn")
        ?.addEventListener("click", exportToPDF);

    document
        .getElementById("export-excel-btn")
        ?.addEventListener("click", exportToExcel);
});

/* =========================================================
   NAVIGATION
   ========================================================= */
function showSection(section) {
    ["home", "form", "history"].forEach(s => {
        document.getElementById(`${s}-section`)?.classList.add("hidden");
    });

    document.getElementById(`${section}-section`)?.classList.remove("hidden");

    if (section === "history") loadFromServer();
}

/* =========================================================
   LOAD DATA FROM SUPABASE
   ========================================================= */
async function loadFromServer() {
    const { data, error } = await sb
        .from("surat")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    allRecords = data;
    renderHistory(data);
    updateStats(data);
}

/* =========================================================
   RENDER TABLE HISTORY
   ========================================================= */
function renderHistory(data) {
    if (!historyTableBody) return;

    historyTableBody.innerHTML = "";

    data.forEach((item, i) => {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-gray-50";

        tr.innerHTML = `
            <td class="p-2 text-center">${i + 1}</td>
            <td class="p-2">${item.nomor_surat}</td>
            <td class="p-2">${item.perihal}</td>
            <td class="p-2">${item.kode_surat ?? "-"}</td>
            <td class="p-2">${item.tanggal_surat}</td>
            <td class="p-2">${item.tujuan_surat}</td>
            <td class="p-2 text-center space-x-2">

                <!-- COPY NOMOR SURAT -->
                <button
                    class="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                    title="Salin Nomor Surat"
                    onclick="copyNomorSurat('${item.nomor_surat}')">
                    📋
                </button>

                <!-- DELETE (ADMIN ONLY) -->
                ${isAdmin ? `
                <button
                    class="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                    title="Hapus Surat"
                    onclick="deleteRecord('${item.id}')">
                    🗑️
                </button>
                ` : ``}

            </td>
        `;

        historyTableBody.appendChild(tr);
    });
}

/* =========================================================
   DASHBOARD STATISTICS
   ========================================================= */
function updateStats(data) {
    const totalEl = document.getElementById("total-surat");
    const todayEl = document.getElementById("surat-hari-ini");
    const monthEl = document.getElementById("surat-bulan-ini");
    const lastEl = document.getElementById("nomor-terakhir");

    if (!totalEl) return;

    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    totalEl.textContent = data.length;
    todayEl.textContent = data.filter(d => d.tanggal_surat === today).length;
    monthEl.textContent = data.filter(d => d.tanggal_surat.startsWith(month)).length;
    lastEl.textContent = data.length ? data[0].nomor_surat : "-";
}

/* =========================================================
   COPY NOMOR SURAT
   ========================================================= */
function copyNomorSurat(nomor) {
    navigator.clipboard
        .writeText(nomor)
        .then(() => showNotification("Nomor surat berhasil disalin"))
        .catch(() => showNotification("Gagal menyalin", "error"));
}

/* =========================================================
   DELETE RECORD (ADMIN ONLY)
   ========================================================= */
async function deleteRecord(id) {
    if (!isAdmin) {
        showNotification("Anda tidak punya hak menghapus", "error");
        return;
    }

    if (!confirm("Hapus surat ini?")) return;

    const { error } = await sb.from("surat").delete().eq("id", id);

    if (error) {
        showNotification("Gagal menghapus", "error");
        return;
    }

    showNotification("Berhasil dihapus");
    loadFromServer();
}

/* =========================================================
   GET NEXT SEQUENCE NUMBER
   ========================================================= */
async function getNextSequence(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();

    const { data } = await sb
        .from("surat")
        .select("nomor_surat")
        .like("nomor_surat", `%/${m}/${y}`)
        .order("created_at", { ascending: false })
        .limit(1);

    return data?.length
        ? parseInt(data[0].nomor_surat.split("/")[0]) + 1
        : 1;
}

/* =========================================================
   FORM SUBMIT
   ========================================================= */
async function submitForm(e) {
    e.preventDefault();

    const tanggal = tanggalInput.value;
    const seq = await getNextSequence(new Date(tanggal));

    const nomor = `${String(seq).padStart(3, "0")}/RUTAN-SBG/PK/${tanggal.slice(5, 7)}/${tanggal.slice(0, 4)}`;

    await sb.from("surat").insert([{
        nomor_surat: nomor,
        perihal: perihalInput.value,
        kode_surat: kodeSuratInput.value,
        tanggal_surat: tanggal,
        tujuan_surat: tujuanInput.value,
        keterangan: keteranganInput.value
    }]);

    showNotification(`Nomor surat dibuat: ${nomor}`);
    e.target.reset();
    showSection("history");
}

/* =========================================================
   EXPORT PDF
   ========================================================= */
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Data Nomor Surat", 14, 15);

    doc.autoTable({
        startY: 20,
        head: [["No", "Nomor Surat", "Perihal", "Tujuan", "Tanggal"]],
        body: allRecords.map((d, i) => [
            i + 1,
            d.nomor_surat,
            d.perihal,
            d.tujuan_surat,
            d.tanggal_surat
        ])
    });

    doc.save("data-nomor-surat.pdf");
}

/* =========================================================
   EXPORT EXCEL
   ========================================================= */
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(allRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Surat");
    XLSX.writeFile(wb, "data-nomor-surat.xlsx");
}

/* =========================================================
   NOTIFICATION
   ========================================================= */
function showNotification(msg, type = "success") {
    const n = document.createElement("div");

    const base =
        "notification fixed top-5 right-5 z-50 px-4 py-2 rounded shadow-lg text-white text-sm transition";

    const color =
        type === "error"
            ? "bg-red-600"
            : type === "info"
                ? "bg-blue-600"
                : "bg-green-600";

    n.className = `${base} ${color}`;
    n.innerText = msg;

    document.body.appendChild(n);

    setTimeout(() => n.remove(), 3000);
}

