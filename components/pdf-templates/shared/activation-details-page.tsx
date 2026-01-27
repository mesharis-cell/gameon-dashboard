/**
 * Activation Details Page Component for PDF Templates
 * Shows detailed information for each activation
 * One activation per page with proper pagination
 */

import { GameOnLogo } from "./game-on-logo";
import {
  formatCurrency,
  formatMonthRange,
  getCurrentDateTime,
  getFullId,
} from "@/lib/utils/pdf-formatters";

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

interface ProposalActivation {
  activation: {
    id: string;
    name: string;
    brandId: string;
    description?: string;
    kitContents?: string[];
    venueRequirements?: string[];
  };
  selectedMonths: number[];
  calculatedValue: string;
  baseValue: string;
  scalingApplied: boolean;
}

interface ActivationDetailsPageProps {
  venueName: string;
  activations: ProposalActivation[];
  brands: Brand[];
  year: number;
  proposalId: string;
  startingPageNumber: number; // e.g., 3 for "3/7"
  totalPages: number; // e.g., 7 for "3/7"
}

export function ActivationDetailsPage({
  venueName,
  activations,
  brands,
  year,
  proposalId,
  startingPageNumber,
  totalPages,
}: ActivationDetailsPageProps) {
  const generationDateTime = getCurrentDateTime();

  // Get brand by ID
  const getBrand = (brandId: string) => {
    return brands.find((b) => b.id === brandId);
  };

  // Render one activation per page
  return (
    <>
      {activations.map((pa, index) => {
        const brand = getBrand(pa.activation.brandId);
        const currentPageNumber = startingPageNumber + index;
        const isFirstActivationPage = index === 0;

        return (
          <div key={pa.activation.id} className="page">
            {/* Header on EVERY page */}
            <div className="header">
              <GameOnLogo />
            </div>

            {/* Title and subtitle only on FIRST activation page */}
            {isFirstActivationPage && (
              <>
                <div className="page-title">Activation Details</div>
                <div className="page-subtitle">
                  Complete breakdown for {venueName}
                </div>
              </>
            )}

            {/* Single activation card per page */}
            <div className="activation-detail-card">
              <div className="activation-header">
                <img
                  src={brand?.logoUrl || ""}
                  className="activation-brand-logo"
                  alt={brand?.name || ""}
                  crossOrigin="anonymous"
                />
                <div className="activation-title">
                  <div className="activation-brand-name">{brand?.name}</div>
                  <div className="activation-name">{pa.activation.name}</div>
                </div>
                <div className="activation-months">
                  {formatMonthRange(pa.selectedMonths, year)}
                </div>
              </div>

              <div className="activation-body">
                {pa.activation.description && (
                  <div className="activation-section">
                    <div className="activation-section-title">Description</div>
                    <div className="activation-description">
                      {pa.activation.description}
                    </div>
                  </div>
                )}

                {pa.activation.kitContents &&
                  pa.activation.kitContents.length > 0 && (
                    <div className="activation-section">
                      <div className="activation-section-title">
                        Kit Contents
                      </div>
                      <ul className="activation-list-items">
                        {pa.activation.kitContents.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {pa.activation.venueRequirements &&
                  pa.activation.venueRequirements.length > 0 && (
                    <div className="activation-section">
                      <div className="activation-section-title">
                        Venue Requirements
                      </div>
                      <ul className="activation-list-items">
                        {pa.activation.venueRequirements.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="activation-section">
                  <div className="activation-section-title">Value</div>
                  <span className="activation-value">
                    {formatCurrency(pa.calculatedValue)}
                  </span>
                  {pa.scalingApplied && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#888",
                        marginLeft: "2mm",
                      }}
                    >
                      (Scaled from base value of {formatCurrency(pa.baseValue)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer on EVERY page */}
            <div className="footer">
              <span>African + Eastern</span>
              <span className="footer-center">
                Digitally generated on {generationDateTime} • Proposal ID:{" "}
                {getFullId(proposalId)}
              </span>
              <span>
                {currentPageNumber}/{totalPages}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
