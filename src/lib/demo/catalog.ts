import type { Automation, Crew, Employee, PlanCadence, Service } from "./types";

// Sample price book. Reef has not supplied real rates yet (spec 17), so these
// numbers are placeholders listed in CONTENT.md. Never launch with them.
export const SERVICES: Service[] = [
  {
    id: "ext",
    name: "Exterior windows",
    short: "Exterior",
    unit: "window",
    rate: 650,
    minutesPerUnit: 4,
    description: "Outside glass, frames and sills, hand-finished. Pure-water pole for second stories.",
  },
  {
    id: "int",
    name: "Interior windows",
    short: "Interior",
    unit: "window",
    rate: 550,
    minutesPerUnit: 4,
    description: "Inside glass and sills with drop cloths and shoe covers.",
  },
  {
    id: "screen",
    name: "Screen cleaning",
    short: "Screens",
    unit: "screen",
    rate: 300,
    minutesPerUnit: 2,
    description: "Removed, washed, dried and reinstalled.",
  },
  {
    id: "track",
    name: "Track detailing",
    short: "Tracks",
    unit: "track",
    rate: 400,
    minutesPerUnit: 3,
    description: "Vacuumed, scrubbed and wiped so sliders run smoothly.",
  },
  {
    id: "skylight",
    name: "Skylights",
    short: "Skylights",
    unit: "skylight",
    rate: 1800,
    minutesPerUnit: 10,
    description: "Interior and exterior, with logged roof access.",
  },
  {
    id: "hardwater",
    name: "Hard-water removal",
    short: "Hard water",
    unit: "pane",
    rate: 1500,
    minutesPerUnit: 9,
    description: "Mineral and sprinkler spotting removed after a test spot you approve.",
  },
  {
    id: "storefront",
    name: "Storefront glass",
    short: "Storefront",
    unit: "flat",
    rate: 5500,
    minutesPerUnit: 25,
    description: "Doors, display glass and entry frames on a set route.",
  },
  {
    id: "callout",
    name: "Minimum visit",
    short: "Minimum",
    unit: "flat",
    rate: 0,
    minutesPerUnit: 0,
    description: "Brings small jobs up to the minimum visit charge.",
  },
];

export const MINIMUM_VISIT = 14900;

export const PLAN_DISCOUNT: Record<PlanCadence, number> = {
  quarterly: 0.15,
  semiannual: 0.1,
  annual: 0.05,
  weekly: 0,
  monthly: 0,
};

/** Sample Reef Credit policy (spec 7). Amounts are configurable, not constants. */
export const REFERRAL_POLICY = {
  reward: 2500,
  newCustomerDiscount: 2500,
  expiryMonths: 12,
  options: [2500, 5000],
};

export const EMPLOYEES: Employee[] = [
  {
    id: "e_owner",
    name: "Reef Owner",
    role: "owner",
    title: "Owner / CEO",
    phone: "(805) 368-0990",
    email: "owner@reefwindowcleaning.example",
    color: "#032541",
    startDate: "2025-01-06",
  },
  {
    id: "e_dana",
    name: "Dana Whitfield",
    role: "manager",
    title: "Operations manager",
    phone: "(619) 555-0101",
    email: "dana@reefwindowcleaning.example",
    color: "#215b88",
    startDate: "2025-03-03",
  },
  {
    id: "e_marco",
    name: "Marco Reyes",
    role: "worker",
    title: "Crew lead, Coral crew",
    phone: "(619) 555-0102",
    email: "marco@reefwindowcleaning.example",
    color: "#0f8a5f",
    crewId: "c_coral",
    hourlyRate: 2800,
    startDate: "2025-02-10",
  },
  {
    id: "e_tavita",
    name: "Tavita Faleolo",
    role: "worker",
    title: "Technician, Coral crew",
    phone: "(619) 555-0103",
    email: "tavita@reefwindowcleaning.example",
    color: "#14b8a6",
    crewId: "c_coral",
    hourlyRate: 2300,
    startDate: "2025-05-19",
  },
  {
    id: "e_luis",
    name: "Luis Ortega",
    role: "worker",
    title: "Crew lead, Kelp crew",
    phone: "(619) 555-0104",
    email: "luis@reefwindowcleaning.example",
    color: "#d97706",
    crewId: "c_kelp",
    hourlyRate: 2800,
    startDate: "2025-04-07",
  },
  {
    id: "e_kenji",
    name: "Kenji Morales",
    role: "worker",
    title: "Technician, Kelp crew",
    phone: "(619) 555-0105",
    email: "kenji@reefwindowcleaning.example",
    color: "#e11d48",
    crewId: "c_kelp",
    hourlyRate: 2200,
    startDate: "2025-08-25",
  },
  {
    id: "e_devon",
    name: "Devon Pryor",
    role: "worker",
    title: "Storefront route tech",
    phone: "(619) 555-0106",
    email: "devon@reefwindowcleaning.example",
    color: "#7c3aed",
    crewId: "c_tide",
    hourlyRate: 2400,
    startDate: "2025-06-02",
  },
  {
    id: "e_brianna",
    name: "Brianna Castillo",
    role: "sales",
    title: "Sales rep",
    phone: "(619) 555-0107",
    email: "brianna@reefwindowcleaning.example",
    color: "#db2777",
    commissionPct: 0.1,
    territoryIds: ["t_west"],
    startDate: "2025-07-14",
  },
  {
    id: "e_theo",
    name: "Theo Nakamura",
    role: "sales",
    title: "Sales rep",
    phone: "(619) 555-0108",
    email: "theo@reefwindowcleaning.example",
    color: "#2563eb",
    commissionPct: 0.1,
    territoryIds: ["t_central"],
    startDate: "2025-07-14",
  },
  {
    id: "e_jalen",
    name: "Jalen Brooks",
    role: "sales",
    title: "Sales rep",
    phone: "(619) 555-0109",
    email: "jalen@reefwindowcleaning.example",
    color: "#ea580c",
    commissionPct: 0.1,
    territoryIds: ["t_east"],
    startDate: "2025-09-08",
  },
];

export const CREWS: Crew[] = [
  { id: "c_coral", name: "Coral crew", memberIds: ["e_marco", "e_tavita"], color: "#0f8a5f", vehicle: "Van 1" },
  { id: "c_kelp", name: "Kelp crew", memberIds: ["e_luis", "e_kenji"], color: "#d97706", vehicle: "Van 2" },
  { id: "c_tide", name: "Tide route", memberIds: ["e_devon"], color: "#7c3aed", vehicle: "Truck 3" },
];

export const AUTOMATIONS: Automation[] = [
  {
    id: "new_lead",
    name: "New-lead response",
    trigger: "Quote request or new lead",
    timing: "Immediately",
    enabled: true,
    template:
      "Hi {first}, thanks for reaching out to Reef Window Cleaning. We got your request and will text you a quote shortly. Reply here with any questions.",
  },
  {
    id: "estimate_followup",
    name: "Estimate follow-up",
    trigger: "Estimate not accepted",
    timing: "2 and 7 days after sending",
    enabled: true,
    template:
      "Hi {first}, just checking in on your Reef estimate ({total}). You can approve it and pick a day here: {link}",
  },
  {
    id: "confirmation",
    name: "Appointment confirmation",
    trigger: "Booking confirmed",
    timing: "Immediately",
    enabled: true,
    template:
      "You're booked! Reef will be at {address} on {date}, arriving {window}. Manage your visit: {link}",
  },
  {
    id: "reminder",
    name: "Appointment reminder",
    trigger: "Upcoming appointment",
    timing: "24 hours before",
    enabled: true,
    template:
      "Reminder: Reef Window Cleaning is coming tomorrow, arriving {window}. Please unlock gates and side yards. Reply R to reschedule.",
  },
  {
    id: "on_the_way",
    name: "On the way",
    trigger: "Crew taps Start travel",
    timing: "Immediately",
    enabled: true,
    template: "{tech} from Reef is on the way and should arrive in about {eta} minutes.",
  },
  {
    id: "completed",
    name: "Job complete",
    trigger: "Crew completes job",
    timing: "Immediately",
    enabled: true,
    template:
      "All done at {address}! Your before-and-after photos are in your Reef account: {link}",
  },
  {
    id: "receipt",
    name: "Payment receipt",
    trigger: "Payment succeeded",
    timing: "Immediately",
    enabled: true,
    template: "Thanks {first}! We received {amount} for invoice {invoice}. Receipt: {link}",
  },
  {
    id: "review",
    name: "Review request",
    trigger: "Job completed",
    timing: "Next day at 10 AM",
    enabled: true,
    template:
      "Hi {first}, how did your windows turn out? A quick Google review helps a small local team a lot: {link}",
  },
  {
    id: "plan_reminder",
    name: "Recurring-service reminder",
    trigger: "Plan visit coming up",
    timing: "7 days before",
    enabled: true,
    template:
      "Your next Reef plan cleaning is coming up {date}. Need a different day? Reschedule here: {link}",
  },
  {
    id: "credit",
    name: "Reef Credit update",
    trigger: "Credit pending, earned or expiring",
    timing: "Immediately",
    enabled: true,
    template:
      "Good news {first}! {friend} booked with Reef, so {amount} in Reef Credit is now in your account. It comes off your next cleaning.",
  },
  {
    id: "failed_payment",
    name: "Failed payment",
    trigger: "Card on file declined",
    timing: "Immediately, then day 3",
    enabled: true,
    template:
      "Hi {first}, the card on file for invoice {invoice} didn't go through. Update it or pay securely here: {link}",
  },
  {
    id: "win_back",
    name: "Old-customer follow-up",
    trigger: "Customer due again, no plan",
    timing: "When follow-up is due",
    enabled: true,
    template:
      "Hi {first}, it's been about {months} months since Reef cleaned your windows. Want us to get you on the schedule? {link}",
  },
  {
    id: "declined_plan",
    name: "Declined-plan follow-up",
    trigger: "Customer declined a plan",
    timing: "On the follow-up date",
    enabled: false,
    template:
      "Hi {first}, Reef plan customers save {discount} and never have to remember to book. Want to try a 6-month plan? {link}",
  },
];

export const NEIGHBORHOODS = [
  { name: "Pacific Beach", city: "San Diego", zip: "92109", box: [32.792, 32.806, -117.247, -117.229], streets: ["Diamond St", "Felspar St", "Reed Ave", "Thomas Ave", "Oliver Ave", "Chalcedony St", "Law St"], w: 13, zone: "coast" },
  { name: "La Jolla", city: "La Jolla", zip: "92037", box: [32.834, 32.848, -117.266, -117.256], streets: ["Draper Ave", "Fay Ave", "Rushville St", "Nautilus St", "Hillside Dr", "Via Capri"], w: 12, zone: "coast" },
  { name: "Bird Rock", city: "La Jolla", zip: "92037", box: [32.813, 32.825, -117.267, -117.261], streets: ["Chelsea Ave", "Beaumont Ave", "Midway St", "Forward St", "Bird Rock Ave"], w: 7, zone: "coast" },
  { name: "Clairemont", city: "San Diego", zip: "92117", box: [32.818, 32.838, -117.205, -117.182], streets: ["Mt Acadia Blvd", "Burgener Blvd", "Field St", "Cowley Way", "Moraga Ave", "Mt Everest Blvd"], w: 12, zone: "central" },
  { name: "University City", city: "San Diego", zip: "92122", box: [32.856, 32.867, -117.221, -117.206], streets: ["Gullstrand St", "Stresemann St", "Millikin Ave", "Agee St", "Governor Dr"], w: 8, zone: "central" },
  { name: "Point Loma", city: "San Diego", zip: "92106", box: [32.736, 32.748, -117.236, -117.223], streets: ["Catalina Blvd", "Udall St", "Silvergate Ave", "Talbot St", "Plum St"], w: 9, zone: "central" },
  { name: "Mission Hills", city: "San Diego", zip: "92103", box: [32.749, 32.757, -117.187, -117.177], streets: ["Fort Stockton Dr", "Sunset Blvd", "Hawk St", "Ingalls St", "Allen Rd"], w: 6, zone: "central" },
  { name: "North Park", city: "San Diego", zip: "92104", box: [32.743, 32.757, -117.137, -117.123], streets: ["Kansas St", "Utah St", "Herman Ave", "Arnold Ave", "Dwight St"], w: 7, zone: "central" },
  { name: "Del Mar", city: "Del Mar", zip: "92014", box: [32.952, 32.964, -117.261, -117.253], streets: ["Klish Way", "Stratford Ct", "15th St", "Crest Rd", "Avenida Primavera"], w: 6, zone: "north" },
  { name: "Encinitas", city: "Encinitas", zip: "92024", box: [33.041, 33.059, -117.289, -117.274], streets: ["Neptune Ave", "Hygeia Ave", "Requeza St", "Cornish Dr", "Vulcan Ave"], w: 7, zone: "north" },
  { name: "Carlsbad", city: "Carlsbad", zip: "92008", box: [33.151, 33.167, -117.344, -117.330], streets: ["Highland Dr", "Garfield St", "Chestnut Ave", "Pine Ave", "Tamarack Ave"], w: 6, zone: "north" },
  { name: "Coronado", city: "Coronado", zip: "92118", box: [32.681, 32.691, -117.182, -117.169], streets: ["A Ave", "Alameda Blvd", "Glorietta Blvd", "Pomona Ave", "Margarita Ave"], w: 7, zone: "coast" },
] as const;

export const COMMERCIAL_AREAS = [
  { name: "Gaslamp", city: "San Diego", zip: "92101", box: [32.709, 32.715, -117.162, -117.158], streets: ["5th Ave", "4th Ave", "Market St", "G St", "Island Ave"] },
  { name: "Little Italy", city: "San Diego", zip: "92101", box: [32.722, 32.727, -117.17, -117.166], streets: ["India St", "Kettner Blvd", "Columbia St", "W Date St"] },
  { name: "North Park", city: "San Diego", zip: "92104", box: [32.747, 32.749, -117.131, -117.124], streets: ["30th St", "University Ave", "Ray St"] },
  { name: "La Jolla", city: "La Jolla", zip: "92037", box: [32.846, 32.849, -117.274, -117.27], streets: ["Girard Ave", "Prospect St", "Wall St"] },
  { name: "Pacific Beach", city: "San Diego", zip: "92109", box: [32.797, 32.799, -117.25, -117.238], streets: ["Garnet Ave", "Cass St", "Mission Blvd"] },
] as const;

export const BUSINESSES = [
  "Tidepool Coffee Bar",
  "Juniper & Salt Kitchen",
  "Lantern Bay Optometry",
  "Cove Street Yoga",
  "Northbound Cycles",
  "Hollis Fine Jewelry",
  "Brightwater Dental",
  "Pier Seven Realty",
  "Copper Kettle Bakery",
  "Pacific Grain Market",
  "Seawall Barber Co.",
  "Driftwood Pilates",
  "Marisol Boutique",
  "Kelp & Co. Florals",
  "Canyon View Vet",
  "Gull Street Books",
  "Salt & Sage Salon",
  "Harborview Insurance",
];

export const FIRST = ["Olivia", "Mateo", "Priya", "Grant", "Leilani", "Hector", "Naomi", "Caleb", "Sofia", "Andre", "Mei", "Russell", "Camila", "Darius", "Hannah", "Marisol", "Owen", "Jasmine", "Ravi", "Brooke", "Tomas", "Allison", "Kai", "Monique", "Victor", "Elena", "Spencer", "Yuki", "Gabriela", "Wesley", "Fatima", "Colin", "Rosa", "Nolan", "Imani", "Diego", "Paige", "Arjun", "Teresa", "Malik", "Lauren", "Ethan", "Ximena", "Graham", "Noor", "Bianca", "Trent", "Alana", "Isaac", "Dolores", "Hugo", "Celeste", "Marcus", "Ingrid", "Rafael", "Simone", "Declan", "Amara"];
export const LAST = ["Hartley", "Okafor", "Nguyen", "Delgado", "Whitaker", "Sato", "Ramirez", "Kowalski", "Bennett", "Castellanos", "Patel", "Lindqvist", "Moreno", "Ashford", "Tran", "Gallagher", "Haddad", "Brennan", "Fujimoto", "Ortiz", "Sinclair", "Abara", "Mendoza", "Callahan", "Iverson", "Kapoor", "Solis", "Thornton", "Vega", "Holloway", "Kim", "Aguilar", "Pruitt", "Esposito", "Watanabe", "Barrera", "Lockhart", "Quintero", "Dunmore", "Chau", "Ferreira", "Stroud", "Ibarra", "Wexler", "Mbeki", "Oyelaran", "Varga", "Sorensen"];

export const REVIEW_LINES = [
  "On time, friendly, and the windows look brand new.",
  "They did the screens and tracks too. Sliders finally glide again.",
  "Texted when they were on the way, which I loved.",
  "Hard-water spots on our shower-side windows are gone.",
  "Super careful inside the house. Drop cloths everywhere.",
  "Easy booking and the photos in the portal were a nice touch.",
  "Second time using Reef. Signed up for the 6-month plan.",
  "Great crew. They found a cracked pane and showed me before starting.",
  "Our ocean-view windows haven't looked this clear in years.",
  "Quick, tidy and fairly priced.",
  "Skylights were a pain to reach. They handled it no problem.",
  "Good job overall. Arrived a little after the window but called ahead.",
];

export const PHOTO_IDS = {
  hero: "1709809994973-3440fac94d65",
  pole: "1721620780493-e905708eba0b",
  house: "1754325899655-5e9b7bf05cdc",
  storefront: "1763026227930-ec2c91d4e7f2",
  coastView: "1652064132636-d0bea258cc85",
  oceanRoom: "1726732238608-6e341cbb9cc9",
  skylight: "1542676012084-a4b1f610452a",
  pane: "1527352774566-e4916e36c645",
  interior: "1758801305205-edbf3de97b1b",
  glassDoors: "1497366754035-f200968a6e72",
  sill: "1496092607007-ca127e0b6a10",
  street: "1761850648640-2ee5870ee883",
};

/** Photos used for job before/after sample sets. */
export const JOB_PHOTO_SETS = [
  PHOTO_IDS.pane,
  PHOTO_IDS.interior,
  PHOTO_IDS.oceanRoom,
  PHOTO_IDS.sill,
  PHOTO_IDS.glassDoors,
  PHOTO_IDS.coastView,
];
