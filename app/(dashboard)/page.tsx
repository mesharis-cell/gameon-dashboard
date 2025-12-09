"use client";

import { useSession } from "@/lib/auth/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Can } from "@/components/shared/can";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { navigationItems } from "@/lib/config/navigation";
import { ProposalSummarySheet } from "./proposals/components/proposal-summary-sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Dot,
  PlusCircle,
  DollarSign,
  RefreshCw,
  Package,
  Database,
  Plus,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  quarterlyRevenue: number;
  currentQuarter: number;
  currentYear: number;
  monthlyPerformance: Array<{
    month: number;
    monthName: string;
    acceptedCount: number;
    pipelineCount: number;
  }>;
  metrics: {
    current: {
      proposalsWon: number;
      pendingProposals: number;
      winRate: number;
      pipelineValue: number;
    };
    previous: {
      proposalsWon: number;
      pendingProposals: number;
      winRate: number;
      pipelineValue: number;
    };
  };
  recentProposals: Array<{
    id: string;
    name: string;
    status: string;
    totalValue: string;
    createdAt: string;
    updatedAt: string;
    venueName: string | null;
    venueTier: string | null;
    brandCount: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const currentYear = new Date().getFullYear();

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null
  );
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Check if user can access full dashboard
  const canAccessDashboard = hasAnyPermission([
    "proposal:view:own",
    "proposal:view:all",
    "proposal:admin:all",
  ]);

  const { data: dashboardData, isLoading } = useQuery<{
    success: boolean;
    data: DashboardStats;
  }>({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/api/dashboard/stats"),
    enabled: canAccessDashboard, // Only fetch if user has permissions
  });

  const stats = dashboardData?.data;

  // Fetch full proposal details when a proposal is selected
  const { data: selectedProposalResponse, isLoading: isProposalLoading } =
    useQuery({
      queryKey: ["proposal", selectedProposalId],
      queryFn: () => api.get(`/api/proposals/${selectedProposalId}`),
      enabled: !!selectedProposalId,
    });

  const selectedProposal = (selectedProposalResponse as any)?.data;

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/proposals", {
        name: "New Proposal",
        year: currentYear,
      }),
    onSuccess: (response: any) => {
      toast.success("Proposal created successfully");
      router.push(`/proposals/${response.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create proposal");
    },
  });

  const handleCreateProposal = () => {
    createMutation.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const updatedDate = new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - updatedDate.getTime()) / 1000
    );

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

  const renderComparisonBadge = (current: number, previous: number) => {
    const change = calculatePercentageChange(current, previous);
    const isPositive = change >= 0;

    return (
      <div className="flex items-center gap-1 text-xs mt-6">
        <span
          className="text-xs font-semibold px-1 py-0.5 rounded-lg flex items-center gap-1"
          style={{
            backgroundColor: isPositive ? "#E1FCEF" : "#FFE7E8",
            color: isPositive ? "#14804A" : "#F20004",
            border: `1px solid ${isPositive ? "#14804A" : "#F20004"}`,
          }}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600" />
          )}
          {Math.abs(change).toFixed(1)}% this month
        </span>
        <span className="text-muted-foreground">vs last month</span>
      </div>
    );
  };

  // Show simple welcome page for users without proposal permissions
  if (!canAccessDashboard) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Simple Welcome Card */}
        <Card
          className="relative overflow-hidden rounded-3xl border-none text-white"
          style={{
            background:
              "linear-gradient(135deg, #AB1A2D 0%, #E8374E 50%, #E43A50 100%)",
          }}
        >
          {/* Decorative SVG Background */}
          <div className="absolute inset-0 w-full h-full">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 849 282"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <mask
                id="mask0_56_9372"
                style={{ maskType: "alpha" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="849"
                height="282"
              >
                <rect
                  x="849"
                  y="282"
                  width="849"
                  height="282"
                  rx="27"
                  transform="rotate(-180 849 282)"
                  fill="url(#paint0_linear_56_9372)"
                />
              </mask>
              <g mask="url(#mask0_56_9372)">
                <ellipse
                  opacity="0.8"
                  cx="748.119"
                  cy="-33.9999"
                  rx="223.736"
                  ry="224"
                  transform="rotate(-180 748.119 -33.9999)"
                  fill="#E6384F"
                  fillOpacity="0.23"
                />
                <path
                  d="M-483.873 251.622C-393.471 198.647 -303.069 145.669 -218.903 157.826C-134.738 169.986 -56.8074 247.279 27.5005 257.955C111.808 268.63 202.495 212.681 287.828 212.64C373.162 212.597 453.144 268.458 536.089 293.376C619.033 318.293 704.94 312.263 790.847 306.235L777.852 441.983C693.242 434.464 608.632 426.945 524.022 419.425C439.412 411.906 354.802 404.386 270.192 396.867C185.581 389.348 100.971 381.828 16.3614 374.309C-68.2486 366.79 -152.859 359.27 -237.469 351.751C-322.079 344.232 -406.689 336.712 -491.299 329.193L-483.873 251.622Z"
                  fill="url(#paint1_linear_56_9372)"
                  fillOpacity="0.6"
                />
                <path
                  d="M824.761 -129.33C759.007 -49.4597 693.253 30.4134 609.928 47.1031C526.602 63.7897 425.705 17.2961 342.78 35.4235C259.855 53.5509 194.903 136.305 114.868 164.827C34.8343 193.352 -60.2809 167.648 -147.048 171.96C-233.816 176.272 -312.234 210.604 -390.654 244.933L-427.274 113.255C-345.2 92.0658 -263.126 70.8772 -181.052 49.6886C-98.9784 28.4999 -16.9044 7.31127 65.1695 -13.8774C147.244 -35.066 229.317 -56.2547 311.391 -77.4433C393.465 -98.632 475.539 -119.821 557.613 -141.009C639.687 -162.198 721.761 -183.387 803.835 -204.575L824.761 -129.33Z"
                  fill="url(#paint2_linear_56_9372)"
                  fillOpacity="0.2"
                />
                <ellipse
                  opacity="0.8"
                  cx="101.88"
                  cy="319"
                  rx="257.696"
                  ry="258"
                  transform="rotate(-180 101.88 319)"
                  fill="#AF1C30"
                  fillOpacity="0.18"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_56_9372"
                  x1="849"
                  y1="295"
                  x2="1683.71"
                  y2="568.418"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#AB1A2D" />
                  <stop offset="0.787775" stopColor="#E8374E" />
                  <stop offset="1" stopColor="#E43A50" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_56_9372"
                  x1="-472.709"
                  y1="135.017"
                  x2="-489.976"
                  y2="329.31"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.05" stopColor="#FB2C36" />
                  <stop offset="0.95" stopColor="white" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_56_9372"
                  x1="856.217"
                  y1="-16.2197"
                  x2="807.356"
                  y2="-205.484"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.05" stopColor="#FB2C36" />
                  <stop offset="0.95" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="flex flex-col items-center justify-center text-center min-h-[200px]">
              <h1 className="text-4xl font-bold mb-4">
                Welcome back, {session?.user?.name || "User"}!
              </h1>
              <p className="text-white/90 text-lg max-w-2xl">
                You're all set! Use the navigation menu to access your tools and
                manage your work.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <div className="text-center text-muted-foreground">
          Failed to load dashboard data
        </div>
      </div>
    );
  }

  const quarterName = `Q${stats.currentQuarter} ${stats.currentYear}`;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      {/* Header Section with Welcome Card and Revenue Performance Chart */}
      <div className="grid gap-6 grid-cols-[2fr_1fr]">
        {/* Welcome Card */}
        <Card
          className="relative overflow-hidden rounded-3xl border-none text-white"
          style={{
            background:
              "linear-gradient(135deg, #AB1A2D 0%, #E8374E 50%, #E43A50 100%)",
          }}
        >
          {/* Unified Decorative SVG Background */}
          <div className="absolute inset-0 w-full h-full">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 849 282"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <mask
                id="mask0_56_9372"
                style={{ maskType: "alpha" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="849"
                height="282"
              >
                <rect
                  x="849"
                  y="282"
                  width="849"
                  height="282"
                  rx="27"
                  transform="rotate(-180 849 282)"
                  fill="url(#paint0_linear_56_9372)"
                />
              </mask>
              <g mask="url(#mask0_56_9372)">
                <ellipse
                  opacity="0.8"
                  cx="748.119"
                  cy="-33.9999"
                  rx="223.736"
                  ry="224"
                  transform="rotate(-180 748.119 -33.9999)"
                  fill="#E6384F"
                  fillOpacity="0.23"
                />
                <path
                  d="M-483.873 251.622C-393.471 198.647 -303.069 145.669 -218.903 157.826C-134.738 169.986 -56.8074 247.279 27.5005 257.955C111.808 268.63 202.495 212.681 287.828 212.64C373.162 212.597 453.144 268.458 536.089 293.376C619.033 318.293 704.94 312.263 790.847 306.235L777.852 441.983C693.242 434.464 608.632 426.945 524.022 419.425C439.412 411.906 354.802 404.386 270.192 396.867C185.581 389.348 100.971 381.828 16.3614 374.309C-68.2486 366.79 -152.859 359.27 -237.469 351.751C-322.079 344.232 -406.689 336.712 -491.299 329.193L-483.873 251.622Z"
                  fill="url(#paint1_linear_56_9372)"
                  fillOpacity="0.6"
                />
                <path
                  d="M824.761 -129.33C759.007 -49.4597 693.253 30.4134 609.928 47.1031C526.602 63.7897 425.705 17.2961 342.78 35.4235C259.855 53.5509 194.903 136.305 114.868 164.827C34.8343 193.352 -60.2809 167.648 -147.048 171.96C-233.816 176.272 -312.234 210.604 -390.654 244.933L-427.274 113.255C-345.2 92.0658 -263.126 70.8772 -181.052 49.6886C-98.9784 28.4999 -16.9044 7.31127 65.1695 -13.8774C147.244 -35.066 229.317 -56.2547 311.391 -77.4433C393.465 -98.632 475.539 -119.821 557.613 -141.009C639.687 -162.198 721.761 -183.387 803.835 -204.575L824.761 -129.33Z"
                  fill="url(#paint2_linear_56_9372)"
                  fillOpacity="0.2"
                />
                <ellipse
                  opacity="0.8"
                  cx="101.88"
                  cy="319"
                  rx="257.696"
                  ry="258"
                  transform="rotate(-180 101.88 319)"
                  fill="#AF1C30"
                  fillOpacity="0.18"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_56_9372"
                  x1="849"
                  y1="295"
                  x2="1683.71"
                  y2="568.418"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#AB1A2D" />
                  <stop offset="0.787775" stopColor="#E8374E" />
                  <stop offset="1" stopColor="#E43A50" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_56_9372"
                  x1="-472.709"
                  y1="135.017"
                  x2="-489.976"
                  y2="329.31"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.05" stopColor="#FB2C36" />
                  <stop offset="0.95" stopColor="white" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_56_9372"
                  x1="856.217"
                  y1="-16.2197"
                  x2="807.356"
                  y2="-205.484"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.05" stopColor="#FB2C36" />
                  <stop offset="0.95" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Content */}
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-y-1">
                <h1 className="text-2xl font-bold">
                  Welcome back, {session?.user?.name || "User"}!
                </h1>
                <p className="text-white/90 text-sm line-clamp-2 max-w-xl">
                  Ready to create winning proposals? You&apos;ve closed&nbsp;
                  {formatCurrency(stats.quarterlyRevenue)} this quarter -
                  let&apos;s keep the momentum going!
                </p>
              </div>

              <div className="bg-[#E64B60] backdrop-blur-sm rounded-2xl px-6 py-4 border border-[#FF9494]">
                <div className="text-sm text-white/80 mb-1">This Quarter</div>
                <div className="text-3xl font-bold">
                  {formatCompactCurrency(stats.quarterlyRevenue)}
                </div>
                <div className="text-sm text-white/80 mt-1">Revenue Closed</div>
              </div>
            </div>
          </div>
          <CardContent className="relative z-10">
            <Can permission={["proposal:manage:own", "proposal:admin:all"]}>
              <Button
                variant="outline"
                className="text-primary flex items-center gap-2"
                onClick={handleCreateProposal}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                <p>Build New Proposal</p>
              </Button>
            </Can>
          </CardContent>
        </Card>

        {/* Revenue Performance Chart */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Performance</CardTitle>
                <CardDescription>
                  Monthly Closed Deals and Pipelines
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {stats.currentYear}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                acceptedCount: {
                  label: "Monthly Closed",
                  color: "hsl(var(--chart-1))",
                },
                pipelineCount: {
                  label: "Pipeline",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[200px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.monthlyPerformance}
                  margin={{ top: 24, right: 24, left: 24, bottom: 24 }}
                >
                  <defs>
                    <linearGradient
                      id="colorAcceptedDashboard"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--chart-1))"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--chart-2))"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorPipelineDashboard"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--chart-2))"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--chart-3))"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="monthName"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (
                        !active ||
                        !payload ||
                        payload.length === 0 ||
                        !payload[0]
                      )
                        return null;

                      const data = payload[0].payload;

                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg">
                          <div className="font-semibold mb-2">
                            {data.monthName}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]" />
                              <span className="text-muted-foreground">
                                Monthly Closed
                              </span>
                              <span className="ml-auto font-semibold">
                                {data.acceptedCount}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />
                              <span className="text-muted-foreground">
                                Pipeline
                              </span>
                              <span className="ml-auto font-semibold">
                                {data.pipelineCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    dataKey="acceptedCount"
                    name="Monthly Closed"
                    type="bump"
                    fill="url(#colorAcceptedDashboard)"
                    fillOpacity={0.4}
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    isAnimationActive={false}
                    activeDot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                    connectNulls
                  />
                  <Area
                    dataKey="pipelineCount"
                    name="Pipeline"
                    type="bump"
                    fill="url(#colorPipelineDashboard)"
                    fillOpacity={0.4}
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    isAnimationActive={false}
                    activeDot={{ r: 4, fill: "hsl(var(--chart-2))" }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Proposals Won */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xl text-sidebar-foreground flex items-center justify-between">
              <p>Proposals Won</p>
              <DollarSign className="bg-gradient-to-r from-[#3ED073] to-[#19A64D] size-8 text-white rounded-full px-2" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.metrics.current.proposalsWon}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">This month</div>
            {renderComparisonBadge(
              stats.metrics.current.proposalsWon,
              stats.metrics.previous.proposalsWon
            )}
          </CardContent>
        </Card>

        {/* Pending Proposals */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xl text-sidebar-foreground flex justify-between items-center">
              <p>Pending Proposals</p>
              <RefreshCw className="size-8 bg-[#538FFE] text-white rounded-full px-2" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.metrics.current.pendingProposals}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Awaiting responses
            </div>
            {renderComparisonBadge(
              stats.metrics.current.pendingProposals,
              stats.metrics.previous.pendingProposals
            )}
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xl text-sidebar-foreground flex items-center justify-between">
              <p>Win Rate</p>
              <Package className="size-8 bg-gradient-to-r from-[#D2384C] to-[#E53950] text-white rounded-full px-2" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.metrics.current.winRate.toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Win Rate</div>
            {renderComparisonBadge(
              stats.metrics.current.winRate,
              stats.metrics.previous.winRate
            )}
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xl text-sidebar-foreground flex items-center justify-between">
              <p>Pipeline Value</p>
              <Database className="size-8 bg-gradient-to-r from-[#F88732] to-[#EB5D10] text-white rounded-full px-2" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatCompactCurrency(stats.metrics.current.pipelineValue)} AED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Pipeline Value</div>
            {renderComparisonBadge(
              stats.metrics.current.pipelineValue,
              stats.metrics.previous.pipelineValue
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Proposals Table */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Recent Proposals
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and track your venue proposals
          </p>
        </div>
        <div className="flex gap-2">
          <Can permission={["proposal:manage:own", "proposal:admin:all"]}>
            <Button
              onClick={handleCreateProposal}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              New Proposal
            </Button>
          </Can>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
          <CardDescription>Track your latest proposal activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-4">Propsal</TableHead>
                  <TableHead className="p-4">VENUE</TableHead>
                  <TableHead className="p-4">TIER</TableHead>
                  <TableHead className="p-4">BRANDS</TableHead>
                  <TableHead className="p-4">VALUE</TableHead>
                  <TableHead className="p-4">STATUS</TableHead>
                  <TableHead className="p-4">LAST UPDATED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentProposals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No recent proposals. Create your first proposal to get
                      started!
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentProposals.map((proposal) => (
                    <TableRow
                      key={proposal.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedProposalId(proposal.id);
                        setIsDetailSheetOpen(true);
                      }}
                    >
                      <TableCell className="p-4">
                        <div className="font-medium">
                          {proposal.name || "New Proposal"}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="font-medium">
                          {proposal.venueName || "No venue"}
                        </div>
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
                              <Trophy className="h-4 w-4 stroke-1" />
                            </div>
                            <p className="capitalize">{proposal.venueTier}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-sm">
                          {proposal.brandCount} brands
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="font-medium">
                          {formatCurrency(parseFloat(proposal.totalValue))}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 ">
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
                          <p>{STATUS_LABELS[proposal.status]}</p>
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium">
                            {formatRelativeTime(proposal.updatedAt)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(proposal.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
  );
}
