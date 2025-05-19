
export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  services: Service[]; // Specific structured services
  contractStartDate: string; // ISO date string
  nextBillingDate: string; // ISO date string
  profileSummary: string; // For AI content suggestions

  // New fields from user request
  clinica?: string;
  telefono?: string;
  serviciosActivosGeneral?: string; // Textual description of general active services
  pagado?: boolean; // Payment status of the client overall (consider if this should be invoice-specific)
  notas?: string;
  dominioWeb?: string;
  tipoServicioWeb?: string;
  vencimientoWeb?: string; // ISO date string
  plataformasRedesSociales?: string; // Changed from array to string for simplicity, can be comma-separated
  detallesRedesSociales?: string;
  serviciosContratadosAdicionales?: string; // Textual description of additionally contracted services
  configuracionRedesSociales?: string;
  credencialesRedesUsuario?: string;
  credencialesRedesContrasena?: string;
}

export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';
export type TaskPriority = 'Baja' | 'Media' | 'Alta';

export interface Task {
  id: string;
  name: string;
  assignedTo: string; // User name or ID
  dueDate: string; // ISO date string
  status: TaskStatus;
  priority: TaskPriority;
  clientId?: string; // Link to client
  clientName?: string; // Optional client association (denormalized for display)
  description?: string;
}

export type InvoiceStatus = 'Pagada' | 'No Pagada' | 'Vencida';

export interface InvoiceItem {
  id: string; // for unique key in lists
  description: string;
  quantity: number;
  unitPrice: number;
}
export interface Invoice {
  id:string;
  clientName: string;
  clientId: string;
  amount: number;
  dueDate: string; // ISO date string
  issuedDate: string; // ISO date string
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
}

export interface Publication {
  id: string;
  clientId: string;
  clientName: string;
  platform: string; // e.g., Instagram, Twitter
  content: string;
  publicationDate: string; // ISO date string
  status: 'Programada' | 'Publicada' | 'Borrador';
}
