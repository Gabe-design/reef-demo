// Demo data model. Shapes follow docs/platform-spec.md section 3 closely
// enough that screens built on them carry over to the real platform, but
// everything here lives in the browser and is generated from a fixed seed.

export type ID = string;
/** Local calendar date in the business timezone, YYYY-MM-DD */
export type DateStr = string;
/** ISO instant */
export type Instant = string;
/** Integer cents. Never use floats for money. */
export type Cents = number;

export type Role = "owner" | "manager" | "worker" | "sales";

export interface Employee {
  id: ID;
  name: string;
  role: Role;
  title: string;
  phone: string;
  email: string;
  color: string;
  crewId?: ID;
  hourlyRate?: Cents;
  commissionPct?: number;
  territoryIds?: ID[];
  startDate: DateStr;
}

export interface Crew {
  id: ID;
  name: string;
  memberIds: ID[];
  color: string;
  vehicle: string;
}

export type LeadSource =
  | "website"
  | "door_to_door"
  | "referral"
  | "google"
  | "nextdoor"
  | "yelp"
  | "instagram"
  | "repeat";

export const LEAD_SOURCES: Record<LeadSource, string> = {
  website: "Website",
  door_to_door: "Door-to-door",
  referral: "Referral",
  google: "Google",
  nextdoor: "Nextdoor",
  yelp: "Yelp",
  instagram: "Instagram",
  repeat: "Repeat customer",
};

export type ServiceId =
  | "ext"
  | "int"
  | "screen"
  | "track"
  | "skylight"
  | "hardwater"
  | "storefront"
  | "callout";

export type PricingUnit = "window" | "pane" | "screen" | "track" | "skylight" | "flat";

export interface Service {
  id: ServiceId;
  name: string;
  short: string;
  unit: PricingUnit;
  rate: Cents;
  minutesPerUnit: number;
  description: string;
}

export interface Line {
  serviceId: ServiceId;
  qty: number;
  unitPrice: Cents;
}

export interface WindowInventory {
  exterior: number;
  interior: number;
  screens: number;
  tracks: number;
  skylights: number;
  hardWaterPanes: number;
}

export interface Customer {
  id: ID;
  name: string;
  kind: "residential" | "commercial";
  contactName: string;
  phone: string;
  email: string;
  source: LeadSource;
  createdAt: Instant;
  referralCode: string;
  referredById?: ID;
  salespersonId?: ID;
  tags: string[];
  doNotText?: boolean;
  cardOnFile?: { brand: string; last4: string; exp: string };
}

export interface Property {
  id: ID;
  customerId: ID;
  street: string;
  city: string;
  zip: string;
  neighborhood: string;
  lat: number;
  lng: number;
  kind: "house" | "condo" | "storefront" | "office";
  stories: number;
  inventory: WindowInventory;
  accessNotes?: string;
  gateCode?: string;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "estimate_sent"
  | "won"
  | "lost"
  | "nurture";

export const LEAD_STAGES: { id: LeadStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "estimate_sent", label: "Estimate sent" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "nurture", label: "Nurture" },
];

export interface Lead {
  id: ID;
  name: string;
  phone: string;
  email?: string;
  street: string;
  neighborhood: string;
  source: LeadSource;
  stage: LeadStage;
  ownerId: ID;
  createdAt: Instant;
  nextAction: string;
  nextActionDue: DateStr;
  estimateValue: Cents;
  services: ServiceId[];
  message?: string;
  referralCode?: string;
  customerId?: ID;
  lostReason?: string;
}

export type EstimateStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export interface Estimate {
  id: ID;
  number: string;
  leadId?: ID;
  customerId?: ID;
  name: string;
  propertyLabel: string;
  status: EstimateStatus;
  lines: Line[];
  total: Cents;
  createdAt: Instant;
  sentAt?: Instant;
  expiresOn: DateStr;
  revision: number;
  planOffer?: PlanCadence;
  createdById: ID;
}

export type JobStatus =
  | "ready_to_schedule"
  | "scheduled"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ChecklistItem {
  label: string;
  done: boolean;
  required: boolean;
}

export interface Photo {
  id: ID;
  kind: "before" | "after";
  src: string;
  caption?: string;
  takenAt: Instant;
  byId: ID;
  local?: boolean;
}

export interface Note {
  id: ID;
  at: Instant;
  byId: ID;
  visibility: "internal" | "crew" | "customer";
  body: string;
}

export interface JobIssue {
  id: ID;
  at: Instant;
  byId: ID;
  kind: "access" | "safety" | "damage" | "customer" | "other";
  body: string;
  resolved: boolean;
}

export interface Job {
  id: ID;
  number: string;
  customerId: ID;
  propertyId: ID;
  status: JobStatus;
  date: DateStr;
  arrivalStart: string; // "08:00"
  arrivalEnd: string;
  durationMin: number;
  crewId?: ID;
  assigneeIds: ID[];
  routeOrder: number;
  lines: Line[];
  discount: Cents;
  total: Cents;
  planId?: ID;
  occurrence?: number;
  checklist: ChecklistItem[];
  photos: Photo[];
  notes: Note[];
  issues: JobIssue[];
  startedAt?: Instant;
  completedAt?: Instant;
  invoiceId?: ID;
  soldById?: ID;
  storefrontRouteId?: ID;
}

export type PlanCadence = "quarterly" | "semiannual" | "annual" | "weekly" | "monthly";

export const CADENCE: Record<PlanCadence, { label: string; short: string; months?: number; perMonth: number }> = {
  quarterly: { label: "Every 3 months", short: "3-month", months: 3, perMonth: 1 / 3 },
  semiannual: { label: "Every 6 months", short: "6-month", months: 6, perMonth: 1 / 6 },
  annual: { label: "Once a year", short: "Annual", months: 12, perMonth: 1 / 12 },
  weekly: { label: "Weekly route", short: "Weekly", perMonth: 52 / 12 },
  monthly: { label: "Monthly route", short: "Monthly", perMonth: 1 },
};

export type PlanStatus = "active" | "paused" | "cancelled" | "pending_acceptance";

export interface PlanEvent {
  at: Instant;
  kind: "created" | "paused" | "resumed" | "skipped" | "cancelled" | "rescheduled" | "price_change";
  note: string;
  byId?: ID;
}

export interface ServicePlan {
  id: ID;
  customerId: ID;
  propertyId: ID;
  cadence: PlanCadence;
  status: PlanStatus;
  lines: Line[];
  pricePerVisit: Cents;
  discountPct: number;
  anchorDate: DateStr;
  nextDate: DateStr;
  startedAt: Instant;
  soldById?: ID;
  autopay: boolean;
  pausedUntil?: DateStr;
  cancelReason?: string;
  events: PlanEvent[];
  skippedOccurrences: number[];
}

export interface PlanOffer {
  id: ID;
  customerId: ID;
  at: Instant;
  cadence: PlanCadence;
  outcome: "accepted" | "declined" | "open";
  reason?: string;
  byId: ID;
  followUpOn?: DateStr;
}

export interface FollowUp {
  id: ID;
  customerId?: ID;
  leadId?: ID;
  ownerId: ID;
  due: DateStr;
  reason: "declined_plan" | "due_again" | "estimate" | "lead" | "failed_payment" | "callback";
  note: string;
  done: boolean;
}

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "partially_paid";

export interface Invoice {
  id: ID;
  number: string;
  customerId: ID;
  jobId?: ID;
  issuedOn: DateStr;
  dueOn: DateStr;
  lines: Line[];
  subtotal: Cents;
  discount: Cents;
  credit: Cents;
  tax: Cents;
  total: Cents;
  paid: Cents;
  status: InvoiceStatus;
}

export interface Payment {
  id: ID;
  invoiceId?: ID;
  customerId: ID;
  amount: Cents;
  method: "card_on_file" | "online" | "tap_to_pay" | "check" | "cash";
  status: "succeeded" | "failed" | "refunded" | "requires_action";
  at: Instant;
  brand?: string;
  last4?: string;
  kind: "payment" | "deposit" | "refund";
  failureReason?: string;
}

export type CreditBucket = "pending" | "available" | "reserved" | "redeemed" | "expired" | "revoked";

/**
 * One row of the Reef Credit ledger. Each row moves an amount from one bucket
 * to another for a customer; balances are always derived from the rows.
 */
export interface CreditEntry {
  id: ID;
  customerId: ID;
  at: Instant;
  from: CreditBucket | "program";
  to: CreditBucket;
  amount: Cents;
  memo: string;
  referralId?: ID;
  invoiceId?: ID;
  expiresOn?: DateStr;
}

export interface Referral {
  id: ID;
  referrerId: ID;
  referredName: string;
  referredCustomerId?: ID;
  createdAt: Instant;
  status: "lead" | "booked" | "qualified" | "expired" | "declined";
  reward: Cents;
  newCustomerDiscount: Cents;
}

export type MessageStatus = "queued" | "sent" | "delivered" | "undelivered" | "failed" | "received";

export interface Message {
  id: ID;
  customerId?: ID;
  leadId?: ID;
  to: string;
  direction: "out" | "in";
  body: string;
  trigger?: string;
  status: MessageStatus;
  at: Instant;
  clicked?: boolean;
  replied?: boolean;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  timing: string;
  enabled: boolean;
  template: string;
}

export interface Review {
  id: ID;
  customerId: ID;
  jobId?: ID;
  rating: number;
  body: string;
  source: "Google" | "Yelp" | "Nextdoor";
  at: Instant;
  requested: boolean;
}

export interface TimeEntry {
  id: ID;
  employeeId: ID;
  date: DateStr;
  start: string;
  end?: string;
  kind: "field" | "travel" | "break";
  approved: boolean;
}

export interface Commission {
  id: ID;
  employeeId: ID;
  jobId: ID;
  amount: Cents;
  basis: Cents;
  status: "pending" | "earned" | "paid" | "reversed";
  on: DateStr;
}

export type DoorOutcome =
  | "no_answer"
  | "not_interested"
  | "interested"
  | "follow_up"
  | "estimate_given"
  | "booked"
  | "do_not_knock";

export const DOOR_OUTCOMES: Record<DoorOutcome, { label: string; color: string }> = {
  // Chromatic outcomes use the validated categorical steps (dataviz palette);
  // "no answer" and "do not knock" are neutral, not identities.
  no_answer: { label: "No answer", color: "#94a3b8" },
  not_interested: { label: "Not interested", color: "#e34948" },
  interested: { label: "Interested", color: "#eda100" },
  follow_up: { label: "Follow-up", color: "#4a3aa7" },
  estimate_given: { label: "Estimate given", color: "#2a78d6" },
  booked: { label: "Booked", color: "#008300" },
  do_not_knock: { label: "Do not knock", color: "#1f2937" },
};

export interface DoorVisit {
  id: ID;
  doorId: number;
  at: Instant;
  salespersonId: ID;
  outcome: DoorOutcome;
  conversation: boolean;
  note?: string;
  leadId?: ID;
  bookedValue?: Cents;
}

export interface Territory {
  id: ID;
  name: string;
  /** [lng, lat] ring, closed */
  polygon: [number, number][];
  salespersonId: ID;
  color: string;
}

export interface StorefrontRoute {
  id: ID;
  name: string;
  cadence: "weekly" | "monthly";
  day: string;
  crewMemberId: ID;
  customerIds: ID[];
}

export interface MarketingSpend {
  source: LeadSource;
  month: string; // YYYY-MM
  amount: Cents;
}

export interface Activity {
  id: ID;
  at: Instant;
  byId?: ID;
  text: string;
  href?: string;
  kind: "lead" | "job" | "payment" | "plan" | "door" | "message" | "review" | "referral";
}

export interface DemoData {
  today: DateStr;
  employees: Employee[];
  crews: Crew[];
  services: Service[];
  customers: Customer[];
  properties: Property[];
  leads: Lead[];
  estimates: Estimate[];
  jobs: Job[];
  plans: ServicePlan[];
  planOffers: PlanOffer[];
  followUps: FollowUp[];
  invoices: Invoice[];
  payments: Payment[];
  referrals: Referral[];
  credit: CreditEntry[];
  messages: Message[];
  automations: Automation[];
  reviews: Review[];
  timeEntries: TimeEntry[];
  commissions: Commission[];
  doorVisits: DoorVisit[];
  territories: Territory[];
  storefrontRoutes: StorefrontRoute[];
  marketingSpend: MarketingSpend[];
  activity: Activity[];
}
