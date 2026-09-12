// ========================================
// KONFIGURASI GOOGLE APPS SCRIPT
// ========================================

// GANTI BAGIAN INI
const API_URL =
  "https://script.google.com/macros/s/AKfycbwrKSjE_m6dUeQDX0wP2C_gmeG0DGmF-OsbbyfKrnMGm7kkLa1kaR-cMNJ7vLQ_vxqJ5Q/exec";


// ========================================
// VARIABEL
// ========================================

let inventory = [];

let editing = false;


// ========================================
// ELEMENT
// ========================================

const $ = id =>
  document.getElementById(id);


// ========================================
// SAAT HALAMAN DIBUKA
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    $("addBtn").addEventListener(
      "click",
      openAddModal
    );


    $("closeModal").addEventListener(
      "click",
      closeModal
    );


    $("cancelBtn").addEventListener(
      "click",
      closeModal
    );


    $("refreshBtn").addEventListener(
      "click",
      loadInventory
    );


    $("inventoryForm").addEventListener(
      "submit",
      saveForm
    );


    $("searchInput").addEventListener(
      "input",
      render
    );


    $("categoryFilter").addEventListener(
      "change",
      render
    );


    $("conditionFilter").addEventListener(
      "change",
      render
    );


    loadInventory();

  }
);


// ========================================
// API
// ========================================

async function api(
  action,
  params = {}
) {

  if (
    API_URL.includes(
      "PASTE_URL"
    )
  ) {

    throw new Error(
      "API_URL belum diisi di script.js"
    );

  }


  const query =
    new URLSearchParams({

      action: action,

      ...params,

      time: Date.now()

    });


  const response =
    await fetch(
      API_URL +
      "?" +
      query.toString()
    );


  const text =
    await response.text();


  let result;


  try {

    result =
      JSON.parse(text);

  }

  catch {

    throw new Error(
      "Response Google Apps Script bukan JSON."
    );

  }


  if (!result.success) {

    throw new Error(
      result.message ||
      "Terjadi kesalahan API"
    );

  }


  return result;

}


// ========================================
// LOAD DATA
// ========================================

async function loadInventory() {

  setStatus(
    "⏳ Memuat data..."
  );


  try {

    const result =
      await api("list");


    inventory =
      result.data || [];


    updateCategories();


    render();


    setStatus(
      "✅ Data berhasil dimuat."
    );

  }

  catch (error) {

    console.error(error);


    setStatus(
      "❌ " +
      error.message,
      true
    );


    render();

  }

}


// ========================================
// KATEGORI
// ========================================

function updateCategories() {

  const select =
    $("categoryFilter");


  const current =
    select.value;


  const categories =
    [
      ...new Set(

        inventory
          .map(item =>
            item.kategori
          )
          .filter(Boolean)

      )
    ].sort();


  select.innerHTML =
    `<option value="">
      Semua Kategori
    </option>`;


  categories.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category;


      option.textContent =
        category;


      select.appendChild(
        option
      );

    }
  );


  if (
    categories.includes(
      current
    )
  ) {

    select.value =
      current;

  }

}


// ========================================
// RENDER TABLE
// ========================================

function render() {

  const search =
    $("searchInput")
      .value
      .toLowerCase()
      .trim();


  const category =
    $("categoryFilter")
      .value;


  const condition =
    $("conditionFilter")
      .value;


  const filtered =
    inventory.filter(
      item => {

        const text =

          `${item.kode}
           ${item.nama}
           ${item.kategori}
           ${item.lokasi}
           ${item.penanggungJawab}`
            .toLowerCase();


        return (

          text.includes(search)

          &&

          (
            !category ||
            item.kategori ===
            category
          )

          &&

          (
            !condition ||
            item.kondisi ===
            condition
          )

        );

      }
    );


  const body =
    $("inventoryBody");


  body.innerHTML = "";


  filtered.forEach(
    (item, index) => {

      const originalIndex =
        inventory.indexOf(
          item
        );


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${index + 1}
        </td>

        <td>
          <b>
            ${escapeHTML(item.kode)}
          </b>
        </td>

        <td>
          ${escapeHTML(item.nama)}
        </td>

        <td>
          ${escapeHTML(item.kategori)}
        </td>

        <td>
          ${item.jumlah}
        </td>

        <td>
          <span class="badge
            ${conditionClass(
              item.kondisi
            )}">
            ${escapeHTML(
              item.kondisi
            )}
          </span>
        </td>

        <td>
          ${escapeHTML(item.lokasi)}
        </td>

        <td>
          ${escapeHTML(
            item.penanggungJawab
          )}
        </td>

        <td>

          <div class="actions">

            <button
              class="mini"
              onclick="editItem(
                ${originalIndex}
              )"
            >
              ✏️
            </button>

            <button
              class="mini delete"
              onclick="deleteItem(
                ${originalIndex}
              )"
            >
              🗑️
            </button>

          </div>

        </td>

      `;


      body.appendChild(row);

    }
  );


  $("emptyState")
    .classList.toggle(
      "hidden",
      filtered.length > 0
    );


  updateStats();

}


// ========================================
// STATISTIK
// ========================================

function updateStats() {

  $("totalJenis")
    .textContent =
    inventory.length;


  const total =
    inventory.reduce(
      (sum, item) =>
        sum +
        Number(
          item.jumlah
        ),
      0
    );


  $("totalBarang")
    .textContent =
    total;


  const baik =
    inventory
      .filter(
        item =>
          item.kondisi ===
          "Baik"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.jumlah),
        0
      );


  $("baikCount")
    .textContent =
    baik;


  const rusak =
    inventory
      .filter(
        item =>
          item.kondisi !==
          "Baik"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.jumlah),
        0
      );


  $("rusakCount")
    .textContent =
    rusak;

}


// ========================================
// TAMBAH
// ========================================

function openAddModal() {

  editing = false;


  $("modalTitle")
    .textContent =
    "Tambah Barang";


  $("inventoryForm")
    .reset();


  $("editRow")
    .value = "";


  $("jumlah")
    .value = 1;


  $("modal")
    .classList.remove(
      "hidden"
    );


  $("kode").focus();

}


// ========================================
// EDIT
// ========================================

function editItem(index) {

  const item =
    inventory[index];


  if (!item) return;


  editing = true;


  $("modalTitle")
    .textContent =
    "Edit Barang";


  $("editRow")
    .value =
    item.row;


  $("kode")
    .value =
    item.kode;


  $("nama")
    .value =
    item.nama;


  $("kategori")
    .value =
    item.kategori;


  $("jumlah")
    .value =
    item.jumlah;


  $("kondisi")
    .value =
    item.kondisi;


  $("lokasi")
    .value =
    item.lokasi;


  $("penanggungJawab")
    .value =
    item.penanggungJawab;


  $("modal")
    .classList.remove(
      "hidden"
    );

}


// ========================================
// SIMPAN
// ========================================

async function saveForm(
  event
) {

  event.preventDefault();


  const data = {

    kode:
      $("kode")
        .value
        .trim(),

    nama:
      $("nama")
        .value
        .trim(),

    kategori:
      $("kategori")
        .value
        .trim(),

    jumlah:
      $("jumlah")
        .value,

    kondisi:
      $("kondisi")
        .value,

    lokasi:
      $("lokasi")
        .value
        .trim(),

    penanggungJawab:
      $("penanggungJawab")
        .value
        .trim()

  };


  try {

    setStatus(
      "⏳ Menyimpan..."
    );


    if (editing) {

      data.row =
        $("editRow")
          .value;


      await api(
        "update",
        data
      );

    }

    else {

      await api(
        "create",
        data
      );

    }


    closeModal();


    await loadInventory();


    alert(
      "✅ Data berhasil disimpan!"
    );

  }

  catch (error) {

    alert(
      "❌ Gagal menyimpan:\n" +
      error.message
    );

  }

}


// ========================================
// HAPUS
// ========================================

async function deleteItem(
  index
) {

  const item =
    inventory[index];


  if (!item) return;


  const yakin =
    confirm(
      `Hapus barang "${item.nama}"?`
    );


  if (!yakin) return;


  try {

    await api(
      "delete",
      {
        row: item.row
      }
    );


    await loadInventory();


    alert(
      "✅ Data berhasil dihapus."
    );

  }

  catch (error) {

    alert(
      "❌ Gagal menghapus:\n" +
      error.message
    );

  }

}


// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {

  $("modal")
    .classList.add(
      "hidden"
    );

}


// ========================================
// STATUS
// ========================================

function setStatus(
  message,
  error = false
) {

  $("status")
    .textContent =
    message;


  $("status")
    .style.color =
    error
      ? "#dc3545"
      : "";

}


// ========================================
// KONDISI
// ========================================

function conditionClass(
  condition
) {

  if (
    condition === "Baik"
  ) {

    return "good";

  }


  if (
    condition ===
    "Rusak Berat"
  ) {

    return "bad";

  }


  return "light";

}


// ========================================
// KEAMANAN HTML
// ========================================

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


window.editItem =
  editItem;

window.deleteItem =
  deleteItem;
