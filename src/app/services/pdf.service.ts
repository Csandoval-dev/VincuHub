// src/app/services/pdf.service.ts

import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface CertificadoData {
  nombreEstudiante: string;
  nombreEvento: string;
  horasGanadas: number;
  fechaEvento: Date;
  nombreCoordinador: string;
  campus: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  generarCertificado(data: CertificadoData): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Borde decorativo
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Logo CEUTEC (texto por ahora, puedes agregar imagen después)
    doc.setFontSize(24);
    doc.setTextColor(0, 102, 204);
    doc.setFont('helvetica', 'bold');
    doc.text('CEUTEC', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Centro Universitario Tecnológico', pageWidth / 2, 38, { align: 'center' });

    // Título del certificado
    doc.setFontSize(28);
    doc.setTextColor(0, 102, 204);
    doc.setFont('times', 'bold');
    doc.text('CERTIFICADO DE PARTICIPACIÓN', pageWidth / 2, 60, { align: 'center' });

    // Línea decorativa
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(60, 65, pageWidth - 60, 65);

    // Texto "Se otorga a"
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text('Se otorga el presente certificado a:', pageWidth / 2, 80, { align: 'center' });

    // Nombre del estudiante
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.text(data.nombreEstudiante.toUpperCase(), pageWidth / 2, 95, { align: 'center' });

    // Línea bajo el nombre
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    const nombreWidth = doc.getTextWidth(data.nombreEstudiante.toUpperCase());
    const lineStart = (pageWidth - nombreWidth) / 2 - 10;
    const lineEnd = (pageWidth + nombreWidth) / 2 + 10;
    doc.line(lineStart, 98, lineEnd, 98);

    // Descripción
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text('Por su participación en el evento:', pageWidth / 2, 110, { align: 'center' });

    // Nombre del evento
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.setFont('helvetica', 'bold');
    
    // Dividir título largo en múltiples líneas
    const splitTitle = doc.splitTextToSize(data.nombreEvento, pageWidth - 100);
    doc.text(splitTitle, pageWidth / 2, 120, { align: 'center' });

    // Horas
    const horasY = 120 + (splitTitle.length * 6);
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Con una duración de ${data.horasGanadas} hora${data.horasGanadas !== 1 ? 's' : ''} de vinculación universitaria`,
      pageWidth / 2,
      horasY + 10,
      { align: 'center' }
    );

    // Fecha
    const fechaFormateada = this.formatearFecha(data.fechaEvento);
    doc.text(
      `Realizado el ${fechaFormateada} en ${data.campus}`,
      pageWidth / 2,
      horasY + 20,
      { align: 'center' }
    );

    // Firma
    const firmaY = pageHeight - 50;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 40, firmaY, pageWidth / 2 + 40, firmaY);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(data.nombreCoordinador, pageWidth / 2, firmaY + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Coordinador de Vinculación Universitaria', pageWidth / 2, firmaY + 12, { align: 'center' });

    // Fecha de emisión
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const fechaEmision = new Date().toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Emitido: ${fechaEmision}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Código único (simulado)
    const codigoUnico = `CERT-${Date.now().toString().slice(-8)}`;
    doc.text(`Código: ${codigoUnico}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Descargar PDF
    const nombreArchivo = `Certificado_${data.nombreEstudiante.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
  }

  // Generar certificados múltiples (ZIP)
  async generarCertificadosMultiples(certificados: CertificadoData[]): Promise<void> {
    for (const cert of certificados) {
      this.generarCertificado(cert);
      // Pequeña pausa entre descargas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}