
import type { Client, Task, Invoice, Service } from '@/types';

// Common services can still be useful for populating dropdowns or as templates.
export const commonServices: Service[] = [
  { id: 's1', name: 'Gestión de Redes Sociales', price: 500 },
  { id: 's2', name: 'Optimización SEO', price: 750 },
  { id: 's3', name: 'Creación de Contenido (Blog)', price: 300 },
  { id: 's4', name: 'Gestión de Campañas PPC', price: 600 },
];

// mockClients is now primarily for populating dropdowns in forms, 
// until those dropdowns also fetch data from Firestore.
// The actual client list page will fetch from Firestore.
export const mockClients: Partial<Client>[] = [ // Using Partial<Client> as some fields might not be needed for dropdowns
  {
    id: 'client_innovatech_mock', // Using a distinct ID to avoid confusion with real Firestore IDs
    name: 'Innovatech Solutions',
    email: 'contact@innovatech.com',
    profileSummary: 'Innovatech Solutions es una empresa tecnológica B2B especializada en analítica impulsada por IA. Público objetivo: CTOs, científicos de datos. Valores: Innovación, eficiencia, seguridad de datos. Tono: Profesional, vanguardista.',
    // contractStartDate, nextBillingDate, etc. are omitted as they are Date objects and
    // mock data is simpler with strings. These would be populated if this mock data was used for ClientCard.
  },
  {
    id: 'client_greenleaf_mock',
    name: 'GreenLeaf Organics',
    email: 'hello@greenleaf.com',
    profileSummary: 'GreenLeaf Organics ofrece productos premium de cuidado de la piel orgánicos. Público objetivo: Consumidores conscientes de la salud, millennials, mujeres de 25-55 años. Valores: Ingredientes naturales, sostenibilidad, origen ético. Tono: Cálido, confiable, ecológico.',
  },
  {
    id: 'client_apexfitness_mock',
    name: 'Apex Fitness Gear',
    email: 'support@apexfitness.com',
    profileSummary: 'Apex Fitness Gear vende ropa y equipamiento deportivo de alto rendimiento. Público objetivo: Entusiastas del fitness, atletas, asistentes al gimnasio. Valores: Rendimiento, durabilidad, motivación. Tono: Energético, inspirador, audaz.',
  },
];

// mockTasks will be replaced by Firestore data on the tasks list page.
export const mockTasks: Task[] = [
  {
    id: 't1_mock',
    name: 'Borrador calendario redes Q3 para Innovatech',
    assignedTo: 'Alicia Pérez',
    dueDate: new Date('2024-07-10'),
    status: 'En Progreso',
    priority: 'Alta',
    clientId: 'client_innovatech_mock',
    clientName: 'Innovatech Solutions',
    description: 'Planificar contenido para LinkedIn y Twitter para el tercer trimestre.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ... other mock tasks can be removed or updated if needed for other parts not yet migrated
];

// mockInvoices will be replaced by Firestore data on the billing list page.
export const mockInvoices: Invoice[] = [
  {
    id: 'inv001_mock',
    clientName: 'Innovatech Solutions',
    clientId: 'client_innovatech_mock',
    totalAmount: 1250,
    dueDate: new Date('2024-07-15'),
    issuedDate: new Date('2024-07-01'),
    status: 'No Pagada',
    items: [
      { id: 'item1', description: 'Gestión de Redes Sociales', quantity: 1, unitPrice: 500 },
      { id: 'item2', description: 'Optimización SEO', quantity: 1, unitPrice: 750 },
    ],
    notes: 'Servicios correspondientes al mes de Julio.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
    // ... other mock invoices can be removed or updated
];
