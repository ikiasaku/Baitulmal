
import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, Plus, History, Download,
    Upload,
    Wallet,
    User,
    Users,
    Activity,
    Calendar,
    Search,
    Filter,
    ArrowRight,
    Edit2,
    Trash2,
    Shield,
    FileText,
    TrendingUp,
    ChevronDown,
    Loader2,
    X,
    Printer, RefreshCw, Save, CheckCircle, AlertCircle
} from 'lucide-react';
import {
    fetchSedekahSummary,
    fetchSedekahList,
    createSedekah,
    updateSedekahApi,
    deleteSedekahApi,
    fetchPengeluaranList,
    createPengeluaran,
    updatePengeluaran,
    deletePengeluaran
} from '../services/santunanApi';
import { useSignatureRule } from '../hooks/useSignatureRule';
import PrintLayout from '../components/PrintLayout';
import { usePagePrint } from '../hooks/usePagePrint';
import SedekahAnalytics from '../components/SedekahAnalytics';

// ---- SIMULATED USERS (Moved outside for initialization access) ----
const SIMULATED_USERS = [
    { id: 99, nama: 'Admin Baitulmal (RW)', role: 'RW', rt_kode: null },
    { id: 1, nama: 'Petugas RT 01', role: 'RT', rt_kode: '01' },
    { id: 2, nama: 'Petugas RT 02', role: 'RT', rt_kode: '02' },
    { id: 3, nama: 'Petugas RT 03', role: 'RT', rt_kode: '03' },
    { id: 4, nama: 'Petugas RT 04', role: 'RT', rt_kode: '04' },
    { id: 5, nama: 'Petugas RT 05', role: 'RT', rt_kode: '05' },
    { id: 6, nama: 'Petugas RT 06', role: 'RT', rt_kode: '06' },
    { id: 7, nama: 'Petugas RT 07', role: 'RT', rt_kode: '07' },
];

const Sedekah = () => {
    // ---- GLOBAL STATE ----
    // Default to Admin, or load from storage if previously selected
    // ENFORCED: If logged in as User RT, force the specific RT user.
    const [currentUser, setCurrentUser] = useState(() => {
        const appRole = localStorage.getItem('app_role');
        const realUser = JSON.parse(localStorage.getItem('user') || '{}');

        // RBAC: If User RT, force selection
        if (appRole === 'User RT') {
            const email = realUser.email || '';
            // Extract RT number from email (e.g. rt01 -> 01)
            const rtMatch = email.match(/rt(\d+)/i);
            const rtKode = rtMatch ? rtMatch[1] : null;

            if (rtKode) {
                const enforced = SIMULATED_USERS.find(u => u.rt_kode === rtKode);
                if (enforced) return enforced;
            }
        }

        const saved = localStorage.getItem('sedekah_simulation_user');
        return saved ? JSON.parse(saved) : SIMULATED_USERS[0];
    });

    const isRestricted = localStorage.getItem('app_role') === 'User RT';

    const [showUserMenu, setShowUserMenu] = useState(false);

    // ---- FILTERS ----
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // ---- SIGNATURES ----
    const { leftSigner, rightSigner } = useSignatureRule(
        'sedekah',
        'ALL',
        currentUser.role === 'RT' ? currentUser.rt_kode : 'ALL'
    );

    // ---- LIFTED STATE FOR RW VIEW ----
    const [rwActiveTab, setRwActiveTab] = useState('monitoring');

    // ---- SIMULATED USERS CONSTANT MOVED UP ----

    const handleUserSelect = (user) => {
        setCurrentUser(user);
        localStorage.setItem('sedekah_simulation_user', JSON.stringify(user));
        setShowUserMenu(false);
    };

    // ---- PRINT HANDLER ----
    const printRef = useRef();
    const handlePrint = usePagePrint(printRef, `Laporan_Sedekah_${selectedMonth}_${selectedYear} `);

    return (
        <>
            <div className="sedekah-v3-container p-4 fade-in no-print">
                {/* HEADER AREA */}
                <div className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-4" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                        <h2 className="mb-1 fw-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                            {currentUser.role === 'RT' ? `Kotak Sedekah ${currentUser.rt_kode} ` : 'Dashboard Pusat Baitulmal'}
                        </h2>
                    </div>


                </div>

                {/* FILTER & ACTION BAR */}
                {/* FILTER & ACTION BAR */}
                <div className="glass-card mb-4 p-3" style={{ borderRadius: '16px', overflow: 'visible', position: 'relative', zIndex: 10 }}>
                    <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                            <span className="fw-bold small text-uppercase" style={{ color: 'var(--text-muted)' }}>Filter Periode:</span>

                            {/* Month Select */}
                            <select
                                className="input"
                                style={{ width: '140px', padding: '0.4rem 0.8rem', height: 'auto' }}
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                <option value="">Semua Bulan</option>
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                                ))}
                            </select>

                            {/* Year Select */}
                            <select
                                className="input"
                                style={{ width: '100px', padding: '0.4rem 0.8rem', height: 'auto' }}
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                <option value="">Semua</option>
                                {[2024, 2025, 2026, 2027, 2028].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Signature Status Preview */}


                        <div className="d-flex align-items-center gap-2">


                            {/* Signature Status Preview - Moved Here */}
                            <div className="d-none d-md-flex align-items-center gap-2 small px-3 py-2 rounded-pill border me-2" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-color)' }}>
                                <Shield size={14} className={leftSigner ? "text-success" : "text-muted"} />
                                <span style={{ color: 'var(--text-muted)' }}>TTD:</span>
                                {leftSigner || rightSigner ? (
                                    <strong style={{ color: 'var(--text-main)' }}>
                                        {leftSigner?.nama_pejabat?.split(' ')[0] || '?'} & {rightSigner?.nama_pejabat?.split(' ')[0] || '?'}
                                    </strong>
                                ) : (
                                    <span className="text-danger fst-italic">Belum diset</span>
                                )}
                            </div>

                            {/* Refresh Button */}
                            <button className="btn btn-ghost shadow-sm border fw-bold d-flex align-items-center justify-content-center"
                                onClick={() => window.location.reload()}
                                style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)', width: '40px', height: '40px', padding: 0 }}
                                title="Refresh Data"
                            >
                                <RefreshCw size={18} />
                            </button>

                            {/* Print Button */}
                            <button className="btn btn-primary shadow-sm fw-bold d-flex align-items-center justify-content-center"
                                onClick={handlePrint}
                                style={{ width: '40px', height: '40px', padding: 0 }}
                                title="Print Laporan"
                            >
                                <Printer size={18} />
                            </button>

                            {/* ROLE SWITCHER - MOVED HERE */
                                // Hide if restricted user (User RT)
                                !isRestricted && (
                                    <div className="position-relative">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="btn btn-ghost shadow-sm border fw-bold d-flex align-items-center gap-2"
                                            style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
                                            title="Klik untuk ganti role"
                                        >
                                            <User size={16} />
                                            {currentUser.nama}
                                            <ChevronDown size={14} className="text-muted" />
                                        </button>

                                        {showUserMenu && (
                                            <div className="position-absolute end-0 mt-2 shadow-lg rounded-4 p-2 glass-card" style={{ width: '240px', zIndex: 1000, border: '1px solid var(--border-color)' }}>
                                                <div className="small fw-bold px-3 py-2 border-bottom mb-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>PILIH SIMULASI ROLE</div>
                                                {SIMULATED_USERS.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => handleUserSelect(u)}
                                                        className={`btn btn-sm w-100 text-start px-3 py-2 mb-1 rounded-3 d-flex justify-content-between`}
                                                        style={{
                                                            background: currentUser.id === u.id ? 'var(--primary)' : 'transparent',
                                                            color: currentUser.id === u.id ? '#fff' : 'var(--text-main)'
                                                        }}
                                                    >
                                                        <span>{u.nama}</span>
                                                        {currentUser.id === u.id && <CheckCircle size={14} />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA BASED ON ROLE */}
                {currentUser.role === 'RT' ? (
                    <RTInputView user={currentUser} month={selectedMonth} year={selectedYear} />
                ) : (
                    <RWAggregationView month={selectedMonth} year={selectedYear} activeTab={rwActiveTab} setActiveTab={setRwActiveTab} />
                )}
            </div>

            {/* PRINT LAYOUT (HIDDEN UNLESS PRINTING) */}
            <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
                <PrintLayout
                    ref={printRef}
                    title={currentUser.role === 'RT' ? `Laporan Kotak Sedekah - RT ${currentUser.rt_kode}` : (rwActiveTab === 'pengeluaran' ? 'Laporan Pengeluaran Operasional' : 'Laporan Rekapitulasi Sedekah RW')}
                    subtitle={`Periode: ${selectedMonth ? new Date(0, selectedMonth - 1).toLocaleString('id-ID', { month: 'long' }) : 'Semua'} ${selectedYear || ''}`}
                >
                    {currentUser.role === 'RT' ? (
                        <RTInputView user={currentUser} month={selectedMonth} year={selectedYear} isPrintMode signer={{ left: leftSigner, right: rightSigner }} />
                    ) : (
                        rwActiveTab === 'pengeluaran' ? (
                            <PengeluaranTable month={selectedMonth} year={selectedYear} isPrintMode signer={{ left: leftSigner, right: rightSigner }} />
                        ) : (
                            <RWAggregationView month={selectedMonth} year={selectedYear} isPrintMode signer={{ left: leftSigner, right: rightSigner }} />
                        )
                    )}
                </PrintLayout>
            </div>
        </>
    );
};

// ============================================
// COMPONENT 1: AMIL RT VIEW (DETAILED INPUT)
// ============================================
const RTInputView = ({ user, month, year, isPrintMode = false, signer }) => {
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const totalCollected = details.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        nama_donatur: '',
        no_hp_donatur: '',
        nominal: ''
    });

    useEffect(() => {
        loadMyDetails();
    }, [user.rt_kode, month, year]);

    const loadMyDetails = async () => {
        setLoading(true);
        // Backend supports rt_kode filter
        const res = await fetchSedekahList({
            rt_kode: user.rt_kode,
            tahun: year,
            jenis: 'penerimaan'
        });
        setDetails(res.data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                rt_id: user.id === 99 ? null : user.id, // Map simulated ID to real DB ID (assuming they match for RTs)
                rt_kode: user.rt_kode, // Fallback search in controller
                tanggal: formData.tanggal,
                nama_donatur: formData.nama_donatur,
                no_hp_donatur: formData.no_hp_donatur,
                jumlah: formData.nominal,
                jenis: 'penerimaan',
                tujuan: 'Kotak Sedekah',
                tahun: year
            };
            const res = await createSedekah(payload);
            if (res) {
                await loadMyDetails();
                setFormData(prev => ({ ...prev, nama_donatur: '', no_hp_donatur: '', nominal: '' }));
                alert("Alhamdulillah, data sedekah tersimpan!");
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (isPrintMode) {
        return (
            <>
                <table className="table table-bordered border-dark">
                    <thead>
                        <tr className="bg-light fw-bold">
                            <th style={{ width: '5%' }}>No</th>
                            <th>Tanggal</th>
                            <th>Nama Donatur</th>
                            <th className="text-end">Nominal (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.map((item, idx) => (
                            <tr key={item.id}>
                                <td>{idx + 1}</td>
                                <td>{item.tanggal}</td>
                                <td>{item.nama_donatur}</td>
                                <td className="text-end">{Number(item.jumlah || 0).toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                        <tr className="fw-bold bg-light">
                            <td colSpan="3" className="text-center">TOTAL</td>
                            <td className="text-end">Rp {totalCollected.toLocaleString('id-ID')}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="signature-grid">
                    <div className="signature-item">
                        <div className="signature-title">{signer?.left?.jabatan || 'Ketua Baitulmal'}</div>
                        <div className="signature-name">{signer?.left?.nama_pejabat || '............................'}</div>
                        {signer?.left?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP/NIY: {signer.left.nip}</div>}
                    </div>
                    <div className="signature-item">
                        <div className="signature-title">{signer?.right?.jabatan || 'Sekretaris / Bendahara'}</div>
                        <div className="signature-name">{signer?.right?.nama_pejabat || '............................'}</div>
                        {signer?.right?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP/NIY: {signer.right.nip}</div>}
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="row g-4">
            {/* LEFT: INPUT FORM */}
            <div className="col-lg-4">
                <div className="glass-card overflow-hidden" style={{ borderRadius: '16px', height: '100%' }}>
                    <div className="p-4 border-bottom" style={{ borderColor: 'var(--border-color)', background: 'linear-gradient(to right, rgba(0, 144, 231, 0.05), transparent)' }}>
                        <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--primary)' }}>
                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 36, height: 36, background: 'rgba(0, 144, 231, 0.15)' }}>
                                <Plus size={20} />
                            </div>
                            Input Sedekah
                        </h5>
                        <div className="small mt-1" style={{ color: 'var(--text-muted)' }}>Catat setiap penerimaan detail</div>
                    </div>
                    <div className="p-4">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    className="input w-100" // Added w-100
                                    style={{ fontWeight: 600 }}
                                    value={formData.tanggal}
                                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                                    Nama Donatur
                                </label>
                                <input
                                    type="text"
                                    className="input w-100"
                                    style={{ fontWeight: 600 }}
                                    placeholder="Contoh: Hamba Allah"
                                    value={formData.nama_donatur}
                                    onChange={e => setFormData({ ...formData, nama_donatur: e.target.value })}
                                />
                                <div className="form-text mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Kosongkan jika anonim / Hamba Allah</div>
                            </div>
                            <div className="mb-4">
                                <label className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                                    No. HP Donatur (WhatsApp)
                                </label>
                                <input
                                    type="text"
                                    className="input w-100"
                                    style={{ fontWeight: 600 }}
                                    placeholder="Contoh: 08123456789"
                                    value={formData.no_hp_donatur}
                                    onChange={e => setFormData({ ...formData, no_hp_donatur: e.target.value })}
                                />
                                <div className="form-text mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Untuk pengiriman pesan terima kasih otomatis</div>
                            </div>
                            <div className="mb-4">
                                <label className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                                    Nominal (Rp)
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text fw-bold" style={{ background: 'var(--success)', color: '#fff', border: 'none', paddingLeft: '1rem', paddingRight: '1rem' }}>Rp</span>
                                    <input
                                        type="number"
                                        className="input"
                                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}
                                        placeholder="0"
                                        min="1"
                                        value={formData.nominal}
                                        onChange={e => setFormData({ ...formData, nominal: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button disabled={submitting} className="btn btn-primary w-100 btn-lg rounded-3 fw-bold shadow-sm mt-2" style={{ height: '50px', letterSpacing: '0.5px' }}>
                                {submitting ? <Loader2 className="spin" /> : <div className="d-flex align-items-center justify-content-center gap-2"><Save size={18} /> SIMPAN DATA</div>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* RIGHT: LIST & SUMMARY */}
            <div className="col-lg-8">
                {/* SMALL STATS CARD */}
                <div className="glass-card mb-4 border-0 shadow-sm" style={{
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(0, 180, 100, 0.15) 0%, rgba(0,0,0,0) 100%)', // Subtle gradient for dark mode
                    border: '1px solid rgba(0, 180, 100, 0.3)'
                }}>
                    <div className="card-body p-4 d-flex justify-content-between align-items-center">
                        <div>
                            <div className="text-uppercase small mb-1" style={{ color: 'var(--success)', fontWeight: 700 }}>Total Terkumpul (RT {user.rt_kode})</div>
                            <h2 className="mb-0 fw-black display-6" style={{ color: 'var(--text-main)' }}>Rp {totalCollected.toLocaleString('id-ID')}</h2>
                            <div className="small mt-1" style={{ color: 'var(--text-muted)' }}>
                                Filter: {month ? document.querySelector(`option[value = "${month}"]`)?.innerText : 'Semua Bulan'} {year}
                            </div>
                        </div>
                        <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0, 180, 100, 0.2)', color: 'var(--success)' }}>
                            <TrendingUp size={32} />
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                        <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-main)', letterSpacing: '0.5px' }}>RIWAYAT INPUT TERBARU</h6>
                        <span className="badge border" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{details.length} Transaksi</span>
                    </div>
                    <div className="table-responsive">
                        <table className="table-compact">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '1.5rem' }}>TANGGAL</th>
                                    <th>DONATUR</th>
                                    <th className="text-end" style={{ paddingRight: '1.5rem' }}>NOMINAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center py-5"><Loader2 className="spin mx-auto text-muted" /></td></tr>
                                ) : details.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-5 text-muted fst-italic">Belum ada data sedekah pada periode ini.</td></tr>
                                ) : (
                                    details.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                            </td>
                                            <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.nama_donatur}</td>
                                            <td className="text-end" style={{ paddingRight: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                                                Rp {Number(item.jumlah || 0).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ============================================
// COMPONENT 2: AMIL RW VIEW (AGGREGATION)
// ============================================
const RWAggregationView = ({ month, year, isPrintMode = false, signer, activeTab, setActiveTab }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [auditRT, setAuditRT] = useState(null);


    useEffect(() => {
        load();
    }, [month, year, activeTab]); // Reload when tab changes (to recalc balance)

    const load = async () => {
        setLoading(true);
        const res = await fetchSedekahSummary({ tahun: year });
        if (res.success) setData(res.data);
        setLoading(false);
    };

    if (isPrintMode) {
        return (
            <>
                <table className="table table-bordered border-dark">
                    <thead>
                        <tr className="bg-light fw-bold">
                            <th style={{ width: '5%' }}>No</th>
                            <th>Wilayah</th>
                            <th className="text-center">Jumlah Transaksi</th>
                            <th className="text-center">Tanggal Terakhir</th>
                            <th className="text-end">Total Nominal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.breakdown.map((rt, idx) => (
                            <tr key={rt.rt_kode}>
                                <td>{idx + 1}</td>
                                <td>RT {rt.rt_kode}</td>
                                <td className="text-center">{rt.transaction_count}</td>
                                <td className="text-center">{rt.last_transaction || '-'}</td>
                                <td className="text-end">Rp {rt.total_nominal.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                        <tr className="fw-bold bg-light">
                            <td colSpan="4" className="text-center">GRAND TOTAL</td>
                            <td className="text-end">Rp {data?.grand_total.toLocaleString('id-ID')}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="signature-grid">
                    <div className="signature-item">
                        <div className="signature-title">{signer?.left?.jabatan || 'Ketua Baitulmal'}</div>
                        <div className="signature-name">{signer?.left?.nama_pejabat || '............................'}</div>
                        {signer?.left?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP/NIY: {signer.left.nip}</div>}
                    </div>
                    <div className="signature-item">
                        <div className="signature-title">{signer?.right?.jabatan || 'Sekretaris / Bendahara'}</div>
                        <div className="signature-name">{signer?.right?.nama_pejabat || '............................'}</div>
                        {signer?.right?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP/NIY: {signer.right.nip}</div>}
                    </div>
                </div>
            </>
        );
    }

    if (!data) return <div className="text-center py-5"><Loader2 className="spin" /></div>;

    return (
        <div className="rw-dashboard">
            {/* TOP STATS */}
            <div className="row mb-4 g-3">
                <div className="col-md-4">
                    <div className="card stat-hover" style={{ borderLeft: '4px solid var(--primary)', padding: '1.25rem' }}>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(0, 144, 231, 0.08)', color: 'var(--primary)' }}>
                                <TrendingUp size={20} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>PEMASUKAN</div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Rp {(data.grand_total || 0).toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card stat-hover" style={{ borderLeft: '4px solid var(--danger)', padding: '1.25rem' }}>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)' }}>
                                <Activity size={20} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>PENGELUARAN</div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Rp {(data.total_expense || 0).toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card stat-hover" style={{ borderLeft: '4px solid var(--success)', padding: '1.25rem' }}>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}>
                                <Wallet size={20} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>SALDO BERSIH</div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Rp {(data.net_balance || 0).toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB SWITCHER */}
            <div className="glass-card mb-4 p-1 d-flex gap-1" style={{ borderRadius: '12px', width: 'fit-content' }}>
                <button
                    className={`btn btn-sm fw-bold px-4 ${activeTab === 'monitoring' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderRadius: '8px' }}
                    onClick={() => setActiveTab('monitoring')}
                >
                    <LayoutDashboard size={14} className="me-2" /> MONITORING RT
                </button>
                <button
                    className={`btn btn-sm fw-bold px-4 ${activeTab === 'pengeluaran' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderRadius: '8px' }}
                    onClick={() => setActiveTab('pengeluaran')}
                >
                    <ArrowRight size={14} className="me-2" /> DATA PENGELUARAN
                </button>
                <button
                    className={`btn btn-sm fw-bold px-4 ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderRadius: '8px' }}
                    onClick={() => setActiveTab('analytics')}
                >
                    <Activity size={14} className="me-2" /> ANALISA & AI
                </button>
            </div>

            {/* CONTENT BASED ON TAB */}
            {activeTab === 'pengeluaran' ? (
                <PengeluaranTable month={month} year={year} />
            ) : activeTab === 'analytics' ? (
                <SedekahAnalytics />
            ) : (
                <>
                    {/* AUDIT MODAL / VIEW */}
                    {auditRT && (
                        <div className="mb-4 fade-in">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="fw-bold text-primary">Audit Detail: RT {auditRT}</h5>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => setAuditRT(null)}>Tutup Audit</button>
                            </div>
                            <AuditTable rt={auditRT} month={month} year={year} isAdmin={true} />
                        </div>
                    )}

                    {/* BREAKDOWN GRID */}
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}><LayoutDashboard size={18} /> Monitoring Per Wilayah RT</h5>
                    <div className="row g-3">
                        {loading ? <div className="col-12 text-center py-5"><Loader2 className="spin" /></div> :
                            data.breakdown.map(rt => (
                                <div className="col-md-6 col-lg-3" key={rt.rt_kode}>
                                    <div
                                        className={`glass - card h - 100 border - 0 shadow - sm rounded - 4 cursor - pointer transition - all hover - lift ${auditRT === rt.rt_kode ? 'ring-2 ring-primary' : ''} `}
                                        onClick={() => setAuditRT(rt.rt_kode)}
                                        style={{ borderRadius: '16px' }}
                                    >
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-muted)' }}>RT {rt.rt_kode}</h5>
                                                {rt.last_transaction && (
                                                    <span className="badge border" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`fw - bold mb - 1`} style={{ color: rt.total_nominal > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                Rp {rt.total_nominal.toLocaleString('id-ID')}
                                            </h3>
                                            <div className="small mb-3" style={{ color: 'var(--text-muted)' }}>{rt.transaction_count} Transaksi</div>

                                            <button className="btn btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1 group" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--primary)', border: '1px solid var(--border-color)' }}>
                                                Buka Detail <ArrowRight size={14} className="group-hover-translate" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ============================================
// COMPONENT 4: PENGELUARAN TABLE (CRUD)
// ============================================
const PengeluaranTable = ({ month, year, isPrintMode = false, signer }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ tanggal: '', deskripsi: '', nominal: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        load();
    }, [month, year]);

    const load = async () => {
        setLoading(true);
        const res = await fetchPengeluaranList(month, year);
        if (res.success) setRows(res.data);
        setLoading(false);
    };

    if (isPrintMode) {
        const totalExpense = rows.reduce((acc, curr) => acc + curr.nominal, 0);
        return (
            <>
                <table className="table table-bordered border-dark">
                    <thead>
                        <tr className="bg-light fw-bold">
                            <th style={{ width: '5%' }}>No</th>
                            <th>Tanggal</th>
                            <th>Deskripsi</th>
                            <th className="text-end">Nominal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, idx) => (
                            <tr key={r.id}>
                                <td>{idx + 1}</td>
                                <td>{r.tanggal}</td>
                                <td>{r.deskripsi}</td>
                                <td className="text-end">Rp {r.nominal.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                        <tr className="fw-bold bg-light">
                            <td colSpan="3" className="text-center">TOTAL PENGELUARAN</td>
                            <td className="text-end">Rp {totalExpense.toLocaleString('id-ID')}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="signature-grid">
                    <div className="signature-item">
                        <div className="signature-title">{signer?.left?.jabatan || 'Ketua Baitulmal'}</div>
                        <div className="signature-name">{signer?.left?.nama_pejabat || '............................'}</div>
                        {signer?.left?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP/NIY: {signer.left.nip}</div>}
                    </div>
                    <div className="signature-item">
                        <div className="signature-title">{signer?.right?.jabatan || 'Sekretaris / Bendahara'}</div>
                        <div className="signature-name">{signer?.right?.nama_pejabat || '............................'}</div>
                        {signer?.right?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP/NIY: {signer.right.nip}</div>}
                    </div>
                </div>
            </>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editItem) {
                await updatePengeluaran(editItem.id, form);
            } else {
                await createPengeluaran(form);
            }
            setForm({ tanggal: '', deskripsi: '', nominal: '' });
            setIsAdding(false);
            setEditItem(null);
            load();
        } catch (e) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hapus data pengeluaran ini?")) return;
        try {
            await deletePengeluaran(id);
            load();
        } catch (e) {
            console.error("Delete Pengeluaran Error:", e);
            alert("Gagal menghapus data: " + (e.response?.data?.message || e.message));
        }
    };

    const openEdit = (item) => {
        setForm({ tanggal: item.tanggal, deskripsi: item.deskripsi, nominal: item.nominal });
        setEditItem(item);
        setIsAdding(true);
    };

    return (
        <>
            <div className="glass-card mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                    <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-main)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>DAFTAR PENGELUARAN OPERASIONAL</h6>
                    <button className="btn btn-sm btn-primary fw-bold" onClick={() => { setIsAdding(true); setEditItem(null); setForm({ tanggal: new Date().toISOString().split('T')[0], deskripsi: '', nominal: '' }); }}>
                        <Plus size={14} className="me-1" /> TAMBAH
                    </button>
                </div>

                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                    <table className="table-compact">
                        <thead>
                            <tr>
                                <th className="p-3" style={{ paddingLeft: '1.5rem', textTransform: 'uppercase' }}>Tanggal</th>
                                <th className="p-3" style={{ textTransform: 'uppercase' }}>Deskripsi</th>
                                <th className="p-3 text-end" style={{ textTransform: 'uppercase' }}>Nominal</th>
                                <th className="p-3 text-center" style={{ textTransform: 'uppercase' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="4" className="text-center py-5"><Loader2 className="spin" /></td></tr> :
                                rows.length === 0 ? <tr><td colSpan="4" className="text-center py-5 text-muted fst-italic">Belum ada pengeluaran.</td></tr> :
                                    rows.map(r => (
                                        <tr key={r.id}>
                                            <td className="p-3" style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>{r.tanggal}</td>
                                            <td className="p-3 fw-bold" style={{ color: 'var(--text-main)' }}>{r.deskripsi}</td>
                                            <td className="p-3 text-end font-monospace fw-bold" style={{ color: 'var(--danger)' }}>Rp {r.nominal.toLocaleString()}</td>
                                            <td className="p-3 text-center">
                                                <button className="btn btn-sm btn-ghost p-1 me-2" onClick={() => openEdit(r)} style={{ color: 'var(--primary)' }}><Edit2 size={14} /></button>
                                                <button className="btn btn-sm btn-ghost p-1" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM - SIBLING FOR Z-INDEX FIX */}
            {isAdding && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
                    <div className="card shadow-lg p-0" style={{ width: '450px', borderRadius: '16px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                                    {editItem ? <Edit2 size={18} /> : <Plus size={18} />}
                                    {editItem ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                                </h5>
                                <button className="btn btn-sm btn-ghost text-white-50" onClick={() => setIsAdding(false)}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-4">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="d-block mb-2 text-uppercase fw-bold text-white-50" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Tanggal</label>
                                    <input
                                        type="date"
                                        className="form-control bg-dark text-white border-secondary"
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        value={form.tanggal}
                                        onChange={e => setForm({ ...form, tanggal: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="d-block mb-2 text-uppercase fw-bold text-white-50" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Deskripsi</label>
                                    <input
                                        type="text"
                                        className="form-control bg-dark text-white border-secondary"
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        placeholder="Contoh: Beli ATK"
                                        value={form.deskripsi}
                                        onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="d-block mb-2 text-uppercase fw-bold text-white-50" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Nominal</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-danger text-white border-0 fw-bold">Rp</span>
                                        <input
                                            type="number"
                                            className="form-control bg-dark text-white border-secondary fw-bold"
                                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            value={form.nominal}
                                            onChange={e => setForm({ ...form, nominal: e.target.value })}
                                            required min="1"
                                        />
                                    </div>
                                </div>
                                <div className="d-flex gap-2 pt-2">
                                    <button type="button" className="btn btn-outline-secondary w-50 text-white-50" onClick={() => setForm({ ...form, deskripsi: '', nominal: '' })}>Clear</button>
                                    <button type="submit" disabled={submitting} className="btn btn-primary w-50 fw-bold shadow-sm">{submitting ? <Loader2 className="spin" /> : 'Simpan Data'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ============================================
// COMPONENT 3: AUDIT TABLE (READ ONLY + ADMIN ACTIONS)
// ============================================
const AuditTable = ({ rt, month, year, isAdmin = false }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState(null);

    useEffect(() => {
        load();
    }, [rt, month, year]);

    const load = async () => {
        setLoading(true);
        const res = await fetchSedekahList({
            rt_kode: rt,
            tahun: year,
            jenis: 'penerimaan'
        });
        setRows(res.data || []);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.")) return;
        try {
            await deleteSedekahApi(id);
            load(); // reload
        } catch (e) {
            alert(e.message);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateSedekahApi(editItem.id, {
                tanggal: editItem.tanggal,
                nama_donatur: editItem.nama_donatur,
                jumlah: editItem.nominal
            });
            setEditItem(null);
            load();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <>
            <div className="glass-card mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                    <table className="table-compact">
                        <thead>
                            <tr>
                                <th className="p-3" style={{ paddingLeft: '1.5rem', textTransform: 'uppercase' }}>Tanggal</th>
                                <th className="p-3" style={{ textTransform: 'uppercase' }}>Donatur</th>
                                <th className="p-3 text-end" style={{ textTransform: 'uppercase' }}>Jumlah</th>
                                {isAdmin && <th className="p-3 text-center" style={{ textTransform: 'uppercase' }}>Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={isAdmin ? 4 : 3} className="text-center p-3 py-5"><Loader2 className="spin" style={{ color: 'var(--text-muted)' }} /></td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={isAdmin ? 4 : 3} className="text-center p-3 py-5 text-muted fst-italic">Tidak ada data di periode ini.</td></tr>}
                            {!loading && rows.map(r => (
                                <tr key={r.id}>
                                    <td className="p-3" style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>{r.tanggal}</td>
                                    <td className="p-3 fw-bold" style={{ color: 'var(--text-main)' }}>{r.nama_donatur}</td>
                                    <td className="p-3 text-end font-monospace fw-bold" style={{ color: 'var(--success)' }}>{Number(r.jumlah || 0).toLocaleString()}</td>
                                    {isAdmin && (
                                        <td className="p-3 text-center">
                                            <button className="btn btn-sm btn-ghost p-1 me-2" onClick={() => setEditItem(r)} style={{ color: 'var(--primary)' }}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-ghost p-1" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT MODAL (SIMPLE OVERLAY) */}
            {editItem && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.7)' }}>
                    <div className="glass-card shadow p-4" style={{ width: '400px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <h5 className="fw-bold mb-3" style={{ color: 'var(--text-main)' }}>Edit Transaksi</h5>
                        <form onSubmit={handleUpdate}>
                            <div className="mb-2">
                                <label className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Tanggal</label>
                                <input type="date" className="input" value={editItem.tanggal} onChange={e => setEditItem({ ...editItem, tanggal: e.target.value })} />
                            </div>
                            <div className="mb-2">
                                <label className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Donatur</label>
                                <input type="text" className="input" value={editItem.nama_donatur} onChange={e => setEditItem({ ...editItem, nama_donatur: e.target.value })} />
                            </div>
                            <div className="mb-4">
                                <label className="label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Nominal</label>
                                <input type="number" className="input" value={editItem.jumlah} onChange={e => setEditItem({ ...editItem, jumlah: e.target.value })} />
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-ghost w-50" onClick={() => setEditItem(null)} style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Batal</button>
                                <button type="submit" className="btn btn-primary w-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sedekah;
