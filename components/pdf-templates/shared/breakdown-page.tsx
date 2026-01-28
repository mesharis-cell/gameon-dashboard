/**
 * Breakdown Page Component for PDF Templates
 * Shows value breakdown, brands, notes, and KAM contact
 */

import { GameOnLogo } from "./game-on-logo";
import {
  formatCurrency,
  formatDateTime,
  getCurrentDateTime,
  getFullId,
  capitalizeTier,
} from "@/lib/utils/pdf-formatters";

interface Brand {
  id: string;
  name: string;
}

interface Note {
  id: string;
  noteText: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface BreakdownPageProps {
  venueName: string;
  venueTier: string;
  activationValue: string;
  tradeDealValue: string;
  focValue: string;
  creditNoteValue: string;
  boosterValue: string;
  totalValue: string;
  brands: Brand[];
  notes: Note[];
  creatorName: string;
  creatorEmail: string;
  venuePhone?: string;
  boosterEligible: boolean;
  proposalId: string;
  pageNumber: string; // e.g., "3/3" or "4/4"
}

export function BreakdownPage({
  venueName,
  venueTier,
  activationValue,
  tradeDealValue,
  focValue,
  creditNoteValue,
  boosterValue,
  totalValue,
  brands,
  notes,
  creatorName,
  creatorEmail,
  venuePhone,
  boosterEligible,
  proposalId,
  pageNumber,
}: BreakdownPageProps) {
  const generationDateTime = getCurrentDateTime();
  return (
    <div className="page">
      <div className="header">
        <GameOnLogo />
      </div>

      <div className="page-title">Package Value Breakdown</div>
      <div className="page-subtitle">
        {venueName} • {capitalizeTier(venueTier)} Tier
      </div>

      <div className="breakdown-section">
        <table className="value-table">
          <tbody>
            <tr>
              <td>Activation Value</td>
              <td>{formatCurrency(activationValue)}</td>
            </tr>
            <tr>
              <td>Trade Deals</td>
              <td>{formatCurrency(tradeDealValue || "0")}</td>
            </tr>
            <tr>
              <td>Additional FOC</td>
              <td>{formatCurrency(focValue || "0")}</td>
            </tr>
            <tr>
              <td>Credit Note</td>
              <td>{formatCurrency(creditNoteValue || "0")}</td>
            </tr>
            {boosterEligible && parseFloat(boosterValue || "0") > 0 && (
              <tr>
                <td>Booster</td>
                <td>{formatCurrency(boosterValue)}</td>
              </tr>
            )}
            <tr className="total-row">
              <td>TOTAL PACKAGE VALUE</td>
              <td>{formatCurrency(totalValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="breakdown-section">
        <div className="section-title">Selected Brands</div>
        <div className="brands-list">
          {brands.map((b) => b.name).join(", ")}
        </div>
      </div>

      <div className="breakdown-section">
        <div className="section-title">
          Venue Counterparts{notes.length > 1 ? " Notes" : ""}
        </div>
        {notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="note-entry">
              <div className="note-meta">
                <span className="note-author">{note.creator.name}</span>
                <span>{formatDateTime(note.createdAt)}</span>
              </div>
              <div className="note-text">{note.noteText}</div>
            </div>
          ))
        ) : (
          <div className="venue-notes">No notes available</div>
        )}
      </div>

      <div className="kam-box">
        <div className="kam-box-title">Your Key Account Manager</div>
        <div className="kam-box-name">{creatorName}</div>
        <div className="kam-box-contact">
          {creatorEmail}
          {venuePhone && (
            <>
              <br />
              {venuePhone}
            </>
          )}
        </div>
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
