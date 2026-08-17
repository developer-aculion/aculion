import React, { useState } from 'react';
import newLogo from '../assets/aculion_logo_transparent.png';
import { billboardService } from '../services/billboard.service';

export default function MediaProfilePage({
  user,
  billboards,
  onSelectBillboard,
  onAddBillboard,
  onLogout,
  navigateTo
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filterType, setFilterType] = useState('Billboard'); // ONLY 'Billboard' | 'Brand' (NO 'All')

  // Brands list state
  const [brands, setBrands] = useState(() => {
    const saved = localStorage.getItem('aculion_brands_list');
    return saved ? JSON.parse(saved) : [
      { id: 'ACU-BR-001', name: 'Nike OOH Campaign', company: 'Nike India', email: 'campaigns@nike.in', phone: '+91 98765 11223', category: 'Retail & Sports', billboards: 'Anna Nagar & T. Nagar (15 Billboards)', status: 'Active', image: '/blog_attention_metrics.png' },
      { id: 'ACU-BR-002', name: 'Samsung Galaxy Launch', company: 'Samsung Electronics', email: 'ooh@samsung.com', phone: '+91 98765 22334', category: 'Consumer Tech', billboards: 'Pondy Bazaar & OMR (32 Billboards)', status: 'Active', image: '/blog_billboard_roi.png' },
      { id: 'ACU-BR-003', name: 'Tata Croma City Drive', company: 'Tata Retail', email: 'marketing@croma.com', phone: '+91 98765 33445', category: 'Electronics', billboards: 'Velachery & Tidel Park (20 Billboards)', status: 'Active', image: '/blog_smart_city.png' },
      { id: 'ACU-BR-004', name: 'Hyundai EV Showcase', company: 'Hyundai Motors', email: 'ads@hyundai.in', phone: '+91 98765 44556', category: 'Automotive', billboards: 'Guindy & Mount Road (18 Billboards)', status: 'Active', image: '/blog_privacy_edge.png' }
    ];
  });

  // Form states for Add Billboard Modal
  const [formData, setFormData] = useState({
    name: '',
    id: `ACU-BB-${Math.floor(1000 + Math.random() * 9000)}`,
    cameraCode: '',
    location: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    latitude: '13.0827',
    longitude: '80.2707',
    width: '40 ft',
    height: '20 ft',
    type: 'Digital Billboard',
    screenType: 'High-Brightness Outdoor LED',
    status: 'Active',
    image: '/blog_smart_city.png'
  });

  // Form states for Add Brand Modal
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    category: 'Retail & FMCG',
    billboards: 'Chennai Network',
    status: 'Active',
    image: '/blog_attention_metrics.png'
  });

  const [formError, setFormError] = useState('');
  const [brandFormError, setBrandFormError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBrandInputChange = (e) => {
    const { name, value } = e.target;
    setBrandFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim() || !formData.location.trim() || !formData.address.trim() || !formData.cameraCode.trim()) {
      setFormError('Please fill in all required fields (Name, Camera Code, Location Landmark, and Street Address).');
      return;
    }

    try {
      const lat = parseFloat(formData.latitude) || 13.0827;
      const lng = parseFloat(formData.longitude) || 80.2707;

      const newAsset = await billboardService.createBillboard({
        name: formData.name,
        id: formData.id,
        location: formData.location || formData.address,
        latitude: lat,
        longitude: lng,
        cameraCode: formData.cameraCode,
      });

      onAddBillboard(newAsset);
      setShowAddModal(false);
      setFormData({
        name: '',
        id: `ACU-BB-${Math.floor(1000 + Math.random() * 9000)}`,
        cameraCode: '',
        location: '',
        address: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        latitude: '13.0827',
        longitude: '80.2707',
        width: '40 ft',
        height: '20 ft',
        type: 'Digital Billboard',
        screenType: 'High-Brightness Outdoor LED',
        status: 'Active',
        image: '/blog_smart_city.png'
      });
    } catch (err) {
      console.error('[handleAddSubmit] createBillboard error:', err);
      setFormError(err.message || 'Failed to save billboard.');
    }
  };

  const handleBrandSubmit = (e) => {
    e.preventDefault();
    setBrandFormError('');
    if (!brandFormData.name.trim() || !brandFormData.company.trim() || !brandFormData.email.trim()) {
      setBrandFormError('Please fill in Brand Name, Company Name, and Contact Email.');
      return;
    }

    const newBrand = {
      id: `ACU-BR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: brandFormData.name,
      company: brandFormData.company,
      email: brandFormData.email,
      phone: brandFormData.phone || '+91 98765 00000',
      category: brandFormData.category,
      billboards: brandFormData.billboards || 'Chennai Network',
      status: brandFormData.status || 'Active',
      image: '/blog_attention_metrics.png'
    };

    const updated = [newBrand, ...brands];
    setBrands(updated);
    localStorage.setItem('aculion_brands_list', JSON.stringify(updated));
    setShowAddBrandModal(false);
    setBrandFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      category: 'Retail & FMCG',
      billboards: 'Chennai Network',
      status: 'Active',
      image: '/blog_attention_metrics.png'
    });
  };

  // Place / Location functional search filter
  const currentQuery = (activeSearch || searchQuery).toLowerCase().trim();

  const filteredBillboards = billboards.filter(b => {
    if (!currentQuery) return true;
    const loc = (b.location || '').toLowerCase();
    const addr = (b.address || '').toLowerCase();
    const city = (b.city || '').toLowerCase();
    const name = (b.name || '').toLowerCase();
    const id = (b.id || '').toLowerCase();
    return loc.includes(currentQuery) || addr.includes(currentQuery) || city.includes(currentQuery) || name.includes(currentQuery) || id.includes(currentQuery);
  });

  const filteredBrands = brands.filter(br => {
    if (!currentQuery) return true;
    const loc = (br.billboards || '').toLowerCase();
    const name = (br.name || '').toLowerCase();
    const comp = (br.company || '').toLowerCase();
    const id = (br.id || '').toLowerCase();
    return loc.includes(currentQuery) || name.includes(currentQuery) || comp.includes(currentQuery) || id.includes(currentQuery);
  });

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setActiveSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans select-none relative overflow-x-hidden">
      
      {/* Background ambient glow orbs - Aculion Blue & Cyan Palette */}
      <div className="fixed top-[-100px] left-1/4 w-[500px] h-[500px] bg-[#0052ff]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-1/4 w-[500px] h-[500px] bg-[#00f0ff]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP HEADER ── */}
      <header className="h-[72px] border-b border-white/10 px-6 lg:px-12 flex items-center justify-between bg-[#080c16]/80 backdrop-blur-md sticky top-0 z-40">
        <a href="/" onClick={(e) => navigateTo && navigateTo(e, '/')} className="flex items-center gap-3">
          <img src={newLogo} alt="Aculion Logo" className="h-[42px] w-auto object-contain" />
        </a>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-cyan-300 text-xs font-bold">
              <i className="fa-solid fa-user-shield" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-white leading-tight">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-cyan-300/70 leading-tight">
                {user?.email || 'developer@aculion.com'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[13px] font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-[12px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8 z-10">

        {/* ── UPPER MENTION ADMIN & ONLY ONE "+" ACTION BUTTON ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Admin Management Console
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white flex items-center gap-3">
              <span>Admin Portal</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-cyan-300 font-medium">
                Admin Role
              </span>
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Manage outdoor billboard networks and brand advertiser accounts across the Aculion platform.
            </p>
          </div>

          {/* ONLY ONE "+" ACTION BUTTON WITH DROPDOWN OPTIONS */}
          <div className="relative self-start md:self-auto">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs tracking-wide shadow-lg shadow-blue-500/25 border border-cyan-400/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-plus text-sm" />
              <span>Add</span>
              <i className="fa-solid fa-chevron-down text-[10px] opacity-70 ml-1" />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0e1424] border border-cyan-500/30 rounded-xl shadow-2xl py-2 z-50 flex flex-col gap-1 backdrop-blur-md">
                <button
                  onClick={() => { setShowAddMenu(false); setShowAddModal(true); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600/20 hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-tower-cell text-blue-400 text-sm" />
                  <span>Add Billboard</span>
                </button>
                <button
                  onClick={() => { setShowAddMenu(false); setShowAddBrandModal(true); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-white hover:bg-cyan-600/20 hover:text-cyan-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-briefcase text-cyan-400 text-sm" />
                  <span>Add Brand</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── ADMIN INFORMATION BADGE PANEL ── */}
        <section className="bg-[#0e1424]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-1.5">
              <i className="fa-solid fa-user-shield" /> ADMIN MASTER PROFILE
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              System Admin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-base flex-shrink-0">
                <i className="fa-solid fa-building-shield" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Platform</span>
                <span className="text-sm font-bold text-white truncate mt-0.5 font-heading">
                  Aculion Enterprise
                </span>
              </div>
            </div>

            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base flex-shrink-0">
                <i className="fa-solid fa-user-gear" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Admin Account</span>
                <span className="text-sm font-bold text-white truncate mt-0.5 font-heading">
                  {user?.name || 'Aculion Developer Admin'}
                </span>
              </div>
            </div>

            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-base flex-shrink-0">
                <i className="fa-solid fa-envelope" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Admin Email</span>
                <span className="text-sm font-bold text-white truncate mt-0.5 font-mono">
                  {user?.email || 'developer@aculion.com'}
                </span>
              </div>
            </div>

            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base flex-shrink-0">
                <i className="fa-solid fa-layer-group" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Accounts</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span>{billboards.length} Billboards</span>
                  <span className="text-[10px] text-white/40">({brands.length} Brands)</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── LONG SEARCH BAR FOR PLACE/LOCATION ONLY & DROPDOWN FOR BILLBOARD AND BRAND ONLY ── */}
        <div style={{
          backgroundColor: 'rgba(14, 20, 36, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '16px',
          width: '100%'
        }}>
          {/* LOCATION INPUT FIELD */}
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <i className="fa-solid fa-location-dot" style={{
              position: 'absolute',
              left: '16px',
              color: '#00f0ff',
              fontSize: '14px',
              pointerEvents: 'none',
              zIndex: 2
            }} />
            <input
              type="text"
              placeholder="Search location (e.g. Anna Nagar, T. Nagar, Velachery, Chennai, OMR)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveSearch(e.target.value);
              }}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#141d33',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '12px',
                paddingLeft: '44px',
                paddingRight: '16px',
                fontSize: '13px',
                color: '#ffffff',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
              }}
            />
          </div>

          {/* SEARCH LOCATION BUTTON */}
          <button
            type="button"
            onClick={handleSearchSubmit}
            style={{
              height: '46px',
              paddingLeft: '22px',
              paddingRight: '22px',
              background: 'linear-gradient(135deg, #0052ff, #00c8ff)',
              color: '#ffffff',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px 0 rgba(0, 82, 255, 0.35)',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '12px' }} />
            <span>Search Location</span>
          </button>

          {/* DROPDOWN SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', whiteSpace: 'nowrap' }}>View:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '160px',
                height: '46px',
                backgroundColor: '#141d33',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '12px',
                paddingLeft: '14px',
                paddingRight: '14px',
                fontSize: '13px',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Billboard">Billboard</option>
              <option value="Brand">Brand</option>
            </select>
          </div>
        </div>

        {/* ── DISPLAY SELECTED VIEW (BILLBOARD OR BRAND) ── */}
        <section className="flex flex-col gap-8">

          {/* ── BILLBOARD VIEW ── */}
          {filterType === 'Billboard' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-tower-cell text-cyan-400 text-sm" />
                  <h2 className="text-lg font-bold font-heading text-white">Billboard Inventory Cards</h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-cyan-400 border border-blue-500/20 font-mono">
                    {filteredBillboards.length} Items
                  </span>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                  <span>Add Billboard</span>
                </button>
              </div>

              {/* Billboard Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBillboards.map((billboard) => (
                  <div
                    key={billboard.id}
                    onClick={() => onSelectBillboard(billboard)}
                    className="group bg-[#0e1424]/80 hover:bg-[#131b30] border border-white/10 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col relative"
                  >
                    <div className="h-40 w-full bg-[#050811] relative overflow-hidden flex-shrink-0">
                      <img
                        src={billboard.image || '/anna_nagar_location.png'}
                        alt={billboard.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/anna_nagar_location.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424] via-transparent to-black/40" />

                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-black/60 backdrop-blur-md text-cyan-400 border border-blue-500/30">
                        {billboard.id}
                      </span>

                      <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-bold backdrop-blur-md flex items-center gap-1.5 border ${
                        billboard.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          billboard.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`} />
                        {billboard.status}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors font-heading leading-snug">
                          {billboard.name}
                        </h3>
                        <p className="text-xs text-white/50 flex items-start gap-1.5 leading-normal">
                          <i className="fa-solid fa-location-dot text-cyan-400 text-xs mt-0.5 flex-shrink-0" />
                          <span>{billboard.location}, {billboard.city}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col">
                          <span className="text-[9px] text-white/40 uppercase font-semibold">Size</span>
                          <span className="font-bold text-white mt-0.5 font-mono">{billboard.size || `${billboard.width} × ${billboard.height}`}</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col">
                          <span className="text-[9px] text-white/40 uppercase font-semibold">Type</span>
                          <span className="font-bold text-cyan-300 mt-0.5 truncate">
                            {['ACU-AN-001', 'ACU-TN-002', 'ACU-VL-003', 'ACU-OMR-004'].includes(billboard.id) ? 'Static Billboard' : (billboard.type || 'Static Billboard')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                        <span>View Intelligence Dashboard</span>
                        <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* '+' Billboard Option Card */}
                <div
                  onClick={() => setShowAddModal(true)}
                  className="group bg-[#0e1424]/40 hover:bg-[#0e1424]/80 border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[300px] cursor-pointer text-center relative overflow-hidden shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 group-hover:border-cyan-400 group-hover:bg-blue-500/20 group-hover:scale-110 flex items-center justify-center text-cyan-400 text-2xl transition-all duration-300">
                    <i className="fa-solid fa-plus" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors font-heading">
                      + Add Billboard
                    </h3>
                    <p className="text-xs text-white/40 max-w-[200px]">
                      Register another billboard location asset into admin platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BRAND VIEW ── */}
          {filterType === 'Brand' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-briefcase text-cyan-400 text-sm" />
                  <h2 className="text-lg font-bold font-heading text-white">Brand Partner Accounts</h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-cyan-400 border border-blue-500/20 font-mono">
                    {filteredBrands.length} Brands
                  </span>
                </div>
                <button
                  onClick={() => setShowAddBrandModal(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                  <span>Add Brand</span>
                </button>
              </div>

              {/* Brand Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="group bg-[#0e1424]/80 hover:bg-[#131b30] border border-white/10 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-300 shadow-xl flex flex-col justify-between gap-4 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-lg flex-shrink-0">
                          <i className="fa-solid fa-building" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-heading truncate">
                            {brand.company}
                          </h3>
                          <span className="text-xs text-cyan-400 font-medium">{brand.name}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                        {brand.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase font-semibold">Category</span>
                        <span className="font-bold text-white mt-0.5 truncate">{brand.category}</span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase font-semibold">Location Coverage</span>
                        <span className="font-bold text-emerald-400 mt-0.5 truncate">{brand.billboards}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/50 pt-1">
                      <span className="flex items-center gap-1.5 text-white/60">
                        <i className="fa-solid fa-envelope text-cyan-400 text-[10px]" />
                        <span className="truncate">{brand.email}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {brand.status}
                      </span>
                    </div>
                  </div>
                ))}

                {/* '+' Brand Option Card */}
                <div
                  onClick={() => setShowAddBrandModal(true)}
                  className="group bg-[#0e1424]/40 hover:bg-[#0e1424]/80 border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[220px] cursor-pointer text-center relative overflow-hidden shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 group-hover:border-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 flex items-center justify-center text-cyan-400 text-2xl transition-all duration-300">
                    <i className="fa-solid fa-plus" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-heading">
                      + Add Brand
                    </h3>
                    <p className="text-xs text-white/40 max-w-[200px]">
                      Create another brand advertiser profile to assign campaign billboards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* ── MODAL 1: ADD NEW BILLBOARD ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1424] border border-blue-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col gap-5 my-8">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400 text-base">
                  <i className="fa-solid fa-plus" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">Add New Billboard</h3>
                  <p className="text-xs text-white/50">Register a new media asset for location intelligence tracking.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/40 hover:text-white text-lg transition-colors p-1"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70">Billboard Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Anna Nagar – Shanthi Colony Junction"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Billboard ID *</label>
                  <input
                    type="text"
                    name="id"
                    placeholder="e.g. ACU-AN-001"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Camera Code *</label>
                  <input
                    type="text"
                    name="cameraCode"
                    placeholder="e.g. CAM-0001"
                    value={formData.cameraCode || ''}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Billboard Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Digital Billboard">Digital Billboard</option>
                    <option value="Static Billboard">Static Billboard</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70">Location Landmark *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Shanthi Colony Junction, Anna Nagar"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. 2nd Avenue, Shanthi Colony, Chennai - 600040"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
                >
                  Add Billboard
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD NEW BRAND ── */}
      {showAddBrandModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1424] border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col gap-5 my-8">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-base">
                  <i className="fa-solid fa-plus" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">Add New Brand Partner</h3>
                  <p className="text-xs text-white/50">Register a new brand advertiser for campaign management.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBrandModal(false)}
                className="text-white/40 hover:text-white text-lg transition-colors p-1"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {brandFormError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation" />
                <span>{brandFormError}</span>
              </div>
            )}

            <form onSubmit={handleBrandSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70">Campaign / Brand Title *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Nike Air Max OOH Campaign"
                    value={brandFormData.name}
                    onChange={handleBrandInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Company Name *</label>
                  <input
                    type="text"
                    name="company"
                    placeholder="e.g. Nike India Pvt. Ltd."
                    value={brandFormData.company}
                    onChange={handleBrandInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Industry / Category</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="e.g. Retail & Apparel"
                    value={brandFormData.category}
                    onChange={handleBrandInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Contact Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. ads@nike.com"
                    value={brandFormData.email}
                    onChange={handleBrandInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={brandFormData.phone}
                    onChange={handleBrandInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70">Target Coverage Range</label>
                  <input
                    type="text"
                    name="billboards"
                    placeholder="e.g. Anna Nagar & T. Nagar (15 Billboards)"
                    value={brandFormData.billboards}
                    onChange={handleBrandInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBrandModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
                >
                  Add Brand Partner
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
