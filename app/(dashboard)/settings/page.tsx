"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Bell,
  TrendingUp,
  Plus,
  Trash,
  Loader2,
  MailPlus,
  Rocket,
  ArrowRight,
  X,
} from "lucide-react";
import { RolesManagement } from "./components/roles-management";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { toast } from "sonner";
import { z } from "zod";

// Validation schemas
const recipientSchema = z.object({
  email: z.string().email("Invalid email address"),
  teamName: z.string().min(1, "Team name is required").max(100),
});

const coefficientSchema = z.object({
  brandCoefficient: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid coefficient format"),
  premiumCoefficient: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid coefficient format"),
});

interface NotificationRecipient {
  id: string;
  email: string;
  teamName: string;
}

interface BoosterCoefficient {
  tier: "gold" | "silver" | "bronze";
  brandCoefficient: string;
  premiumCoefficient: string;
}

export default function SettingsPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Notification recipients state
  const [newEmail, setNewEmail] = useState("");
  const [newTeam, setNewTeam] = useState("");

  // Booster coefficients state
  const [coefficientEdits, setCoefficientEdits] = useState<
    Record<
      string,
      {
        brandCoefficient: string;
        premiumCoefficient: string;
      }
    >
  >({});

  // Track if coefficients have been recently updated
  const [hasRecentlyUpdated, setHasRecentlyUpdated] = useState(false);

  // Fetch notification recipients
  const { data: recipientsResponse, isLoading: recipientsLoading } = useQuery({
    queryKey: ["notification-recipients"],
    queryFn: () => api.get("/api/settings/notification-recipients"),
  });

  // Fetch booster coefficients
  const { data: coefficientsResponse, isLoading: coefficientsLoading } =
    useQuery({
      queryKey: ["booster-coefficients"],
      queryFn: () => api.get("/api/settings/booster-coefficients"),
    });

  const recipients: NotificationRecipient[] =
    (recipientsResponse as any)?.data || [];
  const coefficients: BoosterCoefficient[] =
    (coefficientsResponse as any)?.data || [];

  // Add recipient mutation
  const addRecipientMutation = useMutation({
    mutationFn: (data: { email: string; teamName: string }) =>
      api.post("/api/settings/notification-recipients", data),
    onSuccess: () => {
      toast.success("Recipient added successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-recipients"] });
      setNewEmail("");
      setNewTeam("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add recipient");
    },
  });

  // Delete recipient mutation
  const deleteRecipientMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/settings/notification-recipients/${id}`),
    onSuccess: () => {
      toast.success("Recipient deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-recipients"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete recipient");
    },
  });

  // Update coefficient mutation
  const updateCoefficientMutation = useMutation({
    mutationFn: ({ tier, data }: { tier: string; data: any }) =>
      api.patch(`/api/settings/booster-coefficients/${tier}`, data),
    onSuccess: () => {
      toast.success("Coefficient updated successfully");
      queryClient.invalidateQueries({ queryKey: ["booster-coefficients"] });
      setCoefficientEdits({});
      setHasRecentlyUpdated(true);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update coefficient");
    },
  });

  const handleAddRecipient = () => {
    // Validate
    const result = recipientSchema.safeParse({
      email: newEmail,
      teamName: newTeam,
    });

    if (!result.success) {
      toast.error(result.error.issues[0]?.message || "Invalid input");
      return;
    }

    addRecipientMutation.mutate(result.data);
  };

  const handleUpdateCoefficient = (tier: string) => {
    const edits = coefficientEdits[tier];
    if (!edits) return;

    // Validate
    const result = coefficientSchema.safeParse(edits);

    if (!result.success) {
      toast.error(
        result.error.issues[0]?.message || "Invalid coefficient format"
      );
      return;
    }

    updateCoefficientMutation.mutate({ tier, data: result.data });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "silver":
        return "bg-gray-400/10 border-gray-400/20";
      case "bronze":
        return "bg-orange-700/10 border-orange-700/20";
      default:
        return "bg-muted";
    }
  };

  // Determine which tabs are visible based on permissions
  const visibleTabs = useMemo(() => {
    const tabs = [];

    // Roles tab - requires role:view:all permission
    if (hasPermission("role:view:all")) {
      tabs.push("roles");
    }

    // Notifications tab - requires setting:manage:all permission
    if (hasPermission("setting:manage:all")) {
      tabs.push("notifications");
    }

    // Booster tab - requires setting:manage:all permission
    if (hasPermission("setting:manage:all")) {
      tabs.push("booster");
    }

    return tabs;
  }, [hasPermission]);

  // Set default tab to first visible tab
  const defaultTab = visibleTabs[0] || "roles";

  if (visibleTabs.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system settings and configurations
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          {visibleTabs.includes("roles") && (
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
          )}

          {visibleTabs.includes("booster") && (
            <TabsTrigger value="booster" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Booster Coefficients
            </TabsTrigger>
          )}
          {visibleTabs.includes("notifications") && (
            <TabsTrigger value="notifications" className="gap-2">
              <MailPlus className="h-4 w-4" />
              Email
            </TabsTrigger>
          )}
        </TabsList>

        {/* Roles Tab */}
        {visibleTabs.includes("roles") && (
          <TabsContent value="roles">
            <RolesManagement />
          </TabsContent>
        )}

        {/* Notifications Tab */}
        {visibleTabs.includes("notifications") && (
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Email Notification Recipients</CardTitle>
                <CardDescription>
                  Configure internal team emails that receive automatic
                  notifications when proposals are submitted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Recipient Form */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newEmail && newTeam) {
                          handleAddRecipient();
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Team name (e.g., Sales, Marketing)"
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newEmail && newTeam) {
                          handleAddRecipient();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleAddRecipient}
                    disabled={
                      !newEmail || !newTeam || addRecipientMutation.isPending
                    }
                  >
                    {addRecipientMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Recipients List */}
                {recipientsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recipients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No notification recipients configured</p>
                    <p className="text-sm mt-2">
                      Add recipients above to receive proposal notifications
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-x-4">
                    {recipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{recipient.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {recipient.teamName}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            deleteRecipientMutation.mutate(recipient.id)
                          }
                          disabled={deleteRecipientMutation.isPending}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Booster Coefficients Tab */}
        {visibleTabs.includes("booster") && (
          <TabsContent value="booster">
            <Card>
              <CardHeader>
                <CardTitle>Booster Coefficients</CardTitle>
                <CardDescription>
                  Configure tier-specific coefficients for booster value
                  calculations. Changes will affect all draft proposals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coefficientsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-y-4">
                    <div className="grid grid-cols-3 gap-x-4 ">
                      {/* Always show Gold, Silver, Bronze in order */}
                      {["gold", "silver", "bronze"].map((tier) => {
                        const coeff = coefficients.find((c) => c.tier === tier);
                        if (!coeff) return null;

                        const edits = coefficientEdits[tier] || {
                          brandCoefficient: coeff.brandCoefficient,
                          premiumCoefficient: coeff.premiumCoefficient,
                        };

                        // Bronze tier doesn't use premium coefficient
                        const isBronze = tier === "bronze";

                        return (
                          <div
                            key={tier}
                            className={`p-4 border rounded-lg ${getTierColor(tier)}`}
                          >
                            <h3 className="font-semibold capitalize mb-4 text-lg">
                              {tier} Tier
                            </h3>
                            <div
                              className={`grid ${isBronze ? "grid-cols-1" : "grid-cols-2"} gap-4`}
                            >
                              <div className="space-y-2">
                                <Label htmlFor={`${tier}-brand`}>
                                  Brand Coefficient
                                </Label>
                                <Input
                                  id={`${tier}-brand`}
                                  type="text"
                                  value={edits.brandCoefficient}
                                  onChange={(e) =>
                                    setCoefficientEdits((prev) => ({
                                      ...prev,
                                      [tier]: {
                                        ...edits,
                                        brandCoefficient: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="e.g., 5000"
                                />
                              </div>
                              {/* Only show Premium Coefficient for Gold and Silver */}
                              {!isBronze && (
                                <div className="space-y-2">
                                  <Label htmlFor={`${tier}-premium`}>
                                    Premium Coefficient
                                  </Label>
                                  <Input
                                    id={`${tier}-premium`}
                                    type="text"
                                    value={edits.premiumCoefficient}
                                    onChange={(e) =>
                                      setCoefficientEdits((prev) => ({
                                        ...prev,
                                        [tier]: {
                                          ...edits,
                                          premiumCoefficient: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="e.g., 10000"
                                  />
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="default"
                              className="mt-4 rounded-full"
                              onClick={() => handleUpdateCoefficient(tier)}
                              disabled={
                                updateCoefficientMutation.isPending ||
                                (edits.brandCoefficient ===
                                  coeff.brandCoefficient &&
                                  edits.premiumCoefficient ===
                                    coeff.premiumCoefficient)
                              }
                            >
                              {updateCoefficientMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Coefficient"
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-col text-xs items-start text-muted-foreground">
                      <p>
                        Gold: (brandCount × Brand Coefficient) +
                        (premiumBrandCount × Premium Coefficient)
                      </p>
                      <p>
                        Silver: (brandCount × Brand Coefficient) +
                        (premium_BrandCount × Premium Coefficient)
                      </p>
                      <p>Bronze: (brandCount × Brand Coefficient)</p>
                    </div>

                    {/* CTA Card - Appears after coefficient updates */}
                    {hasRecentlyUpdated && (
                      <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 animate-in slide-in-from-bottom-4">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/20 p-3 flex-shrink-0">
                              <Rocket className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                Test Your New Booster Settings!
                              </h3>
                              <p className="text-muted-foreground text-xs mb-4">
                                Your coefficient changes have been saved. Create
                                a proposal to see how the new booster values
                                affect calculations.
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => router.push("/proposals")}
                                >
                                  Create Proposal
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outlinered"
                                  onClick={() => setHasRecentlyUpdated(false)}
                                >
                                  <X className="h-4 w-4" />
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
