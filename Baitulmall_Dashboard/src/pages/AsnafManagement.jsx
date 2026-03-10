import React, { useState, useEffect, useMemo, useRef } from 'react';
// Deprecated context removed
import { fetchAsnafList, createAsnaf, updateAsnaf as updateAsnafApi, deleteAsnaf as deleteAsnafApi, fetchRTs } from '../services/asnafApi';
import { fetchStrukturInti } from '../services/kepengurusanApi';
import { fetchSettings } from '../services/settingApi';
import { exportAsnafBackup, importAsnafBackup } from '../services/backupApi';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import DeathReportModal from '../components/DeathReportModal';
import { Loader2, AlertCircle as AlertIcon, X as XIcon, HeartCrack } from 'lucide-react';

import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Filter,
    Users,
    ChevronRight,
    Upload,
    Download,
    Printer,
    FileText,
    HandCoins,
    UserCog,
    HeartHandshake,
    Sword,
    Tent,
    Scale,
    Unlock,
    Wallet,
    MapPin,
    Briefcase,
    Shield,
    Trophy,
    TrendingUp, // Added for Graduation tab icon
    Activity, // Added for Analytics tab icon
    UserPlus, // Added by user instruction
    RefreshCw, // Added by user instruction
    BrainCircuit
} from 'lucide-react';
import { exportToExcel, importFromExcel } from '../utils/dataUtils';
import PrintLayout from '../components/PrintLayout';
import { usePagePrint } from '../hooks/usePagePrint';
import { useSignatureRule } from '../hooks/useSignatureRule';
import useRealtimeStats from '../hooks/useRealtimeStats';
import GraduationTab from '../components/Asnaf/GraduationTab';
import AsnafAnalyticsTab from '../components/Asnaf/AsnafAnalyticsTab';

const AsnafPrint = ({ data, rt, kategori, isSpecialCategoryMode, signers }) => (
    <PrintLayout
        title={`Daftar Asnaf${!isSpecialCategoryMode && kategori !== 'Semua' ? ' ' + kategori : ''} - ${isSpecialCategoryMode ? rt : `RT ${rt}`}`}
    >
        <table className="table-print-boxed">
            <thead>
                <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                    <th style={{ width: '30%' }}>Nama Kepala Keluarga</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>RT</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Kategori</th>
                    <th style={{ width: '50px', textAlign: 'center' }}>Jiwa</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={item.id}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>{item.nama}</td>
                        <td style={{ textAlign: 'center' }}>{item.rt}</td>
                        <td style={{ textAlign: 'center' }}>{item.kategori}</td>
                        <td style={{ textAlign: 'center' }}>{item.jumlahJiwa}</td>
                        <td></td>
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="signature-grid">
            <div className="signature-item">
                <div className="signature-title">{signers.left?.jabatan || 'Ketua Baitulmal'}</div>
                <div className="signature-name">{signers.left?.nama_pejabat || '...................'}</div>
                {signers.left?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP: {signers.left.nip}</div>}
            </div>
            <div className="signature-item">
                <div className="signature-title">{signers.right?.jabatan || ''}</div>
                <div className="signature-name">{signers.right?.nama_pejabat || '...................'}</div>
                {signers.right?.nip && <div className="signature-sk" style={{ fontSize: '0.8rem', opacity: 0.8 }}>NIP: {signers.right.nip}</div>}
            </div>
        </div>
    </PrintLayout>
);

const AsnafManagement = () => {
    // Print State
    const printRef = useRef(null);
    const fileImportRef = useRef(null);
    const handlePrint = usePagePrint(printRef, 'Daftar Asnaf');

    // API State
    const [asnafData, setAsnafData] = useState([]);
    const [rtRw, setRtRw] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('master'); // 'master', 'graduation', or 'analytics'

    // Form & Filter States
    const [selectedRt, setSelectedRt] = React.useState('01');
    const [selectedKategori, setSelectedKategori] = useState('Semua');
    const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear().toString());
    const [searchTerm, setSearchTerm] = useState('');
    const [settingsList, setSettingsList] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, loading: false });
    const [strukturInti, setStrukturInti] = useState([]);

    const getSetting = (key, fallback) => {
        const s = settingsList.find(item => item.key_name === key);
        return s ? s.value : fallback;
    };

    // Real-time Statistics Hook
    const { stats: rtStats, loading: rtLoading } = useRealtimeStats(selectedTahun, {
        pollingInterval: 5000,
        enablePolling: true
    });
    const [showModal, setShowModal] = useState(false);
    const [showDeathModal, setShowDeathModal] = useState(false);
    const [selectedDeathAsnaf, setSelectedDeathAsnaf] = useState(null);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        rt: '01',
        kategori: 'Fakir',
        nama: '',
        jumlahJiwa: '',
        tahun: new Date().getFullYear().toString(),
        pendapatan: '',
        status_rumah_detail: 'numpang',
        kondisi_bangunan: 'tidak_permanen',
        fasilitas_dasar: 'keduanya_terbatas',
        custom_criteria: {}
    });

    // Unified Data Loading
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            setUsingFallback(false);

            const [rtsResponse, asnafResponse, strukturResponse, settingsRes] = await Promise.all([
                fetchRTs(),
                fetchAsnafList({ per_page: 5000 }),
                fetchStrukturInti().catch(() => []),
                fetchSettings().catch(() => ({ success: false }))
            ]);

            if (settingsRes.success) setSettingsList(settingsRes.data);
            setStrukturInti(strukturResponse);

            const rts = Array.isArray(rtsResponse) ? rtsResponse : (rtsResponse?.data || []);
            setRtRw(Array.isArray(rts) ? rts : []);

            const asnafList = asnafResponse?.data && Array.isArray(asnafResponse.data)
                ? asnafResponse.data
                : (Array.isArray(asnafResponse) ? asnafResponse : []);

            const transformedAsnaf = asnafList.map(a => ({
                id: a.id,
                rt: a.rt?.kode || '01',
                kategori: a.kategori,
                nama: a.nama,
                jumlahJiwa: Number(a.jumlah_jiwa || 0),
                tahun: a.tahun,
                pendapatan: a.pendapatan,
                kondisi_rumah: a.kondisi_rumah,
                status_rumah_detail: a.status_rumah_detail,
                kondisi_bangunan: a.kondisi_bangunan,
                fasilitas_dasar: a.fasilitas_dasar,
                score: a.score,
                custom_criteria: a.custom_criteria || {}
            }));
            setAsnafData(transformedAsnaf);
            console.log('✅ Asnaf data loaded via API');
        } catch (err) {
            console.error('⚠️ API Fetch Failed, using fallback:', err);
            setRtRw([]);
            setAsnafData([]);
            setUsingFallback(true);
            setError('Menggunakan data lokal (API tidak terjangkau)');
        } finally {
            setLoading(false);
        }
    };

    // Special categories that show all RTs
    const specialCategories = ['Amil', 'Fisabilillah'];
    const isSpecialCategoryMode = specialCategories.includes(selectedRt);

    // Determine effective params for signature
    // If we are in special mode (e.g. Amil), we treat that as the Category, and RT as ALL
    const sigCategory = isSpecialCategoryMode ? selectedRt : (selectedKategori === 'Semua' ? 'ALL' : selectedKategori);
    const sigRt = isSpecialCategoryMode ? 'ALL' : selectedRt;

    // Signature Hook
    const { leftSigner, rightSigner } = useSignatureRule('asnaf', sigCategory, sigRt);

    // Initial Data Fetching
    useEffect(() => {
        loadData();
    }, []);

    const kategoris = ['Fakir', 'Miskin', 'Amil', 'Mualaf', 'Riqab', 'Gharim', 'Fisabilillah', 'Ibnu Sabil'];
    const tahunList = ['2024', '2025', '2026'];

    // Modified filteredData to handle special category mode and year filter
    const filteredData = isSpecialCategoryMode
        ? asnafData.filter(a =>
            a.kategori === selectedRt &&
            a.tahun.toString() === selectedTahun &&
            (searchTerm === '' || a.nama.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => a.rt.localeCompare(b.rt))
        : asnafData.filter(a =>
            a.rt === selectedRt &&
            a.tahun.toString() === selectedTahun &&
            (selectedKategori === 'Semua' || a.kategori === selectedKategori) &&
            (searchTerm === '' || a.nama.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    // Stats for selected RT filtered by year
    const stats = kategoris.map(kat => {
        const data = asnafData.filter(a => a.rt === selectedRt && a.kategori === kat && a.tahun.toString() === selectedTahun);
        const totalJiwa = data.reduce((acc, curr) => acc + curr.jumlahJiwa, 0);
        return { kategori: kat, count: data.length, totalJiwa };
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submit button clicked, processing payload...");

        // Find matching RT object
        const targetRt = rtRw.find(r => r.kode === formData.rt);
        console.log("Target RT lookup:", formData.rt, "=>", targetRt);

        const payload = {
            rt_id: targetRt?.id || 1,
            nama: formData.nama,
            kategori: formData.kategori,
            jumlah_jiwa: ['Amil', 'Fisabilillah'].includes(formData.kategori) ? 1 : Number(formData.jumlahJiwa || 0),
            tahun: Number(formData.tahun),
            status: 'active',
            pendapatan: formData.pendapatan ? Number(formData.pendapatan) : null,
            status_rumah_detail: formData.status_rumah_detail,
            kondisi_bangunan: formData.kondisi_bangunan,
            fasilitas_dasar: formData.fasilitas_dasar,
            kondisi_rumah: 'numpang', // Fallback for backward compatibility
            custom_criteria: formData.custom_criteria
        };

        console.log("Payload to serve:", payload);

        setSaving(true);
        try {
            if (editId) {
                if (!usingFallback) {
                    await updateAsnafApi(editId, payload);
                }
                alert('Data berhasil diperbarui!');
            } else {
                if (!usingFallback) {
                    await createAsnaf(payload);
                }
                alert('Data berhasil ditambahkan!');
            }
            setShowModal(false);
            setEditId(null);

            // Refresh from server
            if (!usingFallback) loadData();
        } catch (err) {
            console.error('Failed to save data:', err);
            console.error('Error Response:', err.response?.data);

            let errorMessage = 'Gagal menyimpan data ke API.';
            const serverMsg = err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;

            if (validationErrors) {
                errorMessage += '\nValidasi Gagal:\n- ' + Object.values(validationErrors).flat().join('\n- ');
            } else if (serverMsg) {
                errorMessage += '\nServer: ' + serverMsg;
            } else {
                errorMessage += '\nError: ' + (err.message || 'Pastikan Laravel backend berjalan.');
            }

            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        setFormData({
            rt: item.rt,
            kategori: item.kategori,
            nama: item.nama,
            jumlahJiwa: item.jumlahJiwa,
            tahun: item.tahun || '2026',
            pendapatan: item.pendapatan || '',
            status_rumah_detail: item.status_rumah_detail || 'numpang',
            kondisi_bangunan: item.kondisi_bangunan || 'tidak_permanen',
            fasilitas_dasar: item.fasilitas_dasar || 'keduanya_terbatas',
            custom_criteria: item.custom_criteria || {}
        });
        setShowModal(true);
    };

    const handleDeleteClick = (e, id) => {
        if (e) e.stopPropagation();
        setDeleteModal({ open: true, id, loading: false });
    };

    const confirmDelete = async () => {
        const id = deleteModal.id;
        if (!id) return;

        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            if (!usingFallback) {
                await deleteAsnafApi(id);
            }
            // Always update local state to reflect deletion immediately
            setAsnafData(prev => prev.filter(a => a.id !== id));
            console.log('✅ Data deleted');
            setDeleteModal({ open: false, id: null, loading: false });
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Gagal menghapus data dari API.');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        setFormData({
            kategori: 'Fakir',
            nama: '',
            jumlahJiwa: '',
            tahun: new Date().getFullYear().toString(),
            pendapatan: '',
            status_rumah_detail: 'numpang',
            kondisi_bangunan: 'tidak_permanen',
            fasilitas_dasar: 'keduanya_terbatas',
            custom_criteria: {}
        });
    };

    const handleExport = () => {
        const dataToExport = filteredData.map(a => ({
            'RT': a.rt,
            'Kategori': a.kategori,
            'Nama Kepala Keluarga': a.nama,
            'Jumlah Jiwa': a.jumlahJiwa
        }));
        exportToExcel(dataToExport, `Data_Asnaf_RT${selectedRt} `);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const data = await importFromExcel(file);
                for (const item of data) {
                    // Normalize keys from Excel (case insensitive)
                    const normalized = {};
                    Object.keys(item).forEach(k => normalized[k.toLowerCase()] = item[k]);

                    const payload = {
                        rt_id: rtRw.find(r => r.kode === (normalized.rt || selectedRt))?.id || 1,
                        nama: normalized.nama || normalized['nama kepala keluarga'] || 'Tanpa Nama',
                        kategori: normalized.kategori || 'Miskin',
                        jumlah_jiwa: Number(normalized.jumlahjiwa) || Number(normalized['jumlah jiwa']) || 1,
                        tahun: new Date().getFullYear(),
                        status: 'active'
                    };

                    if (!usingFallback) {
                        await createAsnaf(payload);
                    }
                }
                alert('Data berhasil diimpor!');
                // Reload data or update state manually here if needed
                window.location.reload();
                e.target.value = ''; // Reset input
            } catch (error) {
                alert('Gagal mengimpor data: ' + error.message);
            }
        }
    };

    const handleImportJSON = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm('Apakah Anda yakin ingin memulihkan data dari file JSON ini? Data yang ada mungkin akan diperbarui atau ditambahkan.')) {
            e.target.value = '';
            return;
        }

        setLoading(true);
        try {
            const result = await importAsnafBackup(file);
            if (result.success) {
                alert(`Berhasil memulihkan data! ${result.count} data diproses.`);
                loadData();
            } else {
                alert('Gagal memulihkan data: ' + (result.message || 'Error tidak diketahui'));
            }
        } catch (error) {
            console.error('Import JSON error:', error);
            alert('Gagal memulihkan data. Pastikan format file benar.');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleExportJSON = async () => {
        try {
            await exportAsnafBackup();
        } catch (error) {
            alert('Gagal mengekspor data JSON.');
        }
    };

    return (
        <div className="asnaf-management-outer">


            <div className="dashboard-content">
                <div className="glass-card" style={{ marginBottom: '2.5rem', padding: '1.75rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                            <Users className="text-primary" size={32} />
                            Manajemen Asnaf & Amil
                        </h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>
                            Data penerima manfaat (8 Asnaf) dan petugas amil per wilayah.
                        </p>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                        {/* TTD Info Block */}
                        <div className="d-flex align-items-center px-3 py-2 gap-2"
                            style={{
                                background: 'var(--card-footer-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '50px',
                                marginRight: '1rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                            <Shield size={16} fill="var(--success)" className="text-success" strokeWidth={0} style={{ opacity: 0.9 }} />
                            <span className="text-muted small fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>TTD:</span>
                            <span className="fw-extrabold text-dark" style={{ fontSize: '0.85rem' }}>
                                {leftSigner?.nama_pejabat?.split(' ')[0] || 'Ketua'} & {rightSigner?.nama_pejabat?.split(' ')[0] || 'Bendahara'}
                            </span>
                        </div>

                        <div className="d-flex gap-3">
                            <button
                                className="btn btn-ghost"
                                style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    padding: '0 1.5rem',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s ease',
                                    background: 'rgba(255,255,255,0.02)'
                                }}
                                disabled={loading}
                                onClick={handlePrint}
                            >
                                <Printer size={20} className="text-primary" />
                                <span>Cetak Laporan</span>
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{
                                    borderRadius: '12px',
                                    padding: '0 1.75rem',
                                    fontWeight: 800,
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)'
                                }}
                                onClick={handleExport}
                            >
                                <Download size={20} />
                                <span>Export Excel</span>
                            </button>

                            <button
                                className="btn btn-ghost"
                                style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    padding: '0 1.25rem',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'rgba(255,255,255,0.02)'
                                }}
                                onClick={handleExportJSON}
                            >
                                <FileText size={20} className="text-info" />
                                <span>Backup JSON</span>
                            </button>

                            <button
                                className="btn btn-ghost"
                                style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    padding: '0 1.25rem',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'rgba(255,255,255,0.02)'
                                }}
                                onClick={() => fileImportRef.current.click()}
                            >
                                <Upload size={20} className="text-warning" />
                                <span>Restore JSON</span>
                                <input
                                    type="file"
                                    ref={fileImportRef}
                                    style={{ display: 'none' }}
                                    accept=".json"
                                    onChange={handleImportJSON}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'master' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('master')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Users size={16} /> Master Data Asnaf
                    </button>
                    {!isSpecialCategoryMode && (
                        <>
                            <button
                                className={`btn ${activeTab === 'graduation' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveTab('graduation')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <TrendingUp size={16} /> Indeks Graduasi (Social Mobility)
                            </button>
                            <button
                                className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveTab('analytics')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Activity size={16} /> Asnaf Analytics & Fraud
                            </button>
                        </>
                    )}
                </div>

                {activeTab === 'graduation' ? (
                    <GraduationTab data={asnafData} rtRw={rtRw} />
                ) : activeTab === 'analytics' ? (
                    <AsnafAnalyticsTab />
                ) : (
                    <>
                        {usingFallback && (
                            <div className="glass-card" style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <AlertIcon size={20} style={{ color: '#f59e0b' }} />
                                <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 600 }}>Mode Fallback: Data diambil dari penyimpanan lokal (API Offline)</span>
                            </div>
                        )}

                        {/* Top Stats Overview */}
                        <div className="stats-grid" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div className="card stat-hover" style={{ gridColumn: 'span 2', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '6px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ padding: '0.75rem', borderRadius: '14px', background: 'rgba(0,144,231,0.08)', color: 'var(--primary)' }}>
                                        <Users size={24} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ background: 'rgba(0,210,91,0.08)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--success)' }}>
                                        {rtStats?.total_kk ?? asnafData.length} KEPALA KELUARGA
                                    </div>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', lineHeight: 1 }}>
                                        {rtStats?.total_jiwa ?? asnafData.reduce((acc, curr) => acc + curr.jumlahJiwa, 0)}
                                    </h2>
                                    <p style={{ margin: '0.75rem 0 0', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.9rem' }}>
                                        Total Jiwa Mustahik {rtLoading && <span style={{ opacity: 0.5 }}>...</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="card stat-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '6px solid var(--danger)' }}>
                                <div style={{ alignSelf: 'flex-start', padding: '0.75rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning-main)' }}>
                                    <AlertIcon size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>
                                        {rtStats?.fakir?.jiwa !== undefined ? (rtStats.fakir.jiwa + rtStats.miskin.jiwa) : asnafData.filter(a => ['Fakir', 'Miskin'].includes(a.kategori) && a.tahun.toString() === selectedTahun).reduce((acc, curr) => acc + curr.jumlahJiwa, 0)}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.75rem 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jiwa Prioritas (F & M)</p>
                                </div>
                            </div>

                            <div className="card stat-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '6px solid var(--info)' }}>
                                <div style={{ alignSelf: 'flex-start', padding: '0.75rem', borderRadius: '14px', background: 'rgba(143, 95, 232, 0.08)', color: 'var(--info)' }}>
                                    <Briefcase size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>
                                        {rtStats?.amil?.kk ?? asnafData.filter(a => a.kategori === 'Amil' && a.tahun.toString() === selectedTahun).length}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.75rem 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amil Terdaftar</p>
                                </div>
                            </div>
                        </div>

                        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
                            {/* Sticky Sidebar */}
                            <div className="sidebar" style={{ position: 'sticky', top: '1.5rem' }}>
                                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                        <Filter size={18} className="text-primary" /> Filter Lokasi
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {rtRw.map(rt => (
                                            <button
                                                key={rt.kode}
                                                onClick={() => setSelectedRt(rt.kode)}
                                                className={`btn ${selectedRt === rt.kode ? 'btn-primary' : 'btn-ghost'}`}
                                                style={{
                                                    textAlign: 'left',
                                                    justifyContent: 'space-between',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontWeight: selectedRt === rt.kode ? 700 : 400
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="dot" style={{ background: selectedRt === rt.kode ? '#fff' : 'var(--text-muted)' }}></div>
                                                    RT {rt.kode}
                                                </div>
                                                {selectedRt === rt.kode && <ChevronRight size={16} />}
                                            </button>
                                        ))}
                                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
                                        {specialCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedRt(cat)}
                                                className={`btn ${selectedRt === cat ? 'btn-primary' : 'btn-ghost'}`}
                                                style={{
                                                    textAlign: 'left',
                                                    justifyContent: 'space-between',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontWeight: selectedRt === cat ? 700 : 400
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="dot" style={{ background: selectedRt === cat ? '#fff' : 'var(--text-muted)' }}></div>
                                                    {cat}
                                                </div>
                                                {selectedRt === cat && <ChevronRight size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="content-area">
                                {/* Search & Filter Bar - Single Row Horizontal */}
                                <div className="glass-card" style={{
                                    padding: '0.75rem 1.25rem',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    border: '1px solid var(--border-color)',
                                    flexWrap: 'nowrap'
                                }}>
                                    {/* Search Input Container */}
                                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Cari nama kepala keluarga..."
                                            style={{
                                                paddingLeft: '40px',
                                                height: '42px',
                                                fontSize: '0.875rem'
                                            }}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Category Filter Container */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border-color)', height: '42px' }}>
                                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                                        <select
                                            className="input"
                                            style={{
                                                width: '135px',
                                                border: 'none',
                                                background: 'transparent',
                                                height: '100%',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                padding: 0,
                                                cursor: 'pointer'
                                            }}
                                            value={selectedKategori}
                                            onChange={(e) => setSelectedKategori(e.target.value)}
                                        >
                                            <option value="Semua">Semua Kategori</option>
                                            {kategoris.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>

                                    {/* Year Filter Container */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border-color)', height: '42px' }}>
                                        <select
                                            className="input"
                                            style={{
                                                width: '90px',
                                                border: 'none',
                                                background: 'transparent',
                                                height: '100%',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                padding: 0,
                                                cursor: 'pointer'
                                            }}
                                            value={selectedTahun}
                                            onChange={(e) => setSelectedTahun(e.target.value)}
                                        >
                                            {tahunList.map(t => <option key={t} value={t}>Tahun {t}</option>)}
                                        </select>
                                    </div>

                                    {/* Separator */}
                                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

                                    {/* Add Button */}
                                    <button
                                        className="btn btn-primary"
                                        style={{
                                            height: '42px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0 1.25rem',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap'
                                        }}
                                        onClick={() => {
                                            setEditId(null);
                                            // Determine default kategori based on view
                                            const defaultKat = specialCategories.includes(selectedRt) ? selectedRt : 'Fakir';
                                            setFormData({
                                                rt: specialCategories.includes(selectedRt) ? '01' : selectedRt,
                                                kategori: defaultKat,
                                                nama: '',
                                                jumlahJiwa: ['Amil', 'Fisabilillah'].includes(defaultKat) ? 1 : '',
                                                tahun: selectedTahun || new Date().getFullYear().toString(),
                                                pendapatan: '',
                                                status_rumah_detail: 'numpang',
                                                kondisi_bangunan: 'tidak_permanen',
                                                fasilitas_dasar: 'keduanya_terbatas',
                                                custom_criteria: {}
                                            });
                                            setShowModal(true);
                                        }}
                                    >
                                        <Plus size={18} strokeWidth={3} /> Tambah Data
                                    </button>
                                </div>

                                <div className="glass-card">
                                    <div className="table-container">
                                        <table className="table-compact">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '60px' }}>NO</th>
                                                    <th>Nama Kepala Keluarga</th>
                                                    <th>RT</th>
                                                    <th>Kategori</th>
                                                    <th style={{ textAlign: 'center' }}>
                                                        <div className="d-flex align-items-center justify-content-center gap-1" title="AI Priority Scoring" style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                            <BrainCircuit size={14} />
                                                            URGENSI
                                                        </div>
                                                    </th>
                                                    <th style={{ textAlign: 'center' }}>Jiwa</th>
                                                    <th className="no-print">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.length > 0 ? filteredData.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{item.nama}</td>
                                                        <td><span style={{ background: 'var(--table-row-hover)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>RT {item.rt}</span></td>
                                                        <td>
                                                            <div style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                padding: '2px 10px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                background: 'var(--table-row-hover)',
                                                                color: item.kategori === 'Fakir' ? 'var(--danger)' : item.kategori === 'Miskin' ? 'var(--warning)' : 'var(--primary)',
                                                                border: '1px solid var(--border-color)'
                                                            }}>
                                                                <div className="dot" style={{ background: 'currentColor' }}></div>
                                                                {item.kategori}
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {item.score !== null ? (
                                                                <div className="d-flex flex-column align-items-center">
                                                                    <span style={{
                                                                        fontSize: '0.95rem',
                                                                        fontWeight: 900,
                                                                        color: item.score >= 80 ? '#ef4444' : item.score >= 60 ? '#f59e0b' : item.score >= 40 ? '#3b82f6' : '#10b981'
                                                                    }}>
                                                                        {item.score}
                                                                    </span>
                                                                    <div style={{
                                                                        fontSize: '0.6rem',
                                                                        fontWeight: 800,
                                                                        textTransform: 'uppercase',
                                                                        padding: '1px 6px',
                                                                        borderRadius: '4px',
                                                                        background: item.score >= 80 ? 'rgba(239, 68, 68, 0.1)' : item.score >= 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                                        color: item.score >= 80 ? '#ef4444' : item.score >= 60 ? '#f59e0b' : '#3b82f6'
                                                                    }}>
                                                                        {item.score >= 80 ? 'Prioritas I' : item.score >= 60 ? 'Prioritas II' : 'Reguler'}
                                                                    </div>
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <td style={{ fontWeight: 800, textAlign: 'center' }}>{item.jumlahJiwa}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button
                                                                    className="btn btn-ghost"
                                                                    style={{ padding: '0.4rem' }}
                                                                    onClick={() => handleEdit(item)}
                                                                    title="Edit data"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    className="btn btn-ghost"
                                                                    style={{ padding: '0.4rem' }}
                                                                    onClick={(e) => handleDeleteClick(e, item.id)}
                                                                    title="Hapus data"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                                <button
                                                                    className="btn btn-ghost"
                                                                    style={{ padding: '0.4rem', color: 'var(--danger)' }}
                                                                    onClick={() => {
                                                                        // Find full RT id needed for modal, item.rt is code
                                                                        const rtObj = rtRw.find(r => r.kode === item.rt);
                                                                        setSelectedDeathAsnaf({
                                                                            ...item,
                                                                            rt_id: rtObj ? rtObj.id : null
                                                                        });
                                                                        setShowDeathModal(true);
                                                                    }}
                                                                    title="Lapor Kematian (Santunan)"
                                                                >
                                                                    <HeartCrack size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                            <AlertIcon size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                                            <p>Tidak ada data asnaf ditemukan.</p>
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ marginTop: '1rem', border: '1px solid var(--border-color)' }}
                                                                onClick={() => { setSearchTerm(''); setSelectedKategori('Semua'); }}
                                                            >
                                                                Reset Filter
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '550px', padding: '0', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                                {editId ? 'Edit Data Asnaf' : 'Tambah Kepala Keluarga'}
                            </h3>
                            <button type="button" onClick={closeModal} className="btn-ghost" style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                                <XIcon size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">
                                    <Users size={16} /> Nama Kepala Keluarga
                                </label>
                                <input
                                    className="input"
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    placeholder="Nama Lengkap"
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="label">
                                        <MapPin size={16} /> Wilayah RT
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.rt}
                                        onChange={e => setFormData({ ...formData, rt: e.target.value })}
                                    >
                                        {rtRw.map(rt => <option key={rt.kode} value={rt.kode}>RT {rt.kode}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">
                                        <Filter size={16} /> Kategori Asnaf
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.kategori}
                                        onChange={e => {
                                            const newKategori = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                kategori: newKategori,
                                                jumlahJiwa: ['Amil', 'Fisabilillah'].includes(newKategori) ? 1 : prev.jumlahJiwa
                                            }));
                                        }}
                                    >
                                        {kategoris.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                            </div>

                            {formData.kategori !== 'Amil' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="label">
                                            <Wallet size={16} /> Pendapatan Bulanan
                                        </label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={formData.pendapatan}
                                            onChange={e => setFormData({ ...formData, pendapatan: e.target.value })}
                                            placeholder="Rp 0"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Detailed Scoring Inputs */}
                            {/* Detailed Scoring Inputs - Conditional Rendering */}
                            {['Fisabilillah', 'Amil'].includes(formData.kategori) ? (
                                <div className="p-3 mb-4 rounded" style={{ background: 'var(--table-row-hover)', border: '1px solid var(--border-color)' }}>
                                    <h6 className="text-uppercase fw-bold mb-3" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                                        Kriteria Penilaian ({formData.kategori})
                                    </h6>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {formData.kategori === 'Fisabilillah' && (
                                            <>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox" id="crit_ngaji"
                                                        checked={formData.custom_criteria?.mengajar_ngaji || false}
                                                        onChange={e => setFormData({ ...formData, custom_criteria: { ...formData.custom_criteria, mengajar_ngaji: e.target.checked } })}
                                                    />
                                                    <label className="form-check-label" htmlFor="crit_ngaji">Mengajar Ngaji (35 Poin)</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox" id="crit_madrasah"
                                                        checked={formData.custom_criteria?.mengajar_madrasah || false}
                                                        onChange={e => setFormData({ ...formData, custom_criteria: { ...formData.custom_criteria, mengajar_madrasah: e.target.checked } })}
                                                    />
                                                    <label className="form-check-label" htmlFor="crit_madrasah">Mengajar Madrasah (35 Poin)</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox" id="crit_imam"
                                                        checked={formData.custom_criteria?.imam_masjid || false}
                                                        onChange={e => setFormData({ ...formData, custom_criteria: { ...formData.custom_criteria, imam_masjid: e.target.checked } })}
                                                    />
                                                    <label className="form-check-label" htmlFor="crit_imam">Imam Masjid/Mushola (30 Poin)</label>
                                                </div>
                                            </>
                                        )}

                                        {formData.kategori === 'Amil' && (
                                            <>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox" id="crit_zakat"
                                                        checked={formData.custom_criteria?.pengurus_zakat || false}
                                                        onChange={e => setFormData({ ...formData, custom_criteria: { ...formData.custom_criteria, pengurus_zakat: e.target.checked } })}
                                                    />
                                                    <label className="form-check-label" htmlFor="crit_zakat">Pengurus Zakat Fitrah (35 Poin)</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox" id="crit_kotak"
                                                        checked={formData.custom_criteria?.pengurus_kotak_sedekah || false}
                                                        onChange={e => setFormData({ ...formData, custom_criteria: { ...formData.custom_criteria, pengurus_kotak_sedekah: e.target.checked } })}
                                                    />
                                                    <label className="form-check-label" htmlFor="crit_kotak">Pengurus Kotak Sedekah (35 Poin)</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input" type="checkbox" id="crit_bantuan"
                                                        checked={formData.custom_criteria?.penyalur_bantuan || false}
                                                        onChange={e => setFormData({ ...formData, custom_criteria: { ...formData.custom_criteria, penyalur_bantuan: e.target.checked } })}
                                                    />
                                                    <label className="form-check-label" htmlFor="crit_bantuan">Menyalurkan Bantuan Sedekah (30 Poin)</label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="label" style={{ fontSize: '0.8rem' }}>
                                            <Tent size={14} /> Status Rumah
                                        </label>
                                        <select
                                            className="input"
                                            value={formData.status_rumah_detail}
                                            onChange={e => setFormData({ ...formData, status_rumah_detail: e.target.value })}
                                        >
                                            <option value="milik_layak">Milik Sendiri (Layak)</option>
                                            <option value="milik_tak_layak">Milik Sendiri (Tak Layak)</option>
                                            <option value="sewa">Sewa / Kontrak</option>
                                            <option value="numpang">Menumpang</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label" style={{ fontSize: '0.8rem' }}>
                                            <Tent size={14} /> Kondisi Bangunan
                                        </label>
                                        <select
                                            className="input"
                                            value={formData.kondisi_bangunan}
                                            onChange={e => setFormData({ ...formData, kondisi_bangunan: e.target.value })}
                                        >
                                            <option value="permanen_baik">Permanen Baik</option>
                                            <option value="semi_permanen">Semi Permanen</option>
                                            <option value="tidak_permanen">Tidak Permanen</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label" style={{ fontSize: '0.8rem' }}>
                                            <Tent size={14} /> Fasilitas Dasar
                                        </label>
                                        <select
                                            className="input"
                                            value={formData.fasilitas_dasar}
                                            onChange={e => setFormData({ ...formData, fasilitas_dasar: e.target.value })}
                                        >
                                            <option value="layak">Listrik & Air Layak</option>
                                            <option value="salah_satu_terbatas">Salah Satu Terbatas</option>
                                            <option value="keduanya_terbatas">Keduanya Terbatas</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="label">
                                    <Briefcase size={16} /> Jumlah Jiwa dalam Keluarga
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.jumlahJiwa}
                                    onChange={e => setFormData({ ...formData, jumlahJiwa: e.target.value })}
                                    placeholder="0"
                                    required={!['Amil', 'Fisabilillah'].includes(formData.kategori)}
                                    style={{ fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' }}
                                    disabled={['Amil', 'Fisabilillah'].includes(formData.kategori)}
                                />
                                <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <AlertIcon size={14} /> Masukkan total anggota keluarga yang masih aktif.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    style={{ flex: 1 }}
                                    onClick={closeModal}
                                >
                                    BATAL
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1.5 }}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>MENYIMPAN...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={20} strokeWidth={3} />
                                            <span>SIMPAN DATA</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div >
                </div >
            )}

            <ConfirmDeleteModal
                open={deleteModal.open}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ open: false, id: null, loading: false })}
                loading={deleteModal.loading}
            />

            <DeathReportModal
                isOpen={showDeathModal}
                onClose={() => {
                    setShowDeathModal(false);
                    setSelectedDeathAsnaf(null);
                }}
                asnafData={selectedDeathAsnaf}
                onSuccess={() => {
                    alert('Laporan kematian berhasil diproses.\nData Asnaf & Santunan telah diperbarui.');
                    loadData();
                }}
            />

            {/* Hidden Print Container */}
            <div className="print-only">
                <div ref={printRef}>
                    <AsnafPrint
                        data={filteredData}
                        rt={selectedRt}
                        kategori={selectedKategori}
                        isSpecialCategoryMode={isSpecialCategoryMode}
                        signers={{ left: leftSigner, right: rightSigner }}
                    />
                </div>
            </div>
        </div >
    );
};

export default AsnafManagement;
