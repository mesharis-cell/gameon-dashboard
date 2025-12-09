'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MonthSelectorProps {
  availableMonths: number[];
  selectedMonths: number[];
  onMonthsChange: (months: number[]) => void;
  activationType: 'fixed' | 'variable';
  disabled?: boolean;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function MonthSelector({
  availableMonths,
  selectedMonths,
  onMonthsChange,
  activationType,
  disabled = false,
}: MonthSelectorProps) {
  const handleMonthToggle = (month: number) => {
    if (disabled) return;

    // Fixed in time: Must select all or none
    if (activationType === 'fixed') {
      if (selectedMonths.length === availableMonths.length) {
        onMonthsChange([]); // Deselect all
      } else {
        onMonthsChange([...availableMonths].sort((a, b) => a - b)); // Select all
      }
      return;
    }

    // Variable in time: Can select any combination
    if (selectedMonths.includes(month)) {
      onMonthsChange(selectedMonths.filter(m => m !== month));
    } else {
      onMonthsChange([...selectedMonths, month].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={activationType === 'fixed' ? 'default' : 'secondary'}>
          {activationType === 'fixed' ? 'Fixed in Time' : 'Variable in Time'}
        </Badge>
        {activationType === 'fixed' && (
          <span className="text-xs text-muted-foreground">
            Must select all months or none
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
          const isSelected = selectedMonths.includes(month);
          const isAvailable = availableMonths.includes(month);

          return (
            <button
              key={month}
              type="button"
              disabled={!isAvailable || disabled}
              onClick={() => isAvailable && handleMonthToggle(month)}
              className={cn(
                'p-3 border rounded-lg text-center transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected && 'bg-primary text-primary-foreground border-primary',
                !isAvailable && 'opacity-30 cursor-not-allowed',
                isAvailable && !isSelected && !disabled && 'hover:bg-accent cursor-pointer',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <div className="text-xs font-medium">{MONTH_NAMES[month - 1]}</div>
            </button>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground">
        Selected: {selectedMonths.length} of {availableMonths.length} months
      </div>
    </div>
  );
}