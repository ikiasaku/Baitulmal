import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Shield, AlignLeft, ShieldCheck, CheckCircle, LayoutDashboard, HandCoins, HeartHandshake, UsersRound, Settings, Globe } from 'lucide-react';

const PERMISSION_GROUPS = [
    {
        title: 'Dashboard & AI',
        icon: <LayoutDashboard className="w-4 h-4" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/20',
        permissions: [
            { id: 'view_dashboard', label: 'Dashboard Utama', desc: 'Akses statistik ringkasan sistem' },
            { id: 'use_ai_assistant', label: 'AI Smart Assistant', desc: 'Gunakan asisten tanya-jawab' },
            { id: 'view_analytics', label: 'Analytics Pro', desc: 'Lihat grafik tren & proyeksi data' },
        ]
    },
    {
        title: 'Zakat & Keuangan',
        icon: <HandCoins className="w-4 h-4" />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/5',
        borderColor: 'border-emerald-500/20',
        permissions: [
            { id: 'manage_zakat_fitrah', label: 'Zakat Fitrah', desc: 'Akses halaman Zakat Fitrah' },
            { id: 'manage_zakat_mall', label: 'Zakat Mall', desc: 'Hitung & catat zakat harta' },
            { id: 'manage_zakat_produktif', label: 'Zakat Produktif', desc: 'Akses halaman Zakat Produktif' },
            { id: 'manage_muzaki', label: 'Input Muzaki', desc: 'Tambah/Edit data pemberi zakat' },
            { id: 'delete_muzaki', label: 'Hapus Muzaki', desc: 'Hapus data dari daftar muzaki' },
            { id: 'edit_zakat_config', label: 'Atur Kalkulasi', desc: 'Ubah porsi & jatah asnaf' },
            { id: 'manage_calculator', label: 'Kalkulator Zakat', desc: 'Akses alat bantu hitung nisab' },
        ]
    },
    {
        title: 'Sosial & Distribusi',
        icon: <HeartHandshake className="w-4 h-4" />,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/20',
        permissions: [
            { id: 'manage_asnaf', label: 'Database Asnaf', desc: 'Master data penerima bantuan' },
            { id: 'manage_distribusi', label: 'Distribusi Bantuan', desc: 'Sesuai Jatah Asnaf' },
            { id: 'confirm_distribution', label: 'Konfirmasi Distribusi', desc: 'Verifikasi & log pembagian zis' },
            { id: 'manage_sedekah', label: 'Sedekah & Infaq', desc: 'Catat kotak amal & infak umum' },
            { id: 'manage_santunan', label: 'Santunan Kematian', desc: 'Kelola dana sosial kematian' },
            { id: 'manage_campaigns', label: 'Donasi Tematik', desc: 'Kelola program dana bantuan khusus' },
        ]
    },
    {
        title: 'SDM & Organisasi',
        icon: <UsersRound className="w-4 h-4" />,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/5',
        borderColor: 'border-indigo-500/20',
        permissions: [
            { id: 'view_kepengurusan', label: 'Struktur Organisasi', desc: 'Lihat hirarki kepengurusan' },
            { id: 'manage_assignments', label: 'Agenda & Event', desc: 'Buat event & tunjuk panitia' },
            { id: 'manage_inventory', label: 'Inventaris Aset', desc: 'Manajemen sarana & prasarana' },
            { id: 'manage_correspondence', label: 'Sekretariat', desc: 'Log surat masuk & keluar' },
        ]
    },
    {
        title: 'Portal & Ekonomi',
        icon: <Globe className="w-4 h-4" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/5',
        borderColor: 'border-cyan-500/20',
        permissions: [
            { id: 'manage_products', label: 'Manajemen Produk', desc: 'Kelola barang/jasa UMKM' },
            { id: 'view_etalase', label: 'Etalase UMKM', desc: 'Akses halaman belanja UMKM' },
            { id: 'view_public', label: 'Portal Publik', desc: 'Akses halaman transparansi' },
        ]
    },
    {
        title: 'Pengaturan & User',
        icon: <Settings className="w-4 h-4" />,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/5',
        borderColor: 'border-rose-500/20',
        permissions: [
            { id: 'manage_users', label: 'Manajemen User', desc: 'Buat & edit akun login' },
            { id: 'manage_roles', label: 'Hak Akses (Role)', desc: 'Konfigurasi permission sistem' },
            { id: 'manage_settings', label: 'Konfigurasi App', desc: 'Setting profil Baitulmal' },
            { id: 'manage_signers', label: 'Aturan TTD', desc: 'Setting tanda tangan otomatis' },
        ]
    }
];

const RoleFormModal = ({ isOpen, onClose, onSave, initialData, isSubmitting }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: []
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                permissions: initialData.permissions || []
            });
        } else {
            setFormData({ name: '', description: '', permissions: [] });
        }
    }, [initialData, isOpen]);

    const handleCheckboxChange = (permId) => {
        setFormData(prev => {
            const isChecked = prev.permissions.includes(permId);
            if (isChecked) {
                return { ...prev, permissions: prev.permissions.filter(id => id !== permId) };
            } else {
                return { ...prev, permissions: [...prev.permissions, permId] };
            }
        });
    };

    const handleSelectAllInGroup = (groupPerms, shouldSelect) => {
        const groupIds = groupPerms.map(p => p.id);
        setFormData(prev => {
            const otherPerms = prev.permissions.filter(id => !groupIds.includes(id));
            if (shouldSelect) {
                return { ...prev, permissions: [...otherPerms, ...groupIds] };
            }
            return { ...prev, permissions: otherPerms };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex justify-center bg-black/60 backdrop-blur-md transition-all overflow-hidden p-0 sm:p-0">
            <div className="w-full max-w-2xl h-full flex flex-col shadow-2xl relative animate-slide-up" style={{ background: 'var(--card-bg)', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                {/* Visual Accent Top */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-blue-600 shrink-0"></div>

                {/* Header - Compact */}
                <div className="px-8 py-5 border-b flex flex-col gap-4 shrink-0" style={{ background: 'var(--card-footer-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                                <Shield className="w-5 h-5 text-slate-300" />
                            </div>
                            <h2 className="text-lg font-black tracking-tight uppercase" style={{ color: 'var(--text-main)' }}>
                                {initialData?.id ? 'Update Otoritas Role' : 'Registrasi Role Baru'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg transition-all group border"
                            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
                        >
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Nama Jabatan inside Header to keep it ALWAYS visible */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                            Nama Jabatan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            autoFocus
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border rounded-xl px-4 py-3.5 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none font-bold text-sm placeholder:font-normal"
                            style={{ background: 'var(--input-bg)', borderColor: formData.name ? 'var(--border-color)' : '#ef4444', color: 'var(--text-main)' }}
                            placeholder="Ketik nama jabatan di sini... (Contoh: KETUA RT)"
                            required
                        />
                    </div>
                </div>

                {/* Form Content - Scrolling Area */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-8 py-6 space-y-8 flex flex-col min-h-0"
                    style={{ background: 'var(--card-bg)' }}
                    id="role-form-content"
                >
                    {/* Description */}
                    <div className="space-y-2 shrink-0">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Deskripsi Tambahan</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border rounded-xl px-5 py-3 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none text-xs"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                            placeholder="Apa tanggung jawab utama role ini? (Opsional)"
                        />
                    </div>

                    {/* Permission Matriks - Dynamic Height */}
                    <div className="space-y-10 pb-10">
                        <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="h-1 w-6 bg-blue-500 rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-main)' }}>Matriks Otoritas</h3>
                        </div>

                        {PERMISSION_GROUPS.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-6">
                                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="flex items-center gap-2">
                                        <div className={`${group.color} p-1.5 bg-white/5 rounded-lg border border-white/5`}>
                                            {React.cloneElement(group.icon, { size: 14 })}
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-main)' }}>
                                            {group.title}
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const allSelected = group.permissions.every(p => formData.permissions.includes(p.id));
                                            handleSelectAllInGroup(group.permissions, !allSelected);
                                        }}
                                        className="text-[9px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase border border-blue-500/20 px-3 py-1 rounded-full hover:bg-blue-500/5"
                                    >
                                        {group.permissions.every(p => formData.permissions.includes(p.id)) ? 'Revoke All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
                                    {group.permissions.map((perm) => (
                                        <label
                                            key={perm.id}
                                            className="group/item flex items-start gap-4 py-2 cursor-pointer"
                                        >
                                            <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${formData.permissions.includes(perm.id)
                                                ? 'bg-blue-600 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                                : 'group-hover/item:border-slate-500'
                                                }`}
                                                style={{ background: formData.permissions.includes(perm.id) ? '' : 'var(--input-bg)', borderColor: formData.permissions.includes(perm.id) ? '' : 'var(--border-color)' }}>
                                                {formData.permissions.includes(perm.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onChange={() => handleCheckboxChange(perm.id)}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold transition-colors" style={{ color: formData.permissions.includes(perm.id) ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                    {perm.label}
                                                </p>
                                                <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                                                    {perm.desc}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </form>

                {/* Footer - Compact */}
                <div className="px-8 py-6 border-t flex justify-end gap-3 shrink-0" style={{ background: 'var(--card-footer-bg)', borderColor: 'var(--border-color)' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em]"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.name}
                        className="px-10 py-4 bg-blue-600 text-white text-[10px] font-black rounded-xl transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center gap-2 uppercase tracking-[0.2em] shadow-xl"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {initialData?.id ? 'Update Role' : 'Simpan Role'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleFormModal;
