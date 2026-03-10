// Proposal status enum
export type ProposalStatus = 'draft' | 'submitted' | 'accepted' | 'rejected';

// Base interfaces
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  premium?: boolean;
}

export interface Venue {
  id: string;
  customerCode: string;
  name: string;
  tier: 'gold' | 'silver' | 'bronze';
  mediaUrl: string;
  boosterEligible: boolean;
  brands?: Brand[];
}

export interface Activation {
  id: string;
  name: string;
  brandId: string;
  year: number;
  description?: string;
  kitContents: string[];
  venueRequirements: string[];
  media?: string;
  activationType: 'fixed' | 'variable';
  availableMonths: number[];
  totalValue: string;
  scalingBehavior?: 'proportional' | 'mixed';
  fixedAmount?: string;
  variableAmount?: string;
  eligibleTiers: Array<'gold' | 'silver' | 'bronze'>;
  targetVenueIds?: string[];
  kitLimit?: number | null;
  submissionDeadline?: string | null;
  visibilityMode?: 'tier_filtered' | 'venue_specific';
  kitsUsed?: number;
  kitsRemaining?: number | null;
  soldOut?: boolean;
  deadlinePassed?: boolean;
  selectable?: boolean;
  blockedReasons?: Array<'tier_not_eligible' | 'venue_not_targeted' | 'deadline_passed' | 'sold_out'>;
  status: 'draft' | 'published';
  active: boolean;
}

export interface ActivationOption extends Activation {
  visibilityMode: 'tier_filtered' | 'venue_specific';
  targetVenueIds: string[];
  kitsUsed: number;
  kitsRemaining: number | null;
  soldOut: boolean;
  deadlinePassed: boolean;
  selectable: boolean;
  blockedReasons: Array<'tier_not_eligible' | 'venue_not_targeted' | 'deadline_passed' | 'sold_out'>;
}

export interface ProposalActivation {
  id: string;
  selectedMonths: number[];
  calculatedValue: string;
  baseValue: string;
  scalingApplied: boolean;
  activation: Activation;
}

export interface VenueNote {
  id: string;
  noteText: string;
  createdAt: string;
  creator: User;
}

export interface SKU {
  id: string;
  brandId: string;
  productDescription: string;
  priceAed: string;
}

export interface TradeDeal {
  id: string;
  mechanic: string;
  mechanicBase: number;
  volume: number;
  freeUnits: string;
  unitPrice: string;
  calculatedValue: string;
  createdAt: string;
  sku: SKU;
}

export interface FOC {
  id: string;
  volume: number;
  unitPrice: string;
  calculatedValue: string;
  createdAt: string;
  sku: SKU;
}

export interface CreditNote {
  id: string;
  amount: string;
  description?: string;
  createdAt: string;
}

// Main Proposal interface
export interface Proposal {
  id: string;
  name: string;
  year: number;
  venueId?: string;
  createdBy: string;
  status: ProposalStatus;
  dummy: boolean;
  totalValue: string;
  activationValue: string;
  tradeDealValue: string;
  focValue: string;
  creditNoteValue: string;
  boosterValue: string;
  venueEmail?: string;
  sendToVenue: boolean;
  dataFrozenAt?: string;
  submittedAt?: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNotes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  venue?: Venue;
  brands?: Brand[];
  activations?: ProposalActivation[];
  notes?: VenueNote[];
  creator?: User;
  decider?: User;
  tradeDeals?: TradeDeal[];
  foc?: FOC[];
  creditNotes?: CreditNote[];
}

// List view proposal (lighter version)
export interface ProposalListItem {
  id: string;
  name: string;
  year: number;
  status: ProposalStatus;
  dummy: boolean;
  totalValue: string;
  createdAt: string;
  updatedAt: string;
  venue?: {
    id: string;
    name: string;
    customerCode: string;
    tier: 'gold' | 'silver' | 'bronze';
  };
  brands?: Brand[];
  activationsCount?: number;
  creator?: User;
}

// Form data types
export interface CreateProposalData {
  name: string;
  year: number;
  venueId?: string;
  brandIds?: string[];
}

export interface UpdateProposalData {
  name?: string;
  year?: number;
  venueId?: string;
  brandIds?: string[];
  venueEmail?: string;
  sendToVenue?: boolean;
}

export interface AddActivationData {
  activationId: string;
  selectedMonths: number[];
  calculatedValue: string;
  baseValue: string;
  scalingApplied: boolean;
}

// API Response types
export interface ProposalsResponse {
  success: boolean;
  data: ProposalListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProposalResponse {
  success: boolean;
  data: Proposal;
  message?: string;
}

// Filter types
export interface ProposalFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  year?: number;
}

// Month names for display
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Status colors
export const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
};

// Status labels
export const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
};
