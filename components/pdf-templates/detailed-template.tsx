// /**
//  * Detailed PDF Template - 4 Pages
//  * Cover + Calendar + Activation Details + Breakdown
//  */

// import { CoverPage } from "./shared/cover-page";
// import { CalendarPage } from "./shared/calendar-page";
// import { ActivationDetailsPage } from "./shared/activation-details-page";
// import { BreakdownPage } from "./shared/breakdown-page";

// interface Brand {
//   id: string;
//   name: string;
//   logoUrl?: string;
//   primaryColor?: string;
// }

// interface ProposalActivation {
//   activation: {
//     id: string;
//     name: string;
//     brandId: string;
//     description?: string;
//     kitContents?: string[];
//     venueRequirements?: string[];
//   };
//   selectedMonths: number[];
//   calculatedValue: string;
//   baseValue: string;
//   scalingApplied: boolean;
// }

// interface Note {
//   id: string;
//   noteText: string;
//   createdAt: string;
//   creator: {
//     id: string;
//     name: string;
//     email: string;
//   };
// }

// interface DetailedTemplateProps {
//   proposal: {
//     id: string;
//     year: number;
//     totalValue: string;
//     activationValue: string;
//     tradeDealValue: string;
//     focValue: string;
//     creditNoteValue: string;
//     boosterValue: string;
//     createdAt: string;
//     venue: {
//       name: string;
//       tier: string;
//       boosterEligible: boolean;
//       contactInfo?: {
//         phone?: string;
//       };
//     };
//     creator: {
//       name: string;
//       email: string;
//     };
//     activations: ProposalActivation[];
//     brands: Brand[];
//     notes: Note[];
//   };
// }

// export function DetailedTemplate({ proposal }: DetailedTemplateProps) {
//   // Calculate number of activation pages (1 card per page to prevent footer overflow)
//   const activationPageCount = proposal.activations.length;

//   // Calculate total pages: Cover (1) + Calendar (1) + Activation Pages (N) + Breakdown (1)
//   const totalPages = 2 + activationPageCount + 1;

//   // Starting page number for activation details (after cover and calendar)
//   const activationStartPage = 3;

//   // Page number for breakdown (last page)
//   const breakdownPageNumber = totalPages;

//   return (
//     <>
//       {/* Page 1: Cover */}
//       <CoverPage
//         year={proposal.year}
//         venueName={proposal.venue.name}
//         venueTier={proposal.venue.tier}
//         totalValue={proposal.totalValue}
//         creatorName={proposal.creator.name}
//         createdAt={proposal.createdAt}
//         proposalId={proposal.id}
//       />

//       {/* Page 2: Calendar */}
//       <CalendarPage
//         year={proposal.year}
//         venueName={proposal.venue.name}
//         activations={proposal.activations}
//         brands={proposal.brands}
//         proposalId={proposal.id}
//         pageNumber={`2/${totalPages}`}
//       />

//       {/* Pages 3+: Activation Details (dynamic number of pages) */}
//       <ActivationDetailsPage
//         venueName={proposal.venue.name}
//         activations={proposal.activations}
//         brands={proposal.brands}
//         year={proposal.year}
//         proposalId={proposal.id}
//         startingPageNumber={activationStartPage}
//         totalPages={totalPages}
//       />

//       {/* Last Page: Breakdown */}
//       <BreakdownPage
//         venueName={proposal.venue.name}
//         venueTier={proposal.venue.tier}
//         activationValue={proposal.activationValue}
//         tradeDealValue={proposal.tradeDealValue}
//         focValue={proposal.focValue}
//         creditNoteValue={proposal.creditNoteValue}
//         boosterValue={proposal.boosterValue}
//         totalValue={proposal.totalValue}
//         brands={proposal.brands}
//         notes={proposal.notes}
//         creatorName={proposal.creator.name}
//         creatorEmail={proposal.creator.email}
//         venuePhone={proposal.venue.contactInfo?.phone}
//         boosterEligible={proposal.venue.boosterEligible}
//         proposalId={proposal.id}
//         pageNumber={`${breakdownPageNumber}/${totalPages}`}
//       />
//     </>
//   );
// }

/**
 * Detailed PDF Template - Dynamic Pages
 * Cover + Calendar + Activation Details (multiple pages) + Breakdown
 */

import { CoverPage } from "./shared/cover-page";
import { CalendarPage } from "./shared/calendar-page";
import { ActivationDetailsPage } from "./shared/activation-details-page";
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
    description?: string;
    kitContents?: string[];
    venueRequirements?: string[];
  };
  selectedMonths: number[];
  calculatedValue: string;
  baseValue: string;
  scalingApplied: boolean;
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

interface DetailedTemplateProps {
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

/**
 * Calculate total pages dynamically based on number of activations
 * COMMENTED OUT: Using fixed 4 pages to match reference HTML (single activation page)
 */
// function calculateTotalPages(activationCount: number): number {
//   const activationsPerPage = 2;
//   const activationPages = Math.ceil(activationCount / activationsPerPage);
//   return 1 + 1 + activationPages + 1; // Cover + Calendar + Activation Pages + Breakdown
// }

/**
 * Fixed 4 pages: Cover (1) + Calendar (1) + Activation Details (1) + Breakdown (1)
 * All activations are on a single page with browser-controlled overflow
 */
function calculateTotalPages(activationCount: number): number {
  return 4; // Fixed 4 pages to match reference HTML design
}

export function DetailedTemplate({ proposal }: DetailedTemplateProps) {
  // Calculate total pages dynamically
  const totalPages = calculateTotalPages(proposal.activations.length);
  const activationStartPage = 3; // After cover (1) and calendar (2)
  const breakdownPageNumber = totalPages;

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
        pageNumber={`2/${totalPages}`}
      />

      {/* Pages 3+: Activation Details (dynamic number of pages) */}
      <ActivationDetailsPage
        venueName={proposal.venue.name}
        activations={proposal.activations}
        brands={proposal.brands}
        year={proposal.year}
        proposalId={proposal.id}
        startingPageNumber={activationStartPage}
        totalPages={totalPages}
      />

      {/* Last Page: Breakdown */}
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
        pageNumber={`${breakdownPageNumber}/${totalPages}`}
      />
    </>
  );
}
