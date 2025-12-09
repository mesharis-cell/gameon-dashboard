import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { MONTH_NAMES } from "@/lib/types/proposals";
import type { Activation, ProposalActivation } from "@/lib/types/proposals";

interface ActivationCalendarProps {
  year: number;
  selectedBrandIds: string[];
  activations: Activation[];
  proposalActivations: ProposalActivation[];
  onAddActivation: (activation: Activation) => void;
  onViewActivation: (proposalActivation: ProposalActivation) => void;
}

export function ActivationCalendar({
  year,
  selectedBrandIds,
  activations,
  proposalActivations,
  onAddActivation,
  onViewActivation,
}: ActivationCalendarProps) {
  // Filter activations by selected brands and year
  const filteredActivations = activations.filter(
    (activation) =>
      activation.year === year &&
      selectedBrandIds.includes(activation.brandId)
  );

  // Get activations for a specific month
  const getActivationsForMonth = (month: number) => {
    return filteredActivations.filter((activation) =>
      activation.availableMonths.includes(month)
    );
  };

  // Check if activation is already in proposal
  const isActivationInProposal = (activationId: string) => {
    return proposalActivations.some(
      (pa) => pa.activation.id === activationId
    );
  };

  // Get proposal activation for display
  const getProposalActivation = (activationId: string) => {
    return proposalActivations.find(
      (pa) => pa.activation.id === activationId
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Activation Calendar - {year}</CardTitle>
          </div>
          <Badge variant="outline">
            {proposalActivations.length} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {MONTH_NAMES.map((monthName, index) => {
            const month = index + 1;
            const monthActivations = getActivationsForMonth(month);

            return (
              <Card key={month} className="overflow-hidden">
                <div className="bg-muted p-3">
                  <h3 className="font-semibold text-sm">{monthName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {monthActivations.length} available
                  </p>
                </div>
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                  {monthActivations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No activations
                    </p>
                  ) : (
                    monthActivations.map((activation) => {
                      const inProposal = isActivationInProposal(activation.id);
                      const proposalActivation = getProposalActivation(activation.id);

                      return (
                        <div
                          key={activation.id}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            inProposal
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => {
                            if (inProposal && proposalActivation) {
                              onViewActivation(proposalActivation);
                            } else {
                              onAddActivation(activation);
                            }
                          }}
                        >
                          <div className="font-medium truncate">
                            {activation.name}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {activation.activationType === "fixed" ? (
                              <Badge variant="outline" className="text-xs">
                                Fixed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Variable
                              </Badge>
                            )}
                          </div>
                          {inProposal && proposalActivation && (
                            <div className="mt-1 text-primary font-semibold">
                              {proposalActivation.selectedMonths.length} months
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredActivations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No activations available</p>
            <p className="text-sm">
              {selectedBrandIds.length === 0
                ? "Select brands to see available activations"
                : `No activations found for ${year}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}