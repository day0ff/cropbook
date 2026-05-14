export const getPagesCount = (pageStr: string): number => {
  const pagesSet = new Set<number>();

  const parts = pageStr.split(',').map((part) => part.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pagesSet.add(i);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page)) {
        pagesSet.add(page);
      }
    }
  }

  return pagesSet.size;
}