import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Users, User, Briefcase, ShieldAlert, AlertTriangle, Search,
    Filter, Phone, Mail, MoreVertical, LayoutGrid, List,
    UserCheck, UserMinus, Zap, ShieldCheck, Edit2, Trash2, X, Plus, Star,
    FileText, Upload, Download
} from 'lucide-react';
import { fetchPeopleOverview, updatePerson, deletePerson } from '../services/personApi';
import { exportSDMBackup, importSDMBackup } from '../services/backupApi';

const PersonCentricDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [people, setPeople] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('nama'); // nama, roles, score
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const fileImportRef = useRef(null);

    // Modals State
    const [showEdit, setShowEdit] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);
    const [skillInput, setSkillInput] = useState('');

    // Delete Confirmation State
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const result = await fetchPeopleOverview();
            if (result.success) setPeople(result.data);
        } catch (err) {
            console.error("Failed to load SDM data", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Derived Statistics
    const stats = useMemo(() => {
        const total = people.length;
        const overloaded = people.filter(p => p.status_burnout === 'Overloaded').length;
        const busy = people.filter(p => p.status_burnout === 'Busy').length;
        const avgScore = total > 0 ? (people.reduce((acc, p) => acc + p.burnout_score, 0) / total).toFixed(1) : 0;

        return { total, overloaded, busy, avgScore };
    }, [people]);

    const filteredAndSortedPeople = useMemo(() => {
        let result = people.filter(p => {
            const matchesSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
                (p.nik && p.nik.includes(search));
            const matchesFilter = filter === 'all' || p.status_burnout.toLowerCase() === filter.toLowerCase();
            return matchesSearch && matchesFilter;
        });

        // Sorting Logic
        result.sort((a, b) => {
            if (sortBy === 'nama') return a.nama.localeCompare(b.nama);
            if (sortBy === 'roles') return b.role_count - a.role_count;
            if (sortBy === 'score') return b.burnout_score - a.burnout_score;
            return 0;
        });

        return result;
    }, [people, search, filter, sortBy]);

    // Handlers
    const handleDeleteClick = (id, name) => {
        console.log("Showing custom delete modal for:", id, name);
        setDeleteTarget({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const { id, name } = deleteTarget;
        setDeleteTarget(null); // Close modal first

        try {
            console.log("Executing API delete for:", id);
            const response = await deletePerson(id);
            if (response.success || response) {
                console.log("Delete success!");
                loadData(true);
            }
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Gagal menghapus data.");
        }
    };

    const handleEdit = (person) => {
        setEditingPerson({ ...person, skills: person.skills || [] });
        setShowEdit(true);
    };

    const handleSaveEdit = async () => {
        try {
            const result = await updatePerson(editingPerson.id, {
                nama_lengkap: editingPerson.nama,
                nik: editingPerson.nik,
                no_wa: editingPerson.no_wa,
                skills: editingPerson.skills
            });
            if (result.success) {
                setShowEdit(false);
                loadData();
            }
        } catch (err) {
            alert("Gagal menyimpan perubahan.");
        }
    };

    const addSkill = () => {
        if (skillInput && !editingPerson.skills.includes(skillInput)) {
            setEditingPerson({
                ...editingPerson,
                skills: [...editingPerson.skills, skillInput]
            });
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setEditingPerson({
            ...editingPerson,
            skills: editingPerson.skills.filter(s => s !== skill)
        });
    };

    const handleExportJSON = async () => {
        try {
            await exportSDMBackup();
        } catch (error) {
            alert("Gagal mengekspor data SDM.");
        }
    };

    const handleImportJSON = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("Apakah Anda yakin ingin memulihkan data SDM dari file JSON ini? Struktur organisasi, personal, dan tugas akan diperbarui.")) {
            e.target.value = '';
            return;
        }

        setLoading(true);
        try {
            const result = await importSDMBackup(file);
            if (result.success) {
                alert(`Berhasil memulihkan data SDM! ${result.count || ''} data diproses.`);
                loadData();
            } else {
                alert("Gagal memulihkan data: " + (result.message || "Error tidak diketahui"));
            }
        } catch (error) {
            console.error("Import SDM error:", error);
            alert("Gagal memulihkan data SDM. Pastikan format file benar.");
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Menyusun data SDM lintas organisasi...</p>
        </div>
    );

    return (
        <div className="container-fluid p-lg-4" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header Section */}
            <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-4">
                <div>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 300,
                        margin: 0,
                        color: 'var(--text-main)',
                        letterSpacing: '-1px'
                    }}>
                        Database <span style={{ fontWeight: 800, color: 'var(--primary)' }}>SDM & Warga</span>
                    </h1>
                    <p style={{
                        color: 'var(--text-muted)',
                        margin: 0,
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        maxWidth: '500px'
                    }}>
                        Kelola data personal, keahlian, dan distribusi beban amanah warga secara efisien.
                    </p>
                </div>

                <div className="d-flex flex-wrap gap-3 align-items-center">
                    {/* Sort Dropdown */}
                    <div className="d-flex align-items-center gap-2 rounded-4 px-3" style={{ height: '44px', background: '#222', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="small text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>SORT BY:</span>
                        <select
                            className="form-select border-0 bg-transparent text-white p-0 ps-1 shadow-none"
                            style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, width: 'auto', outline: 'none' }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="nama">Nama</option>
                            <option value="roles">Jabatan</option>
                            <option value="score">Beban</option>
                        </select>
                    </div>

                    <div className="position-relative rounded-4 shadow-sm" style={{ height: '44px', background: '#222', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Search className="position-absolute" size={18} style={{ left: '16px', top: '12px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            className="form-control shadow-none"
                            placeholder="Cari warga..."
                            style={{
                                paddingLeft: '45px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'transparent',
                                width: '280px',
                                height: '100%',
                                color: '#ffffff',
                                fontSize: '0.95rem'
                            }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="d-flex bg-dark rounded-4 p-1" style={{ border: '1px solid rgba(255,255,255,0.1)', height: '44px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`btn btn-sm rounded-3 px-3 d-flex align-items-center gap-2 transition-all ${viewMode === 'grid' ? 'btn-primary shadow' : 'text-muted'}`}
                            style={{ border: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`btn btn-sm rounded-3 px-3 d-flex align-items-center gap-2 transition-all ${viewMode === 'list' ? 'btn-primary shadow' : 'text-muted'}`}
                            style={{ border: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* Backup & Restore Buttons */}
                    <div className="d-flex gap-2">
                        <button
                            onClick={handleExportJSON}
                            className="btn btn-dark rounded-4 px-3 d-flex align-items-center gap-2"
                            style={{ height: '44px', background: '#222', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.9rem' }}
                            title="Backup SDM to JSON"
                        >
                            <FileText size={18} className="text-info" />
                            <span className="d-none d-xl-inline">Backup</span>
                        </button>
                        <button
                            onClick={() => fileImportRef.current.click()}
                            className="btn btn-dark rounded-4 px-3 d-flex align-items-center gap-2"
                            style={{ height: '44px', background: '#222', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.9rem' }}
                            title="Restore SDM from JSON"
                        >
                            <Upload size={18} className="text-warning" />
                            <span className="d-none d-xl-inline">Restore</span>
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

            {/* Quick Stats Grid */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total SDM', value: stats.total, icon: Users, color: 'var(--primary)', bg: 'rgba(0, 144, 231, 0.1)' },
                    { label: 'Overloaded', value: stats.overloaded, icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
                    { label: 'Busy', value: stats.busy, icon: Zap, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                    { label: 'Avg Health Score', value: stats.avgScore, icon: ShieldCheck, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                ].map((s, idx) => (
                    <div key={idx} className="col-6 col-md-3">
                        <div className="card border-0 rounded-4 h-100" style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '1.25rem'
                        }}>
                            <div className="d-flex flex-column align-items-center text-center gap-2">
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '16px',
                                    background: s.bg,
                                    color: s.color
                                }}>
                                    <s.icon size={28} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '5px' }}>{s.label}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="mb-4 d-flex gap-2 overflow-auto pb-2">
                {['all', 'overloaded', 'busy', 'available'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`btn rounded-pill px-4 transition-all ${filter === f ? 'btn-primary' : 'btn-dark'}`}
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            background: filter === f ? 'var(--primary)' : 'rgba(255,255,255,0.12)',
                            color: filter === f ? '#fff' : 'rgba(255,255,255,0.8)',
                            border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Content View */}
            {viewMode === 'grid' ? (
                <div className="row g-4">
                    {filteredAndSortedPeople.map(p => (
                        <div key={p.id} className="col-sm-6 col-md-4 col-xl-3" style={{ animation: 'slideUp 0.3s ease-out' }}>
                            <div className="card h-100 border-0 rounded-4 overflow-hidden position-relative" style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.2s ease',
                                cursor: 'default'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                }}
                            >
                                {/* Compact Indicator Bar */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, height: '3px',
                                    background: p.status_burnout === 'Overloaded' ? '#ef4444' : (p.status_burnout === 'Busy' ? '#f59e0b' : '#10b981')
                                }}></div>

                                <div className="card-body p-3 d-flex flex-column">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div style={{
                                            width: '44px', height: '44px',
                                            borderRadius: '12px', background: 'var(--primary)',
                                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '1rem'
                                        }}>
                                            <User size={22} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h6 className="text-white text-truncate mb-0" style={{ fontWeight: 800 }}>{p.nama}</h6>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {p.status_burnout.toUpperCase()} • SCORE {p.burnout_score}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compact Roles */}
                                    <div className="mb-3">
                                        <div className="small mb-1 text-muted fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                                            <Briefcase size={10} /> JABATAN ({p.role_count})
                                        </div>
                                        <div className="d-flex flex-column gap-1">
                                            {(p.roles || []).slice(0, 2).map((r, idx) => (
                                                <div key={idx} className="text-truncate" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                                                    • {r.jabatan}
                                                </div>
                                            ))}
                                            {(p.role_count || 0) > 2 && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                                                    + {(p.role_count || 0) - 2} jabatan lainnya
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action row - footer-like but inside body */}
                                    <div className="mt-auto pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                                        <div className="d-flex gap-1">
                                            <button onClick={() => handleEdit(p)} className="btn btn-dark p-0 d-flex align-items-center justify-content-center rounded-3 bg-transparent border-0 text-muted hover-white" style={{ width: '30px', height: '30px' }}><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteClick(p.id, p.nama)} className="btn btn-dark p-0 d-flex align-items-center justify-content-center rounded-3 bg-transparent border-0 text-muted hover-danger" style={{ width: '30px', height: '30px' }}><Trash2 size={14} /></button>
                                        </div>
                                        <a href={`https://wa.me/${p.no_wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary rounded-pill px-3 py-1" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                                            WHATSAPP
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View - More Airy Table */
                <div className="card border-0 rounded-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="table-responsive">
                        <table className="table table-dark table-hover mb-0 align-middle">
                            <thead className="text-muted small fw-bold" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <tr>
                                    <th className="ps-4 py-3 border-0">NAMA & STATUS</th>
                                    <th className="py-3 border-0">JABATAN AKTIF</th>
                                    <th className="py-3 border-0">KEAHLIAN</th>
                                    <th className="py-3 border-0 text-center">WA</th>
                                    <th className="pe-4 py-3 border-0 text-end">AKSI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedPeople.map(p => (
                                    <tr key={p.id} className="border-secondary border-opacity-10" style={{ transition: 'all 0.2s' }}>
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div style={{
                                                    width: '36px', height: '36px',
                                                    borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                                                    color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-white fw-bold mb-0" style={{ fontSize: '0.9rem' }}>{p.nama}</div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div style={{
                                                            width: '6px', height: '6px', borderRadius: '50%',
                                                            background: p.status_burnout === 'Overloaded' ? '#ef4444' : (p.status_burnout === 'Busy' ? '#f59e0b' : '#10b981')
                                                        }}></div>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{p.status_burnout.toUpperCase()} (Score: {p.burnout_score})</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-white small fw-bold">{p.role_count || 0} Jabatan</div>
                                            <div className="text-muted smaller text-truncate" style={{ maxWidth: '200px' }}>
                                                {(p.roles || []).map(r => r.jabatan).join(', ')}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                {(p.skills || []).slice(0, 3).map((s, idx) => (
                                                    <span key={idx} className="badge bg-secondary bg-opacity-10 text-success rounded-pill px-2 py-1" style={{ fontSize: '0.6rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>#{s}</span>
                                                ))}
                                                {(p.skills || []).length > 3 && <span className="text-muted smaller">+{(p.skills || []).length - 3}</span>}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <a href={`https://wa.me/${p.no_wa}`} target="_blank" rel="noopener noreferrer" className="text-success hover-scale d-inline-block">
                                                <Phone size={18} />
                                            </a>
                                        </td>
                                        <td className="pe-4 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button onClick={() => handleEdit(p)} className="btn btn-sm btn-dark bg-transparent border-secondary border-opacity-25 rounded-3"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteClick(p.id, p.nama)} className="btn btn-sm btn-dark bg-transparent border-secondary border-opacity-25 rounded-3 text-danger"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredAndSortedPeople.length === 0 && (
                <div className="py-5 text-center" style={{ color: 'var(--text-muted)' }}>
                    <Users size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                    <h4 style={{ fontWeight: 700, color: 'var(--text-main)' }}>Warga tidak ditemukan</h4>
                    <p>Tidak ada hasil untuk pencarian "{search}"</p>
                </div>
            )}

            {/* Edit Modal Custom Overlay */}
            {showEdit && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3
                }}>
                    <div className="card rounded-4 border-0" style={{
                        width: '100%', maxWidth: '500px',
                        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1) !important',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center p-4">
                            <h4 className="m-0 fw-bold text-white">Edit Database Warga</h4>
                            <button className="btn btn-link text-muted p-0" onClick={() => setShowEdit(false)}><X /></button>
                        </div>
                        <div className="card-body p-4 pt-0">
                            <div className="mb-3">
                                <label className="form-label small text-muted fw-bold">NAMA LENGKAP</label>
                                <input
                                    type="text" className="form-control bg-dark border-secondary text-white rounded-3"
                                    value={editingPerson.nama}
                                    onChange={(e) => setEditingPerson({ ...editingPerson, nama: e.target.value })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small text-muted fw-bold">NIK</label>
                                <input
                                    type="text" className="form-control bg-dark border-secondary text-white rounded-3"
                                    value={editingPerson.nik || ''}
                                    onChange={(e) => setEditingPerson({ ...editingPerson, nik: e.target.value })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small text-muted fw-bold">NO WHATSAPP</label>
                                <input
                                    type="text" className="form-control bg-dark border-secondary text-white rounded-3"
                                    value={editingPerson.no_wa || ''}
                                    onChange={(e) => setEditingPerson({ ...editingPerson, no_wa: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label small text-muted fw-bold">KEAHLIAN (SKILLS) <Star size={12} className="text-warning" /></label>
                                <div className="d-flex gap-2 mb-2">
                                    <input
                                        type="text" className="form-control bg-dark border-secondary text-white rounded-3"
                                        placeholder="Tulis keahlian..."
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                    />
                                    <button className="btn btn-primary rounded-3" onClick={addSkill}><Plus size={18} /></button>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {editingPerson.skills.map(s => (
                                        <span key={s} className="badge bg-secondary rounded-pill d-flex align-items-center gap-1 px-3 py-2" style={{ fontSize: '0.75rem' }}>
                                            {s} <X size={14} className="cursor-pointer" onClick={() => removeSkill(s)} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button className="btn btn-primary w-100 rounded-3 fw-bold py-2" onClick={handleSaveEdit}>SIMPAN PERUBAHAN</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="card rounded-4 border-0 p-4 text-center" style={{
                        width: '100%', maxWidth: '400px',
                        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div className="mb-3 text-danger">
                            <AlertTriangle size={64} />
                        </div>
                        <h4 className="text-white fw-bold mb-2">Konfirmasi Hapus</h4>
                        <p className="text-muted mb-4">
                            Yakin ingin menghapus <span className="text-white fw-bold">{deleteTarget.name}</span> dari daftar aktif?
                        </p>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-dark flex-grow-1 py-2 rounded-3 fw-bold"
                                onClick={() => setDeleteTarget(null)}
                            >
                                BATAL
                            </button>
                            <button
                                className="btn btn-danger flex-grow-1 py-2 rounded-3 fw-bold"
                                onClick={confirmDelete}
                            >
                                YA, HAPUS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .cursor-pointer { cursor: pointer; }
                select option { background: #1a1a1a; color: white; }
            `}</style>
        </div>
    );
};

export default PersonCentricDashboard;
