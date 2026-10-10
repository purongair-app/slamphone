export const paperOptions = ['58mm', '80mm', 'A4', 'A5'] as const;
export function printLayout(settings: Record<string, any>, kind = '') {
  const raw = kind.includes('ใบรับ') ? settings.jobPaper : settings.receiptPaper;
  const paper = paperOptions.includes(raw) ? raw : '80mm';
  const large = paper === 'A4' || paper === 'A5';
  const landscape = large && settings.printOrientation === 'landscape';
  const finite = (v: any, fallback: number, min: number, max: number) => {
    const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };
  const margin = finite(settings.printMargin ?? 3, 3, 0, 8);
  const font = finite(settings.printFontSize ?? 11, 11, 9, 18);
  const height = finite(settings.printRollHeight ?? 200, 200, 60, 500);
  const pageWidth = paper === 'A4' ? (landscape ? 297 : 210) : paper === 'A5' ? (landscape ? 210 : 148) : paper === '58mm' ? 58 : 80;
  return {paper, large, margin, font, height, width:pageWidth - margin * 2,
    pageSize: large ? `${paper} ${landscape ? 'landscape' : 'portrait'}` : `${pageWidth}mm ${height}mm`};
}
