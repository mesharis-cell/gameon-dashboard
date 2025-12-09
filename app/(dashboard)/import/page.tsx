"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  History,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

type ImportType = "venues" | "activations" | "skus";

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
  jobId: string;
}

interface ImportJob {
  id: string;
  importType: string;
  filename: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  errorDetails?: any;
}

export default function ImportPage() {
  const queryClient = useQueryClient();
  const [importType, setImportType] = useState<ImportType>("venues");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Fetch import history
  const { data: importJobsResponse } = useQuery({
    queryKey: ["import-jobs"],
    queryFn: () => api.get("/api/import/jobs"),
  });

  const importJobs = (importJobsResponse as any)?.data || [];

  const importMutation = useMutation({
    mutationFn: async (data: { type: ImportType; file: File }) => {
      const formData = new FormData();
      formData.append("file", data.file);

      const response: any = await api.post(
        `/api/import/${data.type}`,
        formData
      );
      return response.data as ImportResult;
    },
    onSuccess: async (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["import-jobs"] });

      // Clear file after successful import
      if (data.success) {
        setFile(null);
        const fileInput = document.getElementById(
          "file-upload"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        toast.success(`Successfully imported ${data.imported} ${importType}`);
      } else if (data.imported > 0) {
        // Partial import - auto-download error report
        toast.warning(
          `Partial import: ${data.imported} succeeded, ${data.failed} failed`
        );
        await downloadErrorReport(data.jobId);
      } else {
        // Failed import - auto-download error report
        toast.error(`Import failed: ${data.failed} errors`);
        await downloadErrorReport(data.jobId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Import failed");
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [error.message],
        jobId: "",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [".csv", ".xlsx", ".xls"];
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validTypes.includes(fileExtension)) {
        toast.error("Please upload a CSV or Excel file");
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    importMutation.mutate({ type: importType, file });
  };

  const downloadTemplate = (type: ImportType) => {
    // Create CSV template based on type with camelCase headers
    let csvContent = "";

    switch (type) {
      case "venues":
        csvContent =
          "customerCode,name,tier,mediaUrl,boosterEligible,assignedUserEmail,contactName,contactPhone,contactEmail,brands\n" +
          'ZEN001234,The Grand Hotel Dubai,gold,https://s3.amazonaws.com/venues/grand-hotel.jpg,true,john.doe@company.com,Ahmed Al Maktoum,+971-50-123-4567,venue@grandhotel.com,"Corona,Asahi,Budweiser"';
        break;
      case "skus":
        csvContent =
          "brandName,productCode,productDescription,subCategory,priceAed\n" +
          "Corona,90170040,CORONA EXTRA KEG IPPC,BEER - KEG,450.00\n" +
          "Corona,90170041,CORONA EXTRA 24X330ML BOTTLE,BEER - PACKAGED,180.00";
        break;
      case "activations":
        csvContent =
          "brandName,name,year,description,kitContents,venueRequirements,media,activationType,availableMonths,monthlyValue,scalingBehavior,fixedAmount,variableAmount,status,isActive\n" +
          'Asahi,Winter Sports Bar Package,2026,Complete sports bar branding package for winter season,"20x Branded Bar Mats,10x Neon Signs,5x TV Screen Branding","Sports bar or pub,Minimum 3 TV screens",https://s3.amazonaws.com/activations/asahi-sports.jpg,fixed,"11,12",25000,,,,published,true\n' +
          'Corona,Summer Beach Activation 2026,2026,Premium beach setup with branded umbrellas and furniture,"10x Branded Beach Umbrellas,5x Beach Lounge Chairs,2x Branded Coolers","Beachfront location,Minimum 50 seat capacity",https://s3.amazonaws.com/activations/corona-beach.jpg,variable,"1,2,3,4,5,6",,proportional,,10000,published,true\n' +
          'Budweiser,World Cup Viewing Party,2026,Complete World Cup viewing party support package,"Large Screen TV,Branded Furniture,Sound System","Minimum 50 person capacity",https://s3.amazonaws.com/activations/budweiser-worldcup.jpg,variable,"5,6,7",,mixed,60000,13333,published,true';
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Template downloaded: ${type}_template.csv`);
  };

  const downloadErrorReport = async (jobId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/import/jobs/${jobId}/errors`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download error report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `import_errors_${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Error report downloaded");
    } catch (error) {
      toast.error("Failed to download error report");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "partial":
        return "secondary";
      case "failed":
        return "destructive";
      case "processing":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
        <p className="text-muted-foreground">
          Import venues, SKU pricing, and activations from CSV or Excel files
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Select the type of data and upload your CSV or Excel file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-type">Import Type</Label>
              <Select
                value={importType}
                onValueChange={(value) => setImportType(value as ImportType)}
              >
                <SelectTrigger id="import-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venues">Venues</SelectItem>
                  <SelectItem value="skus">SKU Pricing</SelectItem>
                  <SelectItem value="activations">Activations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">File</Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => downloadTemplate(importType)}
                  title="Download Template"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              {file && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                      // Reset the file input
                      const fileInput = document.getElementById(
                        "file-upload"
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Result */}
        <Card>
          <CardHeader>
            <CardTitle>Import Result</CardTitle>
            <CardDescription>
              View the results of your import operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Upload className="h-12 w-12 mb-4 opacity-50" />
                <p>No import performed yet</p>
                <p className="text-sm">
                  Upload a file and click Import to begin
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-semibold">
                    {result.success
                      ? "Import Successful"
                      : result.imported > 0
                        ? "Partial Import"
                        : "Import Failed"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Imported</p>
                    <p className="text-2xl font-bold text-green-500">
                      {result.imported}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-destructive">
                      {result.failed}
                    </p>
                  </div>
                </div>

                {/* {result.errors && result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <p className="font-semibold mb-2">Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="font-semibold">... and {result.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )} */}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Import History
              </CardTitle>
              <CardDescription>
                View your recent import operations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {importJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No import history yet</p>
              <p className="text-sm">Your import operations will appear here</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Processed</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importJobs.map((job: ImportJob) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium capitalize">
                        {job.importType.replace("_", " ")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {job.filename}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {job.totalRows}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {job.processedRows}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {job.errorRows}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(job.startedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {job.errorRows > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadErrorReport(job.id)}
                            title="Download Error Report"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 grid grid-cols-3">
          <div>
            <h3 className="font-semibold mb-2">File Format</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Supported formats: CSV (.csv), Excel (.xlsx, .xls)</li>
              <li>First row must contain column headers (camelCase format)</li>
              <li>Download the template for the correct column structure</li>
              <li>Ensure all required fields are filled</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Data Validation</h3>
            <ul className="list-disc list-inside  text-sm text-muted-foreground">
              <li>Invalid rows will be skipped and reported in errors</li>
              <li>
                Duplicate entries will be updated automatically (venues by
                customerCode, SKUs by productCode, activations by name)
              </li>
              <li>
                Brand names must exist in the system (case-insensitive match)
              </li>
              <li>User emails must exist for venue assignment</li>
              <li>Tier must be: gold, silver, or bronze</li>
              <li>Activation type must be: fixed or variable</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Array Fields</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>
                <strong>All array fields use comma-separated format:</strong>{" "}
                brands, kitContents, venueRequirements, availableMonths
              </li>
              <li>
                <strong>Important:</strong> Comma separated
              </li>
              <li>Example brands: "Corona,Bull,Budwiser,Peroni"</li>
              <li>Example kitContents: "10x Umbrellas,5x Chairs,2x Coolers"</li>
              <li>
                Example venueRequirements: "Beachfront location,Minimum 50 seat
                capacity"
              </li>
              <li>
                Example availableMonths: "1,2,3,4,5,6" (January through June -
                use numbers 1-12)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Activation Types</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>
                <strong>Fixed:</strong> Provide monthlyValue. System calculates:
                total = monthlyValue × months. Leave scalingBehavior,
                fixedAmount, variableAmount empty.
              </li>
              <li>
                <strong>Variable + Proportional:</strong> Provide variableAmount
                (monthly value). System calculates: total = variableAmount ×
                months. Leave monthlyValue and fixedAmount empty.
              </li>
              <li>
                <strong>Variable + Mixed:</strong> Provide fixedAmount
                (one-time) and variableAmount (monthly). System calculates:
                total = fixedAmount + (variableAmount × months). Leave
                monthlyValue empty.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Best Practices</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Test with a small file first to verify format</li>
              <li>Review the template carefully before uploading</li>
              <li>Backup existing data before large imports</li>
              <li>Check import history for detailed error messages</li>
              <li>Successful rows are processed even if some rows fail</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
