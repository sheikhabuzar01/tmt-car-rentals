import React, { useState, useMemo } from 'react';
import { 
  BarChart2, Car, Calendar, Users, Plus, Trash2, AlertTriangle, 
  Check, X, Search, DollarSign, Activity, Settings, ShieldAlert
} from 'lucide-react';
import type { Car as CarType, Booking } from '../utils/mockData';

interface OwnerPortalProps {
  cars: CarType[];
  bookings: Booking[];
  onAddCar: (car: Omit<CarType, 'id'>) => void;
  onUpdateCarStatus: (carId: string, status: CarType['status']) => void;
  onDeleteCar: (carId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function OwnerPortal({
  cars,
  bookings,
  onAddCar,
  onUpdateCarStatus,
  onDeleteCar,
  onUpdateBookingStatus,
  showToast
}: OwnerPortalProps) {
  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState<'dashboard' | 'fleet' | 'bookings' | 'customers'>('dashboard');

  // Search & filter states
  const [fleetSearch, setFleetSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Add Car Modal state
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [newCar, setNewCar] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'Luxury SUV',
    year: new Date().getFullYear(),
    color: '',
    registration: '',
    dailyRent: 1500,
    deposit: 3000,
    status: 'Available' as CarType['status'],
    image: '/2.jpg', // Default to first image
    features: [] as string[],
    transmission: 'Automatic' as 'Automatic' | 'Manual'
  });

  // Available image options in public folder for selection
  const imageOptions = [
    { value: '/2.jpg', label: 'Lamborghini (Green)' },
    { value: '/3.jpg', label: 'Ferrari (Red)' },
    { value: '/4.jpg', label: 'Rolls-Royce (White)' },
    { value: '/5.jpg', label: 'Mercedes G63 (Black)' },
    { value: '/6.jpg', label: 'Bentley GT (Green)' },
    { value: '/7.jpg', label: 'Porsche 911 (Silver)' },
    { value: '/8.jpg', label: 'McLaren 720S (Orange)' },
    { value: '/9.jpg', label: 'Range Rover (Black)' }
  ];

  // Preset features list
  const availableFeatures = [
    'Twin-turbo Engine', 'Convertible', 'Autopilot', 'Burmester Sound System',
    'Starry Sky Headliner', 'Alcantara Interior', 'Heated Seats', 'All-Wheel Drive'
  ];

  // Calculate Dashboard Metrics
  const metrics = useMemo(() => {
    // Total revenue from all Completed or Active bookings
    const totalRevenue = bookings
      .filter(b => b.status === 'Completed' || b.status === 'Active')
      .reduce((sum, b) => sum + b.totalCost, 0);

    const totalBookingsCount = bookings.length;
    
    // Utilization Rate = Rented cars / Total cars
    const totalCarsCount = cars.length;
    const rentedCarsCount = cars.filter(c => c.status === 'Rented').length;
    const utilizationRate = totalCarsCount > 0 ? Math.round((rentedCarsCount / totalCarsCount) * 100) : 0;

    const maintenanceCarsCount = cars.filter(c => c.status === 'Maintenance').length;

    return {
      totalRevenue,
      totalBookingsCount,
      utilizationRate,
      maintenanceCarsCount,
      totalCarsCount
    };
  }, [cars, bookings]);

  // Group revenue by car category for the chart
  const categoryRevenue = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    
    // Initialize with zeros for known categories
    cars.forEach(c => {
      revenueMap[c.category] = 0;
    });

    bookings.forEach(b => {
      if (b.status === 'Completed' || b.status === 'Active') {
        const car = cars.find(c => c.id === b.carId);
        if (car) {
          revenueMap[car.category] = (revenueMap[car.category] || 0) + b.totalCost;
        }
      }
    });

    return Object.entries(revenueMap).map(([category, revenue]) => ({
      category,
      revenue
    }));
  }, [cars, bookings]);

  // Customer Directory summary state
  const customerList = useMemo(() => {
    const customersMap: Record<string, { name: string; email: string; phone: string; count: number; totalSpent: number }> = {};

    bookings.forEach(b => {
      const email = b.customerEmail.toLowerCase().trim();
      if (!customersMap[email]) {
        customersMap[email] = {
          name: b.customerName,
          email: b.customerEmail,
          phone: b.customerPhone,
          count: 0,
          totalSpent: 0
        };
      }
      customersMap[email].count += 1;
      if (b.status === 'Completed' || b.status === 'Active') {
        customersMap[email].totalSpent += b.totalCost;
      }
    });

    return Object.values(customersMap);
  }, [bookings]);

  // Add a feature check/uncheck
  const handleFeatureToggle = (feature: string) => {
    if (newCar.features.includes(feature)) {
      setNewCar({ ...newCar, features: newCar.features.filter(f => f !== feature) });
    } else {
      setNewCar({ ...newCar, features: [...newCar.features, feature] });
    }
  };

  // Submit new car form
  const handleAddCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCar.name.trim() || !newCar.brand.trim() || !newCar.model.trim()) {
      showToast('Please fill out basic vehicle identifiers.', 'error');
      return;
    }
    if (!newCar.registration.trim()) {
      showToast('Registration/License number is required.', 'error');
      return;
    }

    onAddCar(newCar);
    setIsAddCarModalOpen(false);
    showToast(`${newCar.name} added to the rental fleet database.`, 'success');
    
    // Reset form
    setNewCar({
      name: '',
      brand: '',
      model: '',
      category: 'Luxury SUV',
      year: new Date().getFullYear(),
      color: '',
      registration: '',
      dailyRent: 1500,
      deposit: 3000,
      status: 'Available',
      image: '/2.jpg',
      features: [],
      transmission: 'Automatic'
    });
  };

  // Toggle car status
  const handleStatusChange = (carId: string, currentStatus: CarType['status']) => {
    const nextStatusMap: Record<CarType['status'], CarType['status']> = {
      'Available': 'Maintenance',
      'Maintenance': 'Available',
      'Rented': 'Available' // If rented, force available (or let the booking handle it)
    };
    const nextStatus = nextStatusMap[currentStatus];
    onUpdateCarStatus(carId, nextStatus);
    showToast(`Car status updated to ${nextStatus}.`, 'info');
  };

  // Delete car
  const handleDeleteCar = (carId: string, carName: string) => {
    if (window.confirm(`Remove ${carName} from fleet inventory permanently?`)) {
      onDeleteCar(carId);
      showToast('Car removed from database.', 'info');
    }
  };

  // Manage Bookings
  const handleBookingAction = (bookingId: string, action: Booking['status']) => {
    onUpdateBookingStatus(bookingId, action);
    showToast(`Booking status updated to ${action}.`, 'success');
  };

  // Filter lists based on searches
  const filteredFleet = useMemo(() => {
    return cars.filter(c => 
      c.name.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      c.brand.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      c.registration.toLowerCase().includes(fleetSearch.toLowerCase())
    );
  }, [cars, fleetSearch]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.carName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.status.toLowerCase().includes(bookingSearch.toLowerCase())
    );
  }, [bookings, bookingSearch]);

  const filteredCustomers = useMemo(() => {
    return customerList.filter(cust => 
      cust.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      cust.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      cust.phone.includes(customerSearch)
    );
  }, [customerList, customerSearch]);

  return (
    <div className="owner-layout owner-portal-active fade-in">
      {/* Sidebar Panel */}
      <aside className="owner-sidebar">
        <div>
          <div className="logo-container" style={{ color: 'var(--primary)' }}>
            <Settings className="logo-icon" />
            <span>TMT Portal</span>
          </div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 800 }}>
            Fleet Administration
          </span>
        </div>

        <nav>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-link ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveSection('dashboard')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <BarChart2 size={18} /> Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeSection === 'fleet' ? 'active' : ''}`}
                onClick={() => setActiveSection('fleet')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <Car size={18} /> Fleet Inventory ({cars.length})
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeSection === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveSection('bookings')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <Calendar size={18} /> Booking Requests ({bookings.length})
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-link ${activeSection === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveSection('customers')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <Users size={18} /> Customers ({customerList.length})
              </button>
            </li>
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
            <ShieldAlert size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <strong>Authorized Access</strong>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Session: Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Work Area */}
      <main className="owner-content">
        
        {/* SECTION 1: Dashboard Panel */}
        {activeSection === 'dashboard' && (
          <div>
            <div className="admin-tab-header">
              <div>
                <h1 style={{ fontSize: '2rem' }}>Administration Dashboard</h1>
                <p style={{ color: 'var(--text-tertiary)' }}>Real-time rental telemetry and sales analytics.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddCarModalOpen(true)}>
                <Plus size={18} /> Add New Vehicle
              </button>
            </div>

            {/* KPI Metrics Panel */}
            <div className="stats-grid">
              <div className="stats-card glass-panel">
                <div className="stats-card-header">
                  <span>Gross Revenue</span>
                  <div className="stats-card-icon"><DollarSign size={20} /></div>
                </div>
                <div className="stats-card-value">{metrics.totalRevenue.toLocaleString()} AED</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>● active/completed contracts</span>
              </div>

              <div className="stats-card glass-panel">
                <div className="stats-card-header">
                  <span>Fleet Size</span>
                  <div className="stats-card-icon"><Car size={20} /></div>
                </div>
                <div className="stats-card-value">{metrics.totalCarsCount} Vehicles</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total vehicles listed</span>
              </div>

              <div className="stats-card glass-panel">
                <div className="stats-card-header">
                  <span>Fleet Utilization</span>
                  <div className="stats-card-icon"><Activity size={20} /></div>
                </div>
                <div className="stats-card-value">{metrics.utilizationRate}%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-info)' }}>Percentage currently rented</span>
              </div>

              <div className="stats-card glass-panel">
                <div className="stats-card-header">
                  <span>In Maintenance</span>
                  <div className="stats-card-icon"><AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} /></div>
                </div>
                <div className="stats-card-value">{metrics.maintenanceCarsCount} Cars</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>Awaiting service</span>
              </div>
            </div>

            {/* Analytics Dashboard Visuals */}
            <div className="dashboard-grid">
              {/* Category Revenue Chart */}
              <div className="chart-panel glass-panel">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} /> Sales Distribution by Vehicle Class
                </h3>
                
                {/* SVG Bar Chart rendering */}
                {metrics.totalRevenue === 0 ? (
                  <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                    No rental revenue contracts recorded to compile charts.
                  </div>
                ) : (
                  <div style={{ width: '100%' }}>
                    <svg viewBox="0 0 500 240" style={{ width: '100%', height: 'auto', background: 'transparent' }}>
                      {/* Grid lines */}
                      <line x1="50" y1="30" x2="480" y2="30" stroke="var(--border)" strokeDasharray="4 4" />
                      <line x1="50" y1="90" x2="480" y2="90" stroke="var(--border)" strokeDasharray="4 4" />
                      <line x1="50" y1="150" x2="480" y2="150" stroke="var(--border)" strokeDasharray="4 4" />
                      <line x1="50" y1="210" x2="480" y2="210" stroke="var(--border)" />

                      {/* Render bars dynamically */}
                      {categoryRevenue.map((data, idx) => {
                        const maxVal = Math.max(...categoryRevenue.map(d => d.revenue), 1000);
                        const barHeight = (data.revenue / maxVal) * 150;
                        const x = 70 + idx * 80;
                        const y = 210 - barHeight;

                        return (
                          <g key={data.category}>
                            {/* SVG Bar */}
                            <rect 
                              className="bar-chart-rect"
                              x={x} 
                              y={y} 
                              width="40" 
                              height={barHeight} 
                              fill="var(--primary)" 
                              rx="4"
                            />
                            {/* Value label */}
                            <text 
                              x={x + 20} 
                              y={y - 8} 
                              fill="var(--text-primary)" 
                              fontSize="10" 
                              fontWeight="700" 
                              textAnchor="middle"
                            >
                              {data.revenue > 0 ? `${Math.round(data.revenue/1000)}k` : '0'}
                            </text>
                            {/* Category title */}
                            <text 
                              x={x + 20} 
                              y="228" 
                              fill="var(--text-secondary)" 
                              fontSize="9" 
                              fontWeight="600" 
                              textAnchor="middle"
                            >
                              {data.category.substring(0, 10)}
                            </text>
                          </g>
                        );
                      })}
                      {/* Y-axis labels */}
                      <text x="15" y="34" fill="var(--text-tertiary)" fontSize="9">Max</text>
                      <text x="15" y="124" fill="var(--text-tertiary)" fontSize="9">Mid</text>
                      <text x="15" y="214" fill="var(--text-tertiary)" fontSize="9">0</text>
                    </svg>
                  </div>
                )}
              </div>

              {/* Recent Action Activity Feed */}
              <div className="recent-activity-panel glass-panel">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} /> Telemetry Operations Feed
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: b.status === 'Active' ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '6px' }} />
                      <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {b.customerName} booked {b.carName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          Value: {b.totalCost} AED | Period: {b.startDate} to {b.endDate}
                        </div>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px 0' }}>
                      No recent activity recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: Fleet Manager */}
        {activeSection === 'fleet' && (
          <div>
            <div className="admin-tab-header">
              <div>
                <h1 style={{ fontSize: '2rem' }}>Fleet Management</h1>
                <p style={{ color: 'var(--text-tertiary)' }}>Modify, delete, or inspect vehicle profiles.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddCarModalOpen(true)}>
                <Plus size={18} /> Add New Vehicle
              </button>
            </div>

            {/* Search filter bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', maxWidth: '400px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text" 
                  placeholder="Search fleet by name/license..." 
                  className="form-input" 
                  style={{ paddingLeft: '36px' }}
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Data table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>License / Reg</th>
                    <th>Category</th>
                    <th>Daily Rate</th>
                    <th>Status</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFleet.map(car => (
                    <tr key={car.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={car.image} alt={car.name} style={{ width: '60px', height: '40px', borderRadius: '4px', objectFit: 'cover', background: 'var(--bg-tertiary)' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{car.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{car.year} | {car.transmission}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{car.registration}</span></td>
                      <td>{car.category}</td>
                      <td><strong>{car.dailyRent} AED</strong></td>
                      <td>
                        <span className={`badge badge-${car.status.toLowerCase()}`}>
                          {car.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => handleStatusChange(car.id, car.status)}
                            disabled={car.status === 'Rented'}
                            title="Toggle Maintenance"
                          >
                            {car.status === 'Maintenance' ? 'Make Ready' : 'Service'}
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--color-danger)' }}
                            onClick={() => handleDeleteCar(car.id, car.name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFleet.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>No vehicles match search queries.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: Bookings Manager */}
        {activeSection === 'bookings' && (
          <div>
            <div className="admin-tab-header">
              <div>
                <h1 style={{ fontSize: '2rem' }}>Booking Contracts</h1>
                <p style={{ color: 'var(--text-tertiary)' }}>Approve, cancel, or close rental bookings.</p>
              </div>
            </div>

            {/* Filter Search */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', maxWidth: '400px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text" 
                  placeholder="Search bookings by customer/vehicle/status..." 
                  className="form-input" 
                  style={{ paddingLeft: '36px' }}
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Booking table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Period</th>
                    <th>Contract Cost</th>
                    <th>Status</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(b => (
                    <tr key={b.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.id}</span></td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.customerName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{b.customerEmail}</div>
                        </div>
                      </td>
                      <td>{b.carName}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>{b.startDate} to</div>
                          <div style={{ color: 'var(--text-tertiary)' }}>{b.endDate}</div>
                        </div>
                      </td>
                      <td><strong>{b.totalCost} AED</strong></td>
                      <td>
                        <span className={`badge badge-${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {b.status === 'Pending' && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 8px', background: 'var(--color-success)', color: '#fff', border: 'none' }}
                                onClick={() => handleBookingAction(b.id, 'Active')}
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '6px 8px' }}
                                onClick={() => handleBookingAction(b.id, 'Cancelled')}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {b.status === 'Active' && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--color-info)', color: '#fff', border: 'none' }}
                              onClick={() => handleBookingAction(b.id, 'Completed')}
                            >
                              End Trip
                            </button>
                          )}
                          {(b.status === 'Completed' || b.status === 'Cancelled') && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Closed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>No bookings listed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: Customer Directory */}
        {activeSection === 'customers' && (
          <div>
            <div className="admin-tab-header">
              <div>
                <h1 style={{ fontSize: '2rem' }}>Customer Database</h1>
                <p style={{ color: 'var(--text-tertiary)' }}>Customer profiles, phone lines, and rental stats.</p>
              </div>
            </div>

            {/* Filter Search */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', maxWidth: '400px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text" 
                  placeholder="Search customers by name/email/phone..." 
                  className="form-input" 
                  style={{ paddingLeft: '36px' }}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Customers table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Line</th>
                    <th>Bookings Logged</th>
                    <th>Total Capital Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust, i) => (
                    <tr key={i}>
                      <td><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cust.name}</div></td>
                      <td>{cust.email}</td>
                      <td><span style={{ fontFamily: 'monospace' }}>{cust.phone}</span></td>
                      <td><strong>{cust.count} Reservations</strong></td>
                      <td><strong style={{ color: 'var(--primary)' }}>{cust.totalSpent.toLocaleString()} AED</strong></td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>No customer accounts registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Add Car Entry Form */}
      {isAddCarModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCarModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="modal-close" onClick={() => setIsAddCarModalOpen(false)}>
              <X size={18} />
            </button>
            <div style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Add Fleet Vehicle</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '24px' }}>Input the specifications of the new luxury vehicle below.</p>
              
              <form onSubmit={handleAddCarSubmit}>
                <div className="form-grid">
                  <div>
                    <label className="form-label">Manufacturer Brand</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Porsche" 
                      value={newCar.brand}
                      onChange={(e) => setNewCar({ ...newCar, brand: e.target.value, name: `${e.target.value} ${newCar.model}` })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Model Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Taycan Turbo S" 
                      value={newCar.model}
                      onChange={(e) => setNewCar({ ...newCar, model: e.target.value, name: `${newCar.brand} ${e.target.value}` })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Category Class</label>
                    <select 
                      className="form-input"
                      value={newCar.category}
                      onChange={(e) => setNewCar({ ...newCar, category: e.target.value })}
                    >
                      <option value="Supercar">Supercar</option>
                      <option value="Convertible">Convertible</option>
                      <option value="Luxury SUV">Luxury SUV</option>
                      <option value="Luxury Sedan">Luxury Sedan</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Transmission</label>
                    <select 
                      className="form-input"
                      value={newCar.transmission}
                      onChange={(e) => setNewCar({ ...newCar, transmission: e.target.value as 'Automatic' | 'Manual' })}
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Manufacturing Year</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="2015" 
                      max="2027" 
                      value={newCar.year}
                      onChange={(e) => setNewCar({ ...newCar, year: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Exterior Color</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Lizard Green" 
                      value={newCar.color}
                      onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">License Plate / Reg</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Dubai Y 7701" 
                      value={newCar.registration}
                      onChange={(e) => setNewCar({ ...newCar, registration: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Daily Rent Rate (AED)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="100" 
                      value={newCar.dailyRent}
                      onChange={(e) => setNewCar({ ...newCar, dailyRent: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Security Deposit (AED)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0" 
                      value={newCar.deposit}
                      onChange={(e) => setNewCar({ ...newCar, deposit: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  
                  <div className="form-group-full">
                    <label className="form-label">Select Associated Photo</label>
                    <select 
                      className="form-input"
                      value={newCar.image}
                      onChange={(e) => setNewCar({ ...newCar, image: e.target.value })}
                    >
                      {imageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Features & Packages</label>
                    <div className="features-selector">
                      {availableFeatures.map(feat => (
                        <label className="feature-checkbox" key={feat}>
                          <input 
                            type="checkbox" 
                            checked={newCar.features.includes(feat)}
                            onChange={() => handleFeatureToggle(feat)}
                          />
                          {feat}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAddCarModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Register Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
