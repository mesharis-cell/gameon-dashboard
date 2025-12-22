/**
 * Default PDF Template - 3 Pages
 * Cover + Calendar + Breakdown
 */

import { CoverPage } from "./shared/cover-page";
import { CalendarPage } from "./shared/calendar-page";
import { BreakdownPage } from "./shared/breakdown-page";

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

interface DefaultTemplateProps {
  proposal: {
    id: string;
    year: number;
    totalValue: string;
    activationValue: string;
    tradeDealValue: string;
    focValue: string;
    creditNoteValue: string;
    boosterValue: string;
    createdAt: string;
    venue: {
      name: string;
      tier: string;
      boosterEligible: boolean;
      contactInfo?: {
        phone?: string;
      };
    };
    creator: {
      name: string;
      email: string;
    };
    activations: ProposalActivation[];
    brands: Brand[];
    notes: Note[];
  };
}

export function DefaultTemplate({ proposal }: DefaultTemplateProps) {
  return (
    <>
      {/* Page 1: Cover */}
      <CoverPage
        year={proposal.year}
        venueName={proposal.venue.name}
        venueTier={proposal.venue.tier}
        totalValue={proposal.totalValue}
        creatorName={proposal.creator.name}
        createdAt={proposal.createdAt}
        proposalId={proposal.id}
      />

      {/* Page 2: Calendar */}
      <CalendarPage
        year={proposal.year}
        venueName={proposal.venue.name}
        activations={proposal.activations}
        brands={proposal.brands}
        proposalId={proposal.id}
        pageNumber="2/3"
      />

      {/* Page 3: Breakdown */}
      <BreakdownPage
        venueName={proposal.venue.name}
        venueTier={proposal.venue.tier}
        activationValue={proposal.activationValue}
        tradeDealValue={proposal.tradeDealValue}
        focValue={proposal.focValue}
        creditNoteValue={proposal.creditNoteValue}
        boosterValue={proposal.boosterValue}
        totalValue={proposal.totalValue}
        brands={proposal.brands}
        notes={proposal.notes}
        creatorName={proposal.creator.name}
        creatorEmail={proposal.creator.email}
        venuePhone={proposal.venue.contactInfo?.phone}
        boosterEligible={proposal.venue.boosterEligible}
        proposalId={proposal.id}
        pageNumber="3/3"
      />
    </>
  );
}
