// Mock data for Clone AI - segretario personale

export const defaultProfile = {
  name: "",
  nickname: "",
  tone: "amichevole", // amichevole | diretto | ironico | motivazionale
  interests: [],
  habits: [],
  goals: "",
  wakeUp: "07:30",
  completedOnboarding: false,
  avatarColor: "coral",
};

export const toneOptions = [
  { id: "amichevole", label: "Amichevole", emoji: "☕", desc: "Caldo e rilassato" },
  { id: "diretto", label: "Diretto", emoji: "⚡", desc: "Senza giri di parole" },
  { id: "ironico", label: "Ironico", emoji: "🎭", desc: "Un pizzico di sarcasmo" },
  { id: "motivazionale", label: "Motivazionale", emoji: "🔥", desc: "Spinta e grinta" },
];

export const interestsPool = [
  "Tecnologia", "Sport", "Cucina", "Viaggi", "Musica", "Lettura",
  "Cinema", "Fotografia", "Design", "Business", "Fitness", "Natura",
  "Arte", "Gaming", "Finanza", "Scrittura",
];

export const habitsPool = [
  "Mattiniero", "Nottambulo", "Caffè prima di tutto", "Running",
  "Meditazione", "Lettura serale", "Palestra", "Journaling",
  "Cold shower", "Deep work",
];

export const mockEvents = [
  { id: "e1", title: "Call con Marco", time: "09:30", date: "today", color: "coral", type: "meeting" },
  { id: "e2", title: "Allenamento", time: "18:00", date: "today", color: "mint", type: "health" },
  { id: "e3", title: "Cena con Giulia", time: "20:30", date: "today", color: "lavender", type: "social" },
  { id: "e4", title: "Deadline progetto", time: "12:00", date: "tomorrow", color: "amber", type: "work" },
  { id: "e5", title: "Dentista", time: "10:00", date: "tomorrow", color: "sky", type: "health" },
  { id: "e6", title: "Review settimanale", time: "17:00", date: "friday", color: "coral", type: "work" },
];

export const mockReminders = [
  { id: "r1", text: "Chiamare la mamma", done: false, priority: "alta" },
  { id: "r2", text: "Pagare bolletta luce", done: false, priority: "media" },
  { id: "r3", text: "Comprare caffè", done: true, priority: "bassa" },
  { id: "r4", text: "Finire presentazione cliente", done: false, priority: "alta" },
  { id: "r5", text: "Prenotare volo", done: false, priority: "media" },
];

export const mockNotes = [
  {
    id: "n1",
    title: "Idea app segretario",
    content: "Un clone AI che impara dalle mie abitudini e mi aiuta a non dimenticare nulla. Deve avere tono personale.",
    color: "coral",
    date: "Oggi",
  },
  {
    id: "n2",
    title: "Libri da leggere",
    content: "- Atomic Habits\n- Deep Work\n- Il piccolo principe (rilettura)\n- Sapiens",
    color: "mint",
    date: "Ieri",
  },
  {
    id: "n3",
    title: "Progetto Q3",
    content: "Lanciare MVP entro settembre. Focus su onboarding fluido e retention.",
    color: "lavender",
    date: "3 giorni fa",
  },
  {
    id: "n4",
    title: "Ricetta pasta al limone",
    content: "Spaghetti, scorza limone, parmigiano, burro, pepe nero. Semplice ma perfetta.",
    color: "amber",
    date: "La settimana scorsa",
  },
];

export const mockSuggestions = [
  { id: "s1", icon: "Sun", text: "Oggi hai 3 impegni. Inizia col più semplice per prendere ritmo.", type: "insight" },
  { id: "s2", icon: "Coffee", text: "Hai dormito poco ieri. Caffè in più e pausa a metà mattina.", type: "care" },
  { id: "s3", icon: "Target", text: "Mancano 2 giorni alla deadline. Blocca 2h nel pomeriggio per il progetto.", type: "focus" },
];

export const initialChat = [
  {
    id: "m1",
    role: "clone",
    text: "Ehi! Sono il tuo clone 👋 Pensiamo insieme — da cosa partiamo oggi?",
    time: "09:12",
  },
];

// Simulated clone responses (mock, no real AI yet)
export const mockReplies = [
  "Capito. Se fossi in te comincerei da lì — meno attrito, più energia.",
  "Mmm, interessante. Ti conosco: se non lo fai entro stasera lo rimandi di 3 giorni 😅",
  "Ok, lo segno. Vuoi che ti ricordi anche di bere acqua? Lo so, suono come tua madre.",
  "Tipico tuo. Facciamo così: 25 min focus, 5 di pausa. Fidati.",
  "Ti ho visto arrivare. Prima finisci la cosa importante, poi quella urgente.",
  "Questa idea è buona. Scrivila nelle note così non la perdi — ci penso io.",
];

export const colorMap = {
  coral: { bg: "bg-[#FF6B6B]", bgSoft: "bg-[#FFE3E3]", text: "text-[#C92A2A]", border: "border-[#FF6B6B]" },
  mint: { bg: "bg-[#51CF66]", bgSoft: "bg-[#D3F9D8]", text: "text-[#2B8A3E]", border: "border-[#51CF66]" },
  lavender: { bg: "bg-[#845EF7]", bgSoft: "bg-[#E5DBFF]", text: "text-[#5F3DC4]", border: "border-[#845EF7]" },
  amber: { bg: "bg-[#FFD43B]", bgSoft: "bg-[#FFF3BF]", text: "text-[#8B6F00]", border: "border-[#FFD43B]" },
  sky: { bg: "bg-[#4DABF7]", bgSoft: "bg-[#D0EBFF]", text: "text-[#1864AB]", border: "border-[#4DABF7]" },
};
