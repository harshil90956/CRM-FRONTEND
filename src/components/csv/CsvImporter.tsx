import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CsvImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => void;
  requiredFields: string[];
  fieldLabels: Record<string, string>;
}

export const CsvImporter = ({
  open,
  onOpenChange,
  onImport,
  requiredFields,
  fieldLabels,
}: CsvImporterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => String(h || '').trim(),
      complete: (results) => {
        const rows = (results.data || []).filter((r: any) => r && typeof r === 'object');
        const parsedHeaders = (results.meta?.fields || []).map((h) => String(h || '').trim()).filter(Boolean);

        if (parsedHeaders.length === 0 || rows.length === 0) {
          toast.error('No data found in CSV');
          return;
        }

        setCsvData(rows);
        setHeaders(parsedHeaders);

        const headerByLower = new Map(parsedHeaders.map((h) => [h.toLowerCase(), h] as const));
        const defaultMapping: Record<string, string> = {};
        requiredFields.forEach((f) => {
          defaultMapping[f] = headerByLower.get(String(f).toLowerCase()) || '';
        });
        setMapping(defaultMapping);
        setErrors([]);
        setStep('mapping');
      },
      error: () => {
        toast.error('Failed to parse CSV');
      },
    });

    // Allow selecting the same file again
    e.target.value = '';
  };

  const validateMapping = () => {
    const newErrors: string[] = [];
    requiredFields.forEach((field) => {
      // Allow manual entry - no validation needed if field is mapped or manual entry is selected
      if (!mapping[field]) {
        newErrors.push(`${fieldLabels[field] || field} is required`);
      }
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleProceedToPreview = () => {
    if (validateMapping()) {
      setStep("preview");
    }
  };

  const getMappedData = () => {
    return csvData.slice(0, 10).map((row) => {
      const mappedRow: Record<string, any> = {};
      Object.entries(mapping).forEach(([field, csvHeader]) => {
        // If manual entry is selected, use empty string
        if (!csvHeader) {
          mappedRow[field] = "";
        } else {
          mappedRow[field] = (row as any)?.[csvHeader] ?? "";
        }
      });
      return mappedRow;
    });
  };

  const handleImport = () => {
    if (!validateMapping()) return;

    const allMapped = csvData.map((row) => {
      const mappedRow: Record<string, any> = {};
      Object.entries(mapping).forEach(([field, csvHeader]) => {
        mappedRow[field] = csvHeader ? ((row as any)?.[csvHeader] ?? '') : '';
      });
      return mappedRow;
    });

    onImport(allMapped);
    toast.success(`Imported ${allMapped.length} record(s)`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep("upload");
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import CSV
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file to import data."}
            {step === "mapping" && "Map CSV columns to required fields."}
            {step === "preview" && "Review data before importing."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="py-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Drop CSV file here or click to upload</p>
              <p className="text-sm text-muted-foreground">
                Supported format: .csv
              </p>
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4 py-4">
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Missing required mappings</span>
                </div>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {requiredFields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {fieldLabels[field] || field}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={mapping[field] || ""}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, [field]: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        Manual Entry
                      </SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Found {csvData.length} rows in CSV file
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-success mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Ready to import {csvData.length} records</span>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {requiredFields.map((field) => (
                      <TableHead key={field}>{fieldLabels[field] || field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMappedData().map((row, index) => (
                    <TableRow key={index}>
                      {requiredFields.map((field) => (
                        <TableCell key={field} className="max-w-32 truncate">
                          {row[field] || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {csvData.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing first 10 of {csvData.length} rows
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          {step === "mapping" && (
            <Button onClick={handleProceedToPreview}>Continue to Preview</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back to Mapping
              </Button>
              <Button onClick={handleImport}>
                Import {csvData.length} Records
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
