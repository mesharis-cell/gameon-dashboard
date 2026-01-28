/**
 * Calendar Page Component for PDF Templates
 * 12-month grid showing brand activations
 */

import { GameOnLogo } from "./game-on-logo";
import {
  getMonthName,
  getCurrentDateTime,
  getFullId,
} from "@/lib/utils/pdf-formatters";

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface ProposalActivation {
  activation: {
    id: string;
    name: string;
    brandId: string;
  };
  selectedMonths: number[];
}

interface CalendarPageProps {
  year: number;
  venueName: string;
  activations: ProposalActivation[];
  brands: Brand[];
  proposalId: string;
  pageNumber: string; // e.g., "2/3" or "2/4"
}

export function CalendarPage({
  year,
  venueName,
  activations,
  brands,
  proposalId,
  pageNumber,
}: CalendarPageProps) {
  const generationDateTime = getCurrentDateTime();
  // Get brand by ID
  const getBrand = (brandId: string) => {
    return brands.find((b) => b.id === brandId);
  };

  // Get activations for a specific month, grouped by brand
  const getActivationsForMonth = (month: number) => {
    const monthActivations = activations.filter((pa) =>
      pa.selectedMonths.includes(month)
    );

    // Group by brand
    const grouped = monthActivations.reduce((acc, pa) => {
      const brandId = pa.activation.brandId;
      if (!acc[brandId]) {
        acc[brandId] = [];
      }
      acc[brandId].push(pa);
      return acc;
    }, {} as Record<string, ProposalActivation[]>);

    return grouped;
  };

  return (
    <div className="page">
      <div className="header">
        <GameOnLogo />
      </div>

      <div className="page-title">{year} Activation Calendar</div>
      <div className="page-subtitle">
        Year-round brand activations for {venueName}
      </div>

      <div className="calendar-grid">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const groupedActivations = getActivationsForMonth(month);
          const brandIds = Object.keys(groupedActivations);

          return (
            <div key={month} className="month-cell">
              <div className="month-header">{getMonthName(month)}</div>
              <div className="month-content">
                {brandIds.length === 0 ? (
                  <div className="no-activations">No activations scheduled</div>
                ) : (
                  brandIds.map((brandId) => {
                    const brand = getBrand(brandId);
                    const brandActivations = groupedActivations[brandId];

                    return (
                      <div key={brandId} className="brand-group">
                        <div className="brand-row">
                          <img
                            src={brand?.logoUrl || ""}
                            className="brand-logo"
                            alt={brand?.name || ""}
                            crossOrigin="anonymous"
                          />
                          <span className="brand-name">{brand?.name}</span>
                        </div>
                        <div className="activation-list">
                          {brandActivations.map((pa) => (
                            <div
                              key={pa.activation.id}
                              className="activation-item"
                            >
                              {pa.activation.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="footer">
        <span>African + Eastern</span>
        <span className="footer-center">
          Digitally generated on {generationDateTime} • Proposal ID:{" "}
          {getFullId(proposalId)}
        </span>
        <span>{pageNumber}</span>
      </div>
    </div>
  );
}
