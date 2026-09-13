/**
 * Converts an array of transaction objects to a CSV file and triggers a download.
 * @param {Array<{id: number, description: string, amount: number, type: string, date: string}>} transactions
 */
export function exportToCsv(transactions) {
  const header = 'Description,Amount,Type,Date';

  const rows = transactions.map((t) => {
    // Wrap description in quotes to handle any commas inside it
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    return `${desc},${t.amount},${t.type},${t.date}`;
  });

  const csvText = [header, ...rows].join('\n');

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'finscope_transactions.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
