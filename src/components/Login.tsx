import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, FileText, Edit3, X } from 'lucide-react';

interface LoginProps {
    onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [msnv, setMsnv] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get or generate a unique device ID for this browser
            let deviceId = localStorage.getItem('p_device_id');
            if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem('p_device_id', deviceId);
            }

            const { data, error: fetchError } = await supabase
                .from('employees')
                .select('*')
                .eq('msnv', msnv)
                .eq('password', password)
                .single();

            if (fetchError || !data) {
                setError('Mã nhân viên hoặc mật khẩu không chính xác!');
            } else {
                // Device binding logic
                if (data.device_id && data.device_id !== deviceId) {
                    setError('Tài khoản này đã được kích hoạt trên thiết bị khác. Vui lòng liên hệ Admin để đặt lại!');
                    setLoading(false);
                    return;
                }

                // If first time login, bind this device
                if (!data.device_id) {
                    const { error: updateError } = await supabase
                        .from('employees')
                        .update({ device_id: deviceId })
                        .eq('msnv', msnv);

                    if (updateError) {
                        setError('Không thể kích hoạt thiết bị. Vui lòng thử lại!');
                        setLoading(false);
                        return;
                    }
                }

                onLogin(data);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi đăng nhập.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid #f1f5f9'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        background: '#10b981',
                        width: '60px',
                        height: '60px',
                        borderRadius: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 15px',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                    }}>
                        <Check color="white" size={30} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Xác nhận chấm công</h2>
                    <p style={{ color: '#64748b', marginTop: '8px' }}>Vui lòng đăng nhập để tiếp tục</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Mã nhân viên</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                value={msnv}
                                onChange={(e) => setMsnv(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                placeholder="Ví dụ: 00000"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <Edit3 size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1px solid #fee2e2'
                        }}>
                            <X size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '20px' }}>
                        * Mặc định mật khẩu là <b>123456</b>
                    </p>
                </form>
            </div>
        </div>
    );
}
