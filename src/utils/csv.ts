// CSV Export Utility

export const downloadCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const value = String(cell ?? '');
      // Escape quotes and wrap in quotes if contains comma or newline
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseCsv = (csvText: string): { headers: string[]; rows: string[][] } => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0]?.split(',').map(h => h.trim().replace(/^"|"$/g, '')) || [];
  const rows = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
  
  return { headers, rows };
};

export const sampleLeadsCsvTemplate = `Name,Email,Phone,Project,Budget,Source,Status
John Doe,john@example.com,+91 98765 43210,Green Valley,₹85L - ₹1Cr,Website,NEW
Jane Smith,jane@example.com,+91 87654 32109,Sky Heights,₹1.2Cr - ₹1.5Cr,Referral,NEW`;
