/**
 * Cover Page Component for PDF Templates
 * Includes decorative elements and proposal summary
 */

import { GameOnLogo } from "./game-on-logo";
import {
  formatCurrency,
  formatDate,
  getFullId,
  capitalizeTier,
  getCurrentDateTime,
} from "@/lib/utils/pdf-formatters";

interface CoverPageProps {
  year: number;
  venueName: string;
  venueTier: string;
  totalValue: string;
  creatorName: string;
  createdAt: string;
  proposalId: string;
}

export function CoverPage({
  year,
  venueName,
  venueTier,
  totalValue,
  creatorName,
  createdAt,
  proposalId,
}: CoverPageProps) {
  const generationDateTime = getCurrentDateTime();
  return (
    <div className="page">
      <div className="cover-decorations">
        <div className="cover-triangle-1"></div>
        <div className="cover-triangle-2"></div>
        <div className="cover-stripe"></div>
        <div className="cover-rectangles">
          <div className="cover-rect"></div>
          <div className="cover-rect"></div>
          <div className="cover-rect"></div>
        </div>
        <div className="cover-squares">
          <div className="cover-square"></div>
          <div className="cover-square"></div>
          <div className="cover-square"></div>
          <div className="cover-square"></div>
          <div className="cover-square"></div>
          <div className="cover-square"></div>
        </div>
      </div>

      <div className="header">
        <GameOnLogo />
      </div>

      <div className="cover-content">
        <div className="proposal-label">PARTNERSHIP PROPOSAL {year}</div>
        <div className="venue-name">{venueName}</div>
        {venueTier.toLowerCase() === "gold" ? (
          <div className="venue-tier">
            {capitalizeTier(venueTier)} Tier Account
          </div>
        ) : (
          <div className="venue-tier"></div>
        )}

        <div className="value-box">
          <div className="value-label">TOTAL PACKAGE VALUE</div>
          <div className="value-amount">{formatCurrency(totalValue)}</div>
        </div>

        <div className="kam-info">
          Prepared by {creatorName} • {formatDate(createdAt)}
        </div>
      </div>

      <div className="cover-footer">
        <div className="company">African + Eastern</div>
        <div className="generated">
          Digitally generated on {generationDateTime} • Proposal ID:{" "}
          {getFullId(proposalId)}
        </div>
      </div>
    </div>
  );
}
