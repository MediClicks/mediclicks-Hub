
import type { Timestamp } from 'firebase/firestore';

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Client {
  id: string; // Firestore document ID
  name: string;
  email: string;
  avatarUrl?: string;
  services: Service[]; // This might need to be simplified if storing complex objects, or stored as subcollection
  contractStartDate: Date;
  nextBillingDate: Date;
  profileSummary: string;

  clinica?: string;
  telefono?: string;
  serviciosActivosGeneral?: string;
  pagado?: boolean;
  notas?: string;
  dominioWeb?: string;
  tipoServicioWeb?: string;
  vencimientoWeb?: Date;
  plataformasRedesSociales?: string;
  detallesRedesSociales?: string;
  serviciosContratadosAdicionales?: string;
  configuracionRedesSociales?: string;
  credencialesRedesUsuario?: string;
  credencialesRedesContrasena?: string;

  createdAt?: Date | Timestamp; // Firestore serverTimestamp will be a Timestamp, convert to Date on fetch
  updatedAt?: Date | Timestamp; // Firestore serverTimestamp will be a Timestamp, convert to Date on fetch
}

export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';
export type TaskPriority = 'Baja' | 'Media' | 'Alta';

export interface Task {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  assignedTo: string;
  clientId?: string;
  clientName?: string; // Denormalized, useful if client is deleted. Or fetch client info.
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;

  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export type InvoiceStatus = 'Pagada' | 'No Pagada' | 'Vencida';

export interface InvoiceItem {
  id: string; // for unique key in lists, or can be array index if not needing db id
  description: string;
  quantity: number;
  unitPrice: number;
}
export interface Invoice {
  id: string; // Firestore document ID
  clientId: string; // Reference to client document ID
  clientName?: string; // Denormalized for display, consider fetching if needed
  issuedDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  // totalAmount will be calculated from items, or stored if preferred
  totalAmount: number; // Calculated and stored for easier querying/display

  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Publication {
  id: string;
  clientId: string;
  clientName: string;
  platform: string; // e.g., Instagram, Twitter
  content: string;
  publicationDate: Date;
  status: 'Programada' | 'Publicada' | 'Borrador';
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Helper type for converting Firestore Timestamps in fetched data
export type WithConvertedDates<T> = {
  [K in keyof T]: T[K] extends Timestamp ? Date : T[K];
};
