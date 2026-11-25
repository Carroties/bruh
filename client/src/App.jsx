import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Search,
  Plus,
  MapPin,
  CalendarDays,
  Package,
  Monitor,
  IdCard,
  Shirt,
  Glasses,
  GlassWater,
  Mail,
  Phone,
  Upload,
  X,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { categories, locations, dateLabel } from "./catalog.js";
import { mockMode, request } from "./api.js";
const icons = {
  ELECTRONICS: Monitor,
  ID_CARD: IdCard,
  BOTTLE: GlassWater,
  CLOTHING: Shirt,
  ACCESSORIES: Glasses,
  OTHER: Package,
};
function Image({ report, large = false }) {
  const [failed, setFailed] = useState(false);
  const Icon = icons[report.category] || Package;
  return (
    <div
      className={`item-image ${large ? "large" : ""} category-${report.category}`}
    >
      {report.imageUrl && !failed ? (
        <img
          src={report.imageUrl}
          alt={report.itemName}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <Icon strokeWidth={1.2} aria-hidden="true" />
          <span>Foto belum tersedia</span>
        </>
      )}
    </div>
  );
}
function Badge({ type }) {
  return (
    <span className={`badge ${type === "LOST" ? "lost" : "found"}`}>
      <span />
      {type === "LOST" ? "Lost · Hilang" : "Found · Ditemukan"}
    </span>
  );
}
function ErrorBox({ message, onRetry }) {
  return (
    <div className="state error" role="alert">
      <h2>Belum berhasil memuat</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="button secondary" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}
function App() {
  const { pathname } = useLocation();
  const main = useRef(null);
  useEffect(() => {
    window.scrollTo?.(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" to="/" aria-label="Temu beranda">
            <span className="brand-icon">
              <Package size={23} />
            </span>
            temu<span className="brand-dot">.</span>
          </Link>
          <div className="header-caption">
            LOST & FOUND
            <br />
            <b>FASILKOM UI</b>
          </div>
          <nav aria-label="Navigasi utama">
            <NavLink to="/" end>
              Jelajahi laporan
            </NavLink>
            <NavLink to="/reports/new" className="button small">
              <Plus size={16} /> Buat laporan
            </NavLink>
          </nav>
        </div>
      </header>
      {mockMode && (
        <div className="mock-banner">
          Mode mock Checkpoint 2 — data tidak disimpan permanen.
        </div>
      )}
      <main id="main" tabIndex={-1} ref={main}>
        <Routes>
          <Route path="/" element={<Listing />} />
          <Route path="/reports/new" element={<Submission />} />
          <Route path="/reports/:id" element={<Detail />} />
          <Route
            path="*"
            element={
              <div className="shell state">
                <h1>Halaman tidak ditemukan</h1>
                <Link to="/">Kembali ke laporan</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="shell footer">
        <Link className="brand" to="/">
          temu.
        </Link>
        <p>Barang boleh terselip. Kepedulian jangan.</p>
        <span>RISTEK Open Class · Web Development 2026</span>
      </footer>
    </>
  );
}
function Listing() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const [search, setSearch] = useState(params.get("q") || "");
  const [locationDraft, setLocationDraft] = useState(
    params.get("location") || "",
  );
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const next = new URLSearchParams(query);
    setSearch(next.get("q") || "");
    setLocationDraft(next.get("location") || "");
  }, [query]);
  useEffect(() => {
    const abort = new AbortController();
    setState({ loading: true });
    request("/reports?" + query, { signal: abort.signal })
      .then((data) => {
        if (!abort.signal.aborted) setState({ ...data, loading: false });
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setState({ error: e.message, loading: false });
      });
    return () => abort.abort();
  }, [query, retry]);
  function update(values) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in values)) next.delete("page");
    setParams(next);
  }
  const activeFilters = ["q", "type", "category", "location"].filter((k) =>
    params.get(k),
  ).length;
  return (
    <>
      <section className="hero">
        <div className="shell hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> DARI PACIL, UNTUK PACIL
            </div>
            <h1>
              Yang hilang,
              <br />
              bisa <em>bertemu lagi.</em>
            </h1>
            <p>
              Kehilangan tumbler? Menemukan KTM?
              <br />
              Satu tempat untuk saling bantu menemukan.
            </p>
            <Link className="text-link" to="/reports/new">
              Bantu dengan buat laporan <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-spark">✳</span>
            <div className="art-tag tag-lost">
              <span className="tiny-label">LAGI DICARI</span>
              <GlassWater size={65} strokeWidth={1.2} />
              <b>Tumbler kesayangan</b>
              <span>
                <MapPin size={12} /> Terakhir di A206
              </span>
            </div>
            <div className="art-tag tag-found">
              <span className="tiny-label">SUDAH DITEMUKAN</span>
              <IdCard size={65} strokeWidth={1.2} />
              <b>Kartu mahasiswa</b>
              <span>
                <CheckCircle2 size={12} /> Aman di pos satpam
              </span>
            </div>
            <div className="art-note">a little help, a happy reunion.</div>
          </div>
        </div>
      </section>
      <section
        className="shell listing-section"
        aria-labelledby="listing-heading"
      >
        <div className="section-top">
          <div>
            <div className="eyebrow muted">PAPAN KABAR KAMPUS</div>
            <h2 id="listing-heading">
              Cari barangmu di sini<span>.</span>
            </h2>
          </div>
          <span className="section-hint">
            Mungkin ada yang sudah menemukannya.
          </span>
        </div>
        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim() });
          }}
        >
          <Search size={21} />
          <label className="sr-only" htmlFor="search">
            Cari nama barang
          </label>
          <input
            id="search"
            placeholder="Cari nama barang, misalnya tumbler…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
          />
          <button className="button" type="submit">
            Cari barang <ArrowRight size={16} />
          </button>
        </form>
        <div className="filters">
          <div className="type-tabs" aria-label="Tipe laporan">
            {[
              ["", "Semua"],
              ["LOST", "Lost"],
              ["FOUND", "Found"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={
                  (params.get("type") || "") === value ? "selected" : ""
                }
                onClick={() => update({ type: value })}
                aria-pressed={(params.get("type") || "") === value}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="select-filters">
            <SlidersHorizontal size={16} />
            <label className="sr-only" htmlFor="category">
              Kategori
            </label>
            <select
              id="category"
              value={params.get("category") || ""}
              onChange={(e) => update({ category: e.target.value })}
            >
              <option value="">Semua kategori</option>
              {Object.entries(categories).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="location">
              Lokasi
            </label>
            <input
              className="location-filter"
              id="location"
              aria-label="Lokasi"
              list="filter-locations"
              placeholder="Semua lokasi"
              value={locationDraft}
              onChange={(e) => setLocationDraft(e.target.value)}
              minLength={2}
              maxLength={100}
              onBlur={() => {
                if (locationDraft.trim().length !== 1)
                  update({ location: locationDraft.trim() });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && locationDraft.trim().length !== 1)
                  update({ location: locationDraft.trim() });
              }}
            />
            <datalist id="filter-locations">
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="result-line" aria-live="polite">
          <span>
            {state.loading ? (
              "Memuat laporan…"
            ) : state.meta ? (
              <>
                <b>{state.meta.total}</b> laporan{" "}
                {activeFilters ? "sesuai pencarian" : "di papan kabar"}
              </>
            ) : (
              "Laporan belum tersedia"
            )}
          </span>
          {activeFilters > 0 && (
            <button className="reset" onClick={() => setParams({})}>
              Hapus filter <X size={13} />
            </button>
          )}
          <span className="sort-label">Terbaru lebih dulu</span>
        </div>
        {state.error ? (
          <ErrorBox
            message={state.error}
            onRetry={() => setRetry((x) => x + 1)}
          />
        ) : state.loading ? (
          <div className="report-grid" aria-label="Memuat laporan">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        ) : state.data.length === 0 ? (
          <div className="state empty">
            <Search size={36} />
            <h3>Belum ada laporan yang cocok</h3>
            <p>Coba nama barang lain atau hapus filter pencarian.</p>
            <button className="button secondary" onClick={() => setParams({})}>
              Lihat semua laporan
            </button>
          </div>
        ) : (
          <div className="report-grid">
            {state.data.map((report) => (
              <Link
                className="report-card"
                to={`/reports/${report.id}`}
                key={report.id}
              >
                <div className="card-visual">
                  <Image report={report} />
                  <Badge type={report.type} />
                  <span className="card-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
                <div className="card-body">
                  <span className="category-label">
                    {categories[report.category]}
                  </span>
                  <h3>{report.itemName}</h3>
                  <div className="card-meta">
                    <span>
                      <MapPin size={14} />
                      {report.location}
                    </span>
                    <span>
                      <CalendarDays size={14} />
                      {dateLabel(report.occurredAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {state.meta && state.meta.totalPages > 1 && (
          <nav className="pagination" aria-label="Halaman laporan">
            <button
              className="button secondary"
              disabled={state.meta.page <= 1}
              onClick={() => update({ page: String(state.meta.page - 1) })}
            >
              <ArrowLeft size={15} /> Sebelumnya
            </button>
            <span>
              Halaman {state.meta.page} dari {state.meta.totalPages}
            </span>
            <button
              className="button secondary"
              disabled={state.meta.page >= state.meta.totalPages}
              onClick={() => update({ page: String(state.meta.page + 1) })}
            >
              Berikutnya <ArrowRight size={15} />
            </button>
          </nav>
        )}
        <aside className="care-note">
          <span className="care-icon">
            <Package size={22} />
          </span>
          <div>
            <b>Menemukan barang yang bukan milikmu?</b>
            <p>
              Sebuah laporan kecil bisa membuat hari seseorang jauh lebih baik.
            </p>
          </div>
          <Link className="text-link" to="/reports/new">
            Buat laporan <ArrowUpRight size={17} />
          </Link>
        </aside>
      </section>
    </>
  );
}
function Detail() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setState({ loading: true });
    request("/reports/" + id, { signal: abort.signal })
      .then((data) => {
        if (!abort.signal.aborted) setState(data);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setState({ error: e.message });
      });
    return () => abort.abort();
  }, [id, retry]);
  const r = state.data;
  return (
    <section className="shell page-section">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Kembali ke laporan
      </Link>
      {state.loading ? (
        <div className="skeleton detail-skeleton" aria-label="Memuat detail" />
      ) : state.error ? (
        <ErrorBox
          message={state.error}
          onRetry={() => setRetry((x) => x + 1)}
        />
      ) : (
        <>
          <div className="detail-layout">
            <Image key={r.id} report={r} large />
            <div className="detail-copy">
              <Badge type={r.type} />
              <div className="category-label">{categories[r.category]}</div>
              <h1>{r.itemName}</h1>
              <div className="detail-facts">
                <span>
                  <MapPin size={18} />
                  {r.location}
                </span>
                <span>
                  <CalendarDays size={18} />
                  {dateLabel(r.occurredAt)}
                </span>
              </div>
              <h2>Detail barang</h2>
              <p className="description">{r.description}</p>
              <div className="contact-box">
                <h2>Merasa ini barangmu?</h2>
                <p>
                  Hubungi pelapor melalui kontak yang dipilihnya. Cocokkan ciri
                  barang sebelum bertemu.
                </p>
                <a
                  className="button"
                  href={
                    r.contact.method === "EMAIL"
                      ? `mailto:${r.contact.value}`
                      : `https://wa.me/${r.contact.value.replace("+", "")}`
                  }
                  {...(r.contact.method === "WHATSAPP"
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {r.contact.method === "EMAIL" ? (
                    <Mail size={17} />
                  ) : (
                    <Phone size={17} />
                  )}{" "}
                  {r.contact.method === "EMAIL"
                    ? "Kirim email"
                    : "Hubungi via WhatsApp"}{" "}
                  <ArrowUpRight size={16} />
                </a>
                <span className="contact-value">{r.contact.value}</span>
              </div>
              <small className="detail-date">
                Dilaporkan pada {dateLabel(r.createdAt)}
              </small>
            </div>
          </div>
          <div className="privacy-note">
            Jaga privasi bersama. Jangan bagikan nomor identitas atau foto kartu
            secara lengkap. Bertemu di area kampus yang ramai.
          </div>
        </>
      )}
    </section>
  );
}
const blank = {
  type: "LOST",
  itemName: "",
  category: "",
  location: "",
  occurredAt: "",
  description: "",
  contactMethod: "EMAIL",
  contactValue: "",
};
function Submission() {
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);
  const [uploads, setUploads] = useState(null);
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const errorRef = useRef(null);
  useEffect(() => {
    let active = true;
    request("/health")
      .then((r) => {
        if (active) setUploads(r.data.uploadsEnabled);
      })
      .catch(() => {
        if (active) setUploads(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  function change(e) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "contactMethod" ? { contactValue: "" } : {}),
    }));
    setErrors((v) => ({ ...v, [name]: null }));
  }
  function selectFile(e) {
    const candidate = e.target.files?.[0];
    setError("");
    if (!candidate) {
      setFile(null);
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(candidate.type) ||
      candidate.size > 5 * 1024 * 1024
    ) {
      setError("Pilih foto JPEG, PNG, atau WebP maksimal 5 MB.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(candidate);
  }
  function validate() {
    const e = {};
    if (form.itemName.trim().length < 3)
      e.itemName = "Nama barang minimal 3 karakter.";
    if (!form.category) e.category = "Pilih kategori.";
    if (form.location.trim().length < 2)
      e.location = "Isi lokasi minimal 2 karakter.";
    if (
      !form.occurredAt ||
      form.occurredAt > new Date().toLocaleDateString("en-CA")
    )
      e.occurredAt = "Pilih tanggal yang tidak berada di masa depan.";
    if (form.description.trim().length < 10)
      e.description = "Deskripsi minimal 10 karakter.";
    if (
      !(form.contactMethod === "EMAIL"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactValue)
        : /^\+[1-9]\d{7,14}$/.test(form.contactValue))
    )
      e.contactValue =
        form.contactMethod === "EMAIL"
          ? "Isi alamat email yang valid."
          : "Gunakan nomor internasional, contoh +6281234567890.";
    return e;
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const issues = validate();
    setErrors(issues);
    if (Object.keys(issues).length) {
      setError("Ada isian yang perlu diperbaiki.");
      return;
    }
    setBusy(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v.trim()));
    if (file) body.append("image", file);
    try {
      const result = await request("/reports", { body });
      setSuccess(result.data);
    } catch (e) {
      setError(e.message);
      if (e.fields)
        setErrors(
          Object.fromEntries(
            Object.entries(e.fields).map(([k, v]) => [k, v.join(" ")]),
          ),
        );
    } finally {
      setBusy(false);
    }
  }
  function field(name, label, element) {
    return (
      <div className="field">
        <label htmlFor={name}>
          {label} <span>*</span>
        </label>
        {element({
          id: name,
          name,
          value: form[name],
          onChange: change,
          "aria-invalid": !!errors[name],
          "aria-describedby": errors[name] ? `${name}-error` : undefined,
          required: true,
        })}
        {errors[name] && (
          <span className="field-error" id={`${name}-error`}>
            {errors[name]}
          </span>
        )}
      </div>
    );
  }
  if (success)
    return (
      <section className="shell success-state">
        <CheckCircle2 size={58} />
        <div className="eyebrow">TERIMA KASIH SUDAH PEDULI</div>
        <h1>Laporanmu sudah tayang.</h1>
        <p>
          Semoga {success.itemName.toLowerCase()} segera bertemu pemiliknya.
        </p>
        <button
          className="button"
          onClick={() => navigate(`/reports/${success.id}`)}
        >
          Lihat laporan <ArrowRight size={17} />
        </button>
        <Link to="/" className="back-link">
          Kembali ke semua laporan
        </Link>
      </section>
    );
  return (
    <section className="shell page-section">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} /> Kembali ke laporan
      </Link>
      <div className="form-layout">
        <aside className="form-intro">
          <div className="eyebrow muted">SATU LANGKAH KECIL</div>
          <h1>
            Bantu barang
            <br /> menemukan
            <br /> <em>jalan pulang.</em>
          </h1>
          <p>
            Ceritakan barang yang kamu cari atau temukan. Detail yang jelas akan
            memudahkan temanmu mengenalinya.
          </p>
          <div className="intro-note">
            <Package size={26} />
            <b>Berbagi dengan aman</b>
            <p>
              Hanya satu metode kontak pilihanmu yang akan ditampilkan di
              halaman detail. Hindari menulis data pribadi di deskripsi atau
              foto.
            </p>
          </div>
        </aside>
        <form className="report-form" onSubmit={submit} noValidate>
          <h2>Buat laporan</h2>
          <p className="form-subtitle">Kolom bertanda * wajib diisi.</p>
          <fieldset disabled={busy}>
            <legend>Jenis laporan *</legend>
            <div className="report-type-choice">
              {[
                ["LOST", "Saya kehilangan", "Bantu cari barangku"],
                ["FOUND", "Saya menemukan", "Bantu cari pemiliknya"],
              ].map(([v, t, d]) => (
                <label key={v} className={form.type === v ? "active" : ""}>
                  <input
                    type="radio"
                    name="type"
                    value={v}
                    checked={form.type === v}
                    onChange={change}
                  />
                  <span>
                    <b>{t}</b>
                    <small>{d}</small>
                  </span>
                </label>
              ))}
            </div>
            {field("itemName", "Nama barang", (p) => (
              <input
                {...p}
                maxLength={100}
                placeholder="Contoh: Tumbler biru navy"
              />
            ))}
            <div className="form-row">
              {field("category", "Kategori", (p) => (
                <select {...p}>
                  <option value="">Pilih kategori</option>
                  {Object.entries(categories).map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              ))}
              {field(
                "occurredAt",
                form.type === "LOST"
                  ? "Tanggal kehilangan"
                  : "Tanggal ditemukan",
                (p) => (
                  <input
                    {...p}
                    type="date"
                    onInput={change}
                    max={new Date().toLocaleDateString("en-CA")}
                  />
                ),
              )}
            </div>
            {field("location", "Lokasi", (p) => (
              <input
                {...p}
                maxLength={100}
                list="submission-locations"
                placeholder="Contoh: A206"
              />
            ))}
            <datalist id="submission-locations">
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            {field("description", "Deskripsi barang", (p) => (
              <textarea
                {...p}
                rows={4}
                maxLength={2000}
                placeholder="Warna, ciri khusus, dan informasi yang membantu…"
              />
            ))}
            <div className="field">
              <label htmlFor="image">
                Foto barang <small>opsional</small>
              </label>
              <div className="upload-zone">
                {preview ? (
                  <div className="upload-preview">
                    <img src={preview} alt="Pratinjau foto barang" />
                    <button
                      type="button"
                      aria-label="Hapus foto"
                      onClick={() => {
                        setFile(null);
                        fileRef.current.value = "";
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={25} />
                    <b>
                      {uploads === null
                        ? "Memeriksa layanan foto…"
                        : uploads
                          ? "Tambahkan foto barang"
                          : "Laporan tanpa foto tetap bisa dikirim"}
                    </b>
                    <span>JPEG, PNG, WebP · maksimal 5 MB</span>
                  </>
                )}
                <input
                  ref={fileRef}
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!uploads}
                  onChange={selectFile}
                />
              </div>
              {uploads === false && (
                <small>
                  Layanan unggah foto belum tersedia. Placeholder akan
                  ditampilkan.
                </small>
              )}
            </div>
            <div className="contact-section">
              <h3>Kontak publik pilihanmu</h3>
              <p>
                Pilih satu. Kontak ini terlihat oleh pengunjung pada detail
                laporan.
              </p>
              {field("contactMethod", "Metode kontak", (p) => (
                <select {...p}>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              ))}
              {field(
                "contactValue",
                form.contactMethod === "EMAIL"
                  ? "Alamat email"
                  : "Nomor WhatsApp",
                (p) => (
                  <input
                    {...p}
                    type={form.contactMethod === "EMAIL" ? "email" : "tel"}
                    maxLength={254}
                    placeholder={
                      form.contactMethod === "EMAIL"
                        ? "nama@example.com"
                        : "+6281234567890"
                    }
                  />
                ),
              )}
            </div>
            {error && (
              <div
                className="form-error"
                ref={errorRef}
                tabIndex={-1}
                role="alert"
              >
                {error}
              </div>
            )}
            <p className="consent-note">
              Dengan mengirim laporan, kamu setuju detail barang dan kontak
              pilihanmu ditampilkan secara publik.
            </p>
            <button
              type="submit"
              className="button submit-button"
              disabled={busy}
            >
              {busy ? "Mengirim laporan…" : "Publikasikan laporan"}
              <ArrowUpRight size={18} />
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
export default App;
