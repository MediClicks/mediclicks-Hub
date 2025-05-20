
// @ts-nocheck
// Disabling TypeScript check for this file due to @react-pdf/renderer type complexities
// Consider enabling it if types become more stable or are strictly needed.
'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { Invoice, Client } from '@/types'; // Assuming WithConvertedDates is handled before passing

interface AgencyDetails {
  agencyName?: string;
  address?: string;
  taxId?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
}

interface InvoicePdfDocumentProps {
  invoice: Invoice;
  client: Client | null;
  agencyDetails: AgencyDetails | null;
}

// Register a simple font (optional, but good for consistency)
// Font.register({
//   family: 'Roboto',
//   fonts: [
//     { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
//     { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
//   ]
// });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Using a standard font for broad compatibility
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 50,
    lineHeight: 1.4,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d3357', // primary color
  },
  invoiceId: {
    fontSize: 10,
    color: '#555555',
  },
  agencyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d3357',
  },
  smallText: {
    fontSize: 9,
    color: '#444444',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0d3357',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 3,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '48%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  detailLabel: {
    color: '#555555',
  },
  detailValue: {
    textAlign: 'right',
  },
  table: {
    // @ts-ignore: display property in @react-pdf/types seems incomplete
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderColor: '#bfbfbf',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
  },
  tableColHeader: {
    padding: 5,
    borderStyle: 'solid',
    borderColor: '#bfbfbf',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCol: {
    padding: 5,
    borderStyle: 'solid',
    borderColor: '#bfbfbf',
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  tableColDesc: { width: '50%' },
  tableColQty: { width: '15%', textAlign: 'right' },
  tableColPrice: { width: '20%', textAlign: 'right' },
  tableColTotal: { width: '15%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  totalLabel: {
    color: '#555555',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d3357',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d3357',
  },
  notesSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaaaaa',
  },
});

const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({ invoice, client, agencyDetails }) => {
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });
  };

  return (
    <Document title={`Factura ${invoice?.id?.substring(0,8).toUpperCase()}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceId}>ID: {invoice?.id?.substring(0,10).toUpperCase() || 'N/A'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.agencyName}>{agencyDetails?.agencyName || "Nombre de Agencia"}</Text>
            <Text style={styles.smallText}>{agencyDetails?.address || "Dirección de Agencia"}</Text>
            <Text style={styles.smallText}>{agencyDetails?.taxId || "NIF/CIF Agencia"}</Text>
            <Text style={styles.smallText}>{agencyDetails?.contactEmail || "Email Agencia"}</Text>
            {agencyDetails?.contactPhone && <Text style={styles.smallText}>Tel: {agencyDetails.contactPhone}</Text>}
          </View>
        </View>

        {/* Client and Invoice Details */}
        <View style={styles.grid}>
          <View style={styles.gridColumn}>
            <Text style={styles.sectionTitle}>Facturar a:</Text>
            {client ? (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{client.name}</Text>
                {client.clinica && <Text style={styles.smallText}>{client.clinica}</Text>}
                <Text style={styles.smallText}>{client.email}</Text>
                {client.telefono && <Text style={styles.smallText}>{client.telefono}</Text>}
              </>
            ) : (
              <Text style={styles.smallText}>Información del cliente no disponible.</Text>
            )}
          </View>
          <View style={styles.gridColumn}>
            <Text style={styles.sectionTitle}>Detalles de la Factura:</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha de Emisión:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice?.issuedDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha de Vencimiento:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice?.dueDate)}</Text>
            </View>
             <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={[styles.detailValue, {fontWeight: 'bold'}]}>{invoice?.status || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conceptos</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, styles.tableColDesc]}>Descripción</Text>
              <Text style={[styles.tableColHeader, styles.tableColQty]}>Cant.</Text>
              <Text style={[styles.tableColHeader, styles.tableColPrice]}>P. Unit.</Text>
              <Text style={[styles.tableColHeader, styles.tableColTotal]}>Total</Text>
            </View>
            {/* Table Body */}
            {invoice?.items?.map((item, index) => (
              <View key={item.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.tableColDesc]}>{item.description}</Text>
                <Text style={[styles.tableCol, styles.tableColQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCol, styles.tableColPrice]}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={[styles.tableCol, styles.tableColTotal]}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Impuestos (IVA 0%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(0)}</Text>
            </View>
            <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#cccccc', paddingTop: 5, marginTop: 5 }]}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice?.totalAmount || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notas Adicionales:</Text>
            <Text style={styles.smallText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Gracias por su confianza.
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePdfDocument;

