import React, { useState, useEffect, useRef } from 'react';
import { Edit3, X as CloseIcon, Download, FileText, ChevronDown, Check, X } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const LOCATIONS = ['The Hive Thao Dien', 'Work from home', 'Nhà máy'];
const EMPLOYEES = [
    { msnv: "02554", name: "Nguyễn Sỹ Hồng" },
    { msnv: "02555", name: "Lâm Hào Kiệt" },
    { msnv: "02566", name: "Trần Đức Minh" },
    { msnv: "02567", name: "Trần Công Minh" },
    { msnv: "02568", name: "Huỳnh Vũ Tuấn Tú" },
    { msnv: "02571", name: "Nguyễn Lâm Phước" },
    { msnv: "02594", name: "Trần Tiến Mạnh" },
    { msnv: "02651", name: "Huỳnh Trung Tín" },
    { msnv: "02652", name: "Nguyễn Ngọc Thu Thảo" },
    { msnv: "02664", name: "Trương Thị Toán" },
    { msnv: "02676", name: "Dương Ánh Hồng" },
    { msnv: "02679", name: "Võ Văn Sâm" },
    { msnv: "02680", name: "Nguyễn Quý Như Ý" },
    { msnv: "02681", name: "Phạm Thùy Khánh Ngọc" },
    { msnv: "00000", name: "Trương Ngọc Trí" },
];

const exportToExcelFormat = async (entryData: any, user: any) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GiayXacNhan');
    worksheet.columns = [{ width: 5 }, { width: 25 }, { width: 12 }, { width: 15 }, { width: 10 }, { width: 10 }, { width: 20 }, { width: 30 }];
    try {
        const logoRes = await fetch('/logoCongTy.jpg');
        const logoBuffer = await logoRes.arrayBuffer();
        const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' });
        worksheet.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 40 } });
    } catch (e) { }
    worksheet.mergeCells('E1:G1');
    const titleCell = worksheet.getCell('E1'); titleCell.value = 'GIẤY XÁC NHẬN CHẤM CÔNG'; titleCell.font = { name: 'Arial', size: 16, bold: true }; titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    const today = new Date();
    worksheet.getCell('A2').value = `Bộ phận: ${user.department}`;
    worksheet.getCell('G2').value = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
    worksheet.getCell('G2').alignment = { horizontal: 'right' }; worksheet.getCell('G2').font = { name: 'Arial', size: 10, italic: true };
    worksheet.getCell('A3').value = `Lý do: Làm việc tại ${entryData.work_location}`; worksheet.getCell('A3').font = { name: 'Arial', size: 10, italic: true };
    worksheet.mergeCells('A4:H4'); const monthCell = worksheet.getCell('A4'); monthCell.value = `Tháng ${entryData.month.split('-')[1]}/${entryData.month.split('-')[0]}`; monthCell.alignment = { horizontal: 'center' }; monthCell.font = { name: 'Arial', size: 12, bold: true };
    const headerRow = worksheet.getRow(5); headerRow.values = ['STT', 'Họ tên', 'MSNV', 'Ngày', 'Từ', 'Đến', 'Chữ ký xác nhận', 'Ghi chú'];
    headerRow.eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true }; cell.alignment = { vertical: 'middle', horizontal: 'center' }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
    let curRow = 6;
    entryData.data_json.filter((d: any) => d.isPresent).forEach((d: any, i: number) => {
        const row = worksheet.getRow(curRow);
        row.values = [i + 1, user.user_name, user.msnv, format(new Date(d.date), 'dd/MM/yyyy'), d.startTime, d.endTime, '', d.note];
        row.eachCell((cell, colNum) => { cell.font = { name: 'Arial', size: 10 }; cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; if (colNum === 8) cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }; else cell.alignment = { vertical: 'middle', horizontal: 'center' }; });
        curRow++;
    });
    curRow += 2; worksheet.getRow(curRow).values = ['Tổ trưởng', 'Trưởng BP', '', 'Trưởng phòng', '', 'Phòng nhân sự']; worksheet.getRow(curRow).eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true }; cell.alignment = { horizontal: 'center' }; });
    curRow += 4; const bossCell = worksheet.getCell(`D${curRow}`); bossCell.value = 'NGUYỄN SỸ HỒNG'; bossCell.font = { name: 'Arial', size: 10, bold: true }; bossCell.alignment = { horizontal: 'center' };
    const buffer = await workbook.xlsx.writeBuffer();
    const monthNumber = parseInt(entryData.month.split('-')[1]);
    saveAs(new Blob([buffer]), `${user.user_name.toUpperCase()} - XNC - T${monthNumber}.xlsx`);
};

export default function App() {
    const previewRef = useRef<HTMLDivElement>(null);
    const msnvRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState({
        msnv: '',
        user_name: '',
        department: 'Marketing'
    });

    const [showMsnvDrop, setShowMsnvDrop] = useState(false);
    const [showNameDrop, setShowNameDrop] = useState(false);
    const [searchMsnv, setSearchMsnv] = useState('');
    const [searchName, setSearchName] = useState('');

    useEffect(() => {
        const hide = (e: MouseEvent) => {
            if (msnvRef.current && !msnvRef.current.contains(e.target as Node)) setShowMsnvDrop(false);
            if (nameRef.current && !nameRef.current.contains(e.target as Node)) setShowNameDrop(false);
        };
        document.addEventListener('mousedown', hide);
        return () => document.removeEventListener('mousedown', hide);
    }, []);

    useEffect(() => {
        localStorage.setItem('p_msnv', user.msnv);
        localStorage.setItem('p_name', user.user_name);
        localStorage.setItem('p_dept', user.department);
    }, [user]);

    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [daysData, setDaysData] = useState<any[]>([]);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);

    useEffect(() => {
        const start = startOfMonth(new Date(month)); let end = endOfMonth(new Date(month));
        const today = new Date(); if (month === format(today, 'yyyy-MM')) end = today;
        const defaults = eachDayOfInterval({ start, end }).map(d => ({ date: format(d, 'yyyy-MM-dd'), startTime: '07:30', endTime: '16:30', note: '', isPresent: getDay(d) !== 0 }));
        setDaysData(defaults); setEditingIdx(null);
    }, [month]);

    const selectUser = (u: { msnv: string, name: string }) => {
        setUser({ ...user, msnv: u.msnv, user_name: u.name });
        setShowMsnvDrop(false); setShowNameDrop(false); setSearchMsnv(''); setSearchName('');
    };

    const monthStart = startOfMonth(new Date(month));
    const startDay = getDay(monthStart);
    const offset = startDay === 0 ? 6 : startDay - 1;
    const blanks = Array(offset).fill(null);

    const msnvItems = user.msnv ? EMPLOYEES.filter(e => e.msnv.includes(user.msnv)) : EMPLOYEES;
    const nameItems = user.user_name ? EMPLOYEES.filter(e => e.name.toLowerCase().includes(user.user_name.toLowerCase())) : EMPLOYEES;

    return (
        <div className="app-container">
            <div className="container" style={{ border: 'none' }}>
                <header style={{ borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                        {/* Name Dropdown */}
                        <div ref={nameRef} style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', padding: '5px 12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>Họ tên:</label>
                                <input value={user.user_name} onFocus={() => setShowNameDrop(true)} onChange={e => { setUser({ ...user, user_name: e.target.value }); setShowNameDrop(true); }} style={{ width: 220, border: 'none', background: 'transparent', fontSize: 16, fontWeight: 'bold' }} placeholder="Tên nhân viên" />
                                <ChevronDown size={14} color="#64748b" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowNameDrop(!showNameDrop); }} />
                            </div>
                            {showNameDrop && nameItems.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, width: 280, background: 'white', border: '1px solid #ddd', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 100, maxHeight: 300, overflowY: 'auto' }}>
                                    {nameItems.map(e => (<div key={e.msnv} onClick={() => selectUser(e)} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} className="drop-item"><span style={{ fontWeight: 'bold' }}>{e.name}</span></div>))}
                                </div>
                            )}
                        </div>

                        {/* MSNV Dropdown */}
                        <div ref={msnvRef} style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', padding: '5px 12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>MSNV:</label>
                                <input value={user.msnv} onFocus={() => setShowMsnvDrop(true)} onChange={e => { setUser({ ...user, msnv: e.target.value }); setShowMsnvDrop(true); }} style={{ width: 70, border: 'none', background: 'transparent', fontSize: 16, fontWeight: 'bold' }} placeholder="0000" />
                                <ChevronDown size={14} color="#64748b" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowMsnvDrop(!showMsnvDrop); }} />
                            </div>
                            {showMsnvDrop && msnvItems.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, width: 240, background: 'white', border: '1px solid #ddd', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 100, maxHeight: 300, overflowY: 'auto' }}>
                                    {msnvItems.map(e => (<div key={e.msnv} onClick={() => selectUser(e)} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} className="drop-item"><span style={{ fontWeight: 'bold' }}>{e.msnv}</span> - {e.name}</div>))}
                                </div>
                            )}
                        </div>

                        {/* Department */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', padding: '5px 12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: 11, color: '#64748b' }}>Bộ phận:</label>
                            <input value={user.department} onChange={e => setUser({ ...user, department: e.target.value })} style={{ width: 140, border: 'none', background: 'transparent', fontSize: 15 }} placeholder="..." />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => exportToExcelFormat({ month, data_json: daysData, work_location: location }, user)} className="btn-in" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: 5 }}><Download size={16} /> Excel</button>
                        <button onClick={() => { if (!previewRef.current) return; html2pdf().from(previewRef.current).set({ margin: 0.5, filename: `ChamCong_${user.msnv}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }).save(); }} className="btn-export" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={16} /> PDF</button>
                    </div>
                </header>

                <div className="dashboard-grid">
                    <div className="auth-card" style={{ padding: 0, border: 'none' }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 15, padding: '0 20px' }}>
                            <div style={{ display: 'flex', flex: 1, gap: 5 }}>
                                <select
                                    value={month.split('-')[1]}
                                    onChange={e => setMonth(`${month.split('-')[0]}-${e.target.value}`)}
                                    style={{ flex: 2 }}
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const mm = (i + 1).toString().padStart(2, '0');
                                        return <option key={mm} value={mm}>Tháng {mm}</option>;
                                    })}
                                </select>
                                <select
                                    value={month.split('-')[0]}
                                    onChange={e => setMonth(`${e.target.value}-${month.split('-')[1]}`)}
                                    style={{ flex: 1 }}
                                >
                                    {Array.from({ length: 10 }, (_, i) => {
                                        const y = (new Date().getFullYear() - 5 + i).toString();
                                        return <option key={y} value={y}>{y}</option>;
                                    })}
                                </select>
                            </div>
                            <select value={location} onChange={e => setLocation(e.target.value)} style={{ flex: 1 }}>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select>
                        </div>
                        <div className="clean-calendar" style={{ margin: '0 20px' }}>
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="calendar-day-header" style={{ borderBottom: '1px solid #eee', padding: 10 }}>{d}</div>)}
                            {blanks.map((_, i) => <div key={`b-${i}`} className="clean-day empty" />)}
                            {daysData.map((d, i) => (
                                <div
                                    key={i}
                                    className={`clean-day-v3 ${d.isPresent ? 'active' : 'absent'} ${editingIdx === i ? 'editing' : ''}`}
                                    onClick={() => { setEditingIdx(i); }}
                                >
                                    <span className="day-num-small">{new Date(d.date).getDate()}</span>
                                    <div className="status-symbol">
                                        {d.isPresent ? <Check size={28} strokeWidth={3} color="#10b981" /> : <X size={28} strokeWidth={3} color="#ef4444" />}
                                    </div>
                                    <button
                                        className="swap-btn"
                                        onClick={(e) => { e.stopPropagation(); const n = [...daysData]; n[i].isPresent = !n[i].isPresent; setDaysData(n); }}
                                        title={d.isPresent ? "Đổi sang Nghỉ" : "Đổi sang Đi làm"}
                                    >
                                        {d.isPresent ? "bỏ chấm công" : "chấm công"}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {editingIdx !== null && (
                            <div style={{ background: '#f8fafc', padding: 20, marginTop: 20, margin: '20px 20px 0 20px', border: '2px solid #10b981', position: 'relative' }}>
                                <button onClick={() => setEditingIdx(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', color: '#94a3b8' }}><CloseIcon size={18} /></button>
                                <h3 style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Edit3 size={18} color="#10b981" /> Chỉnh sửa Ngày {format(new Date(daysData[editingIdx].date), 'dd/MM/yyyy')}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                                    <div className="user-input-group">
                                        <label>Vào</label>
                                        <input type="text" placeholder="07:30" value={daysData[editingIdx].startTime} onChange={e => { const n = [...daysData]; n[editingIdx].startTime = e.target.value; setDaysData(n); }} />
                                    </div>
                                    <div className="user-input-group">
                                        <label>Ra</label>
                                        <input type="text" placeholder="16:30" value={daysData[editingIdx].endTime} onChange={e => { const n = [...daysData]; n[editingIdx].endTime = e.target.value; setDaysData(n); }} />
                                    </div>
                                </div>
                                <div className="user-input-group"><label>Ghi chú</label><textarea value={daysData[editingIdx].note} placeholder="..." onChange={e => { const n = [...daysData]; n[editingIdx].note = e.target.value; setDaysData(n); }} style={{ minHeight: 60 }} /></div>
                            </div>
                        )}
                        <p style={{ padding: 20, fontSize: 12, color: '#999', textAlign: 'center' }}>* Bấm dấu ở góc để đổi trạng thái, bấm vào ô để hiện chi tiết.</p>
                    </div>

                    <div className="preview-paper" ref={previewRef}>
                        <div className="preview-header"><img src="/logoCongTy.jpg" style={{ height: 35 }} /><div className="preview-title">Giấy Xác Nhận Chấm Công</div><div /></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}><div>Bộ phận: {user.department}</div><div>Ngày {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()}</div></div>
                        <div style={{ fontStyle: 'italic', fontSize: 10, marginBottom: 5 }}>Lý do: Làm việc tại {location}</div>
                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12, marginBottom: 10 }}>Tháng {month.split('-')[1]}/{month.split('-')[0]}</div>
                        <table style={{ width: '100%', marginBottom: 20 }}>
                            <thead style={{ background: '#eee' }}><tr><th>STT</th><th>Họ tên</th><th>MSNV</th><th>Ngày</th><th>Từ</th><th>Đến</th><th>Chữ ký xác nhận</th><th>Ghi chú</th></tr></thead>
                            <tbody>
                                {daysData.filter(d => d.isPresent).map((d, i) => {
                                    const isModified = d.startTime !== '07:30' || d.endTime !== '16:30';
                                    return (
                                        <tr key={i} style={{ backgroundColor: isModified ? '#fff1f2' : 'transparent', borderLeft: isModified ? '4px solid #ef4444' : 'none' }}>
                                            <td>{i + 1}</td>
                                            <td>{user.user_name}</td>
                                            <td>{user.msnv}</td>
                                            <td>{format(new Date(d.date), 'dd/MM/yyyy')}</td>
                                            <td>{d.startTime}</td>
                                            <td>{d.endTime}</td>
                                            <td></td>
                                            <td style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{d.note}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}><div>Tổ trưởng</div><div>Trưởng BP</div><div>Trưởng phòng</div><div>Phòng nhân sự</div></div>
                        <div style={{ height: 40 }} /><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}><div /> <div /> <div style={{ textAlign: 'center' }}>NGUYỄN SỸ HỒNG</div> <div /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
