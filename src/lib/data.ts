
import type { Client, Task, Invoice, Service } from '@/types';

// Common services can still be useful for populating dropdowns or as templates.
export const commonServices: Service[] = [
  { id: 's1', name: 'Gestión de Redes Sociales', price: 500 },
  { id: 's2', name: 'Optimización SEO', price: 750 },
  { id: 's3', name: 'Creación de Contenido (Blog)', price: 300 },
  { id: 's4', name: 'Gestión de Campañas PPC', price: 600 },
];

// mockClients is now primarily for populating dropdowns in forms (Add Task, Add Invoice),
// until those dropdowns also fetch data from Firestore.
// The actual client list page will fetch from Firestore.
export const mockClients: Partial<Client>[] = [
  {
    id: 'client_innovatech_mock',
    name: 'Innovatech Solutions',
    email: 'contact@innovatech.com',
    profileSummary: 'Innovatech Solutions es una empresa tecnológica B2B especializada en analítica impulsada por IA. Público objetivo: CTOs, científicos de datos. Valores: Innovación, eficiencia, seguridad de datos. Tono: Profesional, vanguardista.',
    contractStartDate: new Date(Date.UTC(2023, 0, 15)), 
    nextBillingDate: new Date(Date.UTC(2024, 7, 15)), 
  },
  {
    id: 'client_greenleaf_mock',
    name: 'GreenLeaf Organics',
    email: 'hello@greenleaf.com',
    profileSummary: 'GreenLeaf Organics ofrece productos premium de cuidado de la piel orgánicos. Público objetivo: Consumidores conscientes de la salud, millennials, mujeres de 25-55 años. Valores: Ingredientes naturales, sostenibilidad, origen ético. Tono: Cálido, confiable, ecológico.',
    contractStartDate: new Date(Date.UTC(2023, 2, 1)), 
    nextBillingDate: new Date(Date.UTC(2024, 8, 1)), 
  },
  {
    id: 'client_apexfitness_mock',
    name: 'Apex Fitness Gear',
    email: 'support@apexfitness.com',
    profileSummary: 'Apex Fitness Gear vende ropa y equipamiento deportivo de alto rendimiento. Público objetivo: Entusiastas del fitness, atletas, asistentes al gimnasio. Valores: Rendimiento, durabilidad, motivación. Tono: Energético, inspirador, audaz.',
    contractStartDate: new Date(Date.UTC(2022, 10, 20)), 
    nextBillingDate: new Date(Date.UTC(2024, 7, 20)), 
  },
];

// mockTasks is used by the Dashboard, but the /tasks page now fetches from Firestore.
// This can be removed once the dashboard also fetches its summarized task data from Firestore.
export const mockTasks: Task[] = [
  {
    id: 't1_mock',
    name: 'Borrador calendario redes Q3 para Innovatech',
    assignedTo: 'Alicia Pérez',
    dueDate: new Date(Date.UTC(2024, 6, 10)), // July 10th, 2024 UTC
    status: 'En Progreso',
    priority: 'Alta',
    clientId: 'client_innovatech_mock',
    clientName: 'Innovatech Solutions',
    description: 'Planificar contenido para LinkedIn y Twitter para el tercer trimestre.',
    createdAt: new Date(Date.UTC(2024, 6, 1, 10, 0, 0)), 
    updatedAt: new Date(Date.UTC(2024, 6, 1, 10, 5, 0)), 
  },
  {
    id: 't2_mock',
    name: 'Revisión keywords GreenLeaf',
    assignedTo: 'Carlos Ruiz',
    dueDate: new Date(Date.UTC(2024, 6, 15)), // July 15th, 2024 UTC
    status: 'Pendiente',
    priority: 'Media',
    clientId: 'client_greenleaf_mock',
    clientName: 'GreenLeaf Organics',
    description: 'Investigar y proponer 10 nuevas keywords long-tail.',
    createdAt: new Date(Date.UTC(2024, 6, 2, 10, 0, 0)),
    updatedAt: new Date(Date.UTC(2024, 6, 2, 10, 5, 0)),
  },
];

// mockInvoices is used by the Dashboard, but the /billing page will fetch from Firestore.
// This can be removed once the dashboard also fetches its summarized invoice data from Firestore.
export const mockInvoices: Invoice[] = [
  {
    id: 'inv001_mock',
    clientName: 'Innovatech Solutions',
    clientId: 'client_innovatech_mock',
    totalAmount: 1250,
    dueDate: new Date(Date.UTC(2024, 6, 15)), // July 15th, 2024 UTC
    issuedDate: new Date(Date.UTC(2024, 6, 1)), // July 1st, 2024 UTC
    status: 'No Pagada',
    items: [
      { id: 'item1_mock', description: 'Gestión de Redes Sociales', quantity: 1, unitPrice: 500 },
      { id: 'item2_mock', description: 'Optimización SEO', quantity: 1, unitPrice: 750 },
    ],
    notes: 'Servicios correspondientes al mes de Julio.',
    createdAt: new Date(Date.UTC(2024, 5, 28, 14, 30, 0)), 
    updatedAt: new Date(Date.UTC(2024, 5, 28, 14, 35, 0)), 
  },
  {
    id: 'inv002_mock',
    clientName: 'GreenLeaf Organics',
    clientId: 'client_greenleaf_mock',
    totalAmount: 300,
    dueDate: new Date(Date.UTC(2024, 7, 1)), // August 1st, 2024 UTC
    issuedDate: new Date(Date.UTC(2024, 6, 18)), // July 18th, 2024 UTC
    status: 'Pagada',
    items: [
      { id: 'item3_mock', description: 'Creación de Contenido (Blog Post)', quantity: 1, unitPrice: 300 },
    ],
    createdAt: new Date(Date.UTC(2024, 6, 15, 11, 0, 0)),
    updatedAt: new Date(Date.UTC(2024, 6, 18, 9, 0, 0)),
  },
];
