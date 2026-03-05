"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { XAxis, CartesianGrid, BarChart, Bar, AreaChart, Area } from "recharts";
import {
  DollarSign,
  Package,
  Download,
  ArrowRightFromLine,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Dot,
  Trophy,
  Loader2,
  RefreshCw,
  Database,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Can } from "@/components/shared/can";
import { toast } from "sonner";
import {
  format,
  subDays,
  addMonths,
  startOfDay,
  endOfDay,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import html2canvas from "html2canvas";
import { STATUS_LABELS } from "@/lib/types/proposals";
import { cn } from "@/lib/utils";
import { ProposalSummarySheet } from "../proposals/components/proposal-summary-sheet";

// Types
interface SummaryStats {
  avgValuePerDeal: number;
  avgBrandsPerDeal: number;
  conversionRate: number;
  totalPipeline: number;
  previousPeriod?: {
    avgValuePerDeal: number;
    avgBrandsPerDeal: number;
    conversionRate: number;
    totalPipeline: number;
  };
}

interface ProposalsByStatus {
  status: string;
  count: number;
}

interface KamPerformance {
  id: string;
  name: string;
  email: string;
  totalProposals: number;
  pipelineValue: number;
  winRate: number;
  avgDealSize: number;
}

interface ProposalReport {
  id: string;
  name: string;
  status: string;
  totalValue: string;
  createdAt: string;
  updatedAt: string;
  venueName: string | null;
  venueTier: string | null;
  kamName: string | null;
  kamEmail: string | null;
}

export default function ReportsPage() {
  const reportsContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Header filters (for Summary, Charts, KAM Performance)
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [headerKamFilter, setHeaderKamFilter] = useState("all");
  const [headerStatusFilter, setHeaderStatusFilter] = useState("all");
  const [headerTierFilter, setHeaderTierFilter] = useState("all");
  const [headerBrandFilter, setHeaderBrandFilter] = useState("all");

  // Debounced filter values for API calls
  const [debouncedStartDate, setDebouncedStartDate] = useState<Date | undefined>();
  const [debouncedEndDate, setDebouncedEndDate] = useState<Date | undefined>();
  const [debouncedKamFilter, setDebouncedKamFilter] = useState("all");
  const [debouncedStatusFilter, setDebouncedStatusFilter] = useState("all");
  const [debouncedTierFilter, setDebouncedTierFilter] = useState("all");
  const [debouncedBrandFilter, setDebouncedBrandFilter] = useState("all");

  // Proposals table filters (separate from header filters)
  const [proposalsPage, setProposalsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // KAM performance pagination and sorting
  const [kamPage, setKamPage] = useState(1);
  const [kamSortBy, setKamSortBy] = useState<string>("pipelineValue");

  // Debounce date range filter (500ms delay) - only when BOTH DIFFERENT dates are selected
  useEffect(() => {
    // Only debounce if both dates are selected AND they are different
    // (Calendar sets end date = start date initially, we want to wait for actual end date selection)
    if (customStartDate && customEndDate && customStartDate.getTime() !== customEndDate.getTime()) {
      const timer = setTimeout(() => {
        setDebouncedStartDate(customStartDate);
        setDebouncedEndDate(customEndDate);
      }, 500);
      return () => clearTimeout(timer);
    }
    // If dates are cleared, immediately update debounced values
    if (!customStartDate && !customEndDate) {
      setDebouncedStartDate(undefined);
      setDebouncedEndDate(undefined);
    }
  }, [customStartDate, customEndDate]);

  // Debounce header filters (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKamFilter(headerKamFilter);
      setDebouncedStatusFilter(headerStatusFilter);
      setDebouncedTierFilter(headerTierFilter);
      setDebouncedBrandFilter(headerBrandFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [headerKamFilter, headerStatusFilter, headerTierFilter, headerBrandFilter]);

  // Debounce search query (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setProposalsPage(1);
  }, [statusFilter, dateRangeFilter, tierFilter, debouncedSearchQuery]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setKamPage(1);
  }, [kamSortBy]);

  // Calculate date range with useMemo to prevent infinite re-renders
  // Comparison is ALWAYS current month vs previous month (ignores date range filter)
  const { startDate, endDate, previousStartDate, previousEndDate } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonth = subMonths(now, 1);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);

    // For current period: use custom date range if selected, otherwise use current month
    const currentStart = debouncedStartDate
      ? startOfDay(debouncedStartDate).toISOString()
      : startOfDay(currentMonthStart).toISOString();

    const currentEnd = debouncedEndDate
      ? endOfDay(debouncedEndDate).toISOString()
      : endOfDay(currentMonthEnd).toISOString();

    // For comparison: ALWAYS use previous month (ignore date range filter)
    return {
      startDate: currentStart,
      endDate: currentEnd,
      previousStartDate: startOfDay(previousMonthStart).toISOString(),
      previousEndDate: endOfDay(previousMonthEnd).toISOString(),
    };
  }, [debouncedStartDate, debouncedEndDate]);

  // Fetch summary statistics (with debounced header filters)
  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryStats>({
    queryKey: [
      "reports-summary",
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      debouncedKamFilter,
      debouncedStatusFilter,
      debouncedTierFilter,
      debouncedBrandFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(previousStartDate && { previousStartDate }),
        ...(previousEndDate && { previousEndDate }),
        ...(debouncedKamFilter !== "all" && { kamId: debouncedKamFilter }),
        ...(debouncedStatusFilter !== "all" && {
          status: debouncedStatusFilter,
        }),
        ...(debouncedTierFilter !== "all" && { tier: debouncedTierFilter }),
        ...(debouncedBrandFilter !== "all" && {
          brandId: debouncedBrandFilter,
        }),
      });
      const response: any = await api.get(`/api/reports/summary?${params}`);
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
  console.log(summary);
  // Fetch submitted proposals by month for current year (with debounced header filters)
  const { data: proposalsByMonth, isLoading: monthlyLoading } = useQuery<
    Array<{ month: string; monthNumber: number; count: number }>
  >({
    queryKey: [
      "reports-proposals-by-month",
      debouncedKamFilter,
      debouncedTierFilter,
      debouncedBrandFilter,
    ],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const params = new URLSearchParams({
        year: currentYear.toString(),
        ...(debouncedKamFilter !== "all" && { kamId: debouncedKamFilter }),
        ...(debouncedTierFilter !== "all" && { tier: debouncedTierFilter }),
        ...(debouncedBrandFilter !== "all" && {
          brandId: debouncedBrandFilter,
        }),
      });
      const response: any = await api.get(`/api/reports/proposals-by-month?${params}`);
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch brand activations (with debounced header filters)
  const { data: brandActivations, isLoading: activationsLoading } = useQuery<any[]>({
    queryKey: [
      "reports-brand-activations",
      startDate,
      endDate,
      debouncedKamFilter,
      debouncedStatusFilter,
      debouncedTierFilter,
      debouncedBrandFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(debouncedKamFilter !== "all" && { kamId: debouncedKamFilter }),
        ...(debouncedStatusFilter !== "all" && {
          status: debouncedStatusFilter,
        }),
        ...(debouncedTierFilter !== "all" && { tier: debouncedTierFilter }),
        ...(debouncedBrandFilter !== "all" && {
          brandId: debouncedBrandFilter,
        }),
      });
      const response: any = await api.get(`/api/reports/brand-activations?${params}`);
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch KAM performance (with debounced header filters)
  const { data: kamPerformanceData, isLoading: kamLoading } = useQuery({
    queryKey: [
      "reports-kam-performance",
      startDate,
      endDate,
      kamPage,
      kamSortBy,
      debouncedKamFilter,
      debouncedStatusFilter,
      debouncedTierFilter,
      debouncedBrandFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        page: kamPage.toString(),
        limit: "10",
        sortBy: kamSortBy,
        ...(debouncedKamFilter !== "all" && { kamId: debouncedKamFilter }),
        ...(debouncedStatusFilter !== "all" && {
          status: debouncedStatusFilter,
        }),
        ...(debouncedTierFilter !== "all" && { tier: debouncedTierFilter }),
        ...(debouncedBrandFilter !== "all" && {
          brandId: debouncedBrandFilter,
        }),
      });
      return api.get(`/api/reports/kam-performance?${params}`);
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch proposals for table (uses its own debounced filters, NOT header filters)
  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: [
      "reports-proposals",
      proposalsPage,
      statusFilter,
      dateRangeFilter,
      tierFilter,
      debouncedSearchQuery,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: proposalsPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateRangeFilter !== "all" && { dateRange: dateRangeFilter }),
        ...(tierFilter !== "all" && { tier: tierFilter }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
      });
      return api.get(`/api/reports/proposals?${params}`);
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch full proposal details when a proposal is selected
  const { data: selectedProposalResponse, isLoading: isProposalLoading } = useQuery({
    queryKey: ["proposal", selectedProposalId],
    queryFn: () => api.get(`/api/proposals/${selectedProposalId}`),
    enabled: !!selectedProposalId,
  });

  const selectedProposal = (selectedProposalResponse as any)?.data;

  // Fetch all KAMs for filter - get from kam-performance with large limit to get all KAMs
  const { data: allKamsData } = useQuery({
    queryKey: ["all-kams-list"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
        sortBy: "pipelineValue",
      });
      return api.get(`/api/reports/kam-performance?${params}`);
    },
  });

  // Fetch all brands for filter
  const { data: brandsData } = useQuery({
    queryKey: ["brands-list"],
    queryFn: () => api.get("/api/brands"),
  });

  const kams = (allKamsData as any)?.data || [];
  const brands = (brandsData as any)?.data || [];
  const kamPerformance = (kamPerformanceData as any)?.data || [];
  const kamPagination = (kamPerformanceData as any)?.pagination;
  const proposals = (proposalsData as any)?.data || [];
  const proposalsPagination = (proposalsData as any)?.pagination;

  // Mutations for proposal actions
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/proposals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-proposals"] });
      toast.success("Proposal deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete proposal");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/proposals/${id}/duplicate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-proposals"] });
      toast.success("Proposal duplicated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate proposal");
    },
  });

  const handleDelete = (proposalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProposalToDelete(proposalId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (proposalToDelete) {
      deleteMutation.mutate(proposalToDelete);
      setDeleteDialogOpen(false);
      setProposalToDelete(null);
    }
  };

  const handleDuplicate = (proposalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateMutation.mutate(proposalId);
  };

  const handleRowClick = (proposal: ProposalReport) => {
    setSelectedProposalId(proposal.id);
    setIsDetailSheetOpen(true);
  };

  // Format monthly data for chart display
  const monthlyChartData = useMemo(() => {
    if (!proposalsByMonth) return [];

    return proposalsByMonth.map((item) => ({
      month: item.month,
      submitted: item.count,
    }));
  }, [proposalsByMonth]);

  // Export comprehensive report mutation (Summary + Charts + KAM Performance)
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(debouncedKamFilter !== "all" && { kamId: debouncedKamFilter }),
        ...(debouncedStatusFilter !== "all" && {
          status: debouncedStatusFilter,
        }),
        ...(debouncedTierFilter !== "all" && { tier: debouncedTierFilter }),
        ...(debouncedBrandFilter !== "all" && {
          brandId: debouncedBrandFilter,
        }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/reports/export/comprehensive?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `comprehensive-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Report exported successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export report");
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!reportsContainerRef.current) return;

    try {
      toast.info("Generating PDF...");

      const canvas = await html2canvas(reportsContainerRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `reports-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported as image");
    } catch (error) {
      toast.error("Failed to export PDF");
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get color for each status
  const getBarColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "#D9D9D9";
      case "Submitted":
        return "#538FFE";
      case "Accepted":
        return "#19A64D";
      case "Rejected":
        return "#E53950";
      default:
        return "#9CA3AF";
    }
  };

  // Get gradient for status bars
  const getBarGradient = (status: string) => {
    switch (status) {
      case "Accepted":
        return "linear-gradient(90deg, #3ED073 0%, #19A64D 100%)";
      case "Rejected":
        return "linear-gradient(90deg, #D2384C 0%, #E53950 100%)";
      default:
        return undefined; // Use solid color for other statuses
    }
  };

  // Get badge styling for percentage display
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "Draft":
        return {
          backgroundColor: "#F5F5F5",
          color: "#BEBEBE",
          border: "1px solid #BEBEBE",
        };
      case "Submitted":
        return {
          backgroundColor: "#E5EEFF",
          color: "#538FFE",
          border: "1px solid #538FFE",
        };
      case "Accepted":
        return {
          backgroundColor: "#E1FCEF",
          color: "#14804A",
          border: "1px solid #14804A",
        };
      case "Rejected":
        return {
          backgroundColor: "#FFE7E8",
          color: "#F20004",
          border: "1px solid #F20004",
        };
      default:
        return {
          backgroundColor: "#F5F5F5",
          color: "#9CA3AF",
          border: "1px solid #9CA3AF",
        };
    }
  };

  // Calculate percentage change vs previous period
  const calculateChange = (current: number, previous: number) => {
    // If previous is 0 but current has value, show 100% increase
    if (previous === 0 && current > 0) {
      return { percentage: 100, isPositive: true };
    }
    // If both are 0, show 0%
    if (previous === 0 && current === 0) {
      return { percentage: 0, isPositive: true };
    }
    // If previous has value but current is 0, show 100% decrease
    if (previous > 0 && current === 0) {
      return { percentage: 100, isPositive: false };
    }
    // Normal calculation when both have values
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const updatedDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - updatedDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
  };

  return (
    <Can permission={["report:view:all"]}>
      <div className="flex flex-1 flex-col gap-6 p-8" ref={reportsContainerRef}>
        {/* Header */}
        <div className="flex items-center justify-between gap-x-4">
          <div className="flex flex-col gap-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Summary Statistics</h1>
            <p className="text-muted-foreground">Track your team&apos;s performance and analysis</p>
          </div>
          <div className="flex gap-2 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal rounded-xl",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate && customEndDate ? (
                      <>
                        {format(customStartDate, "MMM dd, yyyy")} -{" "}
                        {format(customEndDate, "MMM dd, yyyy")}
                      </>
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: customStartDate,
                      to: customEndDate,
                    }}
                    onSelect={(range) => {
                      setCustomStartDate(range?.from);
                      setCustomEndDate(range?.to);
                    }}
                    numberOfMonths={2}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* KAM Filter */}
              <Select value={headerKamFilter} onValueChange={setHeaderKamFilter}>
                <SelectTrigger className="w-[150px] rounded-xl">
                  <SelectValue placeholder="All KAMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KAMs</SelectItem>
                  {kams.map((kam: any) => (
                    <SelectItem key={kam.id} value={kam.id}>
                      {kam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={headerStatusFilter} onValueChange={setHeaderStatusFilter}>
                <SelectTrigger className="w-[150px] rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Tier Filter */}
              <Select value={headerTierFilter} onValueChange={setHeaderTierFilter}>
                <SelectTrigger className="w-[130px] rounded-xl">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>

              {/* Brand Filter */}
              <Select value={headerBrandFilter} onValueChange={setHeaderBrandFilter}>
                <SelectTrigger className="w-[150px] rounded-xl">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand: any) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
                {exportMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRightFromLine className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Value per Deal</CardTitle>
              <DollarSign className="bg-gradient-to-r from-[#3ED073] to-[#19A64D] size-8 text-white rounded-full px-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary?.avgValuePerDeal || 0)}
                  </div>
                  {summary?.previousPeriod &&
                    (() => {
                      const change = calculateChange(
                        summary.avgValuePerDeal,
                        summary.previousPeriod.avgValuePerDeal
                      );
                      return (
                        <div className="flex items-center gap-1">
                          <span
                            className="text-xs font-semibold px-1 py-0.5 rounded-lg flex items-center gap-1"
                            style={{
                              backgroundColor: change.isPositive ? "#E1FCEF" : "#FFE7E8",
                              color: change.isPositive ? "#14804A" : "#F20004",
                              border: `1px solid ${change.isPositive ? "#14804A" : "#F20004"}`,
                            }}
                          >
                            {change.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {change.percentage.toFixed(1)}% this month
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                      );
                    })()}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Brands per Deal</CardTitle>
              <Package className="size-8 bg-gradient-to-r from-[#D2384C] to-[#E53950] text-white rounded-full px-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {summary?.avgBrandsPerDeal.toFixed(1) || "0.0"}
                  </div>
                  {summary?.previousPeriod &&
                    (() => {
                      const change = calculateChange(
                        summary.avgBrandsPerDeal,
                        summary.previousPeriod.avgBrandsPerDeal
                      );
                      return (
                        <div className="flex items-center gap-1">
                          <span
                            className="text-xs font-semibold px-1 py-0.5 rounded-lg flex items-center gap-1"
                            style={{
                              backgroundColor: change.isPositive ? "#E1FCEF" : "#FFE7E8",
                              color: change.isPositive ? "#14804A" : "#F20004",
                              border: `1px solid ${change.isPositive ? "#14804A" : "#F20004"}`,
                            }}
                          >
                            {change.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {change.percentage.toFixed(1)}% this month
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                      );
                    })()}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <RefreshCw className="size-8 bg-gradient-to-r from-[#F88732] to-[#EB5D10]  text-white rounded-full px-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-black">
                    {summary?.conversionRate.toFixed(1) || "0.0"}%
                  </p>
                  {summary?.previousPeriod &&
                    (() => {
                      const change = calculateChange(
                        summary.conversionRate,
                        summary.previousPeriod.conversionRate
                      );
                      return (
                        <div className="flex items-center gap-1">
                          <span
                            className="text-xs font-semibold px-1 py-0.5 rounded-lg flex items-center gap-1"
                            style={{
                              backgroundColor: change.isPositive ? "#E1FCEF" : "#FFE7E8",
                              color: change.isPositive ? "#14804A" : "#F20004",
                              border: `1px solid ${change.isPositive ? "#14804A" : "#F20004"}`,
                            }}
                          >
                            {change.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {change.percentage.toFixed(1)}% this month
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                      );
                    })()}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
              <Database className="size-8 bg-[#538FFE] text-white rounded-full px-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary?.totalPipeline || 0)}
                  </div>
                  {summary?.previousPeriod &&
                    (() => {
                      const change = calculateChange(
                        summary.totalPipeline,
                        summary.previousPeriod.totalPipeline
                      );
                      return (
                        <div className="flex items-center gap-1">
                          <span
                            className="text-xs font-semibold px-1 py-0.5 rounded-lg flex items-center gap-1"
                            style={{
                              backgroundColor: change.isPositive ? "#E1FCEF" : "#FFE7E8",
                              color: change.isPositive ? "#14804A" : "#F20004",
                              border: `1px solid ${change.isPositive ? "#14804A" : "#F20004"}`,
                            }}
                          >
                            {change.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {change.percentage.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                      );
                    })()}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Submitted Proposals by Month Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                Submitted Proposals by Months
                {/* ({new Date().getFullYear()}) */}
              </CardTitle>
              <CardDescription>Monthly count of submitted proposals</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : monthlyChartData && monthlyChartData.length > 0 ? (
                <ChartContainer
                  config={{
                    submitted: {
                      label: "Submitted",
                      color: "#538FFE",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <AreaChart
                    accessibilityLayer
                    data={monthlyChartData}
                    margin={{
                      left: 24,
                      right: 24,
                      top: 24,
                      bottom: 24,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Area
                      dataKey="submitted"
                      type="bump"
                      fill="url(#colorSubmitted)"
                      fillOpacity={0.4}
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      isAnimationActive={false}
                      activeDot={{
                        r: 6,
                        fill: "hsl(var(--chart-1))",
                      }}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No monthly data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brand Activation Frequency Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Activation Frequency</CardTitle>
              <CardDescription>Number of proposals per brand</CardDescription>
            </CardHeader>
            <CardContent>
              {activationsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : brandActivations && brandActivations.length > 0 ? (
                <ChartContainer
                  config={{
                    proposalCount: {
                      label: "Proposals",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={brandActivations}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="brandName"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={(value) => value.slice(0, 8)}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="proposalCount" fill="var(--color-proposalCount)" radius={8} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No brand data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KAM Performance Table */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">KAM Performance</h2>
          <Select value={kamSortBy} onValueChange={setKamSortBy}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pipelineValue">Pipeline Value (High to Low)</SelectItem>
              <SelectItem value="winRate">Win Rate (High to Low)</SelectItem>
              <SelectItem value="avgDealSize">Avg Deal Size (High to Low)</SelectItem>
              <SelectItem value="totalProposals">Total Proposals (Most to Least)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {kamLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-4">KAM Name</TableHead>
                    <TableHead className="p-4">Total Proposals</TableHead>
                    <TableHead className="p-4">Pipeline Value</TableHead>
                    <TableHead className="p-4">Win Rate (%)</TableHead>
                    <TableHead className="p-4">Avg Deal Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kamPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No KAM performance data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    kamPerformance.map((kam: KamPerformance) => (
                      <TableRow key={kam.id}>
                        <TableCell className="font-medium p-4">{kam.name}</TableCell>
                        <TableCell className="p-4">{kam.totalProposals}</TableCell>
                        <TableCell className="p-4">{formatCurrency(kam.pipelineValue)}</TableCell>
                        <TableCell className="p-4">{kam.winRate.toFixed(1)}%</TableCell>
                        <TableCell className="p-4">{formatCurrency(kam.avgDealSize)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {kamPagination && kamPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {kamPagination.page} of {kamPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKamPage(kamPage - 1)}
                    disabled={kamPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKamPage(kamPage + 1)}
                    disabled={kamPage === kamPagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* All Proposals Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">All Proposals</h2>
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightFromLine className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </div>

        {/* All Proposals Table */}
        <div className="rounded-xl border">
          <div className="flex flex-row justify-between p-4 gap-4">
            <div className="w-72">
              <Input
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full w-full"
              />
            </div>
            <div className="flex items-center gap-x-2">
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="15">Last 15 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="60">Last 60 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Table className="border-t">
            <TableHeader>
              <TableRow>
                <TableHead className="p-4">PROPOSAL</TableHead>
                <TableHead className="p-4">VENUE</TableHead>
                <TableHead className="p-4">TIER</TableHead>
                <TableHead className="p-4">STATUS</TableHead>
                <TableHead className="p-4">VALUE</TableHead>
                <TableHead className="p-4">UPDATED</TableHead>
                <TableHead className="p-4">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposalsLoading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-2/3" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No proposals found
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal: ProposalReport) => (
                  <TableRow
                    key={proposal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(proposal)}
                  >
                    <TableCell className="p-4">
                      <div className="font-medium">{proposal.name}</div>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="text-sm">{proposal.venueName || "No venue"}</div>
                    </TableCell>
                    <TableCell className="p-4">
                      {proposal.venueTier ? (
                        <div className="flex items-center gap-x-2">
                          <div
                            className="border-none font-medium capitalize rounded-full p-2 text-white"
                            style={{
                              backgroundColor:
                                proposal.venueTier === "gold"
                                  ? "#BE9E55"
                                  : proposal.venueTier === "silver"
                                    ? "#878787"
                                    : "#BFA58F",
                            }}
                          >
                            <Trophy className="stroke-1" />
                          </div>
                          <p className="capitalize">{proposal.venueTier}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge
                        className="font-bold border-none rounded-full flex justify-center w-36 items-center"
                        style={{
                          backgroundColor:
                            proposal.status === "rejected"
                              ? "#FFCAD0"
                              : proposal.status === "submitted"
                                ? "#D9E6FF"
                                : proposal.status === "accepted"
                                  ? "#DDF4E5"
                                  : "#E5E5EA",
                          color:
                            proposal.status === "rejected"
                              ? "#C6273C"
                              : proposal.status === "submitted"
                                ? "#538FFE"
                                : proposal.status === "accepted"
                                  ? "#308C51"
                                  : "#999797",
                        }}
                      >
                        <Dot />
                        <p>{STATUS_LABELS[proposal.status as keyof typeof STATUS_LABELS]}</p>
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="font-medium">
                        {formatCurrency(parseFloat(proposal.totalValue))}
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">
                          {formatRelativeTime(proposal.updatedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(proposal.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Can permission={["proposal:manage:own", "proposal:admin:all"]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/proposals/${proposal.id}`;
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDuplicate(proposal.id, e)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {proposal.status === "draft" && (
                              <DropdownMenuItem
                                onClick={(e) => handleDelete(proposal.id, e)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {proposalsPagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(proposalsPagination.page - 1) * proposalsPagination.limit + 1} to{" "}
              {Math.min(
                proposalsPagination.page * proposalsPagination.limit,
                proposalsPagination.total
              )}{" "}
              of {proposalsPagination.total} proposals
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProposalsPage(proposalsPage - 1)}
                disabled={proposalsPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProposalsPage(proposalsPage + 1)}
                disabled={proposalsPage === proposalsPagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Proposal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this proposal? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProposalToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Proposal Summary Sheet */}
        <ProposalSummarySheet
          proposal={selectedProposal}
          open={isDetailSheetOpen}
          isLoading={isProposalLoading}
          onOpenChange={(open) => {
            setIsDetailSheetOpen(open);
            if (!open) {
              setSelectedProposalId(null);
            }
          }}
        />
      </div>
    </Can>
  );
}
