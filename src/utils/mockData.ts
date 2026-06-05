export interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  color: string;
  registration: string;
  dailyRent: number;
  deposit: number;
  status: 'Available' | 'Rented' | 'Maintenance';
  image: string;
  features: string[];
  transmission: 'Automatic' | 'Manual';
}

export interface Booking {
  id: string;
  carId: string;
  carName: string;
  carImage: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled';
  paymentStatus: 'Paid' | 'Refunded';
}

export const INITIAL_CARS: Car[] = [
  {
    id: 'car-1',
    name: 'Lamborghini Huracán EVO',
    brand: 'Lamborghini',
    model: 'Huracán EVO Spyder',
    category: 'Supercar',
    year: 2023,
    color: 'Verde Mantis',
    registration: 'Dubai O 55512',
    dailyRent: 4500,
    deposit: 5000,
    status: 'Available',
    image: '/2.jpg',
    features: ['V10 Engine', 'Convertible soft-top', 'LDS Dynamic Steering', 'Alcantara Interior'],
    transmission: 'Automatic'
  },
  {
    id: 'car-2',
    name: 'Ferrari 488 Spider',
    brand: 'Ferrari',
    model: '488 Spider',
    category: 'Convertible',
    year: 2022,
    color: 'Rosso Corsa',
    registration: 'Dubai K 11220',
    dailyRent: 5000,
    deposit: 6000,
    status: 'Available',
    image: '/3.jpg',
    features: ['Twin-turbo V8', 'Hard-top Convertible', 'F1 Dual-Clutch Transmission', 'Carbon Fiber Elements'],
    transmission: 'Automatic'
  },
  {
    id: 'car-3',
    name: 'Rolls-Royce Cullinan',
    brand: 'Rolls-Royce',
    model: 'Cullinan',
    category: 'Luxury SUV',
    year: 2023,
    color: 'Arctic White',
    registration: 'Dubai A 9001',
    dailyRent: 6500,
    deposit: 10000,
    status: 'Rented',
    image: '/4.jpg',
    features: ['Twin-Turbo V12', 'Starry Sky Headliner', 'Starlight Tailgate Seats', 'Bespoke Audio'],
    transmission: 'Automatic'
  },
  {
    id: 'car-4',
    name: 'Mercedes-Benz G63 AMG',
    brand: 'Mercedes-Benz',
    model: 'G63 AMG',
    category: 'Luxury SUV',
    year: 2023,
    color: 'Obsidian Black',
    registration: 'Dubai L 33440',
    dailyRent: 3000,
    deposit: 5000,
    status: 'Available',
    image: '/5.jpg',
    features: ['Handcrafted Biturbo V8', 'Burmester Surround Sound', 'Dynamic Select Suspension', 'Ambient Lighting'],
    transmission: 'Automatic'
  },
  {
    id: 'car-5',
    name: 'Bentley Continental GT',
    brand: 'Bentley',
    model: 'Continental GT',
    category: 'Luxury Sedan',
    year: 2023,
    color: 'British Racing Green',
    registration: 'Dubai M 7788',
    dailyRent: 3500,
    deposit: 5000,
    status: 'Available',
    image: '/6.jpg',
    features: ['W12 Twin-Turbo', 'Rotating Dashboard Screen', 'Diamond-in-Diamond Quilting', 'All-Wheel Drive'],
    transmission: 'Automatic'
  },
  {
    id: 'car-6',
    name: 'Porsche 911 Carrera S',
    brand: 'Porsche',
    model: '911 Carrera S',
    category: 'Sports',
    year: 2023,
    color: 'GT Silver',
    registration: 'Dubai P 2024',
    dailyRent: 2500,
    deposit: 4000,
    status: 'Available',
    image: '/7.jpg',
    features: ['Twin-Turbo Flat-6', 'Sport Chrono Package', 'PDK 8-Speed Gearbox', 'PASM Suspension'],
    transmission: 'Manual'
  },
  {
    id: 'car-7',
    name: 'McLaren 720S',
    brand: 'McLaren',
    model: '720S',
    category: 'Supercar',
    year: 2022,
    color: 'Papaya Orange',
    registration: 'Dubai S 7200',
    dailyRent: 5500,
    deposit: 7000,
    status: 'Maintenance',
    image: '/8.jpg',
    features: ['Carbon Fiber Monocage II', 'Dihedral Doors', 'Proactive Chassis Control II', 'Active Aero Wing'],
    transmission: 'Automatic'
  },
  {
    id: 'car-8',
    name: 'Range Rover Vogue',
    brand: 'Land Rover',
    model: 'Range Rover Vogue',
    category: 'Luxury SUV',
    year: 2022,
    color: 'Santorini Black',
    registration: 'Dubai B 4510',
    dailyRent: 1500,
    deposit: 3000,
    status: 'Available',
    image: '/9.jpg',
    features: ['Mild-Hybrid Inline 6', 'Panoramic Sunroof', 'Executive Class Seating', 'Cabin Air Purification'],
    transmission: 'Automatic'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-1',
    carId: 'car-3',
    carName: 'Rolls-Royce Cullinan',
    carImage: '/4.jpg',
    customerName: 'Sheikh Hamdan',
    customerEmail: 'hamdan@dubai.ae',
    customerPhone: '+971 50 111 2222',
    startDate: '2026-06-03',
    endDate: '2026-06-07',
    totalCost: 26000,
    status: 'Active',
    paymentStatus: 'Paid'
  },
  {
    id: 'b-2',
    carId: 'car-5',
    carName: 'Bentley Continental GT',
    carImage: '/6.jpg',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@travel.com',
    customerPhone: '+44 7911 123456',
    startDate: '2026-05-20',
    endDate: '2026-05-23',
    totalCost: 10500,
    status: 'Completed',
    paymentStatus: 'Paid'
  }
];
