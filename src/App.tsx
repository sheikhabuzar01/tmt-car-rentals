import { useState, useEffect } from 'react';
import { 
  Car as CarIcon, Shield, User, Key, ArrowLeft,
  AlertCircle, Info, Sparkles, Check, X, Menu
} from 'lucide-react';
import type { Car, Booking } from './utils/mockData';
import { INITIAL_CARS, INITIAL_BOOKINGS } from './utils/mockData';
import CustomerPortal from './components/CustomerPortal';
import OwnerPortal from './components/OwnerPortal';
import { supabase } from './utils/supabaseClient';

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
    if (targetPortal === 'owner') {
      setIsPasscodeOpen(true);
      setPasscode(['', '', '', '']);
    } else {
      setPortal(targetPortal);
    }
    setIsMobileMenuOpen(false);
  };

  // 1. Initial State Loading & Synchronization with Supabase
  useEffect(() => {
    async function loadData() {
      // Fetch Cars
      let { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*');

      if (carsError) {
        showToast('Error loading cars from database.', 'error');
        console.error(carsError);
      } else if (!carsData || carsData.length === 0) {
        // Seed database with initial cars
        const { error: seedCarsErr } = await supabase.from('cars').insert(INITIAL_CARS);
        if (seedCarsErr) {
          console.error('Error seeding cars:', seedCarsErr);
        } else {
          setCars(INITIAL_CARS);
        }
      } else {
        // Sort cars by id (e.g. car-1, car-2)
        carsData.sort((a, b) => {
          const aNum = parseInt(a.id.split('-')[1]) || 0;
          const bNum = parseInt(b.id.split('-')[1]) || 0;
          return aNum - bNum;
        });
        setCars(carsData);
      }

      // Fetch Bookings
      let { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

      if (bookingsError) {
        showToast('Error loading bookings from database.', 'error');
        console.error(bookingsError);
      } else if (!bookingsData || bookingsData.length === 0) {
        // Seed database with initial bookings
        const { error: seedBookingsErr } = await supabase.from('bookings').insert(INITIAL_BOOKINGS);
        if (seedBookingsErr) {
          console.error('Error seeding bookings:', seedBookingsErr);
        } else {
          setBookings(INITIAL_BOOKINGS);
        }
      } else {
        // Sort bookings by id descending
        bookingsData.sort((a, b) => b.id.localeCompare(a.id));
        setBookings(bookingsData);
      }
    }
    loadData();
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
  const handleCreateBooking = async (newBookingData: Omit<Booking, 'id' | 'status' | 'paymentStatus'>) => {
    const newBookingId = 'b-' + Math.floor(Math.random() * 90000 + 10000);
    const newBooking: Booking = {
      ...newBookingData,
      id: newBookingId,
      status: 'Active',
      paymentStatus: 'Paid'
    };

    // Insert new booking
    const { error: bookingErr } = await supabase
      .from('bookings')
      .insert([newBooking]);

    if (bookingErr) {
      showToast('Error saving booking to database.', 'error');
      console.error(bookingErr);
      return;
    }

    // Update car status to 'Rented'
    const { error: carErr } = await supabase
      .from('cars')
      .update({ status: 'Rented' })
      .eq('id', newBookingData.carId);

    if (carErr) {
      showToast('Error updating car status in database.', 'error');
      console.error(carErr);
      return;
    }

    // Update local state
    setBookings([newBooking, ...bookings]);
    setCars(cars.map(car => {
      if (car.id === newBookingData.carId) {
        return { ...car, status: 'Rented' as const };
      }
      return car;
    }));
    showToast('Booking successfully recorded!', 'success');
  };

  // 4. Customer cancels booking (reverts car to Available)
  const handleCancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Update booking status to Cancelled
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled' })
      .eq('id', bookingId);

    if (bookingErr) {
      showToast('Error cancelling booking in database.', 'error');
      console.error(bookingErr);
      return;
    }

    // Update car status to Available
    const { error: carErr } = await supabase
      .from('cars')
      .update({ status: 'Available' })
      .eq('id', booking.carId);

    if (carErr) {
      showToast('Error updating car status in database.', 'error');
      console.error(carErr);
      return;
    }

    // Update local state
    setBookings(bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: 'Cancelled' as const };
      }
      return b;
    }));
    setCars(cars.map(car => {
      if (car.id === booking.carId) {
        return { ...car, status: 'Available' as const };
      }
      return car;
    }));
    showToast('Booking successfully cancelled.', 'info');
  };

  // 5. Owner Portal adds a new car to inventory
  const handleAddCar = async (newCarData: Omit<Car, 'id'>) => {
    const newCarId = 'car-' + Math.floor(Math.random() * 90000 + 10000);
    const newCar: Car = {
      ...newCarData,
      id: newCarId
    };

    const { error } = await supabase
      .from('cars')
      .insert([newCar]);

    if (error) {
      showToast('Error adding vehicle to database.', 'error');
      console.error(error);
      return;
    }

    setCars([...cars, newCar]);
  };

  // 6. Owner Portal updates car status (e.g. to Maintenance or Available)
  const handleUpdateCarStatus = async (carId: string, status: Car['status']) => {
    const { error } = await supabase
      .from('cars')
      .update({ status })
      .eq('id', carId);

    if (error) {
      showToast('Error updating status in database.', 'error');
      console.error(error);
      return;
    }

    setCars(cars.map(car => {
      if (car.id === carId) {
        return { ...car, status };
      }
      return car;
    }));
  };

  // 7. Owner Portal deletes a car from inventory
  const handleDeleteCar = async (carId: string) => {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);

    if (error) {
      showToast('Error deleting vehicle from database.', 'error');
      console.error(error);
      return;
    }

    setCars(cars.filter(car => car.id !== carId));
  };

  // 8. Owner Portal manages booking statuses
  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const paymentStatus = status === 'Cancelled' ? ('Refunded' as const) : booking.paymentStatus;

    // Update booking in database
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({ status, paymentStatus })
      .eq('id', bookingId);

    if (bookingErr) {
      showToast('Error updating booking in database.', 'error');
      console.error(bookingErr);
      return;
    }

    // Determine target car status
    let carStatus: Car['status'] | null = null;
    if (status === 'Completed' || status === 'Cancelled') {
      carStatus = 'Available';
    } else if (status === 'Active') {
      carStatus = 'Rented';
    }

    // Update car status in database
    if (carStatus) {
      const { error: carErr } = await supabase
        .from('cars')
        .update({ status: carStatus })
        .eq('id', booking.carId);

      if (carErr) {
        showToast('Error updating car status in database.', 'error');
        console.error(carErr);
        return;
      }
    }

    // Update local state
    setBookings(bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status, paymentStatus };
      }
      return b;
    }));

    if (carStatus) {
      setCars(cars.map(car => {
        if (car.id === booking.carId) {
          return { ...car, status: carStatus };
        }
        return car;
      }));
    }
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
                  onClick={() => handleSwitchPortal('owner')}
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
                  onClick={() => handleSwitchPortal('owner')}
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
