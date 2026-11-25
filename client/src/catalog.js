export const categories = {
  ELECTRONICS: "Elektronik",
  ID_CARD: "Kartu identitas",
  BOTTLE: "Botol minum",
  CLOTHING: "Pakaian",
  ACCESSORIES: "Aksesori",
  OTHER: "Lainnya",
};
export const locations = [
  "A206",
  "Sekretariat",
  "Perpustakaan",
  "Kantin",
  "Pos Satpam",
  "Auditorium",
];
export const dateLabel = (value) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
