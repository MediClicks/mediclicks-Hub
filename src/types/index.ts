
import type { Timestamp } from 'firebase/firestore';

export interface Service {
  id: string;
  name: string;
  price: number;
}

export type PaymentModality = 'Único' | 'Mensual' | 'Trimestral' | 'Anual';

export interface ContractedServiceClient {
  id: string; // For react-hook-form key, not Firestore ID
  serviceName: string;
  price: number;
  paymentModality: PaymentModality;
}

export interface SocialMediaAccountClient {
  id: string; // For react-hook-form key, not Firestore ID
  platform: string;
  username: string;
  password?: string;
}

export interface Client {
  id: string; // Firestore document ID
  name: string;
  email: string;
  avatarUrl?: string; // New field for avatar URL
  contractStartDate: Date;
  profileSummary?: string;

  clinica?: string;
  telefono?: string;
  pagado?: boolean;
  
  dominioWeb?: string;
  tipoServicioWeb?: string;
  vencimientoWeb?: Date | null;

  contractedServices?: ContractedServiceClient[];
  socialMediaAccounts?: SocialMediaAccountClient[];
  
  // Deprecated fields, ensure they are not actively used or are handled for migration if needed
  // nextBillingDate?: Date; 
  // serviciosActivosGeneral?: string;
  // notas?: string;
  // plataformasRedesSociales?: string;
  // detallesRedesSociales?: string;
  // serviciosContratadosAdicionales?: string;
  // configuracionRedesSociales?: string;
  credencialesRedesUsuario?: string; // Kept for potential data from old clients
  credencialesRedesContrasena?: string; // Kept for potential data from old clients


  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';
export type TaskPriority = 'Baja' | 'Media' | 'Alta';

export interface Task {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  assignedTo: string;
  clientId?: string;
  clientName?: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;

  alertDate?: Date | Timestamp | null;
  alertFired?: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export type InvoiceStatus = 'Pagada' | 'No Pagada' | 'Vencida';

export interface InvoiceItem {
  id: string; 
  description: string;
  quantity: number;
  unitPrice: number;
}
export interface Invoice {
  id: string; 
  clientId: string; 
  clientName?: string; 
  issuedDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  totalAmount: number; 

  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Publication {
  id: string;
  clientId: string;
  clientName: string;
  platform: string; 
  content: string;
  publicationDate: Date;
  status: 'Programada' | 'Publicada' | 'Borrador';
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Helper type for converting Firestore Timestamps in fetched data
export type WithConvertedDates<T> = {
  [K in keyof T]: T[K] extends Timestamp ? Date :
    T[K] extends Timestamp | null ? Date | null :
    T[K] extends Timestamp | undefined ? Date | undefined :
    T[K] extends (Timestamp | undefined)[] ? (Date | undefined)[] :
    T[K] extends Timestamp[] ? Date[] :
    T[K];
};


export interface AgencyDetails {
  agencyName: string;
  address: string;
  taxId: string;
  contactPhone?: string;
  contactEmail: string;
  website?: string;
  updatedAt?: Date | Timestamp;
}

export interface ServiceDefinition {
  id: string; // Firestore document ID
  name: string;
  price: number;
  paymentModality: PaymentModality;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
