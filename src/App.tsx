import { useState, useEffect } from 'react';
import { 
  Car as CarIcon, Shield, User, Key, ArrowLeft,
  AlertCircle, Info, Sparkles, Check, X, Menu
} from 'lucide-react';
import type { Car, Booking } from './utils/mockData';
import { INITIAL_CARS, INITIAL_BOOKINGS } from './utils/mockData';
import CustomerPortal from './components/CustomerPortal';
import OwnerPortal from './components/OwnerPortal';

// Toast structure
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Portal routing state: 'selector' | 'customer' | 'owner'
  const [portal, setPortal] = useState<'selector' | 'customer' | 'owner'>('selector');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for inventory & bookings
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Passcode modal state
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const [passcode, setPasscode] = useState(['', '', '', '']);
  const adminPasscode = '1234';

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleSwitchPortal = (targetPortal: 'selector' | 'customer' | 'owner') => {
    setPortal(targetPortal);
    setIsMobileMenuOpen(false);
  };

  // 1. Initial State Loading & Synchronization with LocalStorage
  useEffect(() => {
    const savedCars = localStorage.getItem('tmt_cars');
    const savedBookings = localStorage.getItem('tmt_bookings');

    if (savedCars) {
      setCars(JSON.parse(savedCars));
    } else {
      setCars(INITIAL_CARS);
      localStorage.setItem('tmt_cars', JSON.stringify(INITIAL_CARS));
    }

    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    } else {
      setBookings(INITIAL_BOOKINGS);
      localStorage.setItem('tmt_bookings', JSON.stringify(INITIAL_BOOKINGS));
    }
  }, []);

  // 2. Helper to display toasts
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // 3. Customer creates a booking
  const handleCreateBooking = (newBookingData: Omit<Booking, 'id' | 'status' | 'paymentStatus'>) => {
    const newBookingId = 'b-' + Math.floor(Math.random() * 90000 + 10000);
    const newBooking: Booking = {
      ...newBookingData,
      id: newBookingId,
      status: 'Active', // Instantly active upon simulated credit card payment success
      paymentStatus: 'Paid'
    };

    // Update bookings list
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    localStorage.setItem('tmt_bookings', JSON.stringify(updatedBookings));

    // Update car status to 'Rented'
    const updatedCars = cars.map(car => {
      if (car.id === newBookingData.carId) {
        return { ...car, status: 'Rented' as const };
      }
      return car;
    });
    setCars(updatedCars);
    localStorage.setItem('tmt_cars', JSON.stringify(updatedCars));
  };

  // 4. Customer cancels booking (reverts car to Available)
  const handleCancelBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Update booking status to Cancelled
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: 'Cancelled' as const };
      }
      return b;
    });
    setBookings(updatedBookings);
    localStorage.setItem('tmt_bookings', JSON.stringify(updatedBookings));

    // Update car status back to Available
    const updatedCars = cars.map(car => {
      if (car.id === booking.carId) {
        return { ...car, status: 'Available' as const };
      }
      return car;
    });
    setCars(updatedCars);
    localStorage.setItem('tmt_cars', JSON.stringify(updatedCars));
  };

  // 5. Owner Portal adds a new car to inventory
  const handleAddCar = (newCarData: Omit<Car, 'id'>) => {
    const newCarId = 'car-' + (cars.length + 1);
    const newCar: Car = {
      ...newCarData,
      id: newCarId
    };

    const updatedCars = [...cars, newCar];
    setCars(updatedCars);
    localStorage.setItem('tmt_cars', JSON.stringify(updatedCars));
  };

  // 6. Owner Portal updates car status (e.g. to Maintenance or Available)
  const handleUpdateCarStatus = (carId: string, status: Car['status']) => {
    const updatedCars = cars.map(car => {
      if (car.id === carId) {
        return { ...car, status };
      }
      return car;
    });
    setCars(updatedCars);
    localStorage.setItem('tmt_cars', JSON.stringify(updatedCars));
  };

  // 7. Owner Portal deletes a car from inventory
  const handleDeleteCar = (carId: string) => {
    const updatedCars = cars.filter(car => car.id !== carId);
    setCars(updatedCars);
    localStorage.setItem('tmt_cars', JSON.stringify(updatedCars));
  };

  // 8. Owner Portal manages booking statuses
  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status']) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Update booking status
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { 
          ...b, 
          status,
          paymentStatus: status === 'Cancelled' ? ('Refunded' as const) : b.paymentStatus
        };
      }
      return b;
    });
    setBookings(updatedBookings);
    localStorage.setItem('tmt_bookings', JSON.stringify(updatedBookings));

    // Side-effects on Car availability based on booking status transition
    const updatedCars = cars.map(car => {
      if (car.id === booking.carId) {
        if (status === 'Completed' || status === 'Cancelled') {
          return { ...car, status: 'Available' as const };
        } else if (status === 'Active') {
          return { ...car, status: 'Rented' as const };
        }
      }
      return car;
    });
    setCars(updatedCars);
    localStorage.setItem('tmt_cars', JSON.stringify(updatedCars));
  };

  // Passcode modal input handlers
  const handlePasscodeChange = (index: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return; // Allow numbers only
    const newPasscode = [...passcode];
    newPasscode[index] = val;
    setPasscode(newPasscode);

    // Auto-focus next field
    if (val && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Check passcode upon typing the final digit
    const passcodeString = newPasscode.join('');
    if (passcodeString.length === 4) {
      if (passcodeString === adminPasscode) {
        setTimeout(() => {
          setPortal('owner');
          setIsPasscodeOpen(false);
          setPasscode(['', '', '', '']);
          showToast('Owner Portal access granted.', 'success');
        }, 300);
      } else {
        setTimeout(() => {
          showToast('Invalid security passcode. Access Denied.', 'error');
          setPasscode(['', '', '', '']);
          document.getElementById('pin-0')?.focus();
        }, 300);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      const newPasscode = [...passcode];
      newPasscode[index - 1] = '';
      setPasscode(newPasscode);
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  return (
    <div className={portal === 'owner' ? 'owner-portal-active' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', transition: 'background-color 0.4s ease, color 0.4s ease' }}>
      
      {/* Dynamic Navigation Header (for active portals, not the initial role selector) */}
      {portal !== 'selector' && (
        <header className="portal-header glass-panel" style={{ position: 'relative' }}>
          <div className="container header-flex">
            <div className="logo-container" onClick={() => handleSwitchPortal('selector')} style={{ cursor: 'pointer' }}>
              <CarIcon className="logo-icon" size={24} />
              <span>TMT <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Car Rental</span></span>
            </div>
            
            <button 
              className="hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="header-actions desktop-only">
              <button 
                className="btn btn-secondary switch-portal-btn"
                onClick={() => handleSwitchPortal('selector')}
              >
                <ArrowLeft size={14} /> Back to Hub
              </button>
              
              {portal === 'customer' ? (
                <button 
                  className="btn btn-primary switch-portal-btn"
                  onClick={() => {
                    handleSwitchPortal('owner');
                    showToast('Admin Portal cleared.', 'success');
                  }}
                  style={{ background: 'var(--secondary)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                >
                  <Shield size={14} /> Admin Portal
                </button>
              ) : (
                <button 
                  className="btn btn-primary switch-portal-btn"
                  onClick={() => handleSwitchPortal('customer')}
                >
                  <User size={14} /> Customer View
                </button>
              )}
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {isMobileMenuOpen && (
            <div className="mobile-nav-menu glass-panel fade-in">
              <button 
                className="btn btn-secondary mobile-nav-btn"
                onClick={() => handleSwitchPortal('selector')}
              >
                <ArrowLeft size={14} /> Back to Hub
              </button>
              
              {portal === 'customer' ? (
                <button 
                  className="btn btn-primary mobile-nav-btn"
                  onClick={() => {
                    handleSwitchPortal('owner');
                    showToast('Admin Portal cleared.', 'success');
                  }}
                  style={{ background: 'var(--secondary)', color: 'var(--primary)', border: '1px solid var(--border)', width: '100%' }}
                >
                  <Shield size={14} /> Admin Portal
                </button>
              ) : (
                <button 
                  className="btn btn-primary mobile-nav-btn"
                  onClick={() => handleSwitchPortal('customer')}
                  style={{ width: '100%' }}
                >
                  <User size={14} /> Customer View
                </button>
              )}
            </div>
          )}
        </header>
      )}

      {/* 1. PORTAL SELECTOR (Role selection page) */}
      {portal === 'selector' && (
        <section className="portal-selector">
          <div className="selector-header">
            <span className="badge badge-active" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '12px' }}>
              <Sparkles size={12} style={{ marginRight: '6px' }} /> Enterprise Booking Suite v1.4
            </span>
            <h1>TMT Car Rental Hub</h1>
            <p>Welcome to our executive fleet booking system. Choose your portal below to browse vehicles or administer operations.</p>
          </div>

          <div className="selector-grid">
            {/* Customer Portal Selector */}
            <div className="selector-card glass-panel" onClick={() => handleSwitchPortal('customer')}>
              <div className="selector-icon-wrapper">
                <User size={36} />
              </div>
              <h2 style={{ fontSize: '1.5rem' }}>Customer Portal</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Browse our high-end exotic fleet catalog, specify custom insurance coverages, and secure reservations with visual credit card checkouts.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Open Booking Portal
              </button>
            </div>

            {/* Owner Portal Selector */}
            <div className="selector-card owner-card glass-panel" onClick={() => { handleSwitchPortal('owner'); showToast('Admin Portal cleared.', 'success'); }}>
              <div className="selector-icon-wrapper">
                <Shield size={36} />
              </div>
              <h2 style={{ fontSize: '1.5rem' }}>Owner / Admin Portal</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Track gross capitalization and vehicle performance charts, insert new assets to the fleet, edit service items, and verify billing contracts.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Admin Dashboard
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. CUSTOMER BOOKING PORTAL */}
      {portal === 'customer' && (
        <CustomerPortal 
          cars={cars}
          bookings={bookings}
          onCreateBooking={handleCreateBooking}
          onCancelBooking={handleCancelBooking}
          showToast={showToast}
        />
      )}

      {/* 3. OWNER MANAGEMENT PORTAL */}
      {portal === 'owner' && (
        <OwnerPortal 
          cars={cars}
          bookings={bookings}
          onAddCar={handleAddCar}
          onUpdateCarStatus={handleUpdateCarStatus}
          onDeleteCar={handleDeleteCar}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          showToast={showToast}
        />
      )}

      {/* Passcode Modal Overlay */}
      {isPasscodeOpen && (
        <div className="modal-overlay" onClick={() => setIsPasscodeOpen(false)}>
          <div className="modal-content passcode-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsPasscodeOpen(false)}>
              <X className="logo-icon" size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Key size={30} />
              </div>
            </div>
            
            <h3>Administrative Clearance</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Enter the owner portal passcode to verify authentication (Hint: **1234**)
            </p>

            <div className="passcode-inputs">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  id={`pin-${idx}`}
                  type="password"
                  maxLength={1}
                  value={passcode[idx]}
                  onChange={(e) => handlePasscodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="form-input"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global toast notification banner stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div className={`toast toast-${t.type}`} key={t.id}>
            {t.type === 'success' && <Check size={16} />}
            {t.type === 'error' && <AlertCircle size={16} />}
            {t.type === 'info' && <Info size={16} />}
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
