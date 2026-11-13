/* ===========================================================
   pricelist.js — tampilan price list (dipakai popup & halaman pulau)
   Data diambil dari js/pricedata.js
   =========================================================== */
(function () {
  const DATA = window.RFA_PRICES || {};
  const SOON = window.RFA_SOON || [];
  const WA = window.RFA_WA || "62895611885737";
  const ORDER = ["tidung", "pari", "pramuka", "harapan"];

  const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
  const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function chipLabel(pkg) {
    const short = pkg.name.replace(/^\S+\s/, "");
    return `${short} · ${pkg.depart}`;
  }

  /* ---------- satu paket: tab "Harga & Fasilitas" dan "Rundown" ---------- */
  function renderPrice(pkg) {
    const wrap = el("div", "pl-view");
    if (pkg.priceNote) wrap.appendChild(el("p", "pl-flag", pkg.priceNote));

    const board = el("div", "pl-board");
    const table = el("table", "pl-table");
    table.innerHTML = "<thead><tr><th scope='col'>Jumlah Peserta</th><th scope='col'>Harga</th></tr></thead>";
    const tbody = el("tbody");
    pkg.rows.forEach(([peserta, harga]) => {
      const tr = el("tr");
      tr.appendChild(el("td", "", peserta));
      tr.appendChild(el("td", "pl-price", `<strong>${rupiah(harga)}</strong><small> / orang</small>`));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    board.appendChild(table);

    const facWrap = el("div", "pl-fac");
    facWrap.appendChild(el("div", "pl-fac__head", "Fasilitas"));
    if (pkg.facilities.length) {
      const ul = el("ul", "pl-fac__list");
      pkg.facilities.forEach((f) => ul.appendChild(el("li", "", f)));
      facWrap.appendChild(ul);
    } else {
      facWrap.appendChild(el("p", "pl-fac__empty", "Rincian fasilitas paket ini akan dikonfirmasi oleh tim RFA saat pemesanan."));
    }
    board.appendChild(facWrap);
    wrap.appendChild(board);

    if (pkg.extra && pkg.extra.length) {
      const extra = el("div", "pl-extra");
      extra.appendChild(el("strong", "", "Biaya di luar paket"));
      const ul = el("ul");
      pkg.extra.forEach((x) => ul.appendChild(el("li", "", x)));
      extra.appendChild(ul);
      wrap.appendChild(extra);
    }
    if (pkg.note) wrap.appendChild(el("p", "pl-note", pkg.note));
    return wrap;
  }

  function renderRundown(pkg) {
    const wrap = el("div", "pl-view");
    if (!pkg.rundown || !pkg.rundown.length) {
      const soon = el("div", "pl-soon");
      soon.appendChild(el("span", "pl-soon__badge", "Soon"));
      soon.appendChild(el("h4", "", "Rundown segera hadir"));
      soon.appendChild(el("p", "", "Jadwal kegiatan paket ini sedang kami siapkan. Hubungi tim RFA untuk rincian acaranya."));
      wrap.appendChild(soon);
      return wrap;
    }
    const grid = el("div", "pl-days");
    pkg.rundown.forEach((d) => {
      const card = el("section", "pl-day");
      card.appendChild(el("h4", "pl-day__title", d.title));
      const ol = el("ol", "pl-timeline");
      d.items.forEach(([time, text]) => {
        const li = el("li");
        li.appendChild(el("time", "", time));
        li.appendChild(el("span", "", text));
        ol.appendChild(li);
      });
      card.appendChild(ol);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    if (pkg.rundownNotes && pkg.rundownNotes.length) {
      const n = el("div", "pl-extra");
      n.appendChild(el("strong", "", "Catatan"));
      const ul = el("ul", "pl-rundown-notes");
      pkg.rundownNotes.forEach((x) => ul.appendChild(el("li", "", x)));
      n.appendChild(ul);
      wrap.appendChild(n);
    }
    return wrap;
  }

  function renderPackage(island, pkg) {
    const panel = el("div", "pl-panel");
    const head = el("div", "pl-panel__head");
    head.appendChild(el("h3", "pl-panel__title", pkg.name));
    head.appendChild(el("span", "pl-panel__meta", `Berangkat dari <strong>${pkg.depart}</strong>`));
    panel.appendChild(head);

    if (!pkg.rows.length) {
      const soon = el("div", "pl-soon");
      soon.appendChild(el("span", "pl-soon__badge", "Soon"));
      soon.appendChild(el("h4", "", "Harga segera hadir"));
      soon.appendChild(el("p", "", `Daftar harga dan fasilitas paket ${pkg.name} sedang kami siapkan. Hubungi tim RFA untuk info terbaru.`));
      const a = el("a", "btn btn--dark", "Tanya harga via WhatsApp");
      a.href = waLink(`Halo RFA, saya ingin tanya harga paket ${pkg.name} (${pkg.depart}).`);
      a.target = "_blank"; a.rel = "noopener";
      soon.appendChild(a);
      panel.appendChild(soon);
      return panel;
    }

    // tab di dalam paket
    const sub = el("div", "pl-subtabs");
    sub.setAttribute("role", "tablist");
    const views = el("div", "pl-views");
    const defs = [["Harga & Fasilitas", () => renderPrice(pkg)], ["Rundown", () => renderRundown(pkg)]];
    function show(i) {
      sub.querySelectorAll(".pl-subtab").forEach((b, idx) => {
        b.classList.toggle("is-active", idx === i);
        b.setAttribute("aria-selected", String(idx === i));
      });
      views.replaceChildren(defs[i][1]());
    }
    defs.forEach(([label], i) => {
      const b = el("button", "pl-subtab", label);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.addEventListener("click", () => show(i));
      sub.appendChild(b);
    });
    panel.appendChild(sub);
    panel.appendChild(views);
    show(0);

    const foot = el("div", "pl-foot");
    foot.appendChild(el("p", "pl-note", "*Konfirmasikan harga & jadwal terbaru ke tim RFA sebelum membayar."));
    const a = el("a", "btn btn--dark", "Pesan paket ini");
    a.href = waLink(`Halo RFA, saya tertarik dengan paket ${pkg.name} (${pkg.depart}). Mohon info jadwal & ketersediaan.`);
    a.target = "_blank"; a.rel = "noopener";
    foot.appendChild(a);
    panel.appendChild(foot);
    return panel;
  }

  /* ---------- satu pulau: pilihan paket + panel ---------- */
  function mount(container, key) {
    const island = DATA[key];
    if (!container || !island) return;
    container.replaceChildren();
    const chips = el("div", "pl-chips");
    chips.setAttribute("role", "tablist");
    const body = el("div", "pl-body");
    body.setAttribute("role", "tabpanel");

    function select(i) {
      chips.querySelectorAll(".pl-chip").forEach((c, idx) => {
        c.classList.toggle("is-active", idx === i);
        c.setAttribute("aria-selected", String(idx === i));
      });
      body.replaceChildren(renderPackage(key, island.packages[i]));
    }

    island.packages.forEach((pkg, i) => {
      const b = el("button", "pl-chip", chipLabel(pkg));
      b.type = "button";
      b.setAttribute("role", "tab");
      b.addEventListener("click", () => select(i));
      chips.appendChild(b);
    });
    container.appendChild(chips);
    container.appendChild(body);
    select(0);
  }

  /* ---------- POPUP (hanya dibuat saat pertama kali dibuka) ---------- */
  let modal, modalBody, modalTabs, lastFocus, currentKey;

  function buildModal() {
    modal = el("div", "pl-modal");
    modal.id = "priceModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="pl-modal__backdrop" data-close></div>
      <div class="pl-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="plTitle">
        <div class="pl-modal__top">
          <div>
            <p class="pl-modal__eyebrow">Price List</p>
            <h2 id="plTitle">Harga Paket Trip</h2>
          </div>
          <button type="button" class="pl-modal__close" data-close aria-label="Tutup price list">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="pl-tabs" role="tablist" aria-label="Pilih pulau"></div>
        <div class="pl-modal__scroll"><div class="pl-modal__content" id="plContent"></div></div>
      </div>`;
    document.body.appendChild(modal);
    modalTabs = modal.querySelector(".pl-tabs");
    modalBody = modal.querySelector("#plContent");

    ORDER.forEach((key) => {
      const b = el("button", "pl-tab", DATA[key].name);
      b.type = "button";
      b.dataset.key = key;
      b.setAttribute("role", "tab");
      b.addEventListener("click", () => showIsland(key));
      modalTabs.appendChild(b);
    });
    SOON.forEach((name) => {
      const b = el("button", "pl-tab pl-tab--soon", `Pulau ${name} <em class="pl-tab__badge">Soon</em>`);
      b.type = "button";
      b.disabled = true;
      modalTabs.appendChild(b);
    });

    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key === "Tab") {
        const f = modal.querySelectorAll("button:not([disabled]), a[href]");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function showIsland(key) {
    currentKey = key;
    modalTabs.querySelectorAll(".pl-tab").forEach((t) => {
      const on = t.dataset.key === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      if (on) t.scrollIntoView({ block: "nearest", inline: "center" });
    });
    const island = DATA[key];
    modalBody.replaceChildren();
    modalBody.appendChild(el("p", "pl-tagline", island.tagline));
    const mountPoint = el("div");
    modalBody.appendChild(mountPoint);
    mount(mountPoint, key);
    modal.querySelector(".pl-modal__scroll").scrollTop = 0;
  }

  function openModal(key) {
    if (!modal) buildModal();
    lastFocus = document.activeElement;
    showIsland(DATA[key] ? key : "tidung");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("pl-lock");
    modal.querySelector(".pl-modal__close").focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pl-lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // tombol / kartu apa pun dengan atribut data-pricelist membuka popup
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-pricelist]");
    if (!trigger) return;
    e.preventDefault();
    openModal(trigger.dataset.pricelist || "tidung");
  });

  window.RFAPrice = { mount, openModal, closeModal };
})();
