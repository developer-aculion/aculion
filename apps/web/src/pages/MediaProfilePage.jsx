import React, { useState } from 'react';
import newLogo from '../assets/aculion_logo_transparent.png';

export default function MediaProfilePage({
  user,
  billboards,
  onSelectBillboard,
  onAddBillboard,
  onLogout,
  navigateTo
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Form states for Add Billboard Modal
  const [formData, setFormData] = useState({
    name: '',
    id: `ACU-BB-${Math.floor(1000 + Math.random() * 9000)}`,
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

  const [formError, setFormError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim() || !formData.address.trim()) {
      setFormError('Please fill in all required fields (Name, Location, and Address).');
      return;
    }

    const newAsset = {
      ...formData,
      size: `${formData.width} × ${formData.height}`,
      latitude: parseFloat(formData.latitude) || 13.0827,
      longitude: parseFloat(formData.longitude) || 80.2707,
      id: formData.id || `ACU-BB-${Math.floor(1000 + Math.random() * 9000)}`
    };

    onAddBillboard(newAsset);
    setShowAddModal(false);
    setFormError('');
    // Reset form for next entry
    setFormData({
      name: '',
      id: `ACU-BB-${Math.floor(1000 + Math.random() * 9000)}`,
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
  };

  const filteredBillboards = billboards.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase());

    const effectiveType = ['ACU-AN-001', 'ACU-TN-002', 'ACU-VL-003', 'ACU-OMR-004'].includes(b.id) ? 'Static Billboard' : (b.type || 'Static Billboard');

    if (filterType === 'All') return matchesSearch;
    return matchesSearch && effectiveType === filterType;
  });

  const activeCount = billboards.filter(b => b.status === 'Active').length;

  return (
    <div className="min-h-screen bg-[#070913] text-white flex flex-col font-sans select-none relative overflow-x-hidden">
      
      {/* Background ambient glow orbs */}
      <div className="fixed top-[-100px] left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP HEADER ── */}
      <header className="h-[72px] border-b border-white/10 px-6 lg:px-12 flex items-center justify-between bg-[#080c16]/80 backdrop-blur-md sticky top-0 z-40">
        <a href="/" onClick={(e) => navigateTo && navigateTo(e, '/')} className="flex items-center gap-3">
          <img src={newLogo} alt="Aculion Logo" className="h-[42px] w-auto object-contain" />
        </a>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 text-xs font-bold">
              <i className="fa-solid fa-user" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-white leading-tight">
                {user?.name || user?.fullName || 'Media Owner'}
              </span>
              <span className="text-[10px] text-white/50 leading-tight">
                {user?.email || 'owner@aculion.com'}
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

        {/* PAGE TITLE & SUBTITLE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Asset Management Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white">
              Media Profile
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Manage your outdoor advertising assets and select a billboard to view live location intelligence.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all flex items-center gap-2.5 self-start md:self-auto cursor-pointer"
          >
            <i className="fa-solid fa-plus text-xs" />
            <span>Add New Billboard</span>
          </button>
        </div>


        {/* ── SECTION 3: MEDIA OWNER INFORMATION (COMPACT PROFILE SECTION) ── */}
        <section className="bg-[#0e1424]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved" /> MEDIA OWNER PROFILE
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Verified Partner
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Company Name */}
            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base flex-shrink-0">
                <i className="fa-solid fa-building" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Company Name</span>
                <span className="text-sm font-bold text-white truncate mt-0.5 font-heading">
                  Aculion
                </span>
              </div>
            </div>

            {/* Owner / Admin Name */}
            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-base flex-shrink-0">
                <i className="fa-solid fa-user-gear" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Owner / Admin Name</span>
                <span className="text-sm font-bold text-white truncate mt-0.5 font-heading">
                  {user?.name || user?.fullName || 'Media Owner'}
                </span>
              </div>
            </div>

            {/* Registered Email */}
            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-base flex-shrink-0">
                <i className="fa-solid fa-envelope" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Registered Email</span>
                <span className="text-sm font-bold text-white truncate mt-0.5 font-mono" title={user?.email || 'owner@example.com'}>
                  {user?.email || 'owner@example.com'}
                </span>
              </div>
            </div>

            {/* Number of Billboards */}
            <div className="bg-[#12192e]/80 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base flex-shrink-0">
                <i className="fa-solid fa-tower-cell" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Managed Assets</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span>{billboards.length} Total</span>
                  <span className="text-[10px] text-white/40">({activeCount} Active)</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4 & 5: MY BILLBOARDS GRID + FILTER BAR ── */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-white tracking-wide">
                My Billboards
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Click any billboard card below to open its Location Intelligence dashboard.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search billboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0e1424] border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 w-48 sm:w-60"
                />
                <i className="fa-solid fa-magnifying-glass text-[11px] text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[#0e1424] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Digital Billboard">Digital</option>
                <option value="Static Billboard">Static</option>
              </select>
            </div>
          </div>

          {/* BILLBOARD ASSET CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {filteredBillboards.map((billboard) => (
              <div
                key={billboard.id}
                onClick={() => onSelectBillboard(billboard)}
                className="group bg-[#0e1424]/80 hover:bg-[#131b30] border border-white/10 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col relative"
              >
                {/* Thumbnail / Image with live indicator */}
                <div className="h-44 w-full bg-[#050811] relative overflow-hidden flex-shrink-0">
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

                  {/* ID Tag top left */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-black/60 backdrop-blur-md text-blue-400 border border-blue-500/30">
                    {billboard.id}
                  </span>

                  {/* Status Badge top right */}
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

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors font-heading leading-snug">
                      {billboard.name}
                    </h3>
                    <p className="text-xs text-white/50 flex items-start gap-1.5 leading-normal">
                      <i className="fa-solid fa-location-dot text-blue-400 text-xs mt-0.5 flex-shrink-0" />
                      <span>{billboard.location}, {billboard.city}</span>
                    </p>
                  </div>

                  {/* Metadata Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col">
                      <span className="text-[9px] text-white/40 uppercase font-semibold">Size</span>
                      <span className="font-bold text-white mt-0.5 font-mono">{billboard.size || `${billboard.width} × ${billboard.height}`}</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col">
                      <span className="text-[9px] text-white/40 uppercase font-semibold">Type</span>
                      <span className="font-bold text-blue-300 mt-0.5 truncate">
                        {['ACU-AN-001', 'ACU-TN-002', 'ACU-VL-003', 'ACU-OMR-004'].includes(billboard.id) ? 'Static Billboard' : (billboard.type || 'Static Billboard')}
                      </span>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <span>View Intelligence Dashboard</span>
                    </span>
                    <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}

            {/* ── SECTION 5: ADD NEW BILLBOARD "+" OPTION CARD ── */}
            <div
              onClick={() => setShowAddModal(true)}
              className="group bg-[#0e1424]/40 hover:bg-[#0e1424]/80 border-2 border-dashed border-white/15 hover:border-blue-500/60 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[340px] cursor-pointer text-center relative overflow-hidden shadow-lg hover:shadow-blue-500/10"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 group-hover:border-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 flex items-center justify-center text-blue-400 text-2xl transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <i className="fa-solid fa-plus" />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors font-heading">
                  + Add New Billboard
                </h3>
                <p className="text-xs text-white/40 max-w-[220px]">
                  Register another physical or digital outdoor asset to start tracking analytics.
                </p>
              </div>

              <span className="px-4 py-2 rounded-xl bg-blue-600/20 group-hover:bg-blue-600 text-blue-300 group-hover:text-white border border-blue-500/30 text-xs font-semibold transition-all mt-2">
                Create Asset Record
              </span>
            </div>

          </div>
        </section>
      </main>

      {/* ── SECTION 5 MODAL: ADD NEW BILLBOARD FORM MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1424] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col gap-5 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base">
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

            {/* Error Banner */}
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
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

                {/* ID */}
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

                {/* Type */}
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

                {/* Location */}
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

                {/* Address */}
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

                {/* City */}
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

                {/* Status */}
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

                {/* Width */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Width</label>
                  <input
                    type="text"
                    name="width"
                    placeholder="e.g. 40 ft"
                    value={formData.width}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Height */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Height</label>
                  <input
                    type="text"
                    name="height"
                    placeholder="e.g. 20 ft"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Latitude */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Longitude */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="bg-[#141d33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Form Buttons */}
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
                >
                  Add Billboard
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
