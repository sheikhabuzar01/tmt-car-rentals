import React, { useState, useMemo } from 'react';
import { 
  Search, Calendar, Compass, Shield, MapPin, CreditCard, 
  CheckCircle, Info, X, ChevronRight, ChevronLeft, Filter, Sparkles,
  Award, Clock, Check, Car as CarIcon
} from 'lucide-react';
import type { Car, Booking } from '../utils/mockData';

interface CustomerPortalProps {
  cars: Car[];
  bookings: Booking[];
  onCreateBooking: (booking: Omit<Booking, 'id' | 'status' | 'paymentStatus'>) => void;
  onCancelBooking: (bookingId: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CustomerPortal({
  cars,
  bookings,
  onCreateBooking,
  onCancelBooking,
  showToast
}: CustomerPortalProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-bookings'>('catalog');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(7000);
  const [selectedTransmission, setSelectedTransmission] = useState<string>('All');

  // Selected Car for Details Modal
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Booking Wizard States
  const [bookingCar, setBookingCar] = useState<Car | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Add-ons
  const [addons, setAddons] = useState({
    gps: false,
    insurance: false,
    childSeat: false
  });

  // Credit Card Simulation
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null);

  // Available categories list
  const categories = useMemo(() => {
    const cats = new Set(cars.map(c => c.category));
    return ['All', ...Array.from(cats)];
  }, [cars]);

  // Filter cars
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            car.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || car.category === selectedCategory;
      const matchesPrice = car.dailyRent <= maxPrice;
      const matchesTrans = selectedTransmission === 'All' || car.transmission === selectedTransmission;
      return matchesSearch && matchesCategory && matchesPrice && matchesTrans;
    });
  }, [cars, searchQuery, selectedCategory, maxPrice, selectedTransmission]);

  // Calculate rental days
  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return 1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  // Calculate cost details
  const addonCosts = useMemo(() => {
    let daily = 0;
    if (addons.gps) daily += 50; // AED per day
    if (addons.insurance) daily += 150; // AED per day
    if (addons.childSeat) daily += 40; // AED per day
    return daily;
  }, [addons]);

  const bookingCosts = useMemo(() => {
    if (!bookingCar) return { rent: 0, deposit: 0, addonsTotal: 0, total: 0 };
    const rent = bookingCar.dailyRent * rentalDays;
    const deposit = bookingCar.deposit;
    const addonsTotal = addonCosts * rentalDays;
    const total = rent + addonsTotal;
    return { rent, deposit, addonsTotal, total };
  }, [bookingCar, rentalDays, addonCosts]);

  // Open booking modal
  const handleOpenBooking = (car: Car) => {
    if (car.status !== 'Available') {
      showToast(`${car.name} is currently not available for booking.`, 'error');
      return;
    }
    // Set default dates to today and tomorrow
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(tomorrow);
    
    setBookingCar(car);
    setWizardStep(1);
    setAddons({ gps: false, insurance: false, childSeat: false });
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setCompletedBookingId(null);
    setSelectedCar(null); // Close details modal if open
  };

  // Submit step 1 (Dates and Details)
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showToast('Please select valid pickup and return dates.', 'error');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showToast('Return date cannot be earlier than pickup date.', 'error');
      return;
    }
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      showToast('Please fill out all customer information.', 'error');
      return;
    }
    setWizardStep(2);
  };

  // Submit step 3 (Payment Simulation)
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      showToast('Invalid Credit Card number.', 'error');
      return;
    }
    if (!cardName.trim()) {
      showToast('Please enter Cardholder name.', 'error');
      return;
    }
    if (!cardExpiry || !cardCvv) {
      showToast('Please enter Expiry and CVV.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    
    // Simulate API request processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      
      const newBookingId = 'b-' + Math.floor(Math.random() * 90000 + 10000);
      
      onCreateBooking({
        carId: bookingCar!.id,
        carName: bookingCar!.name,
        carImage: bookingCar!.image,
        customerName,
        customerEmail,
        customerPhone,
        startDate,
        endDate,
        totalCost: bookingCosts.total
      });

      setCompletedBookingId(newBookingId);
      setWizardStep(4);
      showToast('Payment successful! Booking confirmed.', 'success');
    }, 2500);
  };

  // Customer self-cancel booking
  const handleCancel = (bookingId: string, carName: string) => {
    if (window.confirm(`Are you sure you want to cancel your booking for ${carName}?`)) {
      onCancelBooking(bookingId);
      showToast('Booking cancelled successfully.', 'info');
    }
  };

  return (
    <div className="fade-in">
      {/* Customer Hero Banner */}
      <section className="customer-hero">
        <div className="container">
          <span className="badge badge-active" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <Sparkles size={12} style={{ marginRight: '6px' }} /> Dubai's Premium Fleet
          </span>
          <h1>Rent Your Dream Car</h1>
          <p>Experience the ultimate luxury, performance, and comfort with our exclusive selection of supercars and luxury SUVs.</p>
          
          {/* Quick Date search bar */}
          <div className="search-box-container">
            <div className="glass-panel search-box-flex">
              <div className="search-field">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <Search size={14} style={{ marginRight: '4px' }} /> Search Cars
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Lamborghini, Ferrari..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.9)', color: '#000' }}
                />
              </div>
              <div className="search-field">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Category</label>
                <select 
                  className="form-input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.9)', color: '#000' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="search-field">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Transmission</label>
                <select 
                  className="form-input"
                  value={selectedTransmission}
                  onChange={(e) => setSelectedTransmission(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.9)', color: '#000' }}
                >
                  <option value="All">All types</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
              <div className="search-field">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Max Price ({maxPrice} AED)</label>
                <input 
                  type="range" 
                  min="1000" 
                  max="7000" 
                  step="500" 
                  className="form-input"
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  style={{ height: '38px', padding: '0 8px' }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedTransmission('All');
                  setSearchQuery('');
                  setMaxPrice(7000);
                  showToast('Search parameters reset.', 'info');
                }}
                style={{ height: '45px' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main navigation tabs */}
      <div className="container" style={{ marginTop: '70px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
          <button 
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: activeTab === 'catalog' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'catalog' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            Available Vehicles ({filteredCars.length})
          </button>
          <button 
            onClick={() => setActiveTab('my-bookings')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: activeTab === 'my-bookings' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'my-bookings' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            My Bookings ({bookings.length})
          </button>
        </div>

        {/* Tab 1: Car Catalog */}
        {activeTab === 'catalog' && (
          <div className="catalog-section">
            {/* Sidebar for filters */}
            <aside className="filters-sidebar glass-panel">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} /> Quick Filter Panel
              </h3>
              
              <div className="filter-group">
                <div className="filter-title">Category</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {categories.map(cat => (
                    <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="cat-sidebar" 
                        checked={selectedCategory === cat} 
                        onChange={() => setSelectedCategory(cat)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-title">Transmission</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {['All', 'Automatic', 'Manual'].map(trans => (
                    <label key={trans} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="trans-sidebar" 
                        checked={selectedTransmission === trans} 
                        onChange={() => setSelectedTransmission(trans)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      {trans}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-title">Why Rent with Us?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Shield size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div><strong>Full Insurance</strong> CDW coverage available</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Award size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div><strong>Top Fleet</strong> Highly maintained exotic models</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Clock size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div><strong>24/7 Delivery</strong> Instant pickup options</div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Car Cards Grid */}
            <main>
              {filteredCars.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <CarIcon size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                  <h3>No Cars Found</h3>
                  <p>Try adjusting your filters or search keywords.</p>
                </div>
              ) : (
                <div className="cars-grid">
                  {filteredCars.map(car => (
                    <div className="car-card glass-panel" key={car.id}>
                      <div className="car-image-container">
                        <img src={car.image} alt={car.name} />
                        <div className="car-card-badge">
                          <span className={`badge badge-${car.status.toLowerCase()}`}>
                            {car.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="car-card-info">
                        <div className="car-card-header">
                          <div>
                            <span className="car-card-category">{car.category}</span>
                            <h3 className="car-card-name">{car.name}</h3>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{car.year}</span>
                        </div>

                        <div className="car-card-specs">
                          <div className="spec-item">
                            <Compass size={14} style={{ color: 'var(--primary)' }} />
                            <span>{car.transmission}</span>
                          </div>
                          <div className="spec-item">
                            <MapPin size={14} style={{ color: 'var(--primary)' }} />
                            <span>{car.color}</span>
                          </div>
                          <div className="spec-item">
                            <Info size={14} style={{ color: 'var(--primary)' }} />
                            <span>Deposit Required</span>
                          </div>
                        </div>

                        <div className="car-card-footer">
                          <div>
                            <div className="car-price-label">Daily Rate</div>
                            <div className="car-price-amount">{car.dailyRent} <span>AED</span></div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedCar(car)}>
                              Details
                            </button>
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleOpenBooking(car)}
                              disabled={car.status !== 'Available'}
                              style={{ opacity: car.status === 'Available' ? 1 : 0.5 }}
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}

        {/* Tab 2: My Bookings */}
        {activeTab === 'my-bookings' && (
          <div className="my-bookings-container">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Your Booking History</h2>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <Calendar size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                <h3>No Bookings Found</h3>
                <p>You haven't rented any cars yet. Switch to the catalog to make your first reservation.</p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setActiveTab('catalog')}>
                  View Catalog
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookings.map(b => (
                  <div className="booking-card glass-panel" key={b.id}>
                    <img className="booking-card-img" src={b.carImage} alt={b.carName} />
                    
                    <div className="booking-card-details">
                      <div>
                        <div className="booking-detail-label">Vehicle</div>
                        <div className="booking-detail-value">{b.carName}</div>
                        <span className="badge badge-completed" style={{ fontSize: '0.7rem', marginTop: '6px' }}>ID: {b.id}</span>
                      </div>
                      
                      <div>
                        <div className="booking-detail-label">Rental Period</div>
                        <div className="booking-detail-value" style={{ fontSize: '0.9rem' }}>
                          {b.startDate} to {b.endDate}
                        </div>
                      </div>

                      <div>
                        <div className="booking-detail-label">Billing Detail</div>
                        <div className="booking-detail-value" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                          {b.totalCost} AED
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Status: <span className={`badge badge-${b.status.toLowerCase()}`} style={{ padding: '2px 8px', textTransform: 'capitalize' }}>{b.status}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {b.status === 'Active' && (
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleCancel(b.id, b.carName)}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          Cancel Booking
                        </button>
                      )}
                      {b.status === 'Completed' && (
                        <span className="badge badge-available" style={{ display: 'inline-flex', gap: '4px' }}>
                          <CheckCircle size={12} /> Trip Ended
                        </span>
                      )}
                      {b.status === 'Cancelled' && (
                        <span className="badge badge-cancelled">Cancelled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Car Specs / Details */}
      {selectedCar && (
        <div className="modal-overlay" onClick={() => setSelectedCar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <button className="modal-close" onClick={() => setSelectedCar(null)}>
              <X size={18} />
            </button>
            <div className="car-details-grid">
              <div>
                <div className="car-details-image">
                  <img src={selectedCar.image} alt={selectedCar.name} />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Vehicle Specifications</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Year:</strong> {selectedCar.year}
                    </div>
                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Transmission:</strong> {selectedCar.transmission}
                    </div>
                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Category:</strong> {selectedCar.category}
                    </div>
                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Daily Rent:</strong> {selectedCar.dailyRent} AED
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="badge badge-available" style={{ marginBottom: '8px' }}>{selectedCar.status}</span>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{selectedCar.name}</h2>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '16px' }}>Reg No: {selectedCar.registration}</p>
                  
                  <h4 style={{ marginBottom: '8px' }}>Standard Features:</h4>
                  <div className="features-list">
                    {selectedCar.features.map((f, i) => (
                      <div className="feature-tag" key={i}>
                        <Check size={14} style={{ color: 'var(--primary)' }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <h5 style={{ color: 'var(--color-info)', marginBottom: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={14} /> Security Deposit Requirement
                    </h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      A pre-authorized security deposit of <strong>{selectedCar.deposit} AED</strong> will be blocked on your credit card and released 14 days after vehicle return.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedCar(null)}>
                    Close
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1.5 }}
                    disabled={selectedCar.status !== 'Available'}
                    onClick={() => handleOpenBooking(selectedCar)}
                  >
                    Proceed to Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Step-by-Step Booking Wizard */}
      {bookingCar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            {wizardStep < 4 && (
              <button className="modal-close" onClick={() => setBookingCar(null)}>
                <X size={18} />
              </button>
            )}
            
            <div className="wizard-container">
              {/* Wizard Steps Header Indicator */}
              <div className="wizard-steps">
                <div className={`wizard-step ${wizardStep === 1 ? 'active' : ''} ${wizardStep > 1 ? 'completed' : ''}`}>
                  <span className="step-indicator">1</span>
                  <span>Dates & Details</span>
                </div>
                <div className={`wizard-step ${wizardStep === 2 ? 'active' : ''} ${wizardStep > 2 ? 'completed' : ''}`}>
                  <span className="step-indicator">2</span>
                  <span>Add-ons</span>
                </div>
                <div className={`wizard-step ${wizardStep === 3 ? 'active' : ''} ${wizardStep > 3 ? 'completed' : ''}`}>
                  <span className="step-indicator">3</span>
                  <span>Payment</span>
                </div>
                <div className={`wizard-step ${wizardStep === 4 ? 'active' : ''}`}>
                  <span className="step-indicator">4</span>
                  <span>Receipt</span>
                </div>
              </div>

              <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                {wizardStep === 4 ? 'Booking Confirmed!' : `Book ${bookingCar.name}`}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                {wizardStep === 1 && 'Select your rental dates and tell us who is driving.'}
                {wizardStep === 2 && 'Personalize your trip with our high-end add-on upgrades.'}
                {wizardStep === 3 && 'Enter mock payment details to secure your reservation.'}
                {wizardStep === 4 && 'Thank you for choosing TMT Car Rental. Here is your voucher.'}
              </p>

              {/* STEP 1: Dates and User Info Form */}
              {wizardStep === 1 && (
                <form onSubmit={handleNextStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Pickup Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        min={new Date().toISOString().split('T')[0]} 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Return Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        min={startDate || new Date().toISOString().split('T')[0]} 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Driver Details</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. John Doe"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label className="form-label">Email Address</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            placeholder="e.g. john@example.com"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Mobile Number</label>
                          <input 
                            type="tel" 
                            className="form-input" 
                            placeholder="e.g. +971 50 123 4567"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setBookingCar(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Next Step <ChevronRight size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Extras/Add-ons */}
              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', backgroundColor: addons.insurance ? 'rgba(170, 59, 255, 0.05)' : 'var(--bg-secondary)', transition: 'var(--transition)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={addons.insurance}
                          onChange={(e) => setAddons({ ...addons, insurance: e.target.checked })}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Full Collision Damage Waiver (CDW)</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zero liability in case of minor accidents or damage.</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>+150 AED/day</div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', backgroundColor: addons.gps ? 'rgba(170, 59, 255, 0.05)' : 'var(--bg-secondary)', transition: 'var(--transition)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={addons.gps}
                          onChange={(e) => setAddons({ ...addons, gps: e.target.checked })}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Satellite GPS Navigator</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Offline voice navigation for all UAE roads and landmarks.</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>+50 AED/day</div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', backgroundColor: addons.childSeat ? 'rgba(170, 59, 255, 0.05)' : 'var(--bg-secondary)', transition: 'var(--transition)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={addons.childSeat}
                          onChange={(e) => setAddons({ ...addons, childSeat: e.target.checked })}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Infant/Toddler Safety Seat</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Premium certified safety booster seat for toddlers.</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>+40 AED/day</div>
                    </label>
                  </div>

                  {/* Summary Card */}
                  <div className="summary-card">
                    <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Billing Summary</h4>
                    <div className="summary-row">
                      <span>Daily Vehicle Rent ({bookingCar.dailyRent} AED x {rentalDays} days)</span>
                      <span>{bookingCosts.rent} AED</span>
                    </div>
                    {addonCosts > 0 && (
                      <div className="summary-row">
                        <span>Extras & Add-ons ({addonCosts} AED x {rentalDays} days)</span>
                        <span>{bookingCosts.addonsTotal} AED</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span>Refundable Security Deposit (Authorization Only)</span>
                      <span>{bookingCosts.deposit} AED</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total Amount Payable</span>
                      <span>{bookingCosts.total} AED</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '16px' }}>
                    <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button className="btn btn-primary" onClick={() => setWizardStep(3)}>
                      Proceed to Checkout <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment Simulation */}
              {wizardStep === 3 && (
                <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Credit Card Illustration */}
                  <div className="credit-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, letterSpacing: '0.05em' }}>TMT SECURE CHECKOUT</span>
                      <CreditCard size={32} />
                    </div>
                    <div className="card-number">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="card-details">
                      <div>
                        <div style={{ opacity: 0.7, fontSize: '0.65rem' }}>Cardholder</div>
                        <div>{cardName || 'YOUR FULL NAME'}</div>
                      </div>
                      <div>
                        <div style={{ opacity: 0.7, fontSize: '0.65rem' }}>Expires</div>
                        <div>{cardExpiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="form-label">Card Number</label>
                      <input 
                        type="text" 
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        className="form-input" 
                        value={cardNumber}
                        onChange={(e) => {
                          // Auto format spacing
                          const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          const matches = v.match(/\d{4,16}/g);
                          const match = (matches && matches[0]) || '';
                          const parts = [];
                          for (let i=0, len=match.length; i<len; i+=4) {
                            parts.push(match.substring(i, i+4));
                          }
                          if (parts.length > 0) {
                            setCardNumber(parts.join(' '));
                          } else {
                            setCardNumber(v);
                          }
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Cardholder Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe"
                        className="form-input" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="form-label">Expiration Date (MM/YY)</label>
                        <input 
                          type="text" 
                          placeholder="12/28"
                          maxLength={5}
                          className="form-input" 
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length >= 2) {
                              val = val.substring(0,2) + '/' + val.substring(2,4);
                            }
                            setCardExpiry(val);
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label">CVV / Security Code</label>
                        <input 
                          type="password" 
                          placeholder="•••"
                          maxLength={3}
                          className="form-input" 
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing brief */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Total billing:</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{bookingCosts.total} AED</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setWizardStep(2)} disabled={isProcessingPayment}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flexGrow: 1 }}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'checkPulse 1s linear infinite' }} />
                          Processing Transaction...
                        </div>
                      ) : (
                        <>Pay & Rent Vehicle <CheckCircle size={16} /></>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: Checkout Completed Receipt */}
              {wizardStep === 4 && (
                <div className="success-checkout-container">
                  <div className="success-checkmark">
                    <Check size={40} />
                  </div>
                  <h3>Booking Confirmed!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Your reservation has been locked in. We have sent a digital rental voucher to <strong>{customerEmail}</strong>.
                  </p>

                  <div style={{ width: '100%', padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'left', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '10px' }}>
                      <strong>Voucher ID:</strong>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{completedBookingId}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Vehicle:</strong>
                      <span>{bookingCar.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Rental Period:</strong>
                      <span>{startDate} to {endDate} ({rentalDays} days)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Driver:</strong>
                      <span>{customerName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Deposit Blocked:</strong>
                      <span>{bookingCosts.deposit} AED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '1.1rem', fontWeight: 800 }}>
                      <strong>Paid Amount:</strong>
                      <span style={{ color: 'var(--primary)' }}>{bookingCosts.total} AED</span>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '16px' }}
                    onClick={() => {
                      setBookingCar(null);
                      setActiveTab('my-bookings');
                    }}
                  >
                    View My Bookings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
