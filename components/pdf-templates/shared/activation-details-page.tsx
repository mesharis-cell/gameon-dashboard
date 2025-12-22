// /**
//  * Activation Details Page Component for PDF Templates
//  * Shows detailed information for each activation
//  */

// import { GameOnLogo } from "./game-on-logo";
// import {
//   formatCurrency,
//   formatMonthRange,
//   getCurrentDateTime,
//   getFullId,
// } from "@/lib/utils/pdf-formatters";

// interface Brand {
//   id: string;
//   name: string;
//   logoUrl?: string;
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

// interface ActivationDetailsPageProps {
//   venueName: string;
//   activations: ProposalActivation[];
//   brands: Brand[];
//   year: number;
//   proposalId: string;
//   startingPageNumber: number; // e.g., 3 for "3/7"
//   totalPages: number; // e.g., 7 for "3/7"
// }

// /**
//  * Helper function to group activations into pages
//  * Puts 1 activation card per page to ensure proper spacing and avoid footer overflow
//  */
// function groupActivationsIntoPages(
//   activations: ProposalActivation[]
// ): ProposalActivation[][] {
//   // Each activation gets its own page to prevent footer overflow
//   return activations.map((activation) => [activation]);
// }

// export function ActivationDetailsPage({
//   venueName,
//   activations,
//   brands,
//   year,
//   proposalId,
//   startingPageNumber,
//   totalPages,
// }: ActivationDetailsPageProps) {
//   const generationDateTime = getCurrentDateTime();

//   // Get brand by ID
//   const getBrand = (brandId: string) => {
//     return brands.find((b) => b.id === brandId);
//   };

//   // Group activations into pages (2-3 cards per page)
//   const activationPages = groupActivationsIntoPages(activations);

//   return (
//     <>
//       {activationPages.map((pageActivations, pageIndex) => {
//         const currentPageNumber = startingPageNumber + pageIndex;
//         const isFirstActivationPage = pageIndex === 0;

//         return (
//           <div key={`activation-page-${pageIndex}`} className="page">
//             {/* Header on EVERY page */}
//             <div className="header">
//               <GameOnLogo />
//             </div>

//             {/* Title and subtitle only on FIRST activation page */}
//             {isFirstActivationPage && (
//               <>
//                 <div className="page-title">Activation Details</div>
//                 <div className="page-subtitle">
//                   Complete breakdown for {venueName}
//                 </div>
//               </>
//             )}

//             {/* Activation cards for this page */}
//             {pageActivations.map((pa) => {
//               const brand = getBrand(pa.activation.brandId);
//               return (
//                 <div key={pa.activation.id} className="activation-detail-card">
//                   <div className="activation-header">
//                     <img
//                       src={brand?.logoUrl || ""}
//                       className="activation-brand-logo"
//                       alt={brand?.name || ""}
//                       crossOrigin="anonymous"
//                     />
//                     <div className="activation-title">
//                       <div className="activation-brand-name">{brand?.name}</div>
//                       <div className="activation-name">
//                         {pa.activation.name}
//                       </div>
//                     </div>
//                     <div className="activation-months">
//                       {formatMonthRange(pa.selectedMonths, year)}
//                     </div>
//                   </div>

//                   <div className="activation-body">
//                     {pa.activation.description && (
//                       <div className="activation-section">
//                         <div className="activation-section-title">
//                           Description
//                         </div>
//                         <div className="activation-description">
//                           {pa.activation.description}
//                         </div>
//                       </div>
//                     )}

//                     {pa.activation.kitContents &&
//                       pa.activation.kitContents.length > 0 && (
//                         <div className="activation-section">
//                           <div className="activation-section-title">
//                             Kit Contents
//                           </div>
//                           <ul className="activation-list-items">
//                             {pa.activation.kitContents.map((item, index) => (
//                               <li key={index}>{item}</li>
//                             ))}
//                           </ul>
//                         </div>
//                       )}

//                     {pa.activation.venueRequirements &&
//                       pa.activation.venueRequirements.length > 0 && (
//                         <div className="activation-section">
//                           <div className="activation-section-title">
//                             Venue Requirements
//                           </div>
//                           <ul className="activation-list-items">
//                             {pa.activation.venueRequirements.map(
//                               (item, index) => (
//                                 <li key={index}>{item}</li>
//                               )
//                             )}
//                           </ul>
//                         </div>
//                       )}

//                     <div className="activation-section">
//                       <div className="activation-section-title">Value</div>
//                       <span className="activation-value">
//                         {formatCurrency(pa.calculatedValue)}
//                       </span>
//                       {pa.scalingApplied && (
//                         <span
//                           style={{
//                             fontSize: "12px",
//                             color: "#888",
//                             marginLeft: "2mm",
//                           }}
//                         >
//                           (Scaled from base value of{" "}
//                           {formatCurrency(pa.baseValue)})
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Footer on EVERY page */}
//             <div className="footer">
//               <span>African + Eastern</span>
//               <span className="footer-center">
//                 Digitally generated on {generationDateTime} • Proposal ID:{" "}
//                 {getFullId(proposalId)}
//               </span>
//               <span>
//                 {currentPageNumber}/{totalPages}
//               </span>
//             </div>
//           </div>
//         );
//       })}
//     </>
//   );
// }

/**
 * Activation Details Page Component for PDF Templates
 * Shows detailed information for each activation
 * Splits activations across multiple pages with proper pagination
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

/**
 * Group activations into pages
 * Puts 2 activations per page to prevent overflow
 * COMMENTED OUT: Using single-page approach to match reference HTML
 */
// function groupActivationsIntoPages(
//   activations: ProposalActivation[]
// ): ProposalActivation[][] {
//   const pages: ProposalActivation[][] = [];
//   const activationsPerPage = 2;

//   for (let i = 0; i < activations.length; i += activationsPerPage) {
//     pages.push(activations.slice(i, i + activationsPerPage));
//   }

//   return pages;
// }

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

  // SINGLE PAGE APPROACH - All activations on one page (matches reference HTML)
  return (
    <div className="page">
      <div className="header">
        <GameOnLogo />
      </div>

      <div className="page-title">Activation Details</div>
      <div className="page-subtitle">Complete breakdown for {venueName}</div>

      {/* All activation cards in single continuous flow */}
      {activations.map((pa) => {
        const brand = getBrand(pa.activation.brandId);
        return (
          <div key={pa.activation.id} className="activation-detail-card">
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
                    <div className="activation-section-title">Kit Contents</div>
                    <ul className="activation-list-items">
                      {pa.activation.kitContents.map((item, index) => (
                        <li key={index}>{item}</li>
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
                      {pa.activation.venueRequirements.map((item, index) => (
                        <li key={index}>{item}</li>
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
        );
      })}

      {/* Footer only on this page */}
      <div className="footer">
        <span>African + Eastern</span>
        <span className="footer-center">
          Digitally generated on {generationDateTime} • Proposal ID:{" "}
          {getFullId(proposalId)}
        </span>
        <span>
          {startingPageNumber}/{totalPages}
        </span>
      </div>
    </div>
  );

  // COMMENTED OUT: Multi-page pagination approach
  // const activationPages = groupActivationsIntoPages(activations);
  // return (
  //   <>
  //     {activationPages.map((pageActivations, pageIndex) => {
  //       const currentPageNumber = startingPageNumber + pageIndex;
  //       const isFirstActivationPage = pageIndex === 0;
  //       return (
  //         <div key={`activation-page-${pageIndex}`} className="page">
  //           <div className="header">
  //             <GameOnLogo />
  //           </div>
  //           {isFirstActivationPage && (
  //             <>
  //               <div className="page-title">Activation Details</div>
  //               <div className="page-subtitle">
  //                 Complete breakdown for {venueName}
  //               </div>
  //             </>
  //           )}
  //           {pageActivations.map((pa) => {
  //             const brand = getBrand(pa.activation.brandId);
  //             return (
  //               <div key={pa.activation.id} className="activation-detail-card">
  //                 {/* ... card content ... */}
  //               </div>
  //             );
  //           })}
  //           <div className="footer">
  //             <span>African + Eastern</span>
  //             <span className="footer-center">
  //               Digitally generated on {generationDateTime} • Proposal ID:{" "}
  //               {getFullId(proposalId)}
  //             </span>
  //             <span>
  //               {currentPageNumber}/{totalPages}
  //             </span>
  //           </div>
  //         </div>
  //       );
  //     })}
  //   </>
  // );

  // return (
  //   <>
  //     {activations.map((pa, index) => {
  //       const brand = getBrand(pa.activation.brandId);

  //       return (
  //         <div key={pa.activation.id} className="page">
  //           {/* Header on EVERY page */}
  //           <div className="header">
  //             <GameOnLogo />
  //           </div>

  //           {/* Title only on FIRST activation page */}
  //           {index === 0 && (
  //             <>
  //               <div className="page-title">Activation Details</div>
  //               <div className="page-subtitle">
  //                 Complete breakdown for {venueName}
  //               </div>
  //             </>
  //           )}

  //           {/* Single activation card per page */}
  //           <div className="activation-detail-card">
  //             <div className="activation-header">
  //               <img
  //                 src={brand?.logoUrl || ""}
  //                 className="activation-brand-logo"
  //                 alt={brand?.name || ""}
  //                 crossOrigin="anonymous"
  //               />
  //               <div className="activation-title">
  //                 <div className="activation-brand-name">{brand?.name}</div>
  //                 <div className="activation-name">{pa.activation.name}</div>
  //               </div>
  //               <div className="activation-months">
  //                 {formatMonthRange(pa.selectedMonths, year)}
  //               </div>
  //             </div>

  //             <div className="activation-body">
  //               {pa.activation.description && (
  //                 <div className="activation-section">
  //                   <div className="activation-section-title">Description</div>
  //                   <div className="activation-description">
  //                     {pa.activation.description}
  //                   </div>
  //                 </div>
  //               )}

  //               {pa.activation.kitContents &&
  //                 pa.activation.kitContents.length > 0 && (
  //                   <div className="activation-section">
  //                     <div className="activation-section-title">
  //                       Kit Contents
  //                     </div>
  //                     <ul className="activation-list-items">
  //                       {pa.activation.kitContents.map((item, idx) => (
  //                         <li key={idx}>{item}</li>
  //                       ))}
  //                     </ul>
  //                   </div>
  //                 )}

  //               {pa.activation.venueRequirements &&
  //                 pa.activation.venueRequirements.length > 0 && (
  //                   <div className="activation-section">
  //                     <div className="activation-section-title">
  //                       Venue Requirements
  //                     </div>
  //                     <ul className="activation-list-items">
  //                       {pa.activation.venueRequirements.map((item, idx) => (
  //                         <li key={idx}>{item}</li>
  //                       ))}
  //                     </ul>
  //                   </div>
  //                 )}

  //               <div className="activation-section">
  //                 <div className="activation-section-title">Value</div>
  //                 <span className="activation-value">
  //                   {formatCurrency(pa.calculatedValue)}
  //                 </span>
  //                 {pa.scalingApplied && (
  //                   <span
  //                     style={{
  //                       fontSize: "12px",
  //                       color: "#888",
  //                       marginLeft: "2mm",
  //                     }}
  //                   >
  //                     (Scaled from base value of {formatCurrency(pa.baseValue)})
  //                   </span>
  //                 )}
  //               </div>
  //             </div>
  //           </div>

  //           {/* Footer on EVERY page */}
  //           <div className="footer">
  //             <span>African + Eastern</span>
  //             <span className="footer-center">
  //               Digitally generated on {generationDateTime} • Proposal ID:{" "}
  //               {getFullId(proposalId)}
  //             </span>
  //             <span>{pageNumber}</span>
  //           </div>
  //         </div>
  //       );
  //     })}
  //   </>
  // );
}
