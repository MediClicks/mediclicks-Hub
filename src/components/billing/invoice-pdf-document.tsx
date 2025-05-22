// @ts-nocheck
// Disabling TypeScript check for this file due to @react-pdf/renderer type complexities.
// Consider enabling it if types become more stable or are strictly needed.
'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { Invoice, Client, WithConvertedDates, AgencyDetails, InvoiceItem } from '@/types';

// Register a simple font if needed, or rely on defaults like Helvetica
// Font.register({ family: 'Helvetica', src: '...' }); // Example if you had custom fonts

interface InvoicePdfDocumentProps {
  invoice?: WithConvertedDates<Invoice> | null;
  client?: WithConvertedDates<Client> | null;
  agencyDetails?: AgencyDetails | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Using a standard font
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
    fontWeight: 'bold', // fontWeight in @react-pdf needs to be a string like 'bold' or a number
    color: '#0d3357', 
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
    marginBottom: 15,
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
    maxWidth: '60%', 
  },
  table: {
    display: 'table' as any, // Workaround for type issue
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
    fontSize: 9,
  },
  tableCol: {
    padding: 5,
    borderStyle: 'solid',
    borderColor: '#bfbfbf',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    fontSize: 9,
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
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#555555',
    fontSize: 10,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'right',
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
    textAlign: 'right',
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
  errorText: {
    fontSize: 12,
    color: '#D8000C', // Red color for error
    textAlign: 'center',
    marginTop: 20,
  }
});

const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({ 
  invoice: rawInvoice, 
  client: rawClient, 
  agencyDetails: rawAgencyDetails 
}) => {

  // Provide default empty objects to avoid "cannot read properties of undefined"
  const invoice = rawInvoice || {} as WithConvertedDates<Invoice>;
  const client = rawClient || {} as WithConvertedDates<Client>;
  const agencyDetails = rawAgencyDetails || {} as AgencyDetails;

  const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(date.getTime())) return 'Fecha Inv.';
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      return 'Fecha Inv.';
    }
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    const numAmount = Number(amount);
    if (typeof numAmount !== 'number' || isNaN(numAmount) || !Number.isFinite(numAmount)) {
      return (0).toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return numAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!rawInvoice || !rawClient || !rawAgencyDetails) {
    return (
      <Document title="Factura Inválida">
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Error al Generar Factura</Text>
            <Text style={styles.errorText}>Los datos necesarios para generar la factura no están completos.</Text>
            {!rawInvoice && <Text style={styles.smallText}>- Falta información de la factura.</Text>}
            {!rawClient && <Text style={styles.smallText}>- Falta información del cliente.</Text>}
            {!rawAgencyDetails && <Text style={styles.smallText}>- Falta información de la agencia.</Text>}
          </View>
        </Page>
      </Document>
    );
  }

  const safeInvoiceItems = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = safeInvoiceItems.reduce((sum, item) => {
    const quantity = Number(item?.quantity);
    const unitPrice = Number(item?.unitPrice);
    const validQuantity = Number.isFinite(quantity) ? quantity : 0;
    const validUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
    return sum + validQuantity * validUnitPrice;
  }, 0);

  const taxAmount = 0; 
  const totalAmount = Number(invoice?.totalAmount);
  const validTotalAmount = Number.isFinite(totalAmount) ? totalAmount : 0;
  const displayInvoiceId = String(invoice?.id || 'N/A').substring(0,10).toUpperCase();

  return (
    <Document title={`Factura ${displayInvoiceId}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceId}>ID: {displayInvoiceId}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.agencyName}>{String(agencyDetails?.agencyName || "Nombre de Agencia N/A")}</Text>
            <Text style={styles.smallText}>{String(agencyDetails?.address || "Dirección N/A")}</Text>
            <Text style={styles.smallText}>{String(agencyDetails?.taxId || "NIF/CIF N/A")}</Text>
            <Text style={styles.smallText}>{String(agencyDetails?.contactEmail || "Email N/A")}</Text>
            {agencyDetails?.contactPhone && <Text style={styles.smallText}>Tel: {String(agencyDetails.contactPhone)}</Text>}
            {agencyDetails?.website && <Text style={styles.smallText}>{String(agencyDetails.website)}</Text>}
          </View>
        </View>

        {/* Client and Invoice Details */}
        <View style={styles.grid}>
          <View style={styles.gridColumn}>
            <Text style={styles.sectionTitle}>Facturar a:</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{String(client?.name || 'Cliente N/A')}</Text>
            {client?.clinica && <Text style={styles.smallText}>{String(client.clinica)}</Text>}
            <Text style={styles.smallText}>{String(client?.email || 'Email N/A')}</Text>
            {client?.telefono && <Text style={styles.smallText}>Tel: {String(client.telefono)}</Text>}
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
              <Text style={[styles.detailValue, {fontWeight: 'bold'}]}>{String(invoice?.status || 'N/A')}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conceptos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, styles.tableColDesc]}>Descripción</Text>
              <Text style={[styles.tableColHeader, styles.tableColQty]}>Cant.</Text>
              <Text style={[styles.tableColHeader, styles.tableColPrice]}>P. Unit.</Text>
              <Text style={[styles.tableColHeader, styles.tableColTotal]}>Total</Text>
            </View>
            {safeInvoiceItems.length > 0 ? safeInvoiceItems.map((item: InvoiceItem | null | undefined, index: number) => {
              const description = String(item?.description || 'Descripción N/A');
              const quantity = Number(item?.quantity);
              const unitPrice = Number(item?.unitPrice);
              const validQuantity = Number.isFinite(quantity) ? quantity : 0;
              const validUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
              const itemTotal = validQuantity * validUnitPrice;
              return (
                <View key={item?.id || `item-pdf-${index}-${Date.now()}`} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.tableColDesc]}>{description}</Text>
                  <Text style={[styles.tableCol, styles.tableColQty]}>{String(validQuantity)}</Text>
                  <Text style={[styles.tableCol, styles.tableColPrice]}>{formatCurrency(validUnitPrice)}</Text>
                  <Text style={[styles.tableCol, styles.tableColTotal]}>{formatCurrency(itemTotal)}</Text>
                </View>
              );
            }) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.tableColDesc, {width: '100%', textAlign: 'center'}]}>No hay ítems en esta factura.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Impuestos (IVA 0%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>
            <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#cccccc', paddingTop: 5, marginTop: 5 }]}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(validTotalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notas Adicionales:</Text>
            <Text style={styles.smallText}>{String(invoice.notes)}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Gracias por su confianza. {agencyDetails?.website ? `Visítanos en ${String(agencyDetails.website)}` : ''}
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePdfDocument;
