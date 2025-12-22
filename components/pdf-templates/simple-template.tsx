/**
 * Simple PDF Template - Single Page
 * Cover + Calendar combined on one page
 */

import { GameOnLogo } from "./shared/game-on-logo";
import {
  formatCurrency,
  formatDate,
  getMonthName,
  getCurrentDateTime,
  getFullId,
  capitalizeTier,
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

interface SimpleTemplateProps {
  proposal: {
    id: string;
    year: number;
    totalValue: string;
    createdAt: string;
    venue: {
      name: string;
      tier: string;
    };
    creator: {
      name: string;
    };
    activations: ProposalActivation[];
    brands: Brand[];
  };
}

export function SimpleTemplate({ proposal }: SimpleTemplateProps) {
  const generationDateTime = getCurrentDateTime();

  // Get brand by ID
  const getBrand = (brandId: string) => {
    return proposal.brands.find((b) => b.id === brandId);
  };

  // Get activations for a specific month, grouped by brand
  const getActivationsForMonth = (month: number) => {
    const monthActivations = proposal.activations.filter((pa) =>
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
      {/* Header with logo and info */}
      <div className="simple-header">
        <div className="simple-header-left">
          <div className="proposal-label">
            PARTNERSHIP PROPOSAL {proposal.year}
          </div>
          <div className="venue-name">{proposal.venue.name}</div>
          <div className="venue-tier">
            {capitalizeTier(proposal.venue.tier)} Tier Account
          </div>
          <div className="kam-info">
            Prepared by {proposal.creator.name} •{" "}
            {formatDate(proposal.createdAt)}
          </div>
        </div>

        <div className="simple-header-right">
          <div className="value-box">
            <div className="value-label">TOTAL VALUE</div>
            <div className="value-amount">
              {formatCurrency(proposal.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section - Inline for simple template */}
      <div className="calendar-section">
        <div className="page-title">{proposal.year} Activation Calendar</div>
        <div className="page-subtitle">
          Year-round brand activations for {proposal.venue.name}
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
                    <div className="no-activations">
                      No activations scheduled
                    </div>
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
      </div>

      {/* Simple Footer */}
      <div className="simple-footer">
        <div className="company">African + Eastern</div>
        <div className="generated">
          Digitally generated on {generationDateTime} • Proposal ID:{" "}
          {getFullId(proposal.id)}
        </div>
      </div>
    </div>
  );
}
