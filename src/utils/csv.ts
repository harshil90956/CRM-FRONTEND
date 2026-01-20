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
  const normalized = (csvText || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

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
  }).filter((row) => row.some((v) => String(v).trim().length > 0));
  
  return { headers, rows };
};

export const sampleLeadsCsvTemplate = `Name,Email,Phone,Status,Source,Budget,tenantId,priority,notes,projectId,assignedToId
John Doe,john@example.com,+91 98765 43210,NEW,Website,₹85L - ₹1Cr,tenant_default,Medium,,,
Jane Smith,jane@example.com,+91 87654 32109,NEW,Referral,₹1.2Cr - ₹1.5Cr,tenant_default,Medium,,,
`;

export const buildLeadsCsvTemplate = (args: {
  dynamicKeys?: string[];
  includeProjectIdColumn?: boolean;
}) => {
  const dynamicKeys = Array.isArray(args.dynamicKeys) ? args.dynamicKeys.filter(Boolean) : [];
  const includeProjectIdColumn = args.includeProjectIdColumn !== false;

  const baseHeaders = [
    'Name',
    'Email',
    'Phone',
    'Status',
    'Source',
    'Budget',
    'tenantId',
    'priority',
    'notes',
    ...(includeProjectIdColumn ? ['projectId'] : []),
    'assignedToId',
  ];

  const lowerBase = new Set(baseHeaders.map((h) => h.toLowerCase()));
  const extra = dynamicKeys.filter((k) => !lowerBase.has(String(k).toLowerCase()));

  const headers = baseHeaders.concat(extra);
  const sampleRow = new Array(headers.length).fill('');

  if (headers[0] === 'Name') sampleRow[0] = 'John Doe';
  if (headers[1] === 'Email') sampleRow[1] = 'john@example.com';
  if (headers[2] === 'Phone') sampleRow[2] = '+91 98765 43210';
  if (headers[3] === 'Status') sampleRow[3] = 'NEW';
  if (headers[4] === 'Source') sampleRow[4] = 'Website';
  if (headers[5] === 'Budget') sampleRow[5] = '₹85L - ₹1Cr';
  const tenantIdx = headers.findIndex((h) => h.toLowerCase() === 'tenantid');
  if (tenantIdx >= 0) sampleRow[tenantIdx] = 'tenant_default';

  return `${headers.join(',')}\n${sampleRow.join(',')}\n`;
};
