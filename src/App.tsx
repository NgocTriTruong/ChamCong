import React, { useState, useEffect, useRef } from 'react';
import { Edit3, X as CloseIcon, Download, FileText, ChevronDown, Check, X, PlayCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import Login from './components/Login';
import { supabase } from './lib/supabase';
import { LogOut, MapPin, AlarmClock, Coffee } from 'lucide-react';

const LOCATIONS = ['69 đường số 47, P.An Khánh'];
const EMPLOYEES = [
    { msnv: "02554", name: "Nguyễn Sỹ Hồng" },
    { msnv: "02565", name: "Lâm Hào Kiệt" },
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
    { msnv: "02681", name: "Phạm Thủy Khánh Ngọc" },
    { msnv: "02683", name: "Bùi Thanh Trúc" },
    { msnv: "02686", name: "Nguyễn Minh Anh" },
    { msnv: "02687", name: "Hoàng Đan" },
    { msnv: "02688", name: "Hứa Kỳ Duyên" },
    { msnv: "02692", name: "Trương Ngọc Trí" },
    { msnv: "02693", name: "Phạm Hương Giang" },
    { msnv: "02694", name: "Đỗ Cường Thịnh" },
    { msnv: "02696", name: "Ngô Thị Thúy Nga" },
    { msnv: "02697", name: "Nguyễn Thị Xuân" },
    { msnv: "00000", name: "Trương Ngọc Trí" },
];

const populateWorksheet = async (worksheet: ExcelJS.Worksheet, entryData: any, user: any, workbook: ExcelJS.Workbook) => {
    worksheet.columns = [{ width: 5 }, { width: 12 }, { width: 25 }, { width: 15 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 20 }, { width: 30 }];
    try {
        const logoRes = await fetch('/logoCongTy.jpg');
        const logoBuffer = await logoRes.arrayBuffer();
        const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' });
        worksheet.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 40 } });
    } catch (e) { }
    worksheet.mergeCells('E1:G1');
    const titleCell = worksheet.getCell('E1'); titleCell.value = 'GIẤY XÁC NHẬN CHẤM CÔNG'; titleCell.font = { name: 'Arial', size: 16, bold: true }; titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    const today = new Date();
    worksheet.getCell('A2').value = `Bộ phận: ${user.department || 'Marketing'}`;
    worksheet.getCell('G2').value = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
    worksheet.getCell('G2').alignment = { horizontal: 'right' }; worksheet.getCell('G2').font = { name: 'Arial', size: 10, italic: true };
    worksheet.getCell('A3').value = `Lý do: Làm việc tại ${entryData.work_location}`; worksheet.getCell('A3').font = { name: 'Arial', size: 10, italic: true };
    worksheet.mergeCells('A4:J4'); const monthCell = worksheet.getCell('A4'); monthCell.value = `Tháng ${entryData.month.split('-')[1]}/${entryData.month.split('-')[0]}`; monthCell.alignment = { horizontal: 'center' }; monthCell.font = { name: 'Arial', size: 12, bold: true };
    const headerRow1 = worksheet.getRow(5);
    headerRow1.values = ['STT', 'MSNV', 'Họ tên', 'Ngày', 'Thời gian xác nhận công', '', 'Tăng ca', 'Tổng giờ', 'Chữ ký xác nhận', 'Ghi chú'];
    const headerRow2 = worksheet.getRow(6);
    headerRow2.values = ['', '', '', '', 'Từ giờ', 'Đến giờ', '', '', '', ''];

    // Merging
    worksheet.mergeCells('A5:A6'); worksheet.mergeCells('B5:B6'); worksheet.mergeCells('C5:C6'); worksheet.mergeCells('D5:D6');
    worksheet.mergeCells('E5:F5'); // "Thời gian xác nhận công"
    worksheet.mergeCells('G5:G6'); worksheet.mergeCells('H5:H6'); worksheet.mergeCells('I5:I6'); worksheet.mergeCells('J5:J6');

    [5, 6].forEach(rowIdx => {
        worksheet.getRow(rowIdx).eachCell(cell => {
            cell.font = { name: 'Arial', size: 10, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
    });

    let curRow = 7;
    entryData.data_json.filter((d: any) => d.isPresent).forEach((d: any, i: number) => {
        const row = worksheet.getRow(curRow);
        row.values = [
            i + 1,
            user.msnv,
            user.user_name,
            format(new Date(d.date), 'dd/MM/yyyy'),
            d.startTime,
            d.otEndTime || d.endTime,
            formatDisplayHours(calculateHours(d.otStartTime, d.otEndTime, true)),
            formatDisplayHours(calculateHours(d.startTime, d.endTime) + calculateHours(d.otStartTime, d.otEndTime, true)),
            '',
            d.note
        ];
        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNum === 10) cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            else cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        curRow++;
    });
    curRow += 2; worksheet.getRow(curRow).values = ['Tổ trưởng', 'Trưởng BP', '', 'Trưởng phòng', '', 'Phòng nhân sự']; worksheet.getRow(curRow).eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true }; cell.alignment = { horizontal: 'center' }; });
    curRow += 4; const bossCell = worksheet.getCell(`D${curRow}`); bossCell.value = 'NGUYỄN SỸ HỒNG'; bossCell.font = { name: 'Arial', size: 10, bold: true }; bossCell.alignment = { horizontal: 'center' };
};

const exportToExcelFormat = async (entryData: any, user: any) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(user.user_name.substring(0, 30));
    await populateWorksheet(worksheet, entryData, user, workbook);
    const buffer = await workbook.xlsx.writeBuffer();
    const monthNumber = parseInt(entryData.month.split('-')[1]);
    saveAs(new Blob([buffer]), `${user.user_name.toUpperCase()} - XNC - T${monthNumber}.xlsx`);
};

const exportAllToExcel = async (month: string, location: string) => {
    const workbook = new ExcelJS.Workbook();

    // Fetch records for all employees
    const start = startOfMonth(new Date(month));
    const end = endOfMonth(new Date(month));
    const interval = eachDayOfInterval({ start, end });

    for (const emp of EMPLOYEES) {
        if (emp.msnv === '00000') continue; // Skip generic admin if needed

        const { data: records } = await supabase
            .from('daily_records')
            .select('*')
            .eq('msnv', emp.msnv)
            .gte('date', format(start, 'yyyy-MM-dd'))
            .lte('date', format(end, 'yyyy-MM-dd'));

        const daysData = interval.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const found = records?.find(r => r.date === dateStr);
            return {
                date: dateStr,
                isPresent: !!found?.is_present,
                startTime: found?.start_time || '',
                endTime: found?.end_time || '',
                otStartTime: found?.ot_start_time || '',
                otEndTime: found?.ot_end_time || '',
                note: found?.note || ''
            };
        });

        const sheetName = emp.name.substring(0, 30).replace(/[*?:\\/\[\]]/g, '');
        const worksheet = workbook.addWorksheet(sheetName);
        await populateWorksheet(worksheet, { month, work_location: location, data_json: daysData }, { msnv: emp.msnv, user_name: emp.name }, workbook);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const monthStr = month.split('-')[1] + '-' + month.split('-')[0];
    saveAs(new Blob([buffer]), `TONG_HOP_CHAM_CONG_${monthStr}.xlsx`);
};

const calculateHours = (start: string, end: string, isOT = false) => {
    if (!start || !end) return 0;
    try {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        if (isNaN(sH) || isNaN(eH)) return 0;
        let diff = (eH + eM / 60) - (sH + sM / 60);
        if (!isOT && sH < 12 && eH >= 13) diff -= 1;
        return Math.max(0, diff);
    } catch (e) { return 0; }
};

const formatDisplayHours = (h: number) => {
    if (h <= 0) return '-';
    const totalMinutes = Math.round(h * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}p`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}p`;
};

export default function App() {
    const previewRef = useRef<HTMLDivElement>(null);
    const msnvRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLDivElement>(null);

    const [sessionUser, setSessionUser] = useState<any>(() => {
        const stored = localStorage.getItem('p_session_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('p_session_user');
        if (stored) {
            const dbUser = JSON.parse(stored);
            return {
                msnv: dbUser.msnv || '',
                user_name: dbUser.name || dbUser.user_name || '',
                department: dbUser.department || 'Marketing'
            };
        }
        return {
            msnv: '',
            user_name: '',
            department: 'Marketing'
        };
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
    const [showPreview, setShowPreview] = useState(false);

    // Geolocation check for specific office locations
    const LOCATION_COORDS: Record<string, { lat: number, lng: number }> = {
        '69 đường số 47, P.An Khánh': { lat: 10.7925, lng: 106.7410 }
    };
    const MAX_DISTANCE = 0.55; // Approx 550 meters

    const saveCheckin = async (type: 'in' | 'out' | 'in_ot' | 'out_ot') => {
        let currentPos: { lat: number, lng: number } | null = null;

        const isAtOffice = await new Promise<boolean>((resolve) => {
            const targetCoords = LOCATION_COORDS[location];
            if (!targetCoords || sessionUser.role === 'admin') {
                return resolve(true);
            }

            if (!navigator.geolocation) {
                alert('Trình duyệt của bạn không hỗ trợ định vị.');
                return resolve(false);
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    const dist = Math.sqrt(
                        Math.pow(pos.coords.latitude - targetCoords.lat, 2) +
                        Math.pow(pos.coords.longitude - targetCoords.lng, 2)
                    ) * 111;

                    if (dist > MAX_DISTANCE) {
                        try {
                            const ipRes = await fetch('https://api.ipify.org?format=json');
                            const ipData = await ipRes.json();
                            const currentIp = ipData.ip;

                            // Danh sách IP công cộng của Wifi công ty
                            const allowedIps = ['171.251.232.88', '14.161.40.123', localStorage.getItem('company_wifi_ip')].filter(Boolean);
                            if (allowedIps.includes(currentIp)) {
                                return resolve(true);
                            }
                            alert(`Bạn đang ở quá xa (${(dist * 1000).toFixed(0)}m) và IP mạng (${currentIp}) không khớp với Wi-Fi công ty!`);
                            return resolve(false);
                        } catch (e) {
                            alert('Không thể xác thực IP công ty.');
                            return resolve(false);
                        }
                    }
                    resolve(true);
                },
                (err) => {
                    fetch('https://api.ipify.org?format=json')
                        .then(res => res.json())
                        .then(ipData => {
                            const currentIp = ipData.ip;
                            const allowedIps = ['171.251.232.88', '14.161.40.123', localStorage.getItem('company_wifi_ip')].filter(Boolean);
                            if (allowedIps.includes(currentIp)) {
                                resolve(true);
                            } else {
                                alert(`Không thể xác thực GPS và IP mạng (${currentIp}) không khớp với Wi-Fi công ty!`);
                                resolve(false);
                            }
                        })
                        .catch(() => {
                            alert('Không thể xác thực GPS hoặc IP công ty!');
                            resolve(false);
                        });
                },
                { enableHighAccuracy: true }
            );
        });

        if (!isAtOffice) return;

        try {
            const now = format(new Date(), 'HH:mm');
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            let updatedRecord: any = null;
            setDaysData(prev => prev.map(d => {
                if (d.date === todayStr) {
                    const newData = { ...d, isPresent: true };
                    if (type === 'in') newData.startTime = now;
                    else if (type === 'out') newData.endTime = now;
                    else if (type === 'in_ot') newData.otStartTime = now;
                    else if (type === 'out_ot') newData.otEndTime = now;
                    updatedRecord = newData;
                    return newData;
                }
                return d;
            }));

            if (updatedRecord) {
                await supabase.from('checkins').insert({
                    msnv: user.msnv,
                    type,
                    latitude: currentPos ? (currentPos as any).lat : null,
                    longitude: currentPos ? (currentPos as any).lng : null
                });
                await saveToDb(updatedRecord);
            }
            const typeLabel = { in: 'Check-in', out: 'Check-out', in_ot: 'Check-in OT', out_ot: 'Check-out OT' }[type];
            alert(`Đã ${typeLabel} thành công!`);
        } catch (e) {
            alert('Lỗi lưu dữ liệu!');
        }
    };

    const handleLogin = (dbUser: any) => {
        setSessionUser(dbUser);
        localStorage.setItem('p_session_user', JSON.stringify(dbUser));
        setUser({
            msnv: dbUser.msnv,
            user_name: dbUser.name || dbUser.user_name || '',
            department: dbUser.department || 'Marketing'
        });
    };


    useEffect(() => {
        const fetchRecords = async () => {
            const today = new Date();
            const start = startOfMonth(new Date(month));
            let end = endOfMonth(new Date(month));

            if (start > today) {
                setDaysData([]);
                return;
            }
            if (end > today) end = today;

            const targetDays = eachDayOfInterval({ start, end }).map(d => ({
                date: format(d, 'yyyy-MM-dd'),
                startTime: '',
                endTime: '',
                otStartTime: '',
                otEndTime: '',
                note: '',
                isPresent: false
            }));

            const { data: dbRecords, error } = await supabase
                .from('daily_records')
                .select('*')
                .eq('msnv', user.msnv)
                .gte('date', format(start, 'yyyy-MM-dd'))
                .lte('date', format(end, 'yyyy-MM-dd'));

            if (!error && dbRecords) {
                const dbMap = new Map(dbRecords.map((r: any) => [r.date, {
                    date: r.date,
                    startTime: r.start_time || '',
                    endTime: r.end_time || '',
                    otStartTime: r.ot_start_time || '',
                    otEndTime: r.ot_end_time || '',
                    note: r.note || '',
                    isPresent: r.is_present
                }]));

                const mergedData = targetDays.map(d => dbMap.get(d.date) || d);

                // Quy tắc quên check-out cho ngày trong quá khứ
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const finalData = mergedData.map(d => {
                    if (d.isPresent && d.startTime && !d.endTime && d.date < todayStr && !d.note) {
                        return { ...d, endTime: '16:30', note: 'không bấm check out' };
                    }
                    return d;
                });

                setDaysData(finalData);
            } else {
                setDaysData(targetDays);
            }
        };

        fetchRecords();
        setEditingIdx(null);
    }, [month, user.msnv]);

    const saveToDb = async (record: any) => {
        await supabase.from('daily_records').upsert({
            msnv: user.msnv,
            date: record.date,
            start_time: record.startTime,
            end_time: record.endTime,
            ot_start_time: record.otStartTime,
            ot_end_time: record.otEndTime,
            is_present: record.isPresent,
            note: record.note
        });
    };

    const deleteFromDb = async (date: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa dữ liệu ngày ${date}?`)) return;
        await supabase.from('daily_records').delete().eq('msnv', user.msnv).eq('date', date);
        setDaysData(prev => prev.map(d => d.date === date ? { ...d, isPresent: false, startTime: '', endTime: '', note: '' } : d));
        setEditingIdx(null);
    };

    useEffect(() => {
        if (daysData.length > 0) {
            const storageKey = `days_${user.msnv}_${month}`;
            localStorage.setItem(storageKey, JSON.stringify(daysData));
        }
    }, [daysData, user.msnv, month]);

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

    useEffect(() => {
        // Kiểm tra xem các ngày trong quá khứ có bị quên check-out không
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setDaysData(prev => prev.map(d => {
            if (d.isPresent && d.startTime && !d.endTime && d.date < todayStr && !d.note) {
                return { ...d, endTime: '16:30', note: 'không bấm check out' };
            }
            return d;
        }));
    }, [daysData.length]); // Chỉ chạy khi nạp dữ liệu lần đầu

    if (!sessionUser) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="app-container">
            <div className="container" style={{ border: 'none' }}>
                <header style={{ borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', padding: '15px' }}>
                    <div className="header-actions" style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Consolidated Top Row: Info -> Lunch -> Excel -> Logout */}
                        <div className="header-top-row" style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap', width: '100%', marginBottom: 15 }}>

                            {/* User Info Section: contains Name and MSNV */}
                            <div className="header-identity-group" style={{ display: 'flex', gap: 10, alignItems: 'center', flex: '1 1 350px' }}>
                                <div ref={nameRef} style={{ position: 'relative', flex: '3 1 200px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                                        {/* Label removed per user request */}
                                        <input
                                            value={user.user_name}
                                            onFocus={() => { if (sessionUser.role === 'admin') setShowNameDrop(true); }}
                                            onChange={e => { if (sessionUser.role === 'admin') { setUser({ ...user, user_name: e.target.value }); setShowNameDrop(true); } }}
                                            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 'bold', color: '#1e293b', cursor: sessionUser.role === 'admin' ? 'text' : 'default' }}
                                            placeholder="Tên nhân viên"
                                            readOnly={sessionUser.role !== 'admin'}
                                        />
                                        {sessionUser.role === 'admin' && (
                                            <ChevronDown size={16} color="#64748b" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowNameDrop(!showNameDrop); }} />
                                        )}
                                    </div>
                                    {showNameDrop && nameItems.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #ddd', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 110, maxHeight: 300, overflowY: 'auto', borderRadius: 6, marginTop: 4 }}>
                                            {nameItems.map(e => (<div key={e.msnv} onClick={() => selectUser(e)} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} className="drop-item"><span style={{ fontWeight: 'bold' }}>{e.name}</span></div>))}
                                        </div>
                                    )}
                                </div>

                                <div ref={msnvRef} style={{ position: 'relative', flex: '1 1 100px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                                        {/* Label removed per user request */}
                                        <input
                                            value={user.msnv}
                                            onFocus={() => { if (sessionUser.role === 'admin') setShowMsnvDrop(true); }}
                                            onChange={e => { if (sessionUser.role === 'admin') { setUser({ ...user, msnv: e.target.value }); setShowMsnvDrop(true); } }}
                                            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 'bold', color: '#1e293b', cursor: sessionUser.role === 'admin' ? 'text' : 'default' }}
                                            placeholder="0000"
                                            readOnly={sessionUser.role !== 'admin'}
                                        />
                                        {sessionUser.role === 'admin' && (
                                            <ChevronDown size={16} color="#64748b" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowMsnvDrop(!showMsnvDrop); }} />
                                        )}
                                    </div>
                                    {showMsnvDrop && msnvItems.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #ddd', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 110, maxHeight: 300, overflowY: 'auto', borderRadius: 6, marginTop: 4 }}>
                                            {msnvItems.map(e => (<div key={e.msnv} onClick={() => selectUser(e)} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} className="drop-item"><span style={{ fontWeight: 'bold' }}>{e.msnv}</span> - {e.name}</div>))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Actions Group: contains Lunch, Excel, Logout */}
                            <div className="header-actions-group" style={{ display: 'flex', gap: 8, flex: '2 1 450px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', padding: '6px 12px', borderRadius: 6, border: '1px solid #fde68a', flex: '0 0 auto' }}>
                                    <Coffee size={18} color="#92400e" />
                                    <span style={{ fontSize: 13, color: '#92400e', fontWeight: 'bold', whiteSpace: 'nowrap' }} className="mobile-short-text">Nghỉ trưa: 12:00 - 13:00</span>
                                </div>

                                {sessionUser.role === 'admin' ? (
                                    <div style={{ display: 'flex', gap: 6, flex: '1 1 auto' }}>
                                        <button onClick={() => exportToExcelFormat({ month, data_json: daysData, work_location: location }, user)} className="btn-in" style={{ flex: 1, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
                                            <Download size={16} /> Excel (Cá nhân)
                                        </button>
                                        <button onClick={() => exportAllToExcel(month, location)} className="btn-in" style={{ flex: 1, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 6, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
                                            <FileText size={16} /> Excel (Tổng hợp)
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => {
                                        setShowPreview(!showPreview);
                                    }} className="btn-in" style={{ flex: '1 1 auto', padding: '8px 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
                                        <FileText size={18} /> {showPreview ? 'Ẩn Excel' : 'Xem Excel'}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                                            setSessionUser(null);
                                            localStorage.removeItem('p_msnv');
                                            localStorage.removeItem('p_session_user');
                                        }
                                    }}
                                    style={{
                                        flex: '1 1 auto',
                                        padding: '8px 15px',
                                        background: '#fef2f2',
                                        color: '#dc2626',
                                        border: '1px solid #fee2e2',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        fontWeight: 'bold',
                                        fontSize: 13
                                    }}
                                >
                                    <X size={18} /> Thoát
                                </button>
                            </div>
                        </div>

                        {/* Punch Clock Buttons Row + Selectors */}
                        <div className="punch-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', marginBottom: 10 }}>
                            {sessionUser.role !== 'admin' && showPreview && (
                                <div className="punch-buttons" style={{ display: 'flex', gap: 10, flexWrap: 'nowrap', flex: '2 1 auto' }}>
                                    <button onClick={() => saveCheckin('in')} style={{ flex: 1, padding: '8px 5px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 11, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}><AlarmClock size={14} /> CHECK-IN</button>
                                    <button onClick={() => saveCheckin('out')} style={{ flex: 1, padding: '8px 5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 11, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}><LogOut size={14} /> CHECK-OUT</button>
                                    <button onClick={() => saveCheckin('in_ot')} style={{ flex: 1, padding: '8px 5px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 11, boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)' }}><AlarmClock size={14} /> CHECK-IN OT</button>
                                    <button onClick={() => saveCheckin('out_ot')} style={{ flex: 1, padding: '8px 5px', background: '#d946ef', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 11, boxShadow: '0 4px 6px -1px rgba(217, 70, 239, 0.3)' }}><LogOut size={14} /> CHECK-OUT OT</button>
                                </div>
                            )}

                            <div className="selectors-row" style={{ display: 'flex', gap: 5, flex: '1 1 auto' }}>
                                <select
                                    value={month.split('-')[1]}
                                    onChange={e => setMonth(`${month.split('-')[0]}-${e.target.value}`)}
                                    style={{ flex: 1, padding: '5px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const mm = (i + 1).toString().padStart(2, '0');
                                        return <option key={mm} value={mm}>Tháng {mm}</option>;
                                    })}
                                </select>
                                <select
                                    value={month.split('-')[0]}
                                    onChange={e => setMonth(`${e.target.value}-${month.split('-')[1]}`)}
                                    style={{ flex: 1, padding: '5px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                                >
                                    {Array.from({ length: 10 }, (_, i) => {
                                        const y = (new Date().getFullYear() - 5 + i).toString();
                                        return <option key={y} value={y}>{y}</option>;
                                    })}
                                </select>
                                <input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    style={{ flex: 2, padding: '5px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                                    placeholder="Địa điểm"
                                    list="location-options-h"
                                />
                                <datalist id="location-options-h">
                                    {LOCATIONS.map(l => <option key={l} value={l} />)}
                                </datalist>
                            </div>
                        </div>

                    </div>

                </header>

                <div className={`dashboard-grid ${sessionUser.role === 'admin' ? 'admin-layout' : 'staff-layout'}`}>
                    {sessionUser.role === 'admin' && (
                        <div className="admin-sidebar shadow-sm">
                            <h4 style={{ marginBottom: 15, color: '#1e293b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={18} color="#2563eb" /> DANH SÁCH NHÂN VIÊN
                            </h4>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, background: 'white', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', marginBottom: 20 }}>
                                {EMPLOYEES.map(emp => (
                                    <div
                                        key={emp.msnv}
                                        onClick={() => selectUser(emp)}
                                        style={{
                                            padding: '12px 15px',
                                            borderBottom: '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            backgroundColor: user.msnv === emp.msnv ? '#eff6ff' : 'transparent',
                                            color: user.msnv === emp.msnv ? '#2563eb' : '#475569',
                                            fontWeight: user.msnv === emp.msnv ? 'bold' : 'normal',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        className="employee-list-item"
                                    >
                                        <span style={{ fontSize: 13 }}>{emp.name}</span>
                                        <span style={{ fontSize: 11, background: user.msnv === emp.msnv ? '#dbeafe' : '#f8fafc', padding: '2px 6px', borderRadius: 4, color: user.msnv === emp.msnv ? '#2563eb' : '#94a3b8' }}>{emp.msnv}</span>
                                    </div>
                                ))}
                            </div>

                            {editingIdx !== null && (
                                <div style={{ background: '#f8fafc', padding: 15, border: '1px solid #e2e8f0', borderRadius: 4, position: 'relative' }}>
                                    <button onClick={() => setEditingIdx(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                    <h3 style={{ fontSize: 14, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Edit3 size={16} color="#2563eb" /> Edit {format(new Date(daysData[editingIdx].date), 'dd/MM')}</h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                        <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <label style={{ minWidth: 'auto', fontSize: 11, marginBottom: 4 }}>Vào</label>
                                            <input style={{ width: '100%', padding: '6px' }} type="text" placeholder="07:30" value={daysData[editingIdx].startTime} onChange={e => { const n = [...daysData]; n[editingIdx].startTime = e.target.value; setDaysData(n); }} />
                                        </div>
                                        <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <label style={{ minWidth: 'auto', fontSize: 11, marginBottom: 4 }}>Ra</label>
                                            <input style={{ width: '100%', padding: '6px' }} type="text" placeholder="16:30" value={daysData[editingIdx].endTime} onChange={e => { const n = [...daysData]; n[editingIdx].endTime = e.target.value; setDaysData(n); }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                        <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <label style={{ minWidth: 'auto', fontSize: 11, marginBottom: 4 }}>Vào OT</label>
                                            <input style={{ width: '100%', padding: '6px' }} type="text" placeholder="17:30" value={daysData[editingIdx].otStartTime || ''} onChange={e => { const n = [...daysData]; n[editingIdx].otStartTime = e.target.value; setDaysData(n); }} />
                                        </div>
                                        <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <label style={{ minWidth: 'auto', fontSize: 11, marginBottom: 4 }}>Ra OT</label>
                                            <input style={{ width: '100%', padding: '6px' }} type="text" placeholder="20:30" value={daysData[editingIdx].otEndTime || ''} onChange={e => { const n = [...daysData]; n[editingIdx].otEndTime = e.target.value; setDaysData(n); }} />
                                        </div>
                                    </div>

                                    <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <label style={{ minWidth: 'auto', fontSize: 11, marginBottom: 4 }}>Ghi chú</label>
                                        <textarea value={daysData[editingIdx].note} placeholder="..." onChange={e => { const n = [...daysData]; n[editingIdx].note = e.target.value; setDaysData(n); }} style={{ minHeight: 40, fontSize: 12 }} />
                                    </div>

                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => { saveToDb(daysData[editingIdx]); setEditingIdx(null); }} style={{ flex: 2, padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 }}>Lưu</button>
                                        <button onClick={() => deleteFromDb(daysData[editingIdx].date)} style={{ flex: 1, padding: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 }}>Xóa</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {sessionUser.role !== 'admin' && !showPreview && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 20,
                            background: '#f8fafc',
                            padding: '40px 30px',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            maxWidth: 650,
                            margin: '40px auto'
                        }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>CHẤM CÔNG HÀNG NGÀY</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15, width: '100%' }}>
                                <button onClick={() => saveCheckin('in')} style={{ padding: '20px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}><AlarmClock size={20} /> CHECK-IN</button>
                                <button onClick={() => saveCheckin('out')} style={{ padding: '20px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}><LogOut size={20} /> CHECK-OUT</button>
                                <button onClick={() => saveCheckin('in_ot')} style={{ padding: '20px 15px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)' }}><AlarmClock size={20} /> CHECK-IN OT</button>
                                <button onClick={() => saveCheckin('out_ot')} style={{ padding: '20px 15px', background: '#d946ef', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 6px -1px rgba(217, 70, 239, 0.3)' }}><LogOut size={20} /> CHECK-OUT OT</button>
                            </div>
                        </div>
                    )}

                    {(sessionUser.role === 'admin' || showPreview) && (
                        <div className="preview-paper" ref={previewRef}>
                            <div className="preview-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 20 }}>
                                <img src="/logoCongTy.jpg" style={{ height: 35, position: 'absolute', left: 0 }} />
                                <h2 className="preview-title" style={{ margin: 0 }}>Giấy Xác Nhận Chấm Công</h2>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 10, marginBottom: 5 }}>Ngày {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()}</div>
                            <div style={{ fontStyle: 'italic', fontSize: 10, marginBottom: 5 }}>Lý do: Làm việc tại {location}</div>
                            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12, marginBottom: 10 }}>Tháng {month.split('-')[1]}/{month.split('-')[0]}</div>
                            <div className="table-responsive">
                                <table style={{ width: '100%', marginBottom: 20 }}>
                                    <thead style={{ background: '#eee' }}>
                                        <tr>
                                            <th rowSpan={2}>STT</th>
                                            <th rowSpan={2}>MSNV</th>
                                            <th rowSpan={2}>Họ tên</th>
                                            <th rowSpan={2}>Ngày</th>
                                            <th colSpan={2}>Thời gian xác nhận công</th>
                                            <th rowSpan={2}>Tăng ca</th>
                                            <th rowSpan={2}>Tổng giờ làm</th>
                                            <th rowSpan={2}>Chữ ký xác nhận</th>
                                            <th rowSpan={2}>Ghi chú</th>
                                        </tr>
                                        <tr>
                                            <th>Từ giờ</th>
                                            <th>Đến giờ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {daysData.filter(d => d.isPresent).map((d, i) => {
                                            const isModified = d.startTime !== '07:30' || d.endTime !== '16:30';
                                            return (
                                                <tr
                                                    key={i}
                                                    style={{
                                                        backgroundColor: isModified ? '#fff1f2' : 'transparent',
                                                        borderLeft: isModified ? '4px solid #ef4444' : 'none',
                                                        cursor: sessionUser.role === 'admin' ? 'pointer' : 'default'
                                                    }}
                                                    onClick={() => { if (sessionUser.role === 'admin') setEditingIdx(daysData.findIndex(item => item.date === d.date)); }}
                                                    title={sessionUser.role === 'admin' ? "Bấm để sửa/xóa" : ""}
                                                >
                                                    <td>{i + 1}</td>
                                                    <td>{user.msnv}</td>
                                                    <td>{user.user_name}</td>
                                                    <td>{format(new Date(d.date), 'dd/MM/yyyy')}</td>
                                                    <td>{d.startTime}</td>
                                                    <td>{d.otEndTime || d.endTime}</td>
                                                    <td style={{ fontWeight: 'bold', color: '#8b5cf6' }}>{formatDisplayHours(calculateHours(d.otStartTime, d.otEndTime, true))}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{formatDisplayHours(calculateHours(d.startTime, d.endTime) + calculateHours(d.otStartTime, d.otEndTime, true))}</td>
                                                    <td></td>
                                                    <td style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{d.note}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}><div>Tổ trưởng</div><div>Trưởng BP</div><div>Trưởng phòng</div><div>Phòng nhân sự</div></div>
                            <div style={{ height: 40 }} /><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}><div /> <div /> <div style={{ textAlign: 'center' }}>NGUYỄN SỸ HỒNG</div> <div /></div>
                        </div>
                    )}
                </div>
            </div>
            <div className={`drawer-overlay ${editingIdx !== null ? 'open' : ''}`} onClick={() => setEditingIdx(null)} />
            <div className={`edit-drawer ${editingIdx !== null ? 'open' : ''}`}>
                {editingIdx !== null && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Edit3 size={24} color="#2563eb" /> Chỉnh sửa ngày
                            </h2>
                            <button onClick={() => setEditingIdx(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: 8, marginBottom: 25, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 5 }}>ĐANG CHỈNH SỬA</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>{format(new Date(daysData[editingIdx as number].date), 'EEEE, dd/MM/yyyy', { locale: vi })}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>GIỜ VÀO (CHÍNH)</label>
                                    <input style={{ width: '100%', padding: '12px', fontSize: 16 }} type="text" placeholder="07:30" value={daysData[editingIdx as number].startTime} onChange={e => { const n = [...daysData]; n[editingIdx as number].startTime = e.target.value; setDaysData(n); }} />
                                </div>
                                <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>GIỜ RA (CHÍNH)</label>
                                    <input style={{ width: '100%', padding: '12px', fontSize: 16 }} type="text" placeholder="16:30" value={daysData[editingIdx as number].endTime} onChange={e => { const n = [...daysData]; n[editingIdx as number].endTime = e.target.value; setDaysData(n); }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>VÀO TĂNG CA (OT)</label>
                                    <input style={{ width: '100%', padding: '12px', fontSize: 16 }} type="text" placeholder="17:30" value={daysData[editingIdx as number].otStartTime || ''} onChange={e => { const n = [...daysData]; n[editingIdx as number].otStartTime = e.target.value; setDaysData(n); }} />
                                </div>
                                <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>RA TĂNG CA (OT)</label>
                                    <input style={{ width: '100%', padding: '12px', fontSize: 16 }} type="text" placeholder="20:30" value={daysData[editingIdx as number].otEndTime || ''} onChange={e => { const n = [...daysData]; n[editingIdx as number].otEndTime = e.target.value; setDaysData(n); }} />
                                </div>
                            </div>

                            <div className="user-input-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>GHI CHÚ</label>
                                <textarea value={daysData[editingIdx as number].note} placeholder="..." onChange={e => { const n = [...daysData]; n[editingIdx as number].note = e.target.value; setDaysData(n); }} style={{ minHeight: 100, fontSize: 14, width: '100%', padding: '12px' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: 15, paddingTop: 30 }}>
                            <button
                                onClick={() => { saveToDb(daysData[editingIdx as number]); setEditingIdx(null); }}
                                style={{ flex: 2, padding: '15px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)' }}
                            >
                                LƯU THÔNG TIN
                            </button>
                            <button
                                onClick={() => { if (window.confirm('Xóa dữ liệu ngày này?')) deleteFromDb(daysData[editingIdx as number].date); }}
                                style={{ flex: 1, padding: '15px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}
                            >
                                XÓA
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
