
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
  services: Service[];
  contractStartDate: string; // ISO date string
  nextBillingDate: string; // ISO date string
  profileSummary: string; // For AI content suggestions
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  name: string;
  assignedTo: string; // User name or ID
  dueDate: string; // ISO date string
  status: TaskStatus;
  priority: TaskPriority;
  clientName?: string; // Optional client association
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';

export interface Invoice {
  id: string;
  clientName: string;
  clientId: string;
  amount: number;
  dueDate: string; // ISO date string
  issuedDate: string; // ISO date string
  status: InvoiceStatus;
  items: { description: string; quantity: number; unitPrice: number }[];
}

export interface Publication {
  id: string;
  clientId: string;
  clientName: string;
  platform: string; // e.g., Instagram, Twitter
  content: string;
  publicationDate: string; // ISO date string
  status: 'Scheduled' | 'Published' | 'Draft';
}
