export type PublicHoliday = {
  date: string;
  localName: string;
  name: string;
};

export async function fetchKoreanPublicHolidays(year: number): Promise<PublicHoliday[]> {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
    if (!res.ok) return [];
    const data = (await res.json()) as PublicHoliday[];
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}
