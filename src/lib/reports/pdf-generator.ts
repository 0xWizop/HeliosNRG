import { jsPDF } from 'jspdf';

interface ReportData {
  teamName: string;
  generatedAt: string;
  dateRange: { start: string; end: string };
  summary: {
    totalWorkloads: number;
    totalEnergyKwh: number;
    totalCarbonKg: number;
    totalCostUsd: number;
    avgUtilization: number;
  };
  workloads: Array<{
    name: string;
    provider: string;
    region: string;
    instanceType: string;
    energyKwh: number;
    carbonKg: number;
    costUsd: number;
    utilization: number;
  }>;
  recommendations?: Array<{
    title: string;
    priority: string;
    carbonSavings: number;
    costSavings: number;
  }>;
  carbonTargets?: Array<{
    name: string;
    targetValue: number;
    currentValue: number;
    status: string;
  }>;
}

export async function generatePDFReport(data: ReportData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper functions
  const addText = (text: string, x: number, y: number, options?: { 
    fontSize?: number; 
    fontStyle?: 'normal' | 'bold';
    color?: [number, number, number];
    align?: 'left' | 'center' | 'right';
  }) => {
    const { fontSize = 10, fontStyle = 'normal', color = [255, 255, 255], align = 'left' } = options || {};
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    if (align === 'center') {
      pdf.text(text, pageWidth / 2, y, { align: 'center' });
    } else if (align === 'right') {
      pdf.text(text, pageWidth - margin, y, { align: 'right' });
    } else {
      pdf.text(text, x, y);
    }
  };

  const addLine = (y: number, color: [number, number, number] = [64, 64, 64]) => {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.line(margin, y, pageWidth - margin, y);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Set background color
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');

  // Header
  pdf.setFillColor(245, 158, 11); // Amber
  pdf.circle(margin + 3, yPos + 3, 3, 'F');
  addText('HELIOS', margin + 10, yPos + 5, { fontSize: 14, fontStyle: 'bold', color: [255, 255, 255] });
  addText('Carbon Intelligence Report', margin, yPos + 15, { fontSize: 20, fontStyle: 'bold', color: [255, 255, 255] });
  yPos += 25;

  addText(data.teamName, margin, yPos, { fontSize: 12, color: [200, 200, 200] });
  yPos += 7;
  addText(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, margin, yPos, { fontSize: 9, color: [150, 150, 150] });
  addText(`Period: ${data.dateRange.start} to ${data.dateRange.end}`, 0, yPos, { fontSize: 9, color: [150, 150, 150], align: 'right' });
  yPos += 10;

  addLine(yPos, [64, 64, 64]);
  yPos += 15;

  // Executive Summary
  addText('EXECUTIVE SUMMARY', margin, yPos, { fontSize: 12, fontStyle: 'bold', color: [245, 158, 11] });
  yPos += 12;

  // Summary boxes
  const boxWidth = (contentWidth - 15) / 4;
  const boxHeight = 25;
  const summaryItems = [
    { label: 'Workloads', value: data.summary.totalWorkloads.toString(), color: [59, 130, 246] },
    { label: 'Energy (kWh)', value: data.summary.totalEnergyKwh.toLocaleString(), color: [139, 92, 246] },
    { label: 'Carbon (kg)', value: data.summary.totalCarbonKg.toLocaleString(), color: [16, 185, 129] },
    { label: 'Cost (USD)', value: `$${data.summary.totalCostUsd.toLocaleString()}`, color: [245, 158, 11] },
  ];

  summaryItems.forEach((item, i) => {
    const x = margin + i * (boxWidth + 5);
    pdf.setFillColor(30, 30, 30);
    pdf.rect(x, yPos, boxWidth, boxHeight, 'F');
    pdf.setDrawColor(item.color[0], item.color[1], item.color[2]);
    pdf.rect(x, yPos, boxWidth, boxHeight, 'S');
    
    addText(item.label, x + 5, yPos + 8, { fontSize: 8, color: [150, 150, 150] });
    addText(item.value, x + 5, yPos + 18, { fontSize: 14, fontStyle: 'bold', color: [255, 255, 255] });
  });

  yPos += boxHeight + 15;

  // Workloads Table
  checkPageBreak(50);
  addText('WORKLOAD BREAKDOWN', margin, yPos, { fontSize: 12, fontStyle: 'bold', color: [245, 158, 11] });
  yPos += 10;

  // Table header
  pdf.setFillColor(30, 30, 30);
  pdf.rect(margin, yPos, contentWidth, 8, 'F');
  
  const colWidths = [45, 25, 25, 25, 25, 25];
  const colPositions = [margin];
  colWidths.forEach((w, i) => {
    if (i > 0) colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
  });

  const headers = ['Workload', 'Provider', 'Region', 'Energy', 'Carbon', 'Cost'];
  headers.forEach((h, i) => {
    addText(h, colPositions[i] + 2, yPos + 5.5, { fontSize: 7, fontStyle: 'bold', color: [200, 200, 200] });
  });
  yPos += 8;

  // Table rows
  const displayWorkloads = data.workloads.slice(0, 15);
  displayWorkloads.forEach((workload, rowIndex) => {
    checkPageBreak(8);
    
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(20, 20, 20);
      pdf.rect(margin, yPos, contentWidth, 7, 'F');
    }

    const rowData = [
      workload.name.substring(0, 20),
      workload.provider,
      workload.region.substring(0, 10),
      `${workload.energyKwh.toFixed(0)} kWh`,
      `${workload.carbonKg.toFixed(1)} kg`,
      `$${workload.costUsd.toFixed(0)}`,
    ];

    rowData.forEach((cell, i) => {
      addText(cell, colPositions[i] + 2, yPos + 5, { fontSize: 7, color: [200, 200, 200] });
    });

    yPos += 7;
  });

  if (data.workloads.length > 15) {
    addText(`... and ${data.workloads.length - 15} more workloads`, margin, yPos + 5, { fontSize: 8, color: [150, 150, 150] });
    yPos += 10;
  }

  yPos += 10;

  // Recommendations
  if (data.recommendations && data.recommendations.length > 0) {
    checkPageBreak(40);
    addText('OPTIMIZATION RECOMMENDATIONS', margin, yPos, { fontSize: 12, fontStyle: 'bold', color: [245, 158, 11] });
    yPos += 10;

    data.recommendations.slice(0, 5).forEach((rec) => {
      checkPageBreak(15);
      
      pdf.setFillColor(30, 30, 30);
      pdf.rect(margin, yPos, contentWidth, 12, 'F');
      
      const priorityColor: [number, number, number] = 
        rec.priority === 'high' ? [239, 68, 68] : 
        rec.priority === 'medium' ? [245, 158, 11] : [59, 130, 246];
      
      pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      pdf.rect(margin, yPos, 3, 12, 'F');
      
      addText(rec.title, margin + 6, yPos + 5, { fontSize: 8, fontStyle: 'bold', color: [255, 255, 255] });
      addText(`-${rec.carbonSavings} kg CO₂  |  -$${rec.costSavings}`, margin + 6, yPos + 10, { fontSize: 7, color: [16, 185, 129] });
      
      yPos += 14;
    });

    yPos += 5;
  }

  // Carbon Targets
  if (data.carbonTargets && data.carbonTargets.length > 0) {
    checkPageBreak(40);
    addText('CARBON TARGETS', margin, yPos, { fontSize: 12, fontStyle: 'bold', color: [245, 158, 11] });
    yPos += 10;

    data.carbonTargets.forEach((target) => {
      checkPageBreak(20);
      
      pdf.setFillColor(30, 30, 30);
      pdf.rect(margin, yPos, contentWidth, 15, 'F');
      
      const statusColor: [number, number, number] = 
        target.status === 'achieved' ? [16, 185, 129] :
        target.status === 'on_track' ? [59, 130, 246] :
        target.status === 'at_risk' ? [245, 158, 11] : [239, 68, 68];
      
      addText(target.name, margin + 5, yPos + 6, { fontSize: 9, fontStyle: 'bold', color: [255, 255, 255] });
      addText(`Current: ${target.currentValue} | Target: ${target.targetValue}`, margin + 5, yPos + 12, { fontSize: 7, color: [150, 150, 150] });
      
      // Status badge
      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      const statusText = target.status.replace('_', ' ').toUpperCase();
      pdf.rect(pageWidth - margin - 25, yPos + 4, 22, 7, 'F');
      addText(statusText, pageWidth - margin - 24, yPos + 9, { fontSize: 6, fontStyle: 'bold', color: [0, 0, 0] });
      
      yPos += 17;
    });
  }

  // Footer
  const footerY = pdf.internal.pageSize.getHeight() - 10;
  addLine(footerY - 5, [64, 64, 64]);
  addText('Generated by Helios Energy • https://heliosnrg-2ab01.web.app', 0, footerY, { fontSize: 8, color: [100, 100, 100], align: 'center' });

  return pdf.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
