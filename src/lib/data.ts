import type { Client, Task, Invoice, Service } from '@/types';

const commonServices: Service[] = [
  { id: 's1', name: 'Social Media Management', price: 500 },
  { id: 's2', name: 'SEO Optimization', price: 750 },
  { id: 's3', name: 'Content Creation (Blog)', price: 300 },
  { id: 's4', name: 'PPC Campaign Management', price: 600 },
];

export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Innovatech Solutions',
    email: 'contact@innovatech.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    services: [commonServices[0], commonServices[1]],
    contractStartDate: '2023-01-15',
    nextBillingDate: '2024-07-15',
    profileSummary: 'Innovatech Solutions is a B2B tech company specializing in AI-driven analytics. Target audience: CTOs, data scientists. Values: Innovation, efficiency, data security. Tone: Professional, forward-thinking.',
  },
  {
    id: 'c2',
    name: 'GreenLeaf Organics',
    email: 'hello@greenleaf.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    services: [commonServices[0], commonServices[2]],
    contractStartDate: '2023-03-01',
    nextBillingDate: '2024-08-01',
    profileSummary: 'GreenLeaf Organics offers premium organic skincare products. Target audience: Health-conscious consumers, millennials, women aged 25-55. Values: Natural ingredients, sustainability, ethical sourcing. Tone: Warm, trustworthy, eco-friendly.',
  },
  {
    id: 'c3',
    name: 'Apex Fitness Gear',
    email: 'support@apexfitness.com',
    services: [commonServices[3]],
    contractStartDate: '2023-05-20',
    nextBillingDate: '2024-07-20',
    profileSummary: 'Apex Fitness Gear sells high-performance athletic apparel and equipment. Target audience: Fitness enthusiasts, athletes, gym-goers. Values: Performance, durability, motivation. Tone: Energetic, inspiring, bold.',
  },
];

export const mockTasks: Task[] = [
  {
    id: 't1',
    name: 'Draft Q3 social media calendar for Innovatech',
    assignedTo: 'Alice Smith',
    dueDate: '2024-07-10',
    status: 'In Progress',
    priority: 'High',
    clientName: 'Innovatech Solutions',
  },
  {
    id: 't2',
    name: 'Keyword research for GreenLeaf Organics new product line',
    assignedTo: 'Bob Johnson',
    dueDate: '2024-07-15',
    status: 'Pending',
    priority: 'Medium',
    clientName: 'GreenLeaf Organics',
  },
  {
    id: 't3',
    name: 'Finalize PPC ad copy for Apex Fitness summer sale',
    assignedTo: 'Carol Williams',
    dueDate: '2024-07-05',
    status: 'Completed',
    priority: 'High',
    clientName: 'Apex Fitness Gear',
  },
  {
    id: 't4',
    name: 'Monthly performance report for Innovatech',
    assignedTo: 'Alice Smith',
    dueDate: '2024-07-25',
    status: 'Pending',
    priority: 'Medium',
    clientName: 'Innovatech Solutions',
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv001',
    clientName: 'Innovatech Solutions',
    clientId: 'c1',
    amount: 1250,
    dueDate: '2024-07-15',
    issuedDate: '2024-07-01',
    status: 'Unpaid',
    items: [
      { description: 'Social Media Management', quantity: 1, unitPrice: 500 },
      { description: 'SEO Optimization', quantity: 1, unitPrice: 750 },
    ],
  },
  {
    id: 'inv002',
    clientName: 'GreenLeaf Organics',
    clientId: 'c2',
    amount: 800,
    dueDate: '2024-06-20',
    issuedDate: '2024-06-05',
    status: 'Paid',
    items: [
      { description: 'Social Media Management', quantity: 1, unitPrice: 500 },
      { description: 'Content Creation (Blog)', quantity: 1, unitPrice: 300 },
    ],
  },
  {
    id: 'inv003',
    clientName: 'Apex Fitness Gear',
    clientId: 'c3',
    amount: 600,
    dueDate: '2024-05-25',
    issuedDate: '2024-05-10',
    status: 'Overdue',
    items: [{ description: 'PPC Campaign Management', quantity: 1, unitPrice: 600 }],
  },
];
