import { Card } from "@/components/ui/card";
import { TrendingUp, Flame } from "lucide-react";

interface ValueSummaryCardsProps {
  totalValue: string;
  activationValue: string;
  tradeDealValue: string;
  focValue: string;
  creditNoteValue: string;
  boosterValue: string;
}

export function ValueSummaryCards({
  totalValue,
  activationValue,
  tradeDealValue,
  focValue,
  creditNoteValue,
  boosterValue,
}: ValueSummaryCardsProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value || "0"));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total Value Card - Black */}
      <Card className="bg-black text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-2">Total Proposal Value</p>
            <p className="text-4xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Activations</p>
            <p className="font-semibold">{formatCurrency(activationValue)}</p>
          </div>
          <div>
            <p className="text-gray-400">Trade Deals</p>
            <p className="font-semibold">{formatCurrency(tradeDealValue)}</p>
          </div>
          <div>
            <p className="text-gray-400">FOC</p>
            <p className="font-semibold">{formatCurrency(focValue)}</p>
          </div>
          <div>
            <p className="text-gray-400">Credit Notes</p>
            <p className="font-semibold">{formatCurrency(creditNoteValue)}</p>
          </div>
        </div>
      </Card>

      {/* Booster Value Card - Red Gradient */}
      <Card className="bg-gradient-to-br from-red-600 to-orange-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-red-100 mb-2">Booster Value</p>
            <p className="text-4xl font-bold">{formatCurrency(boosterValue)}</p>
          </div>
          <Flame className="h-8 w-8 text-red-100 fill-current" />
        </div>
        <div className="mt-6">
          <p className="text-sm text-red-100">
            Additional value based on venue tier and brand premium status
          </p>
        </div>
      </Card>
    </div>
  );
}