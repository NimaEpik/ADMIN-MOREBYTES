import { useState, useMemo } from 'react';
import { useOrders } from '../../context/OrdersContext';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
  LuSearch,
  LuDownload,
  LuX,
  LuArrowUp,
  LuArrowDown,
  LuFileSpreadsheet,
  LuChevronLeft,
  LuChevronRight,
  LuFileText,
} from 'react-icons/lu';
import './Reports.css';

// Initial 4 hardcoded exported reports
const INITIAL_EXPORTS = [
  {
    id: 1,
    format: 'PDF',
    filename: 'Weekly_Sales_May_W2.pdf',
    date: 'Apr 14, 2026',
    rawDate: '2026-04-14',
    size: '1.2 MB',
  },
  {
    id: 2,
    format: 'PDF',
    filename: 'Monthly_Delivery_Stats_April.pdf',
    date: 'Apr 01, 2026',
    rawDate: '2026-04-01',
    size: '840 KB',
  },
  {
    id: 3,
    format: 'XLSX',
    filename: 'Inventory_Audit_Log.xlsx',
    date: 'Apr 28, 2026',
    rawDate: '2026-04-28',
    size: '2.4 MB',
  },
  {
    id: 4,
    format: 'CSV',
    filename: 'Daily_Sales_Report_Apr27.csv',
    date: 'Apr 27, 2026',
    rawDate: '2026-04-27',
    size: '560 KB',
  },
];

// Initial hardcoded customer records with loyalty points (view only)
const HARDCODED_CUSTOMERS = [
  { id: 1, name: 'Benny Sean', totalOrders: 21, totalSpent: 935.0, loyaltyPoints: 450, lastOrderDate: '2026-05-25', status: 'Frequent' },
  { id: 2, name: 'Sean Sean', totalOrders: 19, totalSpent: 1120.0, loyaltyPoints: 380, lastOrderDate: '2026-05-25', status: 'Frequent' },
  { id: 3, name: 'Benny QT', totalOrders: 18, totalSpent: 890.0, loyaltyPoints: 320, lastOrderDate: '2026-05-25', status: 'Frequent' },
  { id: 4, name: 'Benedict', totalOrders: 15, totalSpent: 750.0, loyaltyPoints: 210, lastOrderDate: '2026-05-25', status: 'Regular' },
  { id: 5, name: 'Ben Seanix', totalOrders: 9, totalSpent: 1450.0, loyaltyPoints: 90, lastOrderDate: '2026-05-25', status: 'New' },
  { id: 6, name: 'Maria Santos', totalOrders: 14, totalSpent: 820.0, loyaltyPoints: 180, lastOrderDate: '2026-05-24', status: 'Regular' },
  { id: 7, name: 'Juan Dela Cruz', totalOrders: 12, totalSpent: 650.0, loyaltyPoints: 150, lastOrderDate: '2026-05-24', status: 'Regular' },
  { id: 8, name: 'Alex Johnson', totalOrders: 8, totalSpent: 430.0, loyaltyPoints: 75, lastOrderDate: '2026-05-23', status: 'New' },
  { id: 9, name: 'Sarah Connor', totalOrders: 22, totalSpent: 1350.0, loyaltyPoints: 510, lastOrderDate: '2026-05-23', status: 'Frequent' },
  { id: 10, name: 'David Miller', totalOrders: 5, totalSpent: 320.0, loyaltyPoints: 40, lastOrderDate: '2026-05-22', status: 'New' },
  { id: 11, name: 'Angela Ramos', totalOrders: 16, totalSpent: 910.0, loyaltyPoints: 230, lastOrderDate: '2026-05-22', status: 'Regular' },
  { id: 12, name: 'Carlo Tan', totalOrders: 20, totalSpent: 1050.0, loyaltyPoints: 410, lastOrderDate: '2026-05-21', status: 'Frequent' },
  { id: 13, name: 'Patricia Lee', totalOrders: 7, totalSpent: 490.0, loyaltyPoints: 60, lastOrderDate: '2026-05-21', status: 'New' },
  { id: 14, name: 'Rafael Gomez', totalOrders: 13, totalSpent: 780.0, loyaltyPoints: 170, lastOrderDate: '2026-05-20', status: 'Regular' },
  { id: 15, name: 'Liza Soberano', totalOrders: 17, totalSpent: 880.0, loyaltyPoints: 290, lastOrderDate: '2026-05-19', status: 'Frequent' },
  { id: 16, name: 'Joshua Garcia', totalOrders: 6, totalSpent: 390.0, loyaltyPoints: 50, lastOrderDate: '2026-05-18', status: 'New' },
  { id: 17, name: 'Bea Alonzo', totalOrders: 11, totalSpent: 620.0, loyaltyPoints: 130, lastOrderDate: '2026-05-18', status: 'Regular' },
  { id: 18, name: 'Daniel Padilla', totalOrders: 25, totalSpent: 1600.0, loyaltyPoints: 580, lastOrderDate: '2026-05-17', status: 'Frequent' },
];

// Fallback catalog mapping for categories and trends
const FALLBACK_TOP_ITEMS = [
  { name: 'Pepperoni Pizza', category: 'Pizza', defaultUnits: 142, trend: 12, trendUp: true },
  { name: 'Full House (Pizza)', category: 'Pizza', defaultUnits: 98, trend: 5, trendUp: true },
  { name: 'Heavenly Ube', category: 'Dessert', defaultUnits: 76, trend: 2, trendUp: false },
  { name: 'Supreme Pizza', category: 'Pizza', defaultUnits: 64, trend: 18, trendUp: true },
  { name: 'Cheese Overload', category: 'Pizza', defaultUnits: 51, trend: 8, trendUp: true },
  { name: 'Burger Combo', category: 'Burgers', defaultUnits: 45, trend: 10, trendUp: true },
  { name: 'Chicken Wings', category: 'Sides', defaultUnits: 38, trend: 4, trendUp: true },
  { name: 'Sprite 1.5L', category: 'Beverages', defaultUnits: 32, trend: 1, trendUp: false },
  { name: 'Cheeseburger Combo', category: 'Burgers', defaultUnits: 29, trend: 6, trendUp: true },
  { name: 'Family Meal Deal', category: 'Combos', defaultUnits: 24, trend: 15, trendUp: true },
];

// Currency formatter
const formatCurrency = (amount) =>
  `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Format date helper (YYYY-MM-DD)
const formatDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
};

// Format items list into readable string e.g. "2x Pepperoni Pizza, 1x Sprite 1.5L"
const formatItemsList = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) return 'None';
  return items
    .map((it) => {
      const qty = it.quantity || it.qty || 1;
      const name = it.name || it.itemName || 'Item';
      return `${qty}x ${name}`;
    })
    .join(', ');
};

function Reports() {
  // Pull real orders from context
  const { orders = [] } = useOrders() || {};

  // Active Tab state: 'sales' | 'delivery' | 'customer'
  const [activeTab, setActiveTab] = useState('sales');

  // Filters for Sales Records
  const [salesSearch, setSalesSearch] = useState('');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');
  const [salesPage, setSalesPage] = useState(1);

  // Filters for Delivery Records
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliveryDateFrom, setDeliveryDateFrom] = useState('');
  const [deliveryDateTo, setDeliveryDateTo] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('All');
  const [deliveryPage, setDeliveryPage] = useState(1);

  // Filters for Customer Records
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('All');
  const [customerPage, setCustomerPage] = useState(1);

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isTopSellingModalOpen, setIsTopSellingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Generate Report Modal options
  const [exportFormat, setExportFormat] = useState('PDF'); // 'PDF' | 'CSV' | 'XLSX'
  const [reportSection, setReportSection] = useState('summary'); // 'summary' | 'sales_top' | 'full'
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Exported reports history list
  const [exportedReports, setExportedReports] = useState(INITIAL_EXPORTS);

  // History modal filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyFormatFilter, setHistoryFormatFilter] = useState('All');
  const [historyDateFilter, setHistoryDateFilter] = useState('All');

  // Items per page
  const PAGE_SIZE = 5;

  // ===== STAT CARDS CALCULATIONS =====
  const totalSalesToday = useMemo(() => {
    return orders
      .filter((o) => (o.status || '').toLowerCase() === 'completed')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [orders]);

  const completedDeliveries = useMemo(() => {
    return orders.filter(
      (o) => (o.status || '').toLowerCase() === 'completed' && o.orderType === 'Online Order'
    ).length;
  }, [orders]);

  const totalOrdersCount = orders.length;

  // ===== TOP SELLING ITEMS CALCULATION =====
  const topSellingItems = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((it) => {
          const name = it.name || it.itemName || 'Item';
          const qty = Number(it.quantity || it.qty || 1);
          counts[name] = (counts[name] || 0) + qty;
        });
      }
    });

    const combinedList = FALLBACK_TOP_ITEMS.map((item) => {
      const realSold = counts[item.name] || 0;
      return {
        ...item,
        unitsSold: realSold + item.defaultUnits,
      };
    });

    // Add any order items not in fallback list
    Object.keys(counts).forEach((name) => {
      if (!combinedList.some((item) => item.name === name)) {
        combinedList.push({
          name,
          category: 'Food',
          defaultUnits: 0,
          unitsSold: counts[name],
          trend: 10,
          trendUp: true,
        });
      }
    });

    return combinedList.sort((a, b) => b.unitsSold - a.unitsSold);
  }, [orders]);

  // ===== TAB 1: SALES RECORDS FILTERED & PAGINATED =====
  const filteredSales = useMemo(() => {
    return orders.filter((order) => {
      const orderIdMatch = (order.orderId || '')
        .toLowerCase()
        .includes(salesSearch.trim().toLowerCase());
      const formattedDate = formatDate(order.createdAt);
      const fromMatch = salesDateFrom ? formattedDate >= salesDateDateString(salesDateFrom) : true;
      const toMatch = salesDateTo ? formattedDate <= salesDateDateString(salesDateTo) : true;
      return orderIdMatch && fromMatch && toMatch;
    });
  }, [orders, salesSearch, salesDateFrom, salesDateTo]);

  const totalSalesPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, salesPage]);

  // ===== TAB 2: DELIVERY RECORDS FILTERED & PAGINATED =====
  const filteredDeliveries = useMemo(() => {
    return orders
      .filter((o) => o.orderType === 'Online Order')
      .filter((order) => {
        const query = deliverySearch.trim().toLowerCase();
        const idMatch = (order.orderId || '').toLowerCase().includes(query);
        const riderMatch = (order.driverName || 'unassigned').toLowerCase().includes(query);
        const customerMatch = (order.customerName || '').toLowerCase().includes(query);
        const searchMatch = !query || idMatch || riderMatch || customerMatch;

        const formattedDate = formatDate(order.createdAt);
        const fromMatch = deliveryDateFrom ? formattedDate >= salesDateDateString(deliveryDateFrom) : true;
        const toMatch = deliveryDateTo ? formattedDate <= salesDateDateString(deliveryDateTo) : true;

        const statusMatch =
          deliveryStatusFilter === 'All' ||
          (order.status || '').toLowerCase() === deliveryStatusFilter.toLowerCase();

        return searchMatch && fromMatch && toMatch && statusMatch;
      });
  }, [orders, deliverySearch, deliveryDateFrom, deliveryDateTo, deliveryStatusFilter]);

  const totalDeliveryPages = Math.max(1, Math.ceil(filteredDeliveries.length / PAGE_SIZE));
  const paginatedDeliveries = useMemo(() => {
    const start = (deliveryPage - 1) * PAGE_SIZE;
    return filteredDeliveries.slice(start, start + PAGE_SIZE);
  }, [filteredDeliveries, deliveryPage]);

  // ===== TAB 3: CUSTOMER RECORDS FILTERED & PAGINATED =====
  const filteredCustomers = useMemo(() => {
    return HARDCODED_CUSTOMERS.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(customerSearch.trim().toLowerCase());
      const statusMatch =
        customerStatusFilter === 'All' || c.status.toLowerCase() === customerStatusFilter.toLowerCase();
      return nameMatch && statusMatch;
    });
  }, [customerSearch, customerStatusFilter]);

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, customerPage]);

  // Helper to format date string comparison
  function salesDateDateString(dateVal) {
    if (!dateVal) return '';
    return dateVal;
  }

  // ===== GENERATE REPORT EXPORT LOGIC =====
  const handleGenerateAndDownload = () => {
    const dateStr = reportDate || new Date().toISOString().split('T')[0];
    const timestampFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    // Prepare Sales Data
    const salesExportRows = orders.map((o) => ({
      'Date': formatDate(o.createdAt),
      'Order ID': o.orderId || String(o.id),
      'Customer': o.customerName || 'N/A',
      'Order Type': o.orderType || 'Walk-In',
      'Items Sold': formatItemsList(o.items),
      'Total Amount (PHP)': Number(o.total || 0),
      'Payment Method': 'COD',
      'Status': o.status || 'Pending',
    }));

    // Prepare Top Items Data
    const topExportRows = topSellingItems.slice(0, 10).map((it, idx) => ({
      'Rank': idx + 1,
      'Item Name': it.name,
      'Category': it.category || 'Food',
      'Units Sold': it.unitsSold,
      'Trend': `${it.trendUp ? '+' : '-'}${it.trend}%`,
    }));

    // Prepare Delivery Data
    const deliveryExportRows = orders
      .filter((o) => o.orderType === 'Online Order')
      .map((o) => ({
        'Date': formatDate(o.createdAt),
        'Order ID': o.orderId || String(o.id),
        'Customer': o.customerName || 'N/A',
        'Rider': o.driverName || 'Unassigned',
        'Duration': '-- mins',
        'Distance': '-- km',
        'Status': o.status || 'Pending',
      }));

    if (exportFormat === 'PDF') {
      // PDF GENERATION WITH JSPDF
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(255, 165, 0);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("LIPTON'S MOREBITES - SALES REPORT", 14, 16);

      // Metadata Info
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Date: ${dateStr}`, 14, 32);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 38);
      doc.text(`Total Orders in Report: ${orders.length}`, 14, 44);

      let currentY = 54;

      // Section: Sales Records
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 165, 0);
      doc.text('Sales Records', 14, currentY);
      currentY += 6;

      // Table Header
      doc.setFillColor(245, 245, 245);
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 16, currentY + 5.5);
      doc.text('Order ID', 42, currentY + 5.5);
      doc.text('Type', 72, currentY + 5.5);
      doc.text('Items', 105, currentY + 5.5);
      doc.text('Total', 155, currentY + 5.5);
      doc.text('Status', 178, currentY + 5.5);
      currentY += 9;

      // Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);

      salesExportRows.forEach((row, i) => {
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;
        }
        if (i % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(14, currentY - 3.5, 182, 7, 'F');
        }
        doc.text(String(row.Date), 16, currentY + 1);
        doc.text(String(row['Order ID']), 42, currentY + 1);
        doc.text(String(row['Order Type']), 72, currentY + 1);
        const shortItems = String(row['Items Sold']).length > 25 ? `${String(row['Items Sold']).slice(0, 22)}...` : String(row['Items Sold']);
        doc.text(shortItems, 105, currentY + 1);
        doc.text(`P${row['Total Amount (PHP)']}`, 155, currentY + 1);
        doc.text(String(row.Status), 178, currentY + 1);
        currentY += 7;
      });

      // Section: Top Selling Items (if requested)
      if (reportSection === 'sales_top' || reportSection === 'full') {
        currentY += 8;
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 165, 0);
        doc.text('Top Selling Items', 14, currentY);
        currentY += 6;

        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Rank', 16, currentY + 5.5);
        doc.text('Item Name', 42, currentY + 5.5);
        doc.text('Category', 105, currentY + 5.5);
        doc.text('Units Sold', 155, currentY + 5.5);
        doc.text('Trend', 178, currentY + 5.5);
        currentY += 9;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);

        topExportRows.forEach((row, i) => {
          if (currentY > 275) {
            doc.addPage();
            currentY = 20;
          }
          if (i % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(14, currentY - 3.5, 182, 7, 'F');
          }
          doc.text(`#${row.Rank}`, 16, currentY + 1);
          doc.text(String(row['Item Name']), 42, currentY + 1);
          doc.text(String(row.Category), 105, currentY + 1);
          doc.text(`${row['Units Sold']} units`, 155, currentY + 1);
          doc.text(String(row.Trend), 178, currentY + 1);
          currentY += 7;
        });
      }

      // Section: Delivery Records (if full report requested)
      if (reportSection === 'full') {
        currentY += 8;
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 165, 0);
        doc.text('Delivery Records', 14, currentY);
        currentY += 6;

        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Date', 16, currentY + 5.5);
        doc.text('Order ID', 42, currentY + 5.5);
        doc.text('Customer', 80, currentY + 5.5);
        doc.text('Rider', 125, currentY + 5.5);
        doc.text('Status', 165, currentY + 5.5);
        currentY += 9;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);

        deliveryExportRows.forEach((row, i) => {
          if (currentY > 275) {
            doc.addPage();
            currentY = 20;
          }
          if (i % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(14, currentY - 3.5, 182, 7, 'F');
          }
          doc.text(String(row.Date), 16, currentY + 1);
          doc.text(String(row['Order ID']), 42, currentY + 1);
          doc.text(String(row.Customer), 80, currentY + 1);
          doc.text(String(row.Rider), 125, currentY + 1);
          doc.text(String(row.Status), 165, currentY + 1);
          currentY += 7;
        });
      }

      doc.save(`Sales_Report_${dateStr}.pdf`);
    } else if (exportFormat === 'XLSX') {
      // XLSX EXPORT
      const workbook = XLSX.utils.book_new();
      const wsSales = XLSX.utils.json_to_sheet(salesExportRows);
      XLSX.utils.book_append_sheet(workbook, wsSales, 'Sales Records');

      if (reportSection === 'sales_top' || reportSection === 'full') {
        const wsTop = XLSX.utils.json_to_sheet(topExportRows);
        XLSX.utils.book_append_sheet(workbook, wsTop, 'Top Selling Items');
      }

      if (reportSection === 'full') {
        const wsDelivery = XLSX.utils.json_to_sheet(deliveryExportRows);
        XLSX.utils.book_append_sheet(workbook, wsDelivery, 'Delivery Records');
      }

      XLSX.writeFile(workbook, `Sales_Report_${dateStr}.xlsx`);
    } else if (exportFormat === 'CSV') {
      // CSV EXPORT
      let combinedCsvData = [...salesExportRows];
      if (reportSection === 'sales_top' || reportSection === 'full') {
        combinedCsvData = [...salesExportRows, {}, { 'Date': '--- TOP SELLING ITEMS ---' }, ...topExportRows];
      }
      if (reportSection === 'full') {
        combinedCsvData = [...combinedCsvData, {}, { 'Date': '--- DELIVERY RECORDS ---' }, ...deliveryExportRows];
      }

      const ws = XLSX.utils.json_to_sheet(combinedCsvData);
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Sales_Report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Add entry to Recent Exported Reports list
    const newEntry = {
      id: Date.now(),
      format: exportFormat,
      filename: `Sales_Report_${dateStr}.${exportFormat.toLowerCase()}`,
      date: timestampFormatted,
      rawDate: dateStr,
      size: exportFormat === 'PDF' ? '1.1 MB' : exportFormat === 'XLSX' ? '640 KB' : '420 KB',
    };

    setExportedReports((prev) => [newEntry, ...prev]);
    setIsGenerateModalOpen(false);
  };

  // Export top 10 items directly to XLSX
  const handleExportTopTenXlsx = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const topExportRows = topSellingItems.slice(0, 10).map((it, idx) => ({
      'Rank': idx + 1,
      'Item Name': it.name,
      'Category': it.category || 'Food',
      'Units Sold': it.unitsSold,
      'Trend': `${it.trendUp ? '+' : '-'}${it.trend}%`,
    }));

    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(topExportRows);
    XLSX.utils.book_append_sheet(workbook, ws, 'Top Selling Items');
    XLSX.writeFile(workbook, `Top_Selling_Items_${dateStr}.xlsx`);
  };

  // Download item from history or recent list
  const handleDownloadReportItem = (report) => {
    // Generate simulated file for existing reports
    if (report.format === 'PDF') {
      const doc = new jsPDF();
      doc.setFillColor(255, 165, 0);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(report.filename, 14, 14);
      doc.setTextColor(50, 50, 50);
      doc.text(`Exported on ${report.date}`, 14, 30);
      doc.save(report.filename);
    } else {
      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([{ 'Report Name': report.filename, 'Date': report.date, 'Status': 'Archived' }]);
      XLSX.utils.book_append_sheet(workbook, ws, 'Summary');
      XLSX.writeFile(workbook, report.filename);
    }
  };

  // History filtered reports
  const filteredHistoryReports = useMemo(() => {
    return exportedReports.filter((r) => {
      const matchesSearch = r.filename.toLowerCase().includes(historySearch.trim().toLowerCase());
      const matchesFormat = historyFormatFilter === 'All' || r.format.toUpperCase() === historyFormatFilter.toUpperCase();
      return matchesSearch && matchesFormat;
    });
  }, [exportedReports, historySearch, historyFormatFilter]);

  return (
    <div className="reports-page">
      {/* Page Title */}
      <div className="reports-header">
        <h1 className="reports-title">Records & Reports</h1>
      </div>

      {/* 4 Stat Cards */}
      <div className="reports-stats-grid">
        <div className="reports-stat-card">
          <div className="reports-stat-label">Total Sales Today</div>
          <div className="reports-stat-value sales">{formatCurrency(totalSalesToday)}</div>
          <div className="reports-stat-footer">
            <span className="reports-stat-trend-up">↑ 12%</span>
            <span>vs yesterday</span>
          </div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-label">Completed Deliveries</div>
          <div className="reports-stat-value">{completedDeliveries}</div>
          <div className="reports-stat-subtext">Successfully delivered today</div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-label">Avg. Delivery Time</div>
          <div className="reports-stat-value">14 mins</div>
          <div className="reports-stat-subtext">Delivery Orders only</div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-label">Total Orders</div>
          <div className="reports-stat-value">{totalOrdersCount}</div>
          <div className="reports-stat-subtext">All orders for today</div>
        </div>
      </div>

      {/* 3 Tabs Bar */}
      <div className="reports-tabs-bar">
        <button
          className={`reports-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Records
        </button>
        <button
          className={`reports-tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery')}
        >
          Delivery Records
        </button>
        <button
          className={`reports-tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          Customer Records
        </button>
      </div>

      {/* Main Table Card */}
      <div className="reports-main-card">
        {/* TAB 1 — Sales Records */}
        {activeTab === 'sales' && (
          <div>
            <div className="reports-filter-bar">
              <div className="reports-filter-left">
                <div className="reports-search-box">
                  <LuSearch className="reports-search-icon" />
                  <input
                    type="text"
                    placeholder="Search Order ID..."
                    value={salesSearch}
                    onChange={(e) => {
                      setSalesSearch(e.target.value);
                      setSalesPage(1);
                    }}
                  />
                </div>

                <div className="reports-date-filter">
                  <span>From</span>
                  <input
                    type="date"
                    className="reports-date-input"
                    value={salesDateFrom}
                    onChange={(e) => {
                      setSalesDateFrom(e.target.value);
                      setSalesPage(1);
                    }}
                  />
                  <span>To</span>
                  <input
                    type="date"
                    className="reports-date-input"
                    value={salesDateTo}
                    onChange={(e) => {
                      setSalesDateTo(e.target.value);
                      setSalesPage(1);
                    }}
                  />
                </div>
              </div>

              <button
                className="reports-btn-generate"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                <LuFileSpreadsheet />
                Generate Report
              </button>
            </div>

            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Items Sold</th>
                    <th>Order Type</th>
                    <th>Total Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.length > 0 ? (
                    paginatedSales.map((order) => {
                      const isCompleted = (order.status || '').toLowerCase() === 'completed';
                      return (
                        <tr key={order.id || order.orderId}>
                          <td>{formatDate(order.createdAt)}</td>
                          <td className="reports-order-id">#{order.orderId || order.id}</td>
                          <td>{formatItemsList(order.items)}</td>
                          <td>{order.orderType || 'Walk-In'}</td>
                          <td className="reports-total-amount">{formatCurrency(order.total)}</td>
                          <td>
                            <span className="reports-badge cod">COD</span>
                          </td>
                          <td>
                            {isCompleted ? (
                              <span className="reports-badge paid">Paid</span>
                            ) : (
                              <span className={`reports-badge ${(order.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                {order.status || 'Pending'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div className="reports-empty-state">
                          <div className="reports-empty-title">No sales records yet</div>
                          <div className="reports-empty-subtext">Orders will appear here once created</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sales Pagination */}
            <div className="reports-table-footer">
              <div className="reports-pagination-info">
                Showing {filteredSales.length > 0 ? (salesPage - 1) * PAGE_SIZE + 1 : 0} to{' '}
                {Math.min(salesPage * PAGE_SIZE, filteredSales.length)} of {filteredSales.length} transactions
              </div>
              <div className="reports-pagination-controls">
                <button
                  className="reports-page-btn"
                  disabled={salesPage <= 1}
                  onClick={() => setSalesPage((p) => p - 1)}
                >
                  <LuChevronLeft />
                </button>
                {Array.from({ length: totalSalesPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`reports-page-btn ${salesPage === pageNum ? 'active' : ''}`}
                    onClick={() => setSalesPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="reports-page-btn"
                  disabled={salesPage >= totalSalesPages}
                  onClick={() => setSalesPage((p) => p + 1)}
                >
                  <LuChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 — Delivery Records */}
        {activeTab === 'delivery' && (
          <div>
            <div className="reports-filter-bar">
              <div className="reports-filter-left">
                <div className="reports-search-box">
                  <LuSearch className="reports-search-icon" />
                  <input
                    type="text"
                    placeholder="Search Order ID or rider"
                    value={deliverySearch}
                    onChange={(e) => {
                      setDeliverySearch(e.target.value);
                      setDeliveryPage(1);
                    }}
                  />
                </div>

                <div className="reports-date-filter">
                  <span>From</span>
                  <input
                    type="date"
                    className="reports-date-input"
                    value={deliveryDateFrom}
                    onChange={(e) => {
                      setDeliveryDateFrom(e.target.value);
                      setDeliveryPage(1);
                    }}
                  />
                  <span>To</span>
                  <input
                    type="date"
                    className="reports-date-input"
                    value={deliveryDateTo}
                    onChange={(e) => {
                      setDeliveryDateTo(e.target.value);
                      setDeliveryPage(1);
                    }}
                  />
                </div>

                <select
                  className="reports-select-filter"
                  value={deliveryStatusFilter}
                  onChange={(e) => {
                    setDeliveryStatusFilter(e.target.value);
                    setDeliveryPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Rider</th>
                    <th>Duration</th>
                    <th>Distance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliveries.length > 0 ? (
                    paginatedDeliveries.map((order) => {
                      const isCompleted = (order.status || '').toLowerCase() === 'completed';
                      return (
                        <tr key={order.id || order.orderId}>
                          <td>{formatDate(order.createdAt)}</td>
                          <td className="reports-order-id">#{order.orderId || order.id}</td>
                          <td>{order.customerName || 'Customer'}</td>
                          <td>{order.driverName || 'Unassigned'}</td>
                          <td>-- mins</td>
                          <td>-- km</td>
                          <td>
                            {isCompleted ? (
                              <span className="reports-badge completed">Completed</span>
                            ) : (
                              <span className={`reports-badge ${(order.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                {order.status || 'Pending'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div className="reports-empty-state">
                          <div className="reports-empty-title">No delivery records yet</div>
                          <div className="reports-empty-subtext">Online delivery orders will appear here</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Delivery Pagination */}
            <div className="reports-table-footer">
              <div className="reports-pagination-info">
                Showing {filteredDeliveries.length > 0 ? (deliveryPage - 1) * PAGE_SIZE + 1 : 0} to{' '}
                {Math.min(deliveryPage * PAGE_SIZE, filteredDeliveries.length)} of {filteredDeliveries.length} deliveries
              </div>
              <div className="reports-pagination-controls">
                <button
                  className="reports-page-btn"
                  disabled={deliveryPage <= 1}
                  onClick={() => setDeliveryPage((p) => p - 1)}
                >
                  <LuChevronLeft />
                </button>
                {Array.from({ length: totalDeliveryPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`reports-page-btn ${deliveryPage === pageNum ? 'active' : ''}`}
                    onClick={() => setDeliveryPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="reports-page-btn"
                  disabled={deliveryPage >= totalDeliveryPages}
                  onClick={() => setDeliveryPage((p) => p + 1)}
                >
                  <LuChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — Customer Records */}
        {activeTab === 'customer' && (
          <div>
            <div className="reports-filter-bar">
              <div className="reports-filter-left">
                <div className="reports-search-box">
                  <LuSearch className="reports-search-icon" />
                  <input
                    type="text"
                    placeholder="Search customer name"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerPage(1);
                    }}
                  />
                </div>

                <select
                  className="reports-select-filter"
                  value={customerStatusFilter}
                  onChange={(e) => {
                    setCustomerStatusFilter(e.target.value);
                    setCustomerPage(1);
                  }}
                >
                  <option value="All">All Customers</option>
                  <option value="Frequent">Frequent</option>
                  <option value="Regular">Regular</option>
                  <option value="New">New</option>
                </select>
              </div>
            </div>

            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                    <th>Loyalty Points</th>
                    <th>Last Order Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.length > 0 ? (
                    paginatedCustomers.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.totalOrders} orders</td>
                        <td className="reports-total-amount">{formatCurrency(c.totalSpent)}</td>
                        <td className="reports-loyalty-pts">{c.loyaltyPoints} pts</td>
                        <td>{c.lastOrderDate}</td>
                        <td>
                          <span className={`reports-badge ${c.status.toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="reports-empty-state">
                          <div className="reports-empty-title">No customer records found</div>
                          <div className="reports-empty-subtext">Try changing your search or filter</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="reports-note-text">
              Loyalty points are earned by customers through completed orders. View only.
            </div>

            {/* Customer Pagination */}
            <div className="reports-table-footer">
              <div className="reports-pagination-info">
                Showing {filteredCustomers.length > 0 ? (customerPage - 1) * PAGE_SIZE + 1 : 0} to{' '}
                {Math.min(customerPage * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length} customers
              </div>
              <div className="reports-pagination-controls">
                <button
                  className="reports-page-btn"
                  disabled={customerPage <= 1}
                  onClick={() => setCustomerPage((p) => p - 1)}
                >
                  <LuChevronLeft />
                </button>
                {Array.from({ length: totalCustomerPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`reports-page-btn ${customerPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCustomerPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="reports-page-btn"
                  disabled={customerPage >= totalCustomerPages}
                  onClick={() => setCustomerPage((p) => p + 1)}
                >
                  <LuChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid Section */}
      <div className="reports-bottom-grid">
        {/* Bottom Left — Top Selling Items */}
        <div className="reports-bottom-card">
          <div className="reports-bottom-header">
            <h3 className="reports-bottom-title">Top Selling Items</h3>
            <button
              className="reports-link-action"
              onClick={() => setIsTopSellingModalOpen(true)}
            >
              View Full List
            </button>
          </div>

          <div className="reports-top-list">
            {topSellingItems.slice(0, 5).map((item, idx) => (
              <div key={item.name} className="reports-top-item-row">
                <div className="reports-top-item-left">
                  <span className="reports-rank-badge">#{idx + 1}</span>
                  <span className="reports-top-item-name">{item.name}</span>
                </div>
                <div className="reports-top-item-right">
                  <span className="reports-units-count">{item.unitsSold} units</span>
                  <span className={`reports-trend-badge ${item.trendUp ? 'up' : 'down'}`}>
                    {item.trendUp ? <LuArrowUp /> : <LuArrowDown />}
                    {item.trend}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Right — Recent Exported Reports */}
        <div className="reports-bottom-card">
          <div className="reports-bottom-header">
            <h3 className="reports-bottom-title">Recent Exported Reports</h3>
            <button
              className="reports-link-action"
              onClick={() => setIsHistoryModalOpen(true)}
            >
              History
            </button>
          </div>

          <div className="reports-recent-list">
            {exportedReports.slice(0, 4).map((report) => (
              <div key={report.id} className="reports-recent-row">
                <div className="reports-recent-left">
                  <span className={`reports-format-badge ${report.format.toLowerCase()}`}>
                    {report.format}
                  </span>
                  <div className="reports-recent-details">
                    <div className="reports-recent-filename" title={report.filename}>
                      {report.filename}
                    </div>
                    <div className="reports-recent-date">{report.date}</div>
                  </div>
                </div>

                <div className="reports-recent-right">
                  <span className="reports-recent-size">{report.size}</span>
                  <button
                    className="reports-download-btn"
                    title="Download Report"
                    onClick={() => handleDownloadReportItem(report)}
                  >
                    <LuDownload />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MODAL 1: GENERATE REPORT MODAL ===== */}
      {isGenerateModalOpen && (
        <div className="reports-modal-overlay" onClick={() => setIsGenerateModalOpen(false)}>
          <div className="reports-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="reports-modal-header">
              <div>
                <h3 className="reports-modal-title">Generate Sales Report</h3>
                <p className="reports-modal-subtitle">
                  Choose your export format and what data to include
                </p>
              </div>
              <button
                className="reports-modal-close-btn"
                onClick={() => setIsGenerateModalOpen(false)}
              >
                <LuX />
              </button>
            </div>

            <div className="reports-modal-body">
              {/* Format Selection */}
              <div className="reports-form-group">
                <label className="reports-form-label">Export Format</label>
                <div className="reports-format-group">
                  <button
                    type="button"
                    className={`reports-format-option ${exportFormat === 'PDF' ? 'selected' : ''}`}
                    onClick={() => setExportFormat('PDF')}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className={`reports-format-option ${exportFormat === 'CSV' ? 'selected' : ''}`}
                    onClick={() => setExportFormat('CSV')}
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    className={`reports-format-option ${exportFormat === 'XLSX' ? 'selected' : ''}`}
                    onClick={() => setExportFormat('XLSX')}
                  >
                    XLSX
                  </button>
                </div>
              </div>

              {/* Include Sections */}
              <div className="reports-form-group">
                <label className="reports-form-label">Include Sections</label>
                <div className="reports-radio-group">
                  <label className="reports-radio-item">
                    <input
                      type="radio"
                      name="reportSection"
                      value="summary"
                      checked={reportSection === 'summary'}
                      onChange={(e) => setReportSection(e.target.value)}
                    />
                    <span>Sales Summary Only</span>
                  </label>
                  <label className="reports-radio-item">
                    <input
                      type="radio"
                      name="reportSection"
                      value="sales_top"
                      checked={reportSection === 'sales_top'}
                      onChange={(e) => setReportSection(e.target.value)}
                    />
                    <span>Sales + Top Selling Items</span>
                  </label>
                  <label className="reports-radio-item">
                    <input
                      type="radio"
                      name="reportSection"
                      value="full"
                      checked={reportSection === 'full'}
                      onChange={(e) => setReportSection(e.target.value)}
                    />
                    <span>Full Report (Sales, Deliveries, Top Items)</span>
                  </label>
                </div>
              </div>

              {/* Report Date */}
              <div className="reports-form-group">
                <label className="reports-form-label">Report Date</label>
                <input
                  type="date"
                  className="reports-date-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px' }}
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
            </div>

            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-btn-secondary"
                onClick={() => setIsGenerateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="reports-btn-primary"
                onClick={handleGenerateAndDownload}
              >
                Generate & Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 2: TOP 10 SELLING ITEMS FULL LIST MODAL ===== */}
      {isTopSellingModalOpen && (
        <div className="reports-modal-overlay" onClick={() => setIsTopSellingModalOpen(false)}>
          <div
            className="reports-modal-container large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reports-modal-header">
              <div>
                <h3 className="reports-modal-title">Top 10 Selling Items — Full List</h3>
                <p className="reports-modal-subtitle">
                  Ranked by all units ordered
                </p>
              </div>
              <button
                className="reports-modal-close-btn"
                onClick={() => setIsTopSellingModalOpen(false)}
              >
                <LuX />
              </button>
            </div>

            <div className="reports-modal-body">
              <table className="reports-modal-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellingItems.slice(0, 10).map((item, idx) => (
                    <tr key={item.name}>
                      <td style={{ fontWeight: 700, color: '#888' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td style={{ fontWeight: 600 }}>{item.unitsSold} units</td>
                      <td>
                        <span className={`reports-trend-badge ${item.trendUp ? 'up' : 'down'}`}>
                          {item.trendUp ? <LuArrowUp /> : <LuArrowDown />}
                          {item.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-btn-secondary"
                onClick={() => setIsTopSellingModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="reports-btn-primary"
                onClick={handleExportTopTenXlsx}
              >
                Export This List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 3: ALL EXPORTED REPORTS (HISTORY) MODAL ===== */}
      {isHistoryModalOpen && (
        <div className="reports-modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
          <div
            className="reports-modal-container large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reports-modal-header">
              <div>
                <h3 className="reports-modal-title">All Exported Reports</h3>
                <p className="reports-modal-subtitle">
                  History of generated and downloaded report files
                </p>
              </div>
              <button
                className="reports-modal-close-btn"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                <LuX />
              </button>
            </div>

            <div className="reports-modal-body">
              <div className="reports-filter-bar" style={{ marginBottom: 16 }}>
                <div className="reports-filter-left">
                  <div className="reports-search-box">
                    <LuSearch className="reports-search-icon" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="reports-select-filter"
                    value={historyFormatFilter}
                    onChange={(e) => setHistoryFormatFilter(e.target.value)}
                  >
                    <option value="All">All Format</option>
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                    <option value="XLSX">XLSX</option>
                  </select>

                  <select
                    className="reports-select-filter"
                    value={historyDateFilter}
                    onChange={(e) => setHistoryDateFilter(e.target.value)}
                  >
                    <option value="All">All Dates</option>
                  </select>
                </div>
              </div>

              <div className="reports-recent-list">
                {filteredHistoryReports.length > 0 ? (
                  filteredHistoryReports.map((report) => (
                    <div key={report.id} className="reports-recent-row">
                      <div className="reports-recent-left">
                        <span className={`reports-format-badge ${report.format.toLowerCase()}`}>
                          {report.format}
                        </span>
                        <div className="reports-recent-details">
                          <div className="reports-recent-filename">{report.filename}</div>
                          <div className="reports-recent-date">{report.date}</div>
                        </div>
                      </div>

                      <div className="reports-recent-right">
                        <span className="reports-recent-size">{report.size}</span>
                        <button
                          className="reports-download-btn"
                          title="Download"
                          onClick={() => handleDownloadReportItem(report)}
                        >
                          <LuDownload />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="reports-empty-state">
                    <div className="reports-empty-title">No reports match your filters</div>
                  </div>
                )}
              </div>
            </div>

            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-btn-secondary"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
