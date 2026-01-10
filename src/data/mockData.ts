// Mock data for Real Estate CRM - Comprehensive Implementation

// ============= PROPERTY TYPES =============
export type PropertyMainType = 'Residential' | 'Commercial' | 'Industrial';

export interface ResidentialUnit {
  id: string;
  unitNo: string;
  projectId: string;
  project: string;
  mainType: 'Residential';
  bedrooms: number;
  bathrooms: number;
  carpetArea: number;
  builtUpArea: number;
  floorNumber: number;
  towerName: string;
  facing: 'East' | 'West' | 'North' | 'South';
  hasBalcony: boolean;
  parkingCount: number;
  price: number;
  pricePerSqft: number;
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'SOLD';
  createdAt: string;
  updatedAt?: string;
}

export interface CommercialUnit {
  id: string;
  unitNo: string;
  projectId: string;
  project: string;
  mainType: 'Commercial';
  builtUpArea: number;
  carpetArea: number;
  frontage: number;
  floorNumber: number;
  suitableFor: 'Shop' | 'Office' | 'Showroom' | 'Salon' | 'Cafe' | 'Storage';
  cornerUnit: boolean;
  washroomAvailable: boolean;
  maintenanceCharges: number;
  price: number;
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'SOLD';
  createdAt: string;
  updatedAt?: string;
}

export interface IndustrialUnit {
  id: string;
  unitNo: string;
  projectId: string;
  project: string;
  mainType: 'Industrial';
  totalArea: number;
  clearHeight: number;
  facilityType: 'Warehouse' | 'Industrial Plot' | 'Shed' | 'Cold Storage';
  powerLoad: number;
  dockDoors: number;
  parkingSpace: number;
  roadAccess: string;
  fireNOC: boolean;
  price: number;
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'SOLD';
  createdAt: string;
  updatedAt?: string;
}

export type Unit = ResidentialUnit | CommercialUnit | IndustrialUnit;

// ============= PROJECTS =============
export interface Project {
  id: string;
  name: string;
  mainType: PropertyMainType;
  subType?: string;
  location: string;
  tenantId: string;
  totalUnits: number;
  availableUnits: number;
  bookedUnits: number;
  soldUnits: number;
  priceRange: string;
  status: 'Active' | 'Launching' | 'Completed' | 'On Hold';
  description?: string;
  amenities?: string[];
  images?: string[];
  videos?: string[];
  brochureUrl?: string;
  createdAt: string;
}

export const projects: Project[] = [
  { id: 'proj_1', name: 'Green Valley', mainType: 'Residential', location: 'Whitefield, Bangalore', tenantId: 't_soundarya', totalUnits: 250, availableUnits: 45, bookedUnits: 120, soldUnits: 85, priceRange: '₹85L - ₹1.5Cr', status: 'Active', amenities: ['Swimming Pool', 'Gym', 'Club House', 'Garden'], createdAt: '2023-06-01' },
  { id: 'proj_2', name: 'Sky Heights', mainType: 'Residential', location: 'Gachibowli, Hyderabad', tenantId: 't_soundarya', totalUnits: 180, availableUnits: 30, bookedUnits: 80, soldUnits: 70, priceRange: '₹1.2Cr - ₹2.5Cr', status: 'Active', amenities: ['Rooftop Pool', 'Gym', 'Spa'], createdAt: '2023-08-15' },
  { id: 'proj_3', name: 'Palm Residency', mainType: 'Residential', location: 'Bandra, Mumbai', tenantId: 't_prestige', totalUnits: 120, availableUnits: 15, bookedUnits: 50, soldUnits: 55, priceRange: '₹2Cr - ₹4Cr', status: 'Active', createdAt: '2023-03-20' },
  { id: 'proj_4', name: 'Ocean View', mainType: 'Residential', location: 'ECR, Chennai', tenantId: 't_prestige', totalUnits: 200, availableUnits: 80, bookedUnits: 60, soldUnits: 60, priceRange: '₹1.5Cr - ₹3Cr', status: 'Launching', createdAt: '2024-01-01' },
  { id: 'proj_5', name: 'Metro Edge', mainType: 'Residential', location: 'Noida, Delhi NCR', tenantId: 't_soundarya', totalUnits: 300, availableUnits: 0, bookedUnits: 0, soldUnits: 300, priceRange: '₹75L - ₹1.2Cr', status: 'Completed', createdAt: '2022-01-15' },
  { id: 'proj_6', name: 'Business Park One', mainType: 'Commercial', subType: 'Office Complex', location: 'Electronic City, Bangalore', tenantId: 't_soundarya', totalUnits: 100, availableUnits: 35, bookedUnits: 40, soldUnits: 25, priceRange: '₹45L - ₹2Cr', status: 'Active', createdAt: '2023-09-01' },
  { id: 'proj_7', name: 'Retail Plaza', mainType: 'Commercial', subType: 'Shopping Complex', location: 'MG Road, Pune', tenantId: 't_prestige', totalUnits: 80, availableUnits: 20, bookedUnits: 35, soldUnits: 25, priceRange: '₹60L - ₹3Cr', status: 'Active', createdAt: '2023-07-10' },
  { id: 'proj_8', name: 'Industrial Hub', mainType: 'Industrial', subType: 'Warehouse Complex', location: 'Chakan, Pune', tenantId: 't_soundarya', totalUnits: 50, availableUnits: 15, bookedUnits: 20, soldUnits: 15, priceRange: '₹1Cr - ₹5Cr', status: 'Active', createdAt: '2023-05-20' },
  { id: 'proj_9', name: 'Logistics Park', mainType: 'Industrial', subType: 'Logistics Hub', location: 'Hosur Road, Bangalore', tenantId: 't_prestige', totalUnits: 30, availableUnits: 10, bookedUnits: 12, soldUnits: 8, priceRange: '₹2Cr - ₹8Cr', status: 'Active', createdAt: '2023-11-01' },
];

// ============= UNITS (COMPREHENSIVE) =============
export const units: Unit[] = [
  // Residential Units
  { id: 'unit_1', unitNo: 'A-101', projectId: 'proj_1', project: 'Green Valley', mainType: 'Residential', bedrooms: 2, bathrooms: 2, carpetArea: 1050, builtUpArea: 1250, floorNumber: 1, towerName: 'Tower A', facing: 'East', hasBalcony: true, parkingCount: 1, price: 8750000, pricePerSqft: 7000, status: 'AVAILABLE', createdAt: '2023-06-01' },
  { id: 'unit_2', unitNo: 'A-102', projectId: 'proj_1', project: 'Green Valley', mainType: 'Residential', bedrooms: 3, bathrooms: 3, carpetArea: 1400, builtUpArea: 1650, floorNumber: 1, towerName: 'Tower A', facing: 'West', hasBalcony: true, parkingCount: 2, price: 11550000, pricePerSqft: 7000, status: 'BOOKED', createdAt: '2023-06-01' },
  { id: 'unit_3', unitNo: 'A-201', projectId: 'proj_1', project: 'Green Valley', mainType: 'Residential', bedrooms: 2, bathrooms: 2, carpetArea: 1050, builtUpArea: 1250, floorNumber: 2, towerName: 'Tower A', facing: 'North', hasBalcony: true, parkingCount: 1, price: 9000000, pricePerSqft: 7200, status: 'SOLD', createdAt: '2023-06-01' },
  { id: 'unit_4', unitNo: 'B-301', projectId: 'proj_2', project: 'Sky Heights', mainType: 'Residential', bedrooms: 3, bathrooms: 3, carpetArea: 1500, builtUpArea: 1800, floorNumber: 3, towerName: 'Tower B', facing: 'South', hasBalcony: true, parkingCount: 2, price: 18000000, pricePerSqft: 10000, status: 'AVAILABLE', createdAt: '2023-08-15' },
  { id: 'unit_5', unitNo: 'B-302', projectId: 'proj_2', project: 'Sky Heights', mainType: 'Residential', bedrooms: 4, bathrooms: 4, carpetArea: 1850, builtUpArea: 2200, floorNumber: 3, towerName: 'Tower B', facing: 'East', hasBalcony: true, parkingCount: 2, price: 22000000, pricePerSqft: 10000, status: 'AVAILABLE', createdAt: '2023-08-15' },
  { id: 'unit_6', unitNo: 'C-501', projectId: 'proj_3', project: 'Palm Residency', mainType: 'Residential', bedrooms: 3, bathrooms: 3, carpetArea: 1700, builtUpArea: 2000, floorNumber: 5, towerName: 'Tower C', facing: 'West', hasBalcony: true, parkingCount: 2, price: 32000000, pricePerSqft: 16000, status: 'BOOKED', createdAt: '2023-03-20' },
  { id: 'unit_7', unitNo: 'A-401', projectId: 'proj_1', project: 'Green Valley', mainType: 'Residential', bedrooms: 4, bathrooms: 4, carpetArea: 2000, builtUpArea: 2400, floorNumber: 4, towerName: 'Tower A', facing: 'East', hasBalcony: true, parkingCount: 2, price: 15000000, pricePerSqft: 6250, status: 'HOLD', createdAt: '2023-06-01' },
  
  // Commercial Units
  { id: 'unit_8', unitNo: 'BP-G01', projectId: 'proj_6', project: 'Business Park One', mainType: 'Commercial', builtUpArea: 1500, carpetArea: 1200, frontage: 25, floorNumber: 0, suitableFor: 'Office', cornerUnit: true, washroomAvailable: true, maintenanceCharges: 15000, price: 12000000, status: 'AVAILABLE', createdAt: '2023-09-01' },
  { id: 'unit_9', unitNo: 'BP-101', projectId: 'proj_6', project: 'Business Park One', mainType: 'Commercial', builtUpArea: 2000, carpetArea: 1600, frontage: 30, floorNumber: 1, suitableFor: 'Office', cornerUnit: false, washroomAvailable: true, maintenanceCharges: 20000, price: 16000000, status: 'BOOKED', createdAt: '2023-09-01' },
  { id: 'unit_10', unitNo: 'RP-G05', projectId: 'proj_7', project: 'Retail Plaza', mainType: 'Commercial', builtUpArea: 800, carpetArea: 650, frontage: 20, floorNumber: 0, suitableFor: 'Shop', cornerUnit: true, washroomAvailable: true, maintenanceCharges: 8000, price: 8000000, status: 'AVAILABLE', createdAt: '2023-07-10' },
  { id: 'unit_11', unitNo: 'RP-102', projectId: 'proj_7', project: 'Retail Plaza', mainType: 'Commercial', builtUpArea: 1200, carpetArea: 950, frontage: 15, floorNumber: 1, suitableFor: 'Showroom', cornerUnit: false, washroomAvailable: true, maintenanceCharges: 12000, price: 15000000, status: 'HOLD', createdAt: '2023-07-10' },
  
  // Industrial Units
  { id: 'unit_12', unitNo: 'IH-W01', projectId: 'proj_8', project: 'Industrial Hub', mainType: 'Industrial', totalArea: 10000, clearHeight: 32, facilityType: 'Warehouse', powerLoad: 100, dockDoors: 4, parkingSpace: 20, roadAccess: '60 ft road', fireNOC: true, price: 25000000, status: 'AVAILABLE', createdAt: '2023-05-20' },
  { id: 'unit_13', unitNo: 'IH-S02', projectId: 'proj_8', project: 'Industrial Hub', mainType: 'Industrial', totalArea: 5000, clearHeight: 24, facilityType: 'Shed', powerLoad: 50, dockDoors: 2, parkingSpace: 10, roadAccess: '40 ft road', fireNOC: true, price: 12000000, status: 'BOOKED', createdAt: '2023-05-20' },
  { id: 'unit_14', unitNo: 'LP-W01', projectId: 'proj_9', project: 'Logistics Park', mainType: 'Industrial', totalArea: 25000, clearHeight: 40, facilityType: 'Warehouse', powerLoad: 200, dockDoors: 8, parkingSpace: 50, roadAccess: '80 ft road', fireNOC: true, price: 65000000, status: 'AVAILABLE', createdAt: '2023-11-01' },
  { id: 'unit_15', unitNo: 'LP-CS01', projectId: 'proj_9', project: 'Logistics Park', mainType: 'Industrial', totalArea: 8000, clearHeight: 28, facilityType: 'Cold Storage', powerLoad: 150, dockDoors: 3, parkingSpace: 15, roadAccess: '60 ft road', fireNOC: true, price: 35000000, status: 'SOLD', createdAt: '2023-11-01' },
];

// ============= LEADS =============
export interface Activity {
  id: string;
  type: 'call' | 'meeting' | 'note' | 'email';
  notes: string;
  createdAt: string;
  createdBy?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'NEW' | 'CONTACTED' | 'FOLLOWUP' | 'QUALIFIED' | 'NEGOTIATION' | 'CONVERTED' | 'LOST';
  source: string;
  projectId?: string;
  project?: string;
  budget: string;
  priority?: 'High' | 'Medium' | 'Low';
  assignedTo?: string;
  assignedToId?: string;
  tenantId: string;
  notes?: string;
  activities?: Activity[];
  createdAt: string;
  updatedAt?: string;
}

export const leads: Lead[] = [
  { id: 'lead_1', name: 'Rajesh Kumar', email: 'rajesh@email.com', phone: '+91 98765 43210', status: 'NEW', source: 'Website', project: 'Green Valley', projectId: 'proj_1', budget: '₹85L - ₹1.2Cr', assignedTo: 'Rahul Verma', assignedToId: 'u_agent_1', tenantId: 't_soundarya', createdAt: '2024-01-15' },
  { id: 'lead_2', name: 'Anita Sharma', email: 'anita@email.com', phone: '+91 87654 32109', status: 'CONTACTED', source: 'Facebook', project: 'Sky Heights', projectId: 'proj_2', budget: '₹1.5Cr - ₹2Cr', assignedTo: 'Rahul Verma', assignedToId: 'u_agent_1', tenantId: 't_soundarya', createdAt: '2024-01-14' },
  { id: 'lead_3', name: 'Vikram Mehta', email: 'vikram@email.com', phone: '+91 76543 21098', status: 'QUALIFIED', source: 'Referral', project: 'Palm Residency', projectId: 'proj_3', budget: '₹2Cr - ₹3Cr', assignedTo: 'Neha Gupta', assignedToId: 'u_agent_2', tenantId: 't_prestige', createdAt: '2024-01-13' },
  { id: 'lead_4', name: 'Priya Patel', email: 'priya@email.com', phone: '+91 65432 10987', status: 'FOLLOWUP', source: 'Walk-in', project: 'Green Valley', projectId: 'proj_1', budget: '₹90L - ₹1.3Cr', assignedTo: 'Amit Singh', assignedToId: 'u_agent_3', tenantId: 't_soundarya', createdAt: '2024-01-12' },
  { id: 'lead_5', name: 'Amit Joshi', email: 'amit@email.com', phone: '+91 54321 09876', status: 'NEGOTIATION', source: 'Google Ads', project: 'Sky Heights', projectId: 'proj_2', budget: '₹1.2Cr - ₹1.8Cr', assignedTo: 'Rahul Verma', assignedToId: 'u_agent_1', tenantId: 't_soundarya', createdAt: '2024-01-11' },
  { id: 'lead_6', name: 'Sneha Reddy', email: 'sneha@email.com', phone: '+91 43210 98765', status: 'CONVERTED', source: 'Website', project: 'Palm Residency', projectId: 'proj_3', budget: '₹2.5Cr - ₹4Cr', assignedTo: 'Neha Gupta', assignedToId: 'u_agent_2', tenantId: 't_prestige', createdAt: '2024-01-10' },
  { id: 'lead_7', name: 'Arjun Nair', email: 'arjun@email.com', phone: '+91 32109 87654', status: 'LOST', source: 'Facebook', project: 'Green Valley', projectId: 'proj_1', budget: '₹80L - ₹1.1Cr', assignedTo: 'Amit Singh', assignedToId: 'u_agent_3', tenantId: 't_soundarya', createdAt: '2024-01-09' },
  // Unit Interest Leads
  { id: 'lead_8', name: 'Kavita Menon', email: 'kavita@email.com', phone: '+91 98765 12345', status: 'NEW', source: 'Unit Interest', project: 'Green Valley', projectId: 'proj_1', budget: '₹85L - ₹1.2Cr', assignedTo: 'Rahul Verma', assignedToId: 'u_agent_1', tenantId: 't_soundarya', createdAt: '2024-01-16', notes: 'Interested in unit A-301, 3BHK, requested site visit this weekend' },
  { id: 'lead_9', name: 'Rohit Sharma', email: 'rohit@email.com', phone: '+91 87654 23456', status: 'CONTACTED', source: 'Unit Interest', project: 'Sky Heights', projectId: 'proj_2', budget: '₹1.5Cr - ₹2Cr', assignedTo: 'Neha Gupta', assignedToId: 'u_agent_2', tenantId: 't_soundarya', createdAt: '2024-01-15', notes: 'Expressed interest in unit B-201, 2BHK, looking for EMI options' },
  { id: 'lead_10', name: 'Divya Pillai', email: 'divya@email.com', phone: '+91 76543 34567', status: 'FOLLOWUP', source: 'Unit Interest', project: 'Palm Residency', projectId: 'proj_3', budget: '₹2Cr - ₹3Cr', assignedTo: 'Amit Singh', assignedToId: 'u_agent_3', tenantId: 't_prestige', createdAt: '2024-01-14', notes: 'Interested in unit C-501, 4BHK, requested brochure download' },
  { id: 'lead_11', name: 'Vikram Malhotra', email: 'vikram.m@email.com', phone: '+91 65432 45678', status: 'QUALIFIED', source: 'Unit Interest', project: 'Green Valley', projectId: 'proj_1', budget: '₹90L - ₹1.3Cr', assignedTo: 'Rahul Verma', assignedToId: 'u_agent_1', tenantId: 't_soundarya', createdAt: '2024-01-13', notes: 'Interested in unit A-102, 2BHK, ready for site visit tomorrow' },
  { id: 'lead_8', name: 'Divya Pillai', email: 'divya@email.com', phone: '+91 21098 76543', status: 'CONTACTED', source: 'Referral', project: 'Green Valley', projectId: 'proj_1', budget: '₹1Cr - ₹1.3Cr', tenantId: 't_soundarya', createdAt: '2024-01-08' },
];

// ============= AGENTS =============
export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  totalLeads: number;
  conversions: number;
  revenue: string;
  status: 'Active' | 'Inactive';
  tenantId: string;
  managerId?: string;
  createdAt: string;
}

export const agents: Agent[] = [
  { id: 'u_agent_1', name: 'Rahul Verma', email: 'rahul@soundarya.test', phone: '+91 98765 33333', role: 'Senior Agent', totalLeads: 45, conversions: 12, revenue: '₹8.5Cr', status: 'Active', tenantId: 't_soundarya', managerId: 'u_mgr_1', createdAt: '2023-01-15' },
  { id: 'u_agent_2', name: 'Neha Gupta', email: 'neha@prestige.test', phone: '+91 98765 44444', role: 'Agent', totalLeads: 38, conversions: 8, revenue: '₹5.2Cr', status: 'Active', tenantId: 't_prestige', managerId: 'u_mgr_2', createdAt: '2023-03-20' },
  { id: 'u_agent_3', name: 'Suresh Kumar', email: 'suresh@soundarya.test', phone: '+91 98765 55555', role: 'Agent', totalLeads: 32, conversions: 6, revenue: '₹4.1Cr', status: 'Active', tenantId: 't_soundarya', managerId: 'u_mgr_1', createdAt: '2023-05-10' },
  { id: 'u_agent_4', name: 'Pooja Sharma', email: 'pooja@prestige.test', phone: '+91 98765 66666', role: 'Junior Agent', totalLeads: 20, conversions: 3, revenue: '₹1.8Cr', status: 'Inactive', tenantId: 't_prestige', managerId: 'u_mgr_2', createdAt: '2023-08-01' },
];

// ============= PAYMENTS =============
export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  unitId: string;
  unitNo: string;
  bookingId?: string;
  amount: number;
  type: 'Token' | 'Booking' | 'Down Payment' | 'Milestone' | 'Final' | 'Final Payment';
  method: 'Bank Transfer' | 'Cash' | 'Cheque' | 'Online' | 'UPI' | 'RTGS' | 'Card' | 'Net Banking';
  date: string;
  status: 'Pending' | 'Received' | 'Overdue' | 'Refunded';
  receiptNo?: string;
  notes?: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
  tenantId: string;
  createdAt: string;
}

export const payments: Payment[] = [
  { id: 'pay_1', customerId: 'u_cust_1', customerName: 'Arjun Nair', unitId: 'unit_4', unitNo: 'B-301', amount: 4500000, type: 'Booking', method: 'Bank Transfer', date: '2024-01-15', status: 'Received', receiptNo: 'RCP-2024-001', tenantId: 't_soundarya', createdAt: '2024-01-15' },
  { id: 'pay_2', customerId: 'u_cust_2', customerName: 'Sneha Reddy', unitId: 'unit_2', unitNo: 'A-102', amount: 2500000, type: 'Down Payment', method: 'Online', date: '2024-01-14', status: 'Pending', tenantId: 't_soundarya', createdAt: '2024-01-14' },
  { id: 'pay_3', customerId: 'u_cust_3', customerName: 'Vikram Mehta', unitId: 'unit_6', unitNo: 'C-501', amount: 8000000, type: 'Milestone', method: 'Bank Transfer', date: '2024-01-12', status: 'Received', receiptNo: 'RCP-2024-002', tenantId: 't_prestige', createdAt: '2024-01-12' },
  { id: 'pay_4', customerId: 'u_cust_4', customerName: 'Divya Pillai', unitId: 'unit_3', unitNo: 'A-201', amount: 2000000, type: 'Booking', method: 'Cheque', date: '2024-01-10', status: 'Overdue', tenantId: 't_soundarya', createdAt: '2024-01-10' },
  { id: 'pay_5', customerId: 'u_cust_5', customerName: 'Rajesh Kumar', unitId: 'unit_8', unitNo: 'D-402', amount: 12000000, type: 'Final Payment', method: 'RTGS', date: '2024-01-08', status: 'Received', receiptNo: 'RCP-2024-003', tenantId: 't_prestige', createdAt: '2024-01-08' },
  { id: 'pay_6', customerId: 'u_cust_6', customerName: 'Anita Sharma', unitId: 'unit_1', unitNo: 'A-101', amount: 3500000, type: 'Token', method: 'UPI', date: '2024-01-06', status: 'Received', receiptNo: 'RCP-2024-004', tenantId: 't_soundarya', createdAt: '2024-01-06' },
  { id: 'pay_7', customerId: 'u_cust_7', customerName: 'Michael Chen', unitId: 'unit_5', unitNo: 'B-201', amount: 6500000, type: 'Down Payment', method: 'Net Banking', date: '2024-01-05', status: 'Pending', tenantId: 't_prestige', createdAt: '2024-01-05' },
  { id: 'pay_8', customerId: 'u_cust_8', customerName: 'Priya Nair', unitId: 'unit_9', unitNo: 'E-301', amount: 9000000, type: 'Milestone', method: 'Bank Transfer', date: '2024-01-04', status: 'Received', receiptNo: 'RCP-2024-005', tenantId: 't_soundarya', createdAt: '2024-01-04' },
  { id: 'pay_9', customerId: 'u_cust_9', customerName: 'Amit Patel', unitId: 'unit_7', unitNo: 'C-301', amount: 5500000, type: 'Booking', method: 'Card', date: '2024-01-03', status: 'Pending', tenantId: 't_prestige', createdAt: '2024-01-03' },
  { id: 'pay_10', customerId: 'u_cust_10', customerName: 'Kavita Reddy', unitId: 'unit_10', unitNo: 'F-201', amount: 15000000, type: 'Final Payment', method: 'RTGS', date: '2024-01-02', status: 'Received', receiptNo: 'RCP-2024-006', tenantId: 't_soundarya', createdAt: '2024-01-02' },
  { id: 'pay_11', customerId: 'u_cust_11', customerName: 'Sanjay Gupta', unitId: 'unit_11', unitNo: 'G-101', amount: 2800000, type: 'Token', method: 'Cash', date: '2024-01-01', status: 'Overdue', tenantId: 't_prestige', createdAt: '2024-01-01' },
  { id: 'pay_12', customerId: 'u_cust_12', customerName: 'Meera Joshi', unitId: 'unit_12', unitNo: 'H-402', amount: 7200000, type: 'Down Payment', method: 'Bank Transfer', date: '2023-12-30', status: 'Received', receiptNo: 'RCP-2023-025', tenantId: 't_soundarya', createdAt: '2023-12-30' },
  { id: 'pay_13', customerId: 'u_cust_13', customerName: 'David Wilson', unitId: 'unit_13', unitNo: 'I-301', amount: 11000000, type: 'Milestone', method: 'Online', date: '2023-12-28', status: 'Pending', tenantId: 't_prestige', createdAt: '2023-12-28' },
  { id: 'pay_14', customerId: 'u_cust_14', customerName: 'Lakshmi Narayan', unitId: 'unit_14', unitNo: 'J-201', amount: 4800000, type: 'Booking', method: 'Cheque', date: '2023-12-25', status: 'Received', receiptNo: 'RCP-2023-024', tenantId: 't_soundarya', createdAt: '2023-12-25' },
  { id: 'pay_15', customerId: 'u_cust_15', customerName: 'Farah Khan', unitId: 'unit_15', unitNo: 'K-101', amount: 13500000, type: 'Final Payment', method: 'RTGS', date: '2023-12-22', status: 'Received', receiptNo: 'RCP-2023-023', tenantId: 't_prestige', createdAt: '2023-12-22' },
];

// ============= BOOKING STATUS PIPELINE =============
export type BookingStatus = 
  | 'HOLD_REQUESTED'
  | 'HOLD_CONFIRMED'
  | 'BOOKING_PENDING_APPROVAL'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'BOOKED'
  | 'CANCELLED'
  | 'REFUNDED';

export const BOOKING_STEPS = [
  { key: 'HOLD_REQUESTED', label: 'Hold Requested', description: 'Customer initiated hold request' },
  { key: 'HOLD_CONFIRMED', label: 'Hold Confirmed', description: 'System confirmed the hold' },
  { key: 'BOOKING_PENDING_APPROVAL', label: 'Pending Approval', description: 'Awaiting manager approval' },
  { key: 'BOOKING_CONFIRMED', label: 'Booking Confirmed', description: 'Manager approved booking' },
  { key: 'PAYMENT_PENDING', label: 'Payment Pending', description: 'Awaiting payment from admin' },
  { key: 'BOOKED', label: 'Booked', description: 'Booking completed successfully' },
] as const;

// ============= BOOKINGS =============
export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  unitId: string;
  unitNo: string;
  projectId: string;
  projectName: string;
  tokenAmount: number;
  totalPrice: number;
  status: BookingStatus;
  holdExpiresAt?: string;
  bookedAt?: string;
  tokenPaymentId?: string;
  tokenPaidAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundPaymentId?: string;
  agentId?: string;
  agentName?: string;
  managerId?: string;
  managerName?: string;
  managerApprovedAt?: string;
  managerNotes?: string;
  paymentId?: string;
  paymentRecordedAt?: string;
  paymentMode?: 'UPI' | 'Cash' | 'Cheque' | 'RTGS' | 'Bank Transfer' | 'Card' | 'Net Banking' | 'Online';
  paymentRemarks?: string;
  tenantId: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============= COMMUNICATION LOGS =============
export interface CommunicationLog {
  id: string;
  bookingId: string;
  type: 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Note';
  message: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export const communicationLogs: CommunicationLog[] = [
  { id: 'comm_1', bookingId: 'book_1', type: 'Call', message: 'Discussed payment schedule with customer. Agreed on 3 installments.', createdBy: 'u_agent_1', createdByName: 'Rahul Verma', createdAt: '2024-01-12T10:30:00Z' },
  { id: 'comm_2', bookingId: 'book_1', type: 'WhatsApp', message: 'Sent brochure and floor plan to customer.', createdBy: 'u_agent_1', createdByName: 'Rahul Verma', createdAt: '2024-01-11T15:45:00Z' },
  { id: 'comm_3', bookingId: 'book_2', type: 'Meeting', message: 'Site visit completed. Customer very interested.', createdBy: 'u_agent_1', createdByName: 'Rahul Verma', createdAt: '2024-01-19T11:00:00Z' },
  { id: 'comm_4', bookingId: 'book_3', type: 'Call', message: 'Follow-up call. Customer confirmed for booking.', createdBy: 'u_agent_2', createdByName: 'Neha Gupta', createdAt: '2024-01-10T09:15:00Z' },
];

export const bookings: Booking[] = [
  { id: 'book_1', customerId: 'u_cust_1', customerName: 'Arjun Nair', customerEmail: 'arjun@email.com', customerPhone: '+91 54321 09876', unitId: 'unit_4', unitNo: 'B-301', projectId: 'proj_2', projectName: 'Sky Heights', tokenAmount: 500000, totalPrice: 18000000, status: 'BOOKED', bookedAt: '2024-01-15', agentId: 'u_agent_1', agentName: 'Rahul Verma', managerId: 'u_mgr_1', managerName: 'Deepak Patel', paymentMode: 'Bank Transfer', tenantId: 't_soundarya', createdAt: '2024-01-10' },
  { id: 'book_2', customerId: 'u_cust_2', customerName: 'Sneha Reddy', customerEmail: 'sneha@email.com', customerPhone: '+91 65432 10987', unitId: 'unit_2', unitNo: 'A-102', projectId: 'proj_1', projectName: 'Green Valley', tokenAmount: 300000, totalPrice: 11550000, status: 'BOOKING_PENDING_APPROVAL', holdExpiresAt: '2024-02-01', agentId: 'u_agent_1', agentName: 'Rahul Verma', tenantId: 't_soundarya', createdAt: '2024-01-20' },
  { id: 'book_3', customerId: 'u_cust_3', customerName: 'Vikram Mehta', customerEmail: 'vikram@email.com', customerPhone: '+91 76543 21098', unitId: 'unit_6', unitNo: 'C-501', projectId: 'proj_3', projectName: 'Palm Residency', tokenAmount: 800000, totalPrice: 32000000, status: 'BOOKED', bookedAt: '2024-01-12', agentId: 'u_agent_2', agentName: 'Neha Gupta', managerId: 'u_mgr_2', managerName: 'Priya Singh', paymentMode: 'RTGS', tenantId: 't_prestige', createdAt: '2024-01-05' },
  { id: 'book_4', customerId: 'u_cust_4', customerName: 'Rajesh Kumar', customerEmail: 'rajesh@email.com', customerPhone: '+91 98765 43210', unitId: 'unit_5', unitNo: 'B-302', projectId: 'proj_2', projectName: 'Sky Heights', tokenAmount: 600000, totalPrice: 22000000, status: 'PAYMENT_PENDING', holdExpiresAt: '2024-02-05', agentId: 'u_agent_1', agentName: 'Rahul Verma', managerId: 'u_mgr_1', managerName: 'Deepak Patel', managerApprovedAt: '2024-01-25', tenantId: 't_soundarya', createdAt: '2024-01-22' },
  { id: 'book_5', customerId: 'u_cust_5', customerName: 'Meera Joshi', customerEmail: 'meera@email.com', customerPhone: '+91 87654 32109', unitId: 'unit_10', unitNo: 'RP-G05', projectId: 'proj_7', projectName: 'Retail Plaza', tokenAmount: 200000, totalPrice: 8000000, status: 'HOLD_REQUESTED', holdExpiresAt: '2024-02-10', tenantId: 't_prestige', notes: 'Interested in retail shop for boutique', createdAt: '2024-01-28' },
  { id: 'book_6', customerId: 'u_cust_6', customerName: 'Karthik Iyer', customerEmail: 'karthik@email.com', customerPhone: '+91 76543 21098', unitId: 'unit_12', unitNo: 'IH-W01', projectId: 'proj_8', projectName: 'Industrial Hub', tokenAmount: 1000000, totalPrice: 25000000, status: 'BOOKING_CONFIRMED', holdExpiresAt: '2024-02-08', agentId: 'u_agent_3', agentName: 'Suresh Kumar', managerId: 'u_mgr_1', managerName: 'Deepak Patel', managerApprovedAt: '2024-01-27', tenantId: 't_soundarya', createdAt: '2024-01-24' },
];

// ============= REVIEWS =============
export interface Review {
  id: string;
  type: 'property' | 'agent';
  targetId: string;
  targetName: string;
  customerId: string;
  agentId?: string;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  tenantId: string;
  createdAt: string;
}

export const reviews: Review[] = [
  { id: 'rev_1', type: 'property', targetId: 'proj_1', targetName: 'Green Valley', customerId: 'u_cust_1', customerName: 'Arjun Nair', rating: 5, comment: 'Excellent project with great amenities. Very satisfied with the purchase.', status: 'approved', tenantId: 't_soundarya', createdAt: '2024-01-18' },
  { id: 'rev_2', type: 'agent', targetId: 'u_agent_1', targetName: 'Rahul Verma', customerId: 'u_cust_1', customerName: 'Arjun Nair', rating: 5, comment: 'Very helpful and professional. Made the entire process smooth.', status: 'approved', tenantId: 't_soundarya', createdAt: '2024-01-18' },
  { id: 'rev_3', type: 'property', targetId: 'proj_2', targetName: 'Sky Heights', customerId: 'u_cust_2', customerName: 'Sneha Reddy', rating: 4, comment: 'Good location and construction quality. Slightly delayed possession.', status: 'approved', tenantId: 't_soundarya', createdAt: '2024-01-16' },
  { id: 'rev_4', type: 'property', targetId: 'proj_3', targetName: 'Palm Residency', customerId: 'u_cust_3', customerName: 'Vikram Mehta', rating: 5, comment: 'Premium project with excellent sea view. Worth the investment.', status: 'pending', tenantId: 't_prestige', createdAt: '2024-01-14' },
  { id: 'rev_5', type: 'agent', targetId: 'u_agent_2', targetName: 'Neha Gupta', customerId: 'u_cust_4', customerName: 'Divya Pillai', rating: 4, comment: 'Knowledgeable agent who helped us find the perfect property. Good communication.', status: 'approved', tenantId: 't_prestige', createdAt: '2024-01-12' },
  { id: 'rev_6', type: 'property', targetId: 'proj_4', targetName: 'Ocean View', customerId: 'u_cust_5', customerName: 'Rajesh Kumar', rating: 3, comment: 'Decent property but maintenance could be better. Location is good though.', status: 'approved', tenantId: 't_soundarya', createdAt: '2024-01-10' },
  { id: 'rev_7', type: 'agent', targetId: 'u_mgr_1', targetName: 'Priya Singh', customerId: 'u_cust_6', customerName: 'Anita Sharma', rating: 5, comment: 'Exceptional service from the manager. Resolved all our queries promptly.', status: 'approved', tenantId: 't_soundarya', createdAt: '2024-01-08' },
  { id: 'rev_8', type: 'property', targetId: 'proj_1', targetName: 'Green Valley', customerId: 'u_cust_7', customerName: 'Michael Chen', rating: 4, comment: 'Nice apartments with good ventilation. Clubhouse facilities are excellent.', status: 'pending', tenantId: 't_prestige', createdAt: '2024-01-06' },
  { id: 'rev_9', type: 'agent', targetId: 'u_agent_3', targetName: 'Amit Patel', customerId: 'u_cust_8', customerName: 'Priya Nair', rating: 2, comment: 'Not very responsive. Had to follow up multiple times for information.', status: 'rejected', tenantId: 't_soundarya', createdAt: '2024-01-04' },
  { id: 'rev_10', type: 'property', targetId: 'proj_2', targetName: 'Sky Heights', customerId: 'u_cust_9', customerName: 'Amit Patel', rating: 5, comment: 'Luxury living at its best! Amazing views and top-notch facilities.', status: 'approved', tenantId: 't_prestige', createdAt: '2024-01-02' },
  { id: 'rev_11', type: 'agent', targetId: 'u_agent_4', targetName: 'Pooja Sharma', customerId: 'u_cust_10', customerName: 'Kavita Reddy', rating: 3, comment: 'Average service. Could be more proactive in providing updates.', status: 'pending', tenantId: 't_soundarya', createdAt: '2023-12-30' },
  { id: 'rev_12', type: 'property', targetId: 'proj_3', targetName: 'Palm Residency', customerId: 'u_cust_11', customerName: 'Sanjay Gupta', rating: 4, comment: 'Beautiful project with great landscaping. Security is excellent.', status: 'approved', tenantId: 't_prestige', createdAt: '2023-12-28' },
];

// ============= ENQUIRIES =============
export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectId?: string;
  projectName?: string;
  unitId?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'FOLLOWUP' | 'CONVERTED' | 'LOST';
  assignedTo?: string;
  assignedToId?: string;
  tenantId: string;
  communicationLog: CommunicationEntry[];
  createdAt: string;
}

export interface CommunicationEntry {
  id: string;
  type: 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Note';
  content: string;
  createdBy: string;
  createdAt: string;
}

export const enquiries: Enquiry[] = [
  { id: 'enq_1', name: 'Pradeep Singh', email: 'pradeep@email.com', phone: '+91 99887 76655', projectId: 'proj_1', projectName: 'Green Valley', message: 'Looking for 3BHK with east facing', status: 'NEW', tenantId: 't_soundarya', communicationLog: [], createdAt: '2024-01-20' },
  { id: 'enq_2', name: 'Lakshmi Devi', email: 'lakshmi@email.com', phone: '+91 88776 65544', projectId: 'proj_6', projectName: 'Business Park One', message: 'Need office space for IT company', status: 'CONTACTED', assignedTo: 'Rahul Verma', assignedToId: 'u_agent_1', tenantId: 't_soundarya', communicationLog: [
    { id: 'comm_1', type: 'Call', content: 'Called and explained available options', createdBy: 'Rahul Verma', createdAt: '2024-01-19T10:30:00' }
  ], createdAt: '2024-01-18' },
  { id: 'enq_3', name: 'Mohan Rao', email: 'mohan@email.com', phone: '+91 77665 54433', projectId: 'proj_8', projectName: 'Industrial Hub', message: 'Looking for warehouse with cold storage', status: 'FOLLOWUP', assignedTo: 'Rahul Verma', assignedToId: 'u_agent_1', tenantId: 't_soundarya', communicationLog: [
    { id: 'comm_2', type: 'Meeting', content: 'Site visit completed', createdBy: 'Rahul Verma', createdAt: '2024-01-17T15:00:00' },
    { id: 'comm_3', type: 'WhatsApp', content: 'Sent brochure and price list', createdBy: 'Rahul Verma', createdAt: '2024-01-17T16:00:00' }
  ], createdAt: '2024-01-15' },
];

// ============= TENANTS =============
export interface Tenant {
  id: string;
  name: string;
  email: string;
  domain?: string;
  projects: number;
  users: number;
  subscription: 'Starter' | 'Business' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'Trial';
  revenue: string;
  createdAt: string;
}

export const tenants: Tenant[] = [
  { id: 't_soundarya', name: 'Soundarya Group', email: 'admin@soundarya.com', domain: 'soundarya.com', projects: 5, users: 25, subscription: 'Enterprise', status: 'Active', revenue: '₹125Cr', createdAt: '2023-01-01' },
  { id: 't_prestige', name: 'Prestige Group', email: 'admin@prestige.com', domain: 'prestige.com', projects: 4, users: 20, subscription: 'Business', status: 'Active', revenue: '₹89Cr', createdAt: '2023-02-15' },
  { id: 't_dlf', name: 'DLF Limited', email: 'admin@dlf.com', domain: 'dlf.com', projects: 15, users: 60, subscription: 'Enterprise', status: 'Active', revenue: '₹210Cr', createdAt: '2023-03-01' },
  { id: 't_sobha', name: 'Sobha Developers', email: 'admin@sobha.com', domain: 'sobha.com', projects: 6, users: 25, subscription: 'Business', status: 'Suspended', revenue: '₹45Cr', createdAt: '2023-04-10' },
];

// ============= STAFF =============
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Manager' | 'Agent' | 'Accountant' | 'Support' | 'HR';
  department: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  tenantId: string;
  attendance?: { date: string; status: 'Present' | 'Absent' | 'Half Day' | 'Leave' }[];
  createdAt: string;
}

export const staff: Staff[] = [
  { id: 'staff_1', name: 'Priya Singh', email: 'priya@soundarya.test', phone: '+91 98765 11111', role: 'Manager', department: 'Sales', salary: 150000, joiningDate: '2022-06-01', status: 'Active', tenantId: 't_soundarya', createdAt: '2022-06-01' },
  { id: 'staff_2', name: 'Rahul Verma', email: 'rahul@soundarya.test', phone: '+91 98765 33333', role: 'Agent', department: 'Sales', salary: 75000, joiningDate: '2023-01-15', status: 'Active', tenantId: 't_soundarya', createdAt: '2023-01-15' },
  { id: 'staff_3', name: 'Ananya Desai', email: 'ananya@soundarya.test', phone: '+91 98765 77777', role: 'Accountant', department: 'Finance', salary: 85000, joiningDate: '2022-08-01', status: 'Active', tenantId: 't_soundarya', createdAt: '2022-08-01' },
  { id: 'staff_4', name: 'Ravi Kumar', email: 'ravi@soundarya.test', phone: '+91 98765 88888', role: 'Support', department: 'Operations', salary: 45000, joiningDate: '2023-03-01', status: 'Active', tenantId: 't_soundarya', createdAt: '2023-03-01' },
];

// ============= AUDIT LOGS =============
export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  ipAddress?: string;
  tenantId?: string;
  createdAt: string;
}

export const auditLogs: AuditLog[] = [
  { id: 'audit_1', action: 'CREATE', entity: 'Booking', entityId: 'book_1', userId: 'u_agent_1', userName: 'Rahul Verma', details: 'Created booking for unit B-301', tenantId: 't_soundarya', createdAt: '2024-01-15T10:30:00' },
  { id: 'audit_2', action: 'UPDATE', entity: 'Lead', entityId: 'lead_1', userId: 'u_agent_1', userName: 'Rahul Verma', details: 'Updated lead status to CONTACTED', tenantId: 't_soundarya', createdAt: '2024-01-15T11:00:00' },
  { id: 'audit_3', action: 'CREATE', entity: 'Payment', entityId: 'pay_1', userId: 'u_admin_1', userName: 'Admin - Soundarya Group', details: 'Recorded payment of ₹45L', tenantId: 't_soundarya', createdAt: '2024-01-15T14:00:00' },
  { id: 'audit_4', action: 'LOGIN', entity: 'User', entityId: 'u_admin_1', userId: 'u_admin_1', userName: 'Admin - Soundarya Group', details: 'User logged in', ipAddress: '192.168.1.1', createdAt: '2024-01-16T09:00:00' },
];

// ============= DASHBOARD STATS =============
export const dashboardStats = {
  totalLeads: 1250,
  newLeadsThisMonth: 145,
  conversionRate: 12.5,
  totalRevenue: '₹485Cr',
  revenueGrowth: 18.5,
  activeProjects: 8,
  totalUnits: 1250,
  unitsSold: 680,
  unitsBooked: 320,
  pendingPayments: '₹12.5Cr',
  overduePayments: '₹3.2Cr',
};

export const monthlyRevenue = [
  { month: 'Jan', revenue: 45, target: 50 },
  { month: 'Feb', revenue: 52, target: 50 },
  { month: 'Mar', revenue: 48, target: 55 },
  { month: 'Apr', revenue: 61, target: 55 },
  { month: 'May', revenue: 55, target: 60 },
  { month: 'Jun', revenue: 67, target: 60 },
  { month: 'Jul', revenue: 72, target: 65 },
  { month: 'Aug', revenue: 69, target: 70 },
  { month: 'Sep', revenue: 78, target: 70 },
  { month: 'Oct', revenue: 82, target: 75 },
  { month: 'Nov', revenue: 88, target: 80 },
  { month: 'Dec', revenue: 95, target: 85 },
];

export const leadFunnel = [
  { stage: 'New Leads', count: 500, color: 'hsl(217, 91%, 60%)' },
  { stage: 'Contacted', count: 350, color: 'hsl(199, 89%, 48%)' },
  { stage: 'Qualified', count: 200, color: 'hsl(38, 92%, 50%)' },
  { stage: 'Negotiation', count: 100, color: 'hsl(262, 83%, 58%)' },
  { stage: 'Won', count: 62, color: 'hsl(142, 76%, 36%)' },
];

export const projectPerformance = [
  { name: 'Green Valley', bookings: 120, revenue: 145 },
  { name: 'Sky Heights', bookings: 80, revenue: 128 },
  { name: 'Palm Residency', bookings: 50, revenue: 160 },
  { name: 'Ocean View', bookings: 60, revenue: 108 },
  { name: 'Business Park One', bookings: 40, revenue: 48 },
];

export const activities = [
  { id: 1, type: 'call', description: 'Called Rajesh Kumar regarding site visit', agent: 'Rahul Verma', time: '2 hours ago' },
  { id: 2, type: 'meeting', description: 'Site visit completed with Anita Sharma', agent: 'Rahul Verma', time: '4 hours ago' },
  { id: 3, type: 'note', description: 'Customer interested in 3 BHK units only', agent: 'Neha Gupta', time: '5 hours ago' },
  { id: 4, type: 'email', description: 'Sent brochure to Vikram Mehta', agent: 'Neha Gupta', time: '6 hours ago' },
  { id: 5, type: 'booking', description: 'New booking received for A-102', agent: 'Rahul Verma', time: '1 day ago' },
];
