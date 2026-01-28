// "use client";

// import { use, useEffect, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { api } from "@/lib/api/client";
// import { SimpleTemplate } from "@/components/pdf-templates/simple-template";
// import { DefaultTemplate } from "@/components/pdf-templates/default-template";
// import { DetailedTemplate } from "@/components/pdf-templates/detailed-template";
// import { Loader2, Download } from "lucide-react";
// import { Button } from "@/components/ui/button";

// interface PdfPageProps {
//   params: Promise<{ id: string; type: string }>;
// }

// export default function PdfPage({ params }: PdfPageProps) {
//   const { id, type } = use(params);
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   // Fetch proposal data
//   const { data: proposalResponse, isLoading } = useQuery({
//     queryKey: ["proposal", id],
//     queryFn: () => api.get(`/api/proposals/${id}`),
//     enabled: isClient,
//   });

//   const proposal = (proposalResponse as any)?.data;

//   const handlePrint = () => {
//     window.print();
//   };

//   if (isLoading || !isClient) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
//       </div>
//     );
//   }

//   if (!proposal) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <p className="text-lg text-gray-600">Proposal not found</p>
//       </div>
//     );
//   }

//   // Validate template type
//   const validTypes = ["simple", "standard", "detailed"];
//   const templateType = validTypes.includes(type) ? type : "standard";

//   return (
//     <>
//       <style jsx global>{`
//         :root {
//           --cream: #f6f0e4;
//           --red: #ab1a2d;
//           --black: #0a0a0a;
//           --dark-gray: #22231d;
//         }

//         * {
//           margin: 0;
//           padding: 0;
//           box-sizing: border-box;
//         }

//         @page {
//           size: A4;
//           margin: 0;
//         }

//         body {
//           font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
//           background: #ccc;
//           color: var(--black);
//           font-size: 12px;
//           line-height: 1.4;
//         }

//         .page {
//           width: 210mm;
//           min-height: 297mm;
//           padding: 15mm;
//           background: var(--cream);
//           position: relative;
//           page-break-after: avoid;
//           page-break-inside: avoid;
//           overflow: visible;
//           margin: 10mm auto;
//           box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
//         }

//         .page:not(:last-child) {
//           page-break-after: always;
//         }

//         .page:last-child {
//           page-break-after: avoid;
//         }

//         /* HEADER */
//         .header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 6mm;
//         }

//         /* FOOTER */
//         .footer {
//           position: absolute;
//           bottom: 8mm;
//           left: 15mm;
//           right: 15mm;
//           display: flex;
//           justify-content: space-between;
//           font-size: 12px;
//           color: #888;
//         }

//         .footer-center {
//           text-align: center;
//         }

//         /* ==================== COVER PAGE ==================== */
//         .cover-decorations {
//           position: absolute;
//           inset: 0;
//           overflow: hidden;
//           z-index: 0;
//         }

//         .cover-triangle-1 {
//           position: absolute;
//           width: 0;
//           height: 0;
//           border-left: 100mm solid transparent;
//           border-right: 100mm solid transparent;
//           border-bottom: 140mm solid var(--red);
//           opacity: 0.06;
//           top: -60mm;
//           right: -80mm;
//           transform: rotate(25deg);
//         }

//         .cover-triangle-2 {
//           position: absolute;
//           width: 0;
//           height: 0;
//           border-left: 80mm solid transparent;
//           border-right: 80mm solid transparent;
//           border-top: 100mm solid var(--dark-gray);
//           opacity: 0.08;
//           bottom: -20mm;
//           left: -60mm;
//           transform: rotate(-15deg);
//         }

//         .cover-stripe {
//           position: absolute;
//           width: 150%;
//           height: 25mm;
//           background: linear-gradient(
//             90deg,
//             transparent,
//             var(--red) 20%,
//             var(--red) 80%,
//             transparent
//           );
//           opacity: 0.05;
//           top: 40%;
//           left: -25%;
//           transform: rotate(-8deg);
//         }

//         .cover-rectangles {
//           position: absolute;
//           top: 50mm;
//           right: 20mm;
//           display: flex;
//           flex-direction: column;
//           gap: 2mm;
//         }

//         .cover-rect {
//           width: 15mm;
//           height: 4mm;
//           background: var(--red);
//           opacity: 0.15;
//         }

//         .cover-rect:nth-child(2) {
//           width: 10mm;
//           align-self: flex-end;
//         }

//         .cover-rect:nth-child(3) {
//           width: 12mm;
//         }

//         .cover-squares {
//           position: absolute;
//           bottom: 80mm;
//           right: 15mm;
//           display: grid;
//           grid-template-columns: repeat(3, 6mm);
//           gap: 2mm;
//         }

//         .cover-square {
//           width: 6mm;
//           height: 6mm;
//           background: var(--dark-gray);
//           opacity: 0.12;
//           transform: rotate(45deg);
//         }

//         .cover-content {
//           padding-top: 15mm;
//           position: relative;
//           z-index: 1;
//         }

//         .proposal-label {
//           color: var(--red);
//           font-size: 12px;
//           font-weight: bold;
//           letter-spacing: 1px;
//           margin-bottom: 3mm;
//         }

//         .venue-name {
//           font-size: 28px;
//           font-weight: bold;
//           color: var(--black);
//           margin-bottom: 2mm;
//         }

//         .venue-tier {
//           font-size: 16px;
//           color: var(--dark-gray);
//           margin-bottom: 12mm;
//         }

//         .value-box {
//           background: var(--red);
//           color: white;
//           padding: 6mm 8mm;
//           border-radius: 3mm;
//           display: inline-block;
//           margin-bottom: 12mm;
//         }

//         .value-label {
//           font-size: 12px;
//           margin-bottom: 2mm;
//         }

//         .value-amount {
//           font-size: 32px;
//           font-weight: bold;
//         }

//         .kam-info {
//           font-size: 12px;
//           color: var(--dark-gray);
//         }

//         .cover-footer {
//           position: absolute;
//           bottom: 0;
//           left: 0;
//           right: 0;
//           background: var(--dark-gray);
//           color: white;
//           padding: 4mm 12mm;
//           text-align: center;
//           z-index: 1;
//         }

//         .cover-footer .company {
//           font-size: 12px;
//           margin-bottom: 1mm;
//         }

//         .cover-footer .generated {
//           font-size: 12px;
//           color: #aaa;
//         }

//         /* ==================== SIMPLE TEMPLATE SPECIFIC ==================== */
//         .simple-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           margin-bottom: 8mm;
//           padding-bottom: 4mm;
//           border-bottom: 2px solid var(--red);
//         }

//         .simple-header-left {
//           flex: 1;
//         }

//         .simple-header-right {
//           text-align: right;
//         }

//         .simple-footer {
//           position: absolute;
//           bottom: 0;
//           left: 0;
//           right: 0;
//           background: var(--dark-gray);
//           color: white;
//           padding: 4mm 15mm;
//           text-align: center;
//           font-size: 12px;
//         }

//         .simple-footer .company {
//           font-size: 12px;
//           margin-bottom: 1mm;
//         }

//         .simple-footer .generated {
//           font-size: 12px;
//           color: #aaa;
//         }

//         /* ==================== CALENDAR ==================== */
//         .calendar-section {
//           margin-top: 6mm;
//         }

//         .page-title {
//           font-size: 18px;
//           font-weight: bold;
//           margin-bottom: 1mm;
//         }

//         .page-subtitle {
//           font-size: 12px;
//           color: var(--dark-gray);
//           margin-bottom: 4mm;
//         }

//         .calendar-grid {
//           display: grid;
//           grid-template-columns: repeat(4, 1fr);
//           grid-template-rows: repeat(3, auto);
//           gap: 3mm;
//           height: 100%;
//         }

//         .month-cell {
//           background: white;
//           border: 1px solid #ddd;
//           border-radius: 2mm;
//           padding: 3mm;
//           min-height: 50mm;
//           display: flex;
//           flex-direction: column;
//         }

//         .month-header {
//           font-size: 12px;
//           font-weight: bold;
//           color: var(--dark-gray);
//           border-bottom: 1px solid #eee;
//           padding-bottom: 1.5mm;
//           margin-bottom: 1.5mm;
//           flex-shrink: 0;
//         }

//         .month-content {
//           font-size: 12px;
//           flex-grow: 1;
//         }

//         .brand-group {
//           margin-bottom: 1.5mm;
//         }

//         .brand-row {
//           display: flex;
//           align-items: center;
//           gap: 1.5mm;
//           margin-bottom: 0.5mm;
//         }

//         .brand-logo {
//           width: 6mm;
//           height: 6mm;
//           border-radius: 50%;
//           flex-shrink: 0;
//           object-fit: cover;
//           border: 1px solid #ddd;
//         }

//         .brand-name {
//           font-weight: bold;
//           font-size: 12px;
//           color: var(--dark-gray);
//         }

//         .activation-list {
//           margin-left: 7.5mm;
//           color: #555;
//         }

//         .activation-item {
//           font-size: 12px;
//           line-height: 1.3;
//           margin-bottom: 0.5mm;
//         }

//         .activation-item::before {
//           content: "• ";
//           color: #999;
//         }

//         .no-activations {
//           color: #bbb;
//           font-style: italic;
//           font-size: 12px;
//         }

//         /* ==================== BREAKDOWN ==================== */
//         .breakdown-section {
//           margin-bottom: 6mm;
//         }

//         .section-title {
//           font-size: 14px;
//           font-weight: bold;
//           margin-bottom: 3mm;
//         }

//         .value-table {
//           width: 70%;
//           border-collapse: collapse;
//           margin-bottom: 5mm;
//         }

//         .value-table tr:nth-child(odd) {
//           background: white;
//         }

//         .value-table tr:nth-child(even) {
//           background: #eee;
//         }

//         .value-table td {
//           padding: 3mm 4mm;
//           font-size: 12px;
//         }

//         .value-table td:last-child {
//           text-align: right;
//           font-weight: bold;
//         }

//         .value-table .total-row {
//           background: var(--red) !important;
//           color: white;
//         }

//         .value-table .total-row td {
//           font-size: 14px;
//           font-weight: bold;
//           padding: 4mm 4mm;
//         }

//         .brands-list,
//         .venue-notes {
//           font-size: 12px;
//           color: var(--dark-gray);
//           margin-bottom: 4mm;
//         }

//         .kam-box {
//           border: 1.5px solid var(--red);
//           border-radius: 2mm;
//           padding: 4mm 5mm;
//           display: inline-block;
//           background: white;
//           margin-top: 3mm;
//         }

//         .kam-box-title {
//           font-size: 12px;
//           font-weight: bold;
//           color: var(--red);
//           margin-bottom: 2mm;
//         }

//         .kam-box-name {
//           font-size: 14px;
//           font-weight: bold;
//           margin-bottom: 2mm;
//         }

//         .kam-box-contact {
//           font-size: 12px;
//           color: var(--dark-gray);
//           line-height: 1.4;
//         }

//         /* ==================== ACTIVATION DETAILS ==================== */
//         .activation-detail-card {
//           background: white;
//           border-left: 3mm solid var(--red);
//           padding: 4mm;
//           margin-bottom: 5mm;
//           border-radius: 2mm;
//           page-break-inside: avoid;
//           -webkit-print-color-adjust: exact;
//           print-color-adjust: exact;
//         }

//         .activation-header {
//           display: flex;
//           align-items: center;
//           gap: 3mm;
//           margin-bottom: 3mm;
//           padding-bottom: 2mm;
//           border-bottom: 1px solid #eee;
//         }

//         .activation-brand-logo {
//           width: 10mm;
//           height: 10mm;
//           border-radius: 50%;
//           flex-shrink: 0;
//           object-fit: cover;
//           border: 1px solid #ddd;
//         }

//         .activation-title {
//           flex-grow: 1;
//         }

//         .activation-brand-name {
//           font-size: 12px;
//           color: #888;
//           margin-bottom: 1mm;
//         }

//         .activation-name {
//           font-size: 14px;
//           font-weight: bold;
//           color: var(--black);
//         }

//         .activation-months {
//           font-size: 12px;
//           color: var(--red);
//           font-weight: bold;
//         }

//         .activation-body {
//           font-size: 12px;
//           line-height: 1.5;
//         }

//         .activation-section {
//           margin-bottom: 3mm;
//         }

//         .activation-section-title {
//           font-size: 12px;
//           font-weight: bold;
//           color: var(--dark-gray);
//           margin-bottom: 1mm;
//           text-transform: uppercase;
//         }

//         .activation-description {
//           color: #555;
//           margin-bottom: 2mm;
//         }

//         .activation-list-items {
//           list-style: none;
//           padding-left: 0;
//         }

//         .activation-list-items li {
//           padding-left: 4mm;
//           margin-bottom: 1mm;
//           position: relative;
//         }

//         .activation-list-items li::before {
//           content: "•";
//           position: absolute;
//           left: 0;
//           color: var(--red);
//           font-weight: bold;
//         }

//         .activation-value {
//           display: inline-block;
//           background: var(--cream);
//           padding: 2mm 3mm;
//           border-radius: 1mm;
//           font-weight: bold;
//           color: var(--red);
//         }

//         /* Timestamped Notes */
//         .note-entry {
//           background: white;
//           border-left: 2mm solid #ddd;
//           padding: 3mm 4mm;
//           margin-bottom: 3mm;
//           font-size: 12px;
//         }

//         .note-meta {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 2mm;
//           font-size: 12px;
//           color: #888;
//         }

//         .note-author {
//           font-weight: bold;
//           color: var(--dark-gray);
//         }

//         .note-text {
//           color: #555;
//           line-height: 1.5;
//         }

//         /* ==================== DOWNLOAD BUTTON ==================== */
//         .download-button-container {
//           position: fixed;
//           top: 20px;
//           right: 20px;
//           z-index: 9999;
//         }

//         /* Print styles */
//         @media print {
//           body {
//             background: white;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//             margin: 0;
//             padding: 0;
//           }
//           .page {
//             margin: 0;
//             box-shadow: none;
//             page-break-after: avoid !important;
//             page-break-inside: avoid;
//             background: var(--cream) !important;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//           .page:not(:last-child) {
//             page-break-after: always !important;
//           }
//           .page:last-child {
//             page-break-after: avoid !important;
//           }
//           .activation-detail-card {
//             background: white !important;
//             page-break-inside: avoid !important;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//           .download-button-container {
//             display: none !important;
//           }
//         }
//       `}</style>

//       {/* Download Button - Hidden when printing */}
//       <div className="download-button-container">
//         <Button onClick={handlePrint} size="lg" className="shadow-lg">
//           <Download className="mr-2 h-5 w-5" />
//           Download PDF
//         </Button>
//       </div>

//       {/* Render appropriate template */}
//       {templateType === "simple" && <SimpleTemplate proposal={proposal} />}
//       {templateType === "standard" && <DefaultTemplate proposal={proposal} />}
//       {templateType === "detailed" && <DetailedTemplate proposal={proposal} />}
//     </>
//   );
// }

"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { SimpleTemplate } from "@/components/pdf-templates/simple-template";
import { DefaultTemplate } from "@/components/pdf-templates/default-template";
import { DetailedTemplate } from "@/components/pdf-templates/detailed-template";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfPageProps {
  params: Promise<{ id: string; type: string }>;
}

export default function PdfPage({ params }: PdfPageProps) {
  const { id, type } = use(params);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch proposal data
  const { data: proposalResponse, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => api.get(`/api/proposals/${id}`),
    enabled: isClient,
  });

  const proposal = (proposalResponse as any)?.data;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Proposal not found</p>
      </div>
    );
  }

  // Validate template type
  const validTypes = ["simple", "standard", "detailed"];
  const templateType = validTypes.includes(type) ? type : "standard";

  return (
    <>
      <style jsx global>{`
        :root {
          --cream: #f6f0e4;
          --red: #ab1a2d;
          --black: #0a0a0a;
          --dark-gray: #22231d;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: A4;
          margin: 0;
        }

        body {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          background: #ccc;
          color: var(--black);
          font-size: 12px;
          line-height: 1.4;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm;
          padding-bottom: 20mm;
          background: var(--cream);
          position: relative;
          page-break-after: avoid;
          page-break-inside: avoid;
          overflow: visible;
          margin: 10mm auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        /* Simple template specific overrides */
        .simple-page {
          page-break-inside: auto !important;
          min-height: auto;
        }

        .page:not(:last-child) {
          page-break-after: always;
        }

        .page:last-child {
          page-break-after: avoid;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6mm;
        }

        /* FOOTER */
        .footer {
          position: absolute;
          bottom: 8mm;
          left: 15mm;
          right: 15mm;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #888;
        }

        .footer-center {
          text-align: center;
        }

        /* ==================== COVER PAGE ==================== */
        .cover-decorations {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .cover-triangle-1 {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 100mm solid transparent;
          border-right: 100mm solid transparent;
          border-bottom: 140mm solid var(--red);
          opacity: 0.06;
          top: -60mm;
          right: -80mm;
          transform: rotate(25deg);
        }

        .cover-triangle-2 {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 80mm solid transparent;
          border-right: 80mm solid transparent;
          border-top: 100mm solid var(--dark-gray);
          opacity: 0.08;
          bottom: -20mm;
          left: -60mm;
          transform: rotate(-15deg);
        }

        .cover-stripe {
          position: absolute;
          width: 150%;
          height: 25mm;
          background: linear-gradient(
            90deg,
            transparent,
            var(--red) 20%,
            var(--red) 80%,
            transparent
          );
          opacity: 0.05;
          top: 40%;
          left: -25%;
          transform: rotate(-8deg);
        }

        .cover-rectangles {
          position: absolute;
          top: 50mm;
          right: 20mm;
          display: flex;
          flex-direction: column;
          gap: 2mm;
        }

        .cover-rect {
          width: 15mm;
          height: 4mm;
          background: var(--red);
          opacity: 0.15;
        }

        .cover-rect:nth-child(2) {
          width: 10mm;
          align-self: flex-end;
        }

        .cover-rect:nth-child(3) {
          width: 12mm;
        }

        .cover-squares {
          position: absolute;
          bottom: 80mm;
          right: 15mm;
          display: grid;
          grid-template-columns: repeat(3, 6mm);
          gap: 2mm;
        }

        .cover-square {
          width: 6mm;
          height: 6mm;
          background: var(--dark-gray);
          opacity: 0.12;
          transform: rotate(45deg);
        }

        .cover-content {
          padding-top: 15mm;
          position: relative;
          z-index: 1;
        }

        .proposal-label {
          color: var(--red);
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 3mm;
        }

        .venue-name {
          font-size: 28px;
          font-weight: bold;
          color: var(--black);
          margin-bottom: 2mm;
        }

        .venue-tier {
          font-size: 16px;
          color: var(--dark-gray);
          margin-bottom: 12mm;
        }

        .value-box {
          background: var(--red);
          color: white;
          padding: 6mm 8mm;
          border-radius: 3mm;
          display: inline-block;
          margin-bottom: 12mm;
        }

        .value-label {
          font-size: 12px;
          margin-bottom: 2mm;
        }

        .value-amount {
          font-size: 32px;
          font-weight: bold;
        }

        .kam-info {
          font-size: 12px;
          color: var(--dark-gray);
        }

        .cover-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--dark-gray);
          color: white;
          padding: 4mm 12mm;
          text-align: center;
          z-index: 1;
        }

        .cover-footer .company {
          font-size: 12px;
          margin-bottom: 1mm;
        }

        .cover-footer .generated {
          font-size: 12px;
          color: #aaa;
        }

        /* ==================== SIMPLE TEMPLATE SPECIFIC ==================== */
        .simple-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8mm;
          padding-bottom: 4mm;
          border-bottom: 2px solid var(--red);
        }

        .simple-header-left {
          flex: 1;
        }

        .simple-header-right {
          text-align: right;
        }

        .simple-header .value-box {
          background: var(--red);
          color: white;
          padding: 4mm 6mm;
          border-radius: 2mm;
          display: inline-block;
        }

        .simple-header .value-label {
          font-size: 12px;
          margin-bottom: 1mm;
        }

        .simple-header .value-amount {
          font-size: 26px;
          font-weight: bold;
        }

        .simple-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--dark-gray);
          color: white;
          padding: 4mm 15mm;
          text-align: center;
          font-size: 12px;
        }

        .simple-footer .company {
          font-size: 12px;
          margin-bottom: 1mm;
        }

        .simple-footer .generated {
          font-size: 12px;
          color: #aaa;
        }

        /* ==================== CALENDAR ==================== */
        .calendar-section {
          margin-top: 6mm;
        }

        .page-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 2mm;
        }

        .page-subtitle {
          font-size: 12px;
          color: var(--dark-gray);
          margin-bottom: 4mm;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(3, auto);
          gap: 3mm;
        }

        .month-cell {
          background: white;
          border: 1px solid #ddd;
          border-radius: 2mm;
          padding: 3mm;
          min-height: 45mm;
          max-height: 65mm;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .month-header {
          font-size: 12px;
          font-weight: bold;
          color: var(--dark-gray);
          border-bottom: 1px solid #eee;
          padding-bottom: 2mm;
          margin-bottom: 2mm;
          flex-shrink: 0;
        }

        .month-content {
          font-size: 12px;
          flex-grow: 1;
          overflow: hidden;
        }

        .brand-group {
          margin-bottom: 2mm;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 2mm;
          margin-bottom: 1mm;
        }

        .brand-logo {
          width: 6mm;
          height: 6mm;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
          border: 1px solid #ddd;
        }

        .brand-name {
          font-weight: bold;
          font-size: 12px;
          color: var(--dark-gray);
        }

        .activation-list {
          margin-left: 7.5mm;
          color: #555;
        }

        .activation-item {
          font-size: 12px;
          line-height: 1.4;
          margin-bottom: 1mm;
        }

        .activation-item::before {
          content: "• ";
          color: #999;
        }

        .no-activations {
          color: #bbb;
          font-style: italic;
          font-size: 12px;
        }

        /* ==================== BREAKDOWN ==================== */
        .breakdown-section {
          margin-bottom: 6mm;
        }

        .section-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 3mm;
        }

        .value-table {
          width: 60%;
          border-collapse: collapse;
          margin-bottom: 5mm;
        }

        .value-table tr:nth-child(odd) {
          background: white;
        }

        .value-table tr:nth-child(even) {
          background: #eee;
        }

        .value-table td {
          padding: 2mm 3mm;
          font-size: 12px;
        }

        .value-table td:last-child {
          text-align: right;
          font-weight: bold;
        }

        .value-table .total-row {
          background: var(--red) !important;
          color: white;
        }

        .value-table .total-row td {
          font-size: 12px;
          font-weight: bold;
          padding: 2.5mm 3mm;
        }

        .brands-list,
        .venue-notes {
          font-size: 12px;
          color: var(--dark-gray);
          margin-bottom: 4mm;
        }

        .kam-box {
          border: 1.5px solid var(--red);
          border-radius: 2mm;
          padding: 3mm 4mm;
          display: inline-block;
          background: white;
          margin-top: 3mm;
        }

        .kam-box-title {
          font-size: 12px;
          font-weight: bold;
          color: var(--red);
          margin-bottom: 1.5mm;
        }

        .kam-box-name {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 1.5mm;
        }

        .kam-box-contact {
          font-size: 12px;
          color: var(--dark-gray);
          line-height: 1.4;
        }

        /* ==================== ACTIVATION DETAILS ==================== */
        .activation-detail-card {
          background: white;
          border-left: 3mm solid var(--red);
          padding: 4mm;
          margin-bottom: 5mm;
          border-radius: 2mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .activation-detail-card:last-child {
          margin-bottom: 0;
        }

        .activation-header {
          display: flex;
          align-items: center;
          gap: 3mm;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
          border-bottom: 1px solid #eee;
        }

        .activation-brand-logo {
          width: 10mm;
          height: 10mm;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
          border: 1px solid #ddd;
        }

        .activation-title {
          flex-grow: 1;
        }

        .activation-brand-name {
          font-size: 12px;
          color: #888;
          margin-bottom: 1mm;
        }

        .activation-name {
          font-size: 14px;
          font-weight: bold;
          color: var(--black);
        }

        .activation-months {
          font-size: 12px;
          color: var(--red);
          font-weight: bold;
        }

        .activation-body {
          font-size: 12px;
          line-height: 1.5;
        }

        .activation-section {
          margin-bottom: 3mm;
        }

        .activation-section-title {
          font-size: 12px;
          font-weight: bold;
          color: var(--dark-gray);
          margin-bottom: 1mm;
          text-transform: uppercase;
        }

        .activation-description {
          color: #555;
          margin-bottom: 2mm;
        }

        .activation-list-items {
          list-style: none;
          padding-left: 0;
        }

        .activation-list-items li {
          padding-left: 4mm;
          margin-bottom: 1mm;
          position: relative;
        }

        .activation-list-items li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--red);
          font-weight: bold;
        }

        .activation-value {
          display: inline-block;
          background: var(--cream);
          padding: 2mm 3mm;
          border-radius: 1mm;
          font-weight: bold;
          color: var(--red);
        }

        /* Timestamped Notes */
        .note-entry {
          background: white;
          border-left: 2mm solid #ddd;
          padding: 3mm 4mm;
          margin-bottom: 3mm;
          font-size: 12px;
        }

        .note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2mm;
          font-size: 12px;
          color: #888;
        }

        .note-author {
          font-weight: bold;
          color: var(--dark-gray);
        }

        .note-text {
          color: #555;
          line-height: 1.5;
        }

        /* ==================== DOWNLOAD BUTTON ==================== */
        .download-button-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
        }

        /* Print styles */
        @media print {
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          .page {
            margin: 0;
            box-shadow: none;
            page-break-after: avoid !important;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page:not(:last-child) {
            page-break-after: always !important;
          }
          .page:last-child {
            page-break-after: avoid !important;
          }
          /* Simple template specific print overrides */
          .simple-page {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          .activation-detail-card {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .download-button-container {
            display: none !important;
          }
        }
      `}</style>

      {/* Download Button - Hidden when printing */}
      <div className="download-button-container">
        <Button onClick={handlePrint} size="lg" className="shadow-lg">
          <Download className="mr-2 h-5 w-5" />
          Download PDF
        </Button>
      </div>

      {/* Render appropriate template */}
      {templateType === "simple" && <SimpleTemplate proposal={proposal} />}
      {templateType === "standard" && <DefaultTemplate proposal={proposal} />}
      {templateType === "detailed" && <DetailedTemplate proposal={proposal} />}
    </>
  );
}
