import React, { useState, useEffect } from 'react';

// Reusing number animator from BrandPortal
function AnimNum({ value, suffix = '', precision = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) return;
    const duration = 800;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = p * (2 - p);
      setDisplay(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(tick);
      else setDisplay(end);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const fmt = precision > 0 ? display.toFixed(precision) : Math.floor(display).toLocaleString();
  return <span>{fmt}{suffix}</span>;
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('status');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [clock, setClock] = useState('');
  
  // Local storage users list for user management tab
  const [userList, setUserList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // System monitoring states
  const [edgeNodes, setEdgeNodes] = useState(42);
  const [systemLoad, setSystemLoad] = useState(34.2);
  const [bandwidth, setBandwidth] = useState(1.4);

  useEffect(() => {
    window.scrollTo(0, 0);
    const tick = () => {
      const n = new Date();
      setClock(`${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}:${n.getSeconds().toString().padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Sync users list from localStorage
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('aculion_users') || '[]');
    setUserList(list);
  }, [activeTab]);

  // Simulate server load fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad(p => {
        const d = (Math.random() - 0.5) * 4;
        return Math.min(99, Math.max(10, +(p + d).toFixed(1)));
      });
      setBandwidth(p => {
        const d = (Math.random() - 0.45) * 0.15;
        return Math.min(10, Math.max(0.5, +(p + d).toFixed(2)));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const deleteUser = (emailToDelete) => {
    if (emailToDelete === user.email) {
      alert("You cannot delete your own Administrator account!");
      return;
    }
    if (window.confirm(`Are you sure you want to remove user ${emailToDelete}?`)) {
      const updated = userList.filter(u => u.email !== emailToDelete);
      localStorage.setItem('aculion_users', JSON.stringify(updated));
      setUserList(updated);
    }
  };

  const navItems = [
    { key: 'status', label: 'System Status', icon: 'fa-server' },
    { key: 'users', label: 'User Accounts', icon: 'fa-users-gear' },
    { key: 'nodes', label: 'Edge Nodes', icon: 'fa-microchip' },
    { key: 'logs', label: 'Security Logs', icon: 'fa-shield-halved' }
  ];

  const filteredUsers = userList.filter(u => 
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || 'owner').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="brand-portal admin-portal">
      {/* Sidebar */}
      <aside className={`brand-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="brand-sidebar-header">
          {sidebarCollapsed ? (
            <button 
              className="brand-sidebar-expand-btn" 
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expand sidebar"
            >
              <i className="fa-solid fa-angles-right"></i>
            </button>
          ) : (
            <>
              <a className="brand-sidebar-logo" onClick={() => setActiveTab('status')}>
                ACULION<span className="logo-dot"></span>
              </a>
              <span className="brand-sidebar-badge" style={{ color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.4)', background: 'rgba(139, 92, 246, 0.15)' }}>Admin</span>
              <button className="brand-sidebar-toggle" onClick={() => { setSidebarCollapsed(true); setMobileSidebarOpen(false); }}>
                <i className="fa-solid fa-angles-left"></i>
              </button>
            </>
          )}
        </div>
        <nav className="brand-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`brand-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.key); setMobileSidebarOpen(false); }}
              title={sidebarCollapsed ? item.label : ''}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="brand-sidebar-footer">
          <button className="brand-nav-item logout-btn" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`brand-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Topbar */}
        <header className="brand-topbar">
          <div className="brand-topbar-left">
            <button className="brand-mobile-menu-btn" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <h1 className="brand-page-title">
              {navItems.find(n => n.key === activeTab)?.label || 'Console'}
            </h1>
          </div>
          <div className="brand-topbar-right">
            <span className="brand-topbar-clock">
              <i className="fa-solid fa-clock"></i> {clock}
            </span>
            <span className="brand-live-badge">
              <span className="brand-live-dot"></span> SECURE
            </span>
            <div className="brand-topbar-user">
              <div className="brand-topbar-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ef4444)' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="brand-topbar-user-info">
                <span className="brand-topbar-username">{user?.name || 'Admin'}</span>
                <span className="brand-topbar-company">Aculion Cloud</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="brand-content">
          {activeTab === 'status' && (
            <div className="brand-tab-content fade-in-content">
              {/* KPIs */}
              <div className="brand-kpi-grid">
                <div className="brand-kpi-card">
                  <div className="brand-kpi-icon" style={{ color: '#00f0ff' }}><i className="fa-solid fa-server"></i></div>
                  <div className="brand-kpi-data">
                    <span className="brand-kpi-label">Edge Node Streams</span>
                    <span className="brand-kpi-value"><AnimNum value={edgeNodes} /></span>
                  </div>
                </div>
                <div className="brand-kpi-card">
                  <div className="brand-kpi-icon" style={{ color: '#10b981' }}><i className="fa-solid fa-users"></i></div>
                  <div className="brand-kpi-data">
                    <span className="brand-kpi-label">Registered Accounts</span>
                    <span className="brand-kpi-value"><AnimNum value={userList.length} /></span>
                  </div>
                </div>
                <div className="brand-kpi-card">
                  <div className="brand-kpi-icon" style={{ color: '#f59e0b' }}><i className="fa-solid fa-gauge"></i></div>
                  <div className="brand-kpi-data">
                    <span className="brand-kpi-label">System Cpu Load</span>
                    <span className="brand-kpi-value"><AnimNum value={systemLoad} suffix="%" precision={1} /></span>
                  </div>
                </div>
                <div className="brand-kpi-card">
                  <div className="brand-kpi-icon" style={{ color: '#ef4444' }}><i className="fa-solid fa-network-wired"></i></div>
                  <div className="brand-kpi-data">
                    <span className="brand-kpi-label">Data Ingestion Rate</span>
                    <span className="brand-kpi-value"><AnimNum value={bandwidth} suffix=" GB/s" precision={2} /></span>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="brand-card" style={{ marginTop: 24 }}>
                <div className="brand-card-header">
                  <h3><i className="fa-solid fa-circle-check text-success"></i> Enterprise Core Services Status</h3>
                </div>
                <div style={{ marginTop: 20 }}>
                  {[
                    { service: 'Authentication Gateway (JWT/OAuth)', status: 'Active & Operational', load: '12%', color: '--success-green' },
                    { service: 'Pedestrian AI Inference Node Pipeline', status: 'Active & Ingesting', load: '45%', color: '--success-green' },
                    { service: 'GDPR Real-time Compliance Blur Service', status: 'Active & Operational', load: '68%', color: '--success-green' },
                    { service: 'Holographic Analytics Storage Cluster', status: 'Active & Synced', load: '24%', color: '--success-green' },
                    { service: 'FormSubmit Email Verification Microservice', status: 'Active & Operational', load: '2%', color: '--success-green' }
                  ].map(s => (
                    <div key={s.service} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--graphite-border)' }}>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-white)' }}>{s.service}</strong>
                        <span style={{ fontSize: 12, color: `var(${s.color})` }}>● {s.status}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Load: {s.load}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="brand-tab-content fade-in-content">
              <div className="brand-card">
                <div className="brand-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <h3><i className="fa-solid fa-users-gear"></i> User Account Control Directory</h3>
                  <div style={{ position: 'relative' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}></i>
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        padding: '8px 12px 8px 34px',
                        background: 'var(--bg-midnight)',
                        border: '1px solid var(--graphite-border)',
                        color: '#fff',
                        borderRadius: 6,
                        outline: 'none',
                        fontSize: 13,
                        width: 220
                      }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginTop: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--graphite-border)', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 8px' }}>User Details</th>
                        <th style={{ padding: '12px 8px' }}>Company</th>
                        <th style={{ padding: '12px 8px' }}>Assigned Role</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Manage Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 14 }}>
                          <td style={{ padding: '16px 8px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-white)' }}>{u.fullName || 'No Name'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '16px 8px', color: 'var(--text-light)' }}>{u.company || '—'}</td>
                          <td style={{ padding: '16px 8px' }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : u.role === 'brand' ? 'rgba(0, 82, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: u.role === 'admin' ? 'var(--danger-red)' : u.role === 'brand' ? 'var(--electric-blue)' : 'var(--success-green)',
                              border: `1px solid ${u.role === 'admin' ? 'rgba(239, 68, 68, 0.3)' : u.role === 'brand' ? 'rgba(0, 82, 255, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                            }}>
                              {u.role === 'admin' ? 'Admin' : u.role === 'brand' ? 'Advertiser' : 'Media Owner'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => deleteUser(u.email)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger-red)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                padding: '6px 12px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                transition: 'var(--transition-smooth)'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--danger-red)'; e.currentTarget.style.color = '#fff'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--danger-red)'; }}
                            >
                              Revoke Access
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="brand-tab-content fade-in-content">
              <div className="brand-card">
                <div className="brand-card-header">
                  <h3><i className="fa-solid fa-microchip"></i> Active Edge Computing AI Node Streams</h3>
                </div>
                <div style={{ marginTop: 24 }}>
                  {[
                    { id: 'NODE-ANS-01', location: 'Anna Salai Central, Chennai', model: 'YOLOv8x Pedestrian (FP16)', fps: '29.8 fps', ping: '14ms', status: 'Online' },
                    { id: 'NODE-ANS-02', location: 'Anna Salai Billboard South, Chennai', model: 'YOLOv8x Pedestrian (FP16)', fps: '30.0 fps', ping: '12ms', status: 'Online' },
                    { id: 'NODE-LND-01', location: 'Piccadilly Circus High Rise, London', model: 'YOLOv8x Vehicle+Ped (FP16)', fps: '24.4 fps', ping: '42ms', status: 'Online' },
                    { id: 'NODE-BLR-01', location: 'MG Road Metro Crossing, Bangalore', model: 'YOLOv8n Pedestrian (INT8)', fps: '60.0 fps', ping: '8ms', status: 'Online' },
                    { id: 'NODE-MUM-01', location: 'Marine Drive Gateway Premium, Mumbai', model: 'YOLOv8x Vehicle+Ped (FP16)', fps: '28.2 fps', ping: '19ms', status: 'Online' }
                  ].map(node => (
                    <div key={node.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--graphite-border)', borderRadius: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 'bold', color: '#fff' }}>{node.id}</span>
                          <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-green)', padding: '1px 6px', borderRadius: 4, fontWeight: 'bold' }}>{node.status}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}><i className="fa-solid fa-location-dot"></i> {node.location}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Model: {node.model}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{node.fps}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Latency: {node.ping}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="brand-tab-content fade-in-content">
              <div className="brand-card">
                <div className="brand-card-header">
                  <h3><i className="fa-solid fa-shield-halved"></i> Global Security Audit Trails</h3>
                </div>
                <div style={{ marginTop: 24, fontFamily: 'monospace', fontSize: 12, color: '#00ff66', background: '#040508', padding: 20, borderRadius: 8, border: '1px solid var(--graphite-border)', lineHeight: 1.6, maxHeight: 400, overflowY: 'auto' }}>
                  <div>[2026-06-27 12:12:04] AUTH: Administrator session token successfully signed and dispatched for user {user.email}.</div>
                  <div>[2026-06-27 12:05:42] SYSTEM: Synced local database nodes from localStorage (5 total profiles).</div>
                  <div>[2026-06-27 11:59:18] COMPLIANCE: Triggered auto-anonymization check on active node streams. 100% compliant.</div>
                  <div>[2026-06-27 11:48:33] NETWORK: Node NODE-BLR-01 completed model deployment (YOLOv8n Pedestrian).</div>
                  <div>[2026-06-27 11:34:02] COMPLIANCE: Faces and plates matching index cleared from edge cache.</div>
                  <div>[2026-06-27 11:12:59] SECURE: Access token verification succeeded. Admin console loaded.</div>
                  <div>[2026-06-27 10:45:00] INIT: Aculion Security Subsystem initialized. Operational logs open.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {mobileSidebarOpen && <div className="brand-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)}></div>}
    </div>
  );
}
