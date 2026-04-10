"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/hooks/use-user";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@/components/shared/can";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Loader2,
  Dot,
  ArrowRightFromLine,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import type { ProposalListItem, ProposalsResponse } from "@/lib/types/proposals";
import { STATUS_LABELS } from "@/lib/types/proposals";
import { ProposalSummarySheet } from "./components/proposal-summary-sheet";

const currentYear = new Date().getFullYear();

export default function ProposalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Filters and pagination
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, dateFilter, tierFilter]);

  const { data: proposalsResponse, isLoading } = useQuery<ProposalsResponse>({
    queryKey: ["proposals", page, searchQuery, statusFilter, dateFilter, tierFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateFilter !== "all" && { dateRange: dateFilter }),
        ...(tierFilter !== "all" && { tier: tierFilter }),
      });
      return api.get(`/api/proposals?${params.toString()}`);
    },
  });

  // Fetch full proposal details when a proposal is selected
  const { data: selectedProposalResponse, isLoading: isProposalLoading } = useQuery({
    queryKey: ["proposal", selectedProposalId],
    queryFn: () => api.get(`/api/proposals/${selectedProposalId}`),
    enabled: !!selectedProposalId,
  });

  const selectedProposal = (selectedProposalResponse as any)?.data;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/proposals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete proposal");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/proposals/${id}/duplicate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal duplicated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate proposal");
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/proposals", {
        name: "New Proposal",
        year: currentYear,
      }),
    onSuccess: (response: any) => {
      toast.success("Proposal created successfully");
      // Navigate to the proposal editor
      router.push(`/proposals/${response.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create proposal");
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateFilter !== "all" && { dateRange: dateFilter }),
        ...(tierFilter !== "all" && { tier: tierFilter }),
        format: "csv",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/proposals/export?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export proposals");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposals-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Proposals exported successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export proposals");
    },
  });

  const handleCreateProposal = () => {
    createMutation.mutate();
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const proposals = proposalsResponse?.data || [];
  const pagination = proposalsResponse?.pagination;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowClick = (proposal: ProposalListItem) => {
    // Open detail sheet instead of navigating
    setSelectedProposalId(proposal.id);
    setIsDetailSheetOpen(true);
  };

  const handleEditProposal = (proposalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/proposals/${proposalId}`;
  };

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

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
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
    <div className="flex flex-1 flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">Manage and track your venue proposals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightFromLine className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
          <Can permission={["proposal:manage:own", "proposal:admin:all"]}>
            <Button onClick={handleCreateProposal} disabled={createMutation.isPending}>
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

      {/* Table */}
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
              <Select value={dateFilter} onValueChange={setDateFilter}>
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
            {isLoading ? (
              // Skeleton rows
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
              proposals.map((proposal) => {
                // Check if user can manage this specific proposal
                const canManageThisProposal =
                  hasPermission("proposal:admin:all") ||
                  (hasPermission("proposal:manage:own") && proposal.creator?.id === user?.id);

                return (
                  <TableRow
                    key={proposal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(proposal)}
                  >
                    <TableCell className="p-4">
                      <div className="flex flex-col">
                        <div className="font-medium">{proposal.name}</div>
                        {proposal.dummy && (
                          <Badge
                            className="w-fit mt-1 text-xs font-normal border-none"
                            style={{
                              backgroundColor: "#E5E5EA",
                              color: "black",
                            }}
                          >
                            Dummy
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="text-sm">{proposal.venue?.name || "No venue"}</div>
                    </TableCell>
                    <TableCell className="p-4">
                      {proposal.venue?.tier ? (
                        <div className="flex items-center gap-x-2">
                          <div
                            className="border-none font-medium capitalize rounded-full p-2 text-white"
                            style={{
                              backgroundColor:
                                proposal.venue.tier === "gold"
                                  ? "#BE9E55"
                                  : proposal.venue.tier === "silver"
                                    ? "#878787"
                                    : "#BFA58F",
                              // color:
                              //   proposal.venue.tier === "gold"
                              //     ? "#92400E"
                              //     : proposal.venue.tier === "silver"
                              //       ? "#374151"
                              //       : "#9A3412",
                            }}
                          >
                            <Trophy className="stroke-1" />
                          </div>
                          <p className="capi capitalize">{proposal.venue.tier}</p>
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
                        <p>{STATUS_LABELS[proposal.status]}</p>
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="font-medium">{formatCurrency(proposal.totalValue)}</div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" disabled={!canManageThisProposal}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleEditProposal(proposal.id, e)}
                            disabled={!canManageThisProposal}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDuplicate(proposal.id, e)}
                            disabled={!canManageThisProposal}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {proposal.status === "draft" && (
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(proposal.id, e)}
                              className="text-destructive"
                              disabled={!canManageThisProposal}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            proposals
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
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
            <AlertDialogCancel onClick={() => setProposalToDelete(null)}>Cancel</AlertDialogCancel>
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
  );
}
