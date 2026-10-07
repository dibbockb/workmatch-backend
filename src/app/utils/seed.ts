// biome-ignore-all format: seedscript

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../generated/prisma/client";
import {
	ContractStatus,
	CounterOfferOrigin,
	CounterOfferStatus,
	JobStatus,
	PaymentStatus,
	ProposalStatus,
	UserRoles,
	UserStatus,
} from "../../generated/prisma/enums";
import envConfig from "../envConfig";

const connectionString = `${envConfig.database_url}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

const ADMIN_COUNT = 1;
const CLIENT_COUNT = 10;
const FREELANCER_COUNT = 20; // 1 + 40 + 109 = 150 users
const JOB_COUNT = 50;
const PLATFORM_FEE = 0.1; // 10% commission

// Placeholder bcrypt hash. Replace with a hash of a password you actually know
// if you want to log in as the seeded users.
const DEMO_PASSWORD_HASH =
	"$2a$12$YYDUAWjOy2x.ntlRZWRmQOOU4BQ6xZgtDSpfX45jCwHZjjn0339uK";

/* -------------------------------------------------------------------------- */
/*  Seeded random + helpers                                                   */
/* -------------------------------------------------------------------------- */

function seededRandom(seed: number) {
	return () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
}
const rand = seededRandom(100);

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = Date.now();

const int = (min: number, max: number) =>
	Math.floor(rand() * (max - min + 1)) + min;
const chance = (p: number) => rand() < p;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function shuffle<T>(arr: readonly T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
const sample = <T>(arr: readonly T[], n: number) => shuffle(arr).slice(0, n);

function weighted<T>(entries: Array<[T, number]>): T {
	const total = entries.reduce((sum, [, w]) => sum + w, 0);
	let r = rand() * total;
	for (const [value, w] of entries) {
		r -= w;
		if (r <= 0) return value;
	}
	return entries[entries.length - 1][0];
}

const ALNUM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const token = (len: number) =>
	Array.from({ length: len }, () => ALNUM[Math.floor(rand() * ALNUM.length)]).join("");

const addHours = (d: Date, h: number) => new Date(d.getTime() + h * HOUR);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const clampPast = (d: Date) => new Date(Math.min(d.getTime(), NOW - HOUR));

/* -------------------------------------------------------------------------- */
/*  Static data                                                               */
/* -------------------------------------------------------------------------- */

const firstNames = [
	"Sarah", "James", "Priya", "Mohammed", "Emma", "Wei", "Carlos", "Aisha",
	"Liam", "Sofia", "Dmitri", "Yuki", "Omar", "Elena", "Raj", "Mei", "Andrei",
	"Chidi", "Ingrid", "Hans", "Fatima", "Thomas", "Noor", "Keiko", "Alejandro",
	"Tanvir", "Nusrat", "Rafiq", "Sadia", "Lucas", "Olivia", "Arjun", "Hannah",
	"Mateo", "Zara", "Ethan", "Layla", "Kenji", "Anna", "Samuel",
];
const lastNames = [
	"Chen", "Smith", "Patel", "Garcia", "Kim", "O'Brien", "Nguyen", "Wilson",
	"Tanaka", "Mohamed", "Petrov", "Yamamoto", "Singh", "Johansson", "Brown",
	"Fernandez", "Kowalski", "Mueller", "Santos", "Larsson", "Ivanova",
	"Nakamura", "Okafor", "Kimura", "Romero", "Rahman", "Hossain", "Ahmed",
	"Islam", "Chowdhury", "Taylor", "Martin", "Silva", "Lopez", "Khan", "Ali",
	"Costa", "Novak", "Rossi", "Dubois",
];

const companyPrefixes = [
	"Nova", "Apex", "Bright", "Summit", "Blue", "Iron", "Star", "Quantum", "True",
	"Green", "Red", "Silver", "Cloud", "Pixel", "Harbor", "Vertex", "Lumen",
	"Orbit", "Pioneer", "Atlas",
];
const companySuffixes = [
	"Labs", "Solutions", "Digital", "Systems", "Ventures", "Studio", "Logistics",
	"Analytics",
];
const industries = [
	"fintech", "e-commerce", "healthcare", "logistics", "SaaS", "edtech",
	"real estate", "travel",
];

type Archetype = {
	title: string;
	pool: string[];
	focus: string[];
	rate: [number, number]; // hourly rate range in USD, scales with experience
};

const archetypes: Record<string, Archetype> = {
	fullstack: {
		title: "Full Stack Developer",
		pool: ["JavaScript", "TypeScript", "React", "Node.js", "Next.js", "PostgreSQL", "Prisma", "REST APIs", "Tailwind CSS", "Docker", "Stripe", "Webhooks", "GraphQL", "Redis", "PHP", "WordPress", "Headless CMS"],
		focus: ["SaaS products", "marketplaces", "internal tools", "e-commerce platforms"],
		rate: [25, 95],
	},
	frontend: {
		title: "Frontend Developer",
		pool: ["JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Nuxt", "Tailwind CSS", "CSS", "Shopify", "Liquid", "WordPress", "Headless CMS"],
		focus: ["responsive web apps", "design systems", "storefronts", "dashboards"],
		rate: [20, 80],
	},
	backend: {
		title: "Backend Engineer",
		pool: ["Node.js", "TypeScript", "PostgreSQL", "Prisma", "GraphQL", "Redis", "Go", "Rust", "Kafka", "Django", "Python", "Docker", "REST APIs", "Stripe", "Webhooks", "Socket.IO"],
		focus: ["scalable APIs", "payment systems", "event-driven services", "database performance"],
		rate: [30, 110],
	},
	mobile: {
		title: "Mobile App Developer",
		pool: ["React Native", "Flutter", "Dart", "Swift", "SwiftUI", "Kotlin", "Firebase", "TypeScript", "HealthKit", "Google Maps API", "REST APIs"],
		focus: ["consumer apps", "on-demand services", "fitness and health apps", "delivery apps"],
		rate: [25, 95],
	},
	devops: {
		title: "DevOps Engineer",
		pool: ["AWS", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CI/CD", "Prometheus", "Security", "OWASP", "Penetration Testing"],
		focus: ["cloud infrastructure", "CI/CD pipelines", "cost optimization", "security hardening"],
		rate: [35, 120],
	},
	data: {
		title: "Data Scientist",
		pool: ["Python", "Pandas", "scikit-learn", "SQL", "Airflow", "BigQuery", "TensorFlow", "Power BI", "Scrapy"],
		focus: ["predictive modeling", "data pipelines", "analytics dashboards", "recommendation systems"],
		rate: [30, 115],
	},
	designer: {
		title: "UX/UI Designer",
		pool: ["Figma", "UX Research", "Prototyping", "UI Design", "Branding", "Adobe XD"],
		focus: ["mobile onboarding flows", "SaaS dashboards", "brand identities", "design systems"],
		rate: [20, 85],
	},
	qa: {
		title: "QA Engineer",
		pool: ["Playwright", "Cypress", "Jest", "Selenium", "TypeScript", "CI/CD", "JavaScript"],
		focus: ["end-to-end testing", "test automation", "release quality", "regression suites"],
		rate: [18, 65],
	},
};
const archetypePicker = [
	"fullstack", "fullstack", "fullstack", "frontend", "frontend", "backend",
	"backend", "backend", "mobile", "mobile", "devops", "devops", "data", "data",
	"designer", "designer", "qa",
];

type JobTemplate = {
	title: string;
	description: string;
	skills: string[];
	budget: [number, number]; // USD, realistic range for this kind of work
	days: [number, number]; // typical delivery time
};

const jobTemplates: JobTemplate[] = [
	{ title: "Build a React admin dashboard for sales analytics", description: "We need a clean admin dashboard with charts, filters and CSV export on top of our existing REST API.", skills: ["React", "TypeScript", "Tailwind CSS", "REST APIs"], budget: [800, 2500], days: [14, 35] },
	{ title: "Redesign our mobile app onboarding flow", description: "Our signup-to-first-action drop-off is high. Looking for a designer to research, wireframe and deliver a tested Figma prototype.", skills: ["Figma", "UX Research", "Prototyping", "UI Design"], budget: [500, 1500], days: [10, 25] },
	{ title: "Set up CI/CD pipeline and AWS infrastructure", description: "Containerize our services and set up automated build, test and deploy pipelines with infrastructure defined as code.", skills: ["AWS", "Docker", "Terraform", "GitHub Actions"], budget: [1200, 3500], days: [14, 30] },
	{ title: "Flutter app for appointment booking", description: "Cross-platform app where customers can browse providers, book slots and receive reminders. Backend APIs are already available.", skills: ["Flutter", "Dart", "Firebase", "REST APIs"], budget: [1500, 4500], days: [30, 60] },
	{ title: "Customer churn prediction model", description: "Analyze 18 months of usage data, build a churn model and deliver a notebook plus a short report with recommendations.", skills: ["Python", "Pandas", "scikit-learn", "SQL"], budget: [1000, 3000], days: [21, 45] },
	{ title: "REST API for a multi-vendor marketplace", description: "Design and build the backend for vendors, products, orders and payouts with proper auth and role-based access.", skills: ["Node.js", "TypeScript", "PostgreSQL", "Prisma"], budget: [1500, 4000], days: [25, 50] },
	{ title: "Migrate legacy PHP app to Next.js", description: "Move our customer portal from a legacy PHP codebase to Next.js without breaking existing URLs or user data.", skills: ["Next.js", "React", "TypeScript", "PostgreSQL"], budget: [2500, 6000], days: [40, 75] },
	{ title: "Stripe subscription billing integration", description: "Add monthly and annual plans, a customer billing portal, proration and webhook handling for failed payments.", skills: ["Stripe", "Node.js", "TypeScript", "Webhooks"], budget: [600, 1800], days: [7, 20] },
	{ title: "End-to-end test suite with Playwright", description: "Cover our critical user journeys (signup, checkout, account settings) and run the suite in CI on every pull request.", skills: ["Playwright", "TypeScript", "CI/CD", "Jest"], budget: [700, 2000], days: [10, 25] },
	{ title: "Shopify store customization", description: "Customize our theme, add a product bundle builder and fix several mobile layout issues.", skills: ["Shopify", "Liquid", "JavaScript", "CSS"], budget: [300, 1000], days: [7, 18] },
	{ title: "WordPress to headless CMS migration", description: "Migrate content from WordPress to a headless CMS and rebuild the frontend for better performance and SEO.", skills: ["WordPress", "Headless CMS", "Next.js", "PHP"], budget: [1200, 3000], days: [21, 45] },
	{ title: "Kubernetes cluster cost optimization", description: "Our cloud bill has doubled this year. Audit the cluster, right-size workloads and set up cost monitoring.", skills: ["Kubernetes", "AWS", "Prometheus", "Terraform"], budget: [1500, 4000], days: [14, 30] },
	{ title: "iOS fitness tracking app", description: "Native iOS app with workout logging, Apple Health sync and weekly progress summaries.", skills: ["Swift", "SwiftUI", "HealthKit"], budget: [2500, 6500], days: [40, 75] },
	{ title: "React Native delivery tracking app", description: "Driver and customer apps with live location tracking, push notifications and order status updates.", skills: ["React Native", "TypeScript", "Firebase", "Google Maps API"], budget: [2000, 5500], days: [35, 70] },
	{ title: "Data pipeline with Airflow and BigQuery", description: "Build reliable daily pipelines from three data sources into BigQuery with monitoring and alerting.", skills: ["Python", "Airflow", "BigQuery", "SQL"], budget: [1800, 4500], days: [21, 45] },
	{ title: "Landing page and brand identity", description: "We are launching a new product and need a logo, color palette and a conversion-focused landing page design.", skills: ["Figma", "UI Design", "Branding"], budget: [400, 1200], days: [7, 20] },
	{ title: "GraphQL API performance tuning", description: "Our API slows down under load. Profile resolvers, fix N+1 queries and add caching where it makes sense.", skills: ["GraphQL", "Node.js", "PostgreSQL", "Redis"], budget: [900, 2500], days: [10, 25] },
	{ title: "Security audit of our web application", description: "Run a penetration test against our staging environment and deliver a prioritized report with fixes.", skills: ["Security", "Penetration Testing", "OWASP", "Node.js"], budget: [1500, 4000], days: [14, 30] },
	{ title: "Real-time chat feature with WebSockets", description: "Add one-to-one and group chat with typing indicators, read receipts and message history to our existing app.", skills: ["Node.js", "Socket.IO", "Redis", "React"], budget: [800, 2200], days: [14, 30] },
	{ title: "Python web scraper and data cleaning", description: "Scrape product listings from several sites daily, clean the data and store it in PostgreSQL.", skills: ["Python", "Scrapy", "Pandas", "PostgreSQL"], budget: [300, 900], days: [5, 15] },
	{ title: "Django REST backend for an online learning platform", description: "Courses, lessons, enrollments, progress tracking and instructor dashboards with a documented API.", skills: ["Python", "Django", "PostgreSQL", "Docker"], budget: [2000, 5000], days: [30, 60] },
	{ title: "Vue.js storefront with Nuxt", description: "Build a fast, SEO-friendly storefront on top of our existing product API with cart and checkout screens.", skills: ["Vue.js", "Nuxt", "TypeScript", "Tailwind CSS"], budget: [1200, 3200], days: [21, 45] },
	{ title: "Rust microservice for event processing", description: "High-throughput service consuming events from Kafka, enriching them and writing to PostgreSQL.", skills: ["Rust", "Kafka", "PostgreSQL", "Docker"], budget: [3000, 8000], days: [30, 60] },
	{ title: "Go backend for shipment tracking", description: "Build services for shipment events, ETA calculation and webhooks to customers.", skills: ["Go", "PostgreSQL", "Redis", "Docker"], budget: [2500, 6000], days: [30, 60] },
];

const jobContexts = [
	"We are a small fintech startup with a team of five engineers.",
	"We are an e-commerce brand doing around 2,000 orders a month.",
	"Our team is remote-first and we run weekly sprint reviews.",
	"We are a healthcare company and care a lot about reliability.",
	"We are a seed-stage SaaS company and move fast.",
	"We work with a few other freelancers, so clean handover matters.",
	"We run a logistics platform used by about 300 businesses.",
	"We are an edtech company with a growing user base.",
];

const approachTemplates = [
	(skills: string, tpl: string) => `I have delivered similar work before and can start right away. I would begin with a short discovery call, then ship in weekly milestones using ${skills}. You will see working progress every few days.`,
	(skills: string, tpl: string) => `This is very close to what I do day to day. My plan: confirm scope, set up the foundations with ${skills}, then iterate with demos and written updates. Tests and documentation are included.`,
	(skills: string, tpl: string) => `I read the brief carefully and have a few questions about edge cases, but I am confident I can deliver. I would use ${skills}, keep the code clean and well documented, and hand over a short walkthrough at the end.`,
	(skills: string, tpl: string) => `I recently completed a similar project and can reuse a lot of that experience. I would start with a small proof of concept to validate the approach, then build out the rest in sprints with ${skills}.`,
	(skills: string, tpl: string) => `I suggest a clear 3-phase plan: requirements and architecture, implementation with ${skills}, then testing and deployment. I prefer short feedback loops and daily async updates.`,
];

const clientCounterMessages = [
	"Your proposal looks good, but it is a bit above our budget. Could you do it for this price?",
	"We like your approach. Can we shorten the timeline and adjust the price accordingly?",
	"We have a fixed budget for this milestone. Would you be able to work within this amount?",
	"Great profile. We would like to move forward if we can agree on this price and timeline.",
];
const freelancerCounterMessages = [
	"After reviewing the scope again, I would like to adjust the price slightly to cover the additional integration work.",
	"I can meet your budget if we trim a few nice-to-have features. Here is my revised offer.",
	"Happy to work with your timeline. This is the best price I can offer for that schedule.",
	"I have adjusted the timeline and price based on our call. Let me know if this works for you.",
];

const reviewComments: Record<number, string[]> = {
	5: [
		"Excellent work, delivered ahead of schedule and communication was great throughout.",
		"Very professional. The code was clean and well documented. Would hire again.",
		"Exactly what we needed. Fast, reliable and proactive about suggesting improvements.",
		"Outstanding attention to detail. Highly recommended.",
		"Great collaboration from start to finish. We are already planning the next project together.",
	],
	4: [
		"Solid work and good communication. A couple of small revisions but overall very happy.",
		"Delivered what we agreed on, on time. Would work with again.",
		"Good quality output. Slightly slow to respond at times but the result was great.",
		"Professional and skilled. Minor issues were fixed quickly.",
	],
	3: [
		"The final result was fine but it took longer than expected and needed several revisions.",
		"Decent work. Communication could have been better.",
		"Met the core requirements, though some details were missed at first.",
	],
	2: [
		"Delivery was late and the quality was below what we expected.",
		"Needed a lot of follow-up to get the basics right.",
	],
	1: ["Did not meet the agreed scope and was hard to reach during the project."],
};

/* -------------------------------------------------------------------------- */
/*  Seed                                                                      */
/* -------------------------------------------------------------------------- */

async function insertInBatches<T>(
	label: string,
	rows: T[],
	insert: (chunk: T[]) => Promise<unknown>,
	size = 500,
) {
	console.log(`Inserting ${label} (${rows.length})...`);
	for (let i = 0; i < rows.length; i += size) {
		await insert(rows.slice(i, i + size));
	}
}

async function main() {
	console.log("Seeding database for demo...");
	await prisma.$connect();

	// selectedProposalId now holds real proposal ids, so null them first
	await prisma.job.updateMany({ data: { selectedProposalId: null } });
	await prisma.auditLog.deleteMany();
	await prisma.review.deleteMany();
	await prisma.payment.deleteMany();
	await prisma.contract.deleteMany();
	await prisma.counterOffer.deleteMany();
	await prisma.proposal.deleteMany();
	await prisma.job.deleteMany();
	await prisma.freelancer.deleteMany();
	await prisma.client.deleteMany();
	await prisma.user.deleteMany();

	const userRows: Prisma.UserCreateManyInput[] = [];
	const clientRows: Prisma.ClientCreateManyInput[] = [];
	const freelancerRows: Prisma.FreelancerCreateManyInput[] = [];
	const jobRows: Prisma.JobCreateManyInput[] = [];
	const proposalRows: Prisma.ProposalCreateManyInput[] = [];
	const counterOfferRows: Prisma.CounterOfferCreateManyInput[] = [];
	const contractRows: Prisma.ContractCreateManyInput[] = [];
	const paymentRows: Prisma.PaymentCreateManyInput[] = [];
	const reviewRows: Prisma.ReviewCreateManyInput[] = [];
	const auditLogRows: Prisma.AuditLogCreateManyInput[] = [];

	const clientUserIds: string[] = [];
	const freelancerUserIds: string[] = [];
	const names = new Map<string, { first: string; last: string }>();

	/* ------------------------------- users -------------------------------- */

	const totalUsers = ADMIN_COUNT + CLIENT_COUNT + FREELANCER_COUNT;
	for (let i = 0; i < totalUsers; i++) {
		// (i % 40, (i + floor(i / 40)) % 40) never repeats for i < 160
		const first = firstNames[i % firstNames.length];
		const last = lastNames[(i + Math.floor(i / firstNames.length)) % lastNames.length];
		const role =
			i < ADMIN_COUNT
				? UserRoles.ADMIN
				: i < ADMIN_COUNT + CLIENT_COUNT
					? UserRoles.CLIENT
					: UserRoles.FREELANCER;

		let email = `${slug(first)}.${slug(last)}@workmatch.com`;
		if (i === 0) email = "admin@workmatch.com";
		if (i === ADMIN_COUNT) email = "client@workmatch.com";
		if (i === ADMIN_COUNT + CLIENT_COUNT) email = "freelancer@workmatch.com";
		const isDemoAccount = i === 0 || i === ADMIN_COUNT || i === ADMIN_COUNT + CLIENT_COUNT;

		const id = crypto.randomUUID();
		userRows.push({
			id,
			name: `${first} ${last}`,
			email,
			password: DEMO_PASSWORD_HASH,
			role,
			status: !isDemoAccount && chance(0.04) ? UserStatus.BLOCKED : UserStatus.ACTIVE,
			emailVerified: true,
			profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${first} ${last}`)}&background=random`,
		});
		names.set(id, { first, last });
		if (role === UserRoles.CLIENT) clientUserIds.push(id);
		if (role === UserRoles.FREELANCER) freelancerUserIds.push(id);
	}

	/* ------------------------------- clients ------------------------------ */

	const companies = shuffle(
		companyPrefixes.flatMap((p) => companySuffixes.map((s) => `${p} ${s}`)),
	);
	clientUserIds.forEach((userId, i) => {
		const industry = pick(industries);
		clientRows.push({
			id: crypto.randomUUID(),
			userId,
			companyName: companies[i],
			bio: `${industry[0].toUpperCase()}${industry.slice(1)} company with a team of ${int(8, 150)} people. We hire freelancers for product, design and infrastructure work and prefer clear scopes with weekly updates.`,
			totalSpent: 0, // computed below
			postedJobs: 0, // computed below
			averageRating: Number((3.8 + rand() * 1.2).toFixed(1)),
		});
	});

	/* ----------------------------- freelancers ---------------------------- */

	const profiles = new Map<string, { skills: Set<string> }>();
	freelancerUserIds.forEach((userId) => {
		const arch = archetypes[pick(archetypePicker)];
		const years = int(1, 12);
		const skillList = sample(arch.pool, int(4, Math.min(7, arch.pool.length)));
		const rate = Math.max(
			10,
			roundTo(arch.rate[0] + ((arch.rate[1] - arch.rate[0]) * years) / 12 + int(-5, 5), 5),
		);
		const n = names.get(userId)!;
		const [s1, s2, s3] = skillList;
		profiles.set(userId, { skills: new Set(skillList) });

		freelancerRows.push({
			id: crypto.randomUUID(),
			userId,
			bio: pick([
				`${arch.title} with ${years} year${years > 1 ? "s" : ""} of experience in ${pick(arch.focus)}. Comfortable with ${s1}, ${s2} and ${s3}.`,
				`I help startups and small teams with ${pick(arch.focus)}. ${years}+ years working with ${s1} and ${s2}, and I care about clean, maintainable work.`,
				`Freelance ${arch.title.toLowerCase()} based on ${s1} and ${s2}. Previously worked on ${pick(arch.focus)} for product companies. Clear communication and no surprises.`,
			]),
			skills: skillList,
			hourlyRate: rate,
			totalEarnings: 0, // computed below
			averageRating: 0, // computed below
			completedWork: 0, // computed below
			verified: false, // computed below
			portfolioUrl: `https://${slug(n.first)}${slug(n.last)}.dev`,
		});
	});

	/* ------------------------------- the core ------------------------------ */

	const jobStatusWeights: Array<[JobStatus, number]> = [
		[JobStatus.OPEN, 25],
		[JobStatus.IN_PROGRESS, 25],
		[JobStatus.COMPLETED, 35],
		[JobStatus.CLOSED, 5],
		[JobStatus.CANCELLED, 10],
	];
	// how old (in days) a job is, depending on its status
	const jobAge: Record<string, [number, number]> = {
		[JobStatus.OPEN]: [1, 25],
		[JobStatus.IN_PROGRESS]: [10, 40],
		[JobStatus.COMPLETED]: [60, 180],
		[JobStatus.CLOSED]: [30, 120],
		[JobStatus.CANCELLED]: [10, 120],
	};

	const selectedProposalUpdates: Array<{ jobId: string; proposalId: string }> = [];
	const freelancerStats = new Map<string, { completed: number; earnings: number; ratings: number[] }>();
	const clientStats = new Map<string, { spent: number; jobs: number }>();

	for (let i = 0; i < JOB_COUNT; i++) {
		const tpl = jobTemplates[i % jobTemplates.length];
		const status = weighted(jobStatusWeights);
		const clientId = pick(clientUserIds);
		const [ageMin, ageMax] = jobAge[status];
		const createdAt = addHours(new Date(NOW - int(ageMin, ageMax) * DAY), -int(0, 23));
		const baseTimeline = int(tpl.days[0], tpl.days[1]);

		// budget: integers, max is only 20-55% above min
		const rawMin = tpl.budget[0] + rand() * (tpl.budget[1] - tpl.budget[0]) * 0.8;
		const step = rawMin >= 2000 ? 100 : 50;
		const budgetMin = roundTo(rawMin, step);
		const budgetMax = Math.max(budgetMin + 2 * step, roundTo(budgetMin * (1.2 + rand() * 0.35), step));

		const jobId = crypto.randomUUID();
		const hires =
			status === JobStatus.IN_PROGRESS ||
			status === JobStatus.COMPLETED ||
			(status === JobStatus.CANCELLED && chance(0.5));

		/* ---------------------------- proposals ---------------------------- */

		const proposalCount =
			status === JobStatus.OPEN ? int(2, 7) : status === JobStatus.CLOSED ? int(2, 4) : int(3, 8);

		// prefer freelancers whose skills match the job
		const candidates = freelancerUserIds
			.map((id) => {
				const have = profiles.get(id)!.skills;
				const overlap = tpl.skills.filter((s) => have.has(s)).length;
				return { id, score: overlap * 2 + rand() * 3 };
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, proposalCount);

		const hiredIdx = hires ? int(0, candidates.length - 1) : -1;
		let minTimelineForActive = 0;

		type Hired = {
			proposal: Prisma.ProposalCreateManyInput;
			price: number;
			timeline: number;
		};
		let hired: Hired | null = null;

		candidates.forEach((c, idx) => {
			const isHired = idx === hiredIdx;
			const proposalStatus = isHired
				? ProposalStatus.ACCEPTED
				: status === JobStatus.OPEN
					? weighted<ProposalStatus>([
						[ProposalStatus.PENDING, 70],
						[ProposalStatus.REJECTED, 15],
						[ProposalStatus.WITHDRAWN, 15],
					])
					: weighted<ProposalStatus>([
						[ProposalStatus.REJECTED, 75],
						[ProposalStatus.WITHDRAWN, 25],
					]);

			const submittedAt = clampPast(addHours(createdAt, int(3, 24 * 6)));
			const respondedAt =
				proposalStatus === ProposalStatus.PENDING
					? null
					: clampPast(addHours(submittedAt, isHired ? int(6, 96) : int(4, 72)));

			let timeline = Math.max(5, baseTimeline + int(-5, 10));
			if (isHired && status === JobStatus.IN_PROGRESS && respondedAt) {
				// an active contract must still be running today
				const elapsed = Math.ceil((NOW - respondedAt.getTime()) / DAY);
				minTimelineForActive = elapsed + int(5, 20);
				timeline = Math.max(timeline, minTimelineForActive);
			}

			const price = roundTo(
				budgetMin * 0.85 + rand() * (budgetMax * 1.05 - budgetMin * 0.85),
				10,
			);
			const have = profiles.get(c.id)!.skills;
			const matched = tpl.skills.filter((s) => have.has(s));
			const skillText = (matched.length ? matched : tpl.skills).slice(0, 2).join(" and ");

			const proposal: Prisma.ProposalCreateManyInput = {
				id: crypto.randomUUID(),
				jobId,
				freelancerId: c.id,
				proposedPrice: price,
				proposedTimeline: timeline,
				approachDescription: pick(approachTemplates)(skillText, tpl.title),
				status: proposalStatus,
				submittedAt,
				respondedAt,
			};
			proposalRows.push(proposal);
			if (isHired) hired = { proposal, price, timeline };

			/* -------------------------- counter offers ------------------------- */

			let counterStatus: CounterOfferStatus | null = null;
			if (isHired && chance(0.35)) counterStatus = CounterOfferStatus.ACCEPTED;
			else if (proposalStatus === ProposalStatus.PENDING && chance(0.25)) counterStatus = CounterOfferStatus.PENDING;
			else if (proposalStatus === ProposalStatus.REJECTED && chance(0.15)) counterStatus = CounterOfferStatus.REJECTED;

			if (counterStatus) {
				const offeredBy = chance(0.6) ? CounterOfferOrigin.CLIENT : CounterOfferOrigin.FREELANCER;
				const fromClient = offeredBy === CounterOfferOrigin.CLIENT;
				const counterPrice = roundTo(price * (fromClient ? 0.8 + rand() * 0.15 : 0.93 + rand() * 0.15), 10);
				let counterTimeline = fromClient ? Math.max(5, timeline - int(2, 7)) : timeline + int(0, 6);
				if (isHired && status === JobStatus.IN_PROGRESS) {
					counterTimeline = Math.max(counterTimeline, minTimelineForActive);
				}

				counterOfferRows.push({
					id: crypto.randomUUID(),
					proposalId: proposal.id as string,
					offeredBy,
					proposedPrice: counterPrice,
					proposedTimeline: counterTimeline,
					message: pick(fromClient ? clientCounterMessages : freelancerCounterMessages),
					status: counterStatus,
				});

				if (isHired && counterStatus === CounterOfferStatus.ACCEPTED && hired) {
					hired.price = counterPrice;
					hired.timeline = counterTimeline;
				}
			}
		});

		/* ------------------------------ job row ------------------------------ */

		const hiredProposal = (hired as Hired | null)?.proposal ?? null;
		const hiredResponded = hiredProposal?.respondedAt as Date | null | undefined;

		jobRows.push({
			id: jobId,
			clientId,
			title: tpl.title,
			description: `${tpl.description} ${pick(jobContexts)} Target delivery is around ${Math.max(1, Math.round(baseTimeline / 7))} weeks.`,
			requiredSkills: [...tpl.skills],
			budgetMin,
			budgetMax,
			deadline:
				status === JobStatus.OPEN
					? addDays(new Date(NOW), int(7, 45))
					: status === JobStatus.IN_PROGRESS
						? addDays(new Date(NOW), int(3, 30))
						: addDays(createdAt, baseTimeline + int(10, 25)),
			status,
			proposalCount: candidates.length,
			selectedProposalId: null, // set after proposals exist
			createdAt,
			deletedAt:
				status === JobStatus.CANCELLED
					? clampPast(addDays(hiredResponded ?? createdAt, int(3, 14)))
					: null,
		});

		const cs = clientStats.get(clientId) ?? { spent: 0, jobs: 0 };
		cs.jobs += 1;
		clientStats.set(clientId, cs);

		/* ------------------------ contract / review / payment ------------------------ */

		if (!hired || !hiredProposal || !hiredResponded) continue;
		const h = hired as Hired;
		selectedProposalUpdates.push({ jobId, proposalId: hiredProposal.id as string });

		const contractStatus =
			status === JobStatus.COMPLETED
				? ContractStatus.COMPLETED
				: status === JobStatus.IN_PROGRESS
					? ContractStatus.ACTIVE
					: ContractStatus.CANCELLED;

		const startDate = clampPast(addHours(hiredResponded, int(2, 48)));
		let endDate: Date | null = null;
		if (contractStatus === ContractStatus.COMPLETED) {
			const wanted = addDays(startDate, Math.round(h.timeline * (0.75 + rand() * 0.4)));
			const latest = new Date(NOW - DAY);
			const earliest = addDays(startDate, 3);
			endDate = new Date(Math.max(earliest.getTime(), Math.min(wanted.getTime(), latest.getTime())));
		}

		const freelancerId = hiredProposal.freelancerId as string;
		const contractId = crypto.randomUUID();
		contractRows.push({
			id: contractId,
			jobId,
			proposalId: hiredProposal.id as string,
			clientId,
			freelancerId,
			agreedPrice: h.price,
			agreedTimeline: h.timeline,
			status: contractStatus,
			startDate,
			endDate,
			deliverables: `Working implementation using ${tpl.skills.slice(0, 3).join(", ")}, source code in a private repository, and short handover documentation.`,
		});

		// review (completed contracts only, ~90% get reviewed)
		let reviewId: string | null = null;
		let rating = 0;
		if (contractStatus === ContractStatus.COMPLETED && chance(0.9)) {
			rating = weighted<number>([[5, 55], [4, 30], [3, 10], [2, 4], [1, 1]]);
			reviewId = crypto.randomUUID();
			reviewRows.push({
				id: reviewId,
				contractId,
				reviewerId: clientId,
				revieweeId: freelancerId,
				rating,
				comment: pick(reviewComments[rating]),
			});
		}

		// payment
		let paymentStatus: PaymentStatus | null = null;
		if (contractStatus === ContractStatus.COMPLETED) paymentStatus = PaymentStatus.SUCCEEDED;
		else if (contractStatus === ContractStatus.ACTIVE)
			paymentStatus = chance(0.8) ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING;
		else if (chance(0.4)) paymentStatus = PaymentStatus.FAILED; // cancelled after a failed payment

		if (paymentStatus) {
			const amount = h.price;
			const platformCommission = Math.round(amount * PLATFORM_FEE);
			const freelancerEarns = amount - platformCommission;
			paymentRows.push({
				id: crypto.randomUUID(),
				contractId,
				clientId,
				freelancerId,
				amount,
				platformCommission,
				freelancerEarns,
				status: paymentStatus,
				stripeSessionId: `cs_test_${token(58)}`,
				reviewId,
			});

			if (paymentStatus === PaymentStatus.SUCCEEDED) {
				const c = clientStats.get(clientId)!;
				c.spent += amount;
				if (contractStatus === ContractStatus.COMPLETED) {
					const f = freelancerStats.get(freelancerId) ?? { completed: 0, earnings: 0, ratings: [] };
					f.earnings += freelancerEarns;
					freelancerStats.set(freelancerId, f);
				}
			}
		}

		if (contractStatus === ContractStatus.COMPLETED) {
			const f = freelancerStats.get(freelancerId) ?? { completed: 0, earnings: 0, ratings: [] };
			f.completed += 1;
			if (rating) f.ratings.push(rating);
			freelancerStats.set(freelancerId, f);
		}
	}

	/* ------------- derive profile stats from the data we generated ------------- */

	for (const f of freelancerRows) {
		const s = freelancerStats.get(f.userId as string);
		f.completedWork = s?.completed ?? 0;
		f.totalEarnings = s?.earnings ?? 0;
		f.averageRating =
			s && s.ratings.length
				? Number((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length).toFixed(2))
				: 0;
		f.verified = (s?.completed ?? 0) > 0 ? chance(0.8) : chance(0.3);
	}
	for (const c of clientRows) {
		const s = clientStats.get(c.userId as string);
		c.totalSpent = s?.spent ?? 0;
		c.postedJobs = s?.jobs ?? 0;
	}

	/* ------------------------------- audit logs ------------------------------- */

	const log = (
		userId: string,
		action: string,
		entityType: string,
		entityId: string,
		from: string | null,
		to: string,
	): Prisma.AuditLogCreateManyInput => ({
		id: crypto.randomUUID(),
		userId,
		action,
		entityType,
		entityId,
		changes: JSON.stringify({ field: "status", from, to }),
	});

	for (const u of userRows) auditLogRows.push(log(u.id as string, "USER_LOGIN", "User", u.id as string, null, "ACTIVE"));
	for (const j of jobRows) auditLogRows.push(log(j.clientId as string, "JOB_POSTED", "Job", j.id as string, null, "OPEN"));
	for (const p of proposalRows) auditLogRows.push(log(p.freelancerId as string, "PROPOSAL_SUBMITTED", "Proposal", p.id as string, null, "PENDING"));
	for (const c of contractRows) {
		auditLogRows.push(log(c.clientId as string, "CONTRACT_CREATED", "Contract", c.id as string, null, "ACTIVE"));
		if (c.status === ContractStatus.COMPLETED)
			auditLogRows.push(log(c.clientId as string, "CONTRACT_COMPLETED", "Contract", c.id as string, "ACTIVE", "COMPLETED"));
	}
	for (const p of paymentRows) auditLogRows.push(log(p.clientId as string, "PAYMENT_INITIATED", "Payment", p.id as string, null, "PENDING"));
	for (const r of reviewRows) auditLogRows.push(log(r.reviewerId as string, "REVIEW_CREATED", "Review", r.id as string, null, "PUBLISHED"));

	/* --------------------------------- insert --------------------------------- */

	await insertInBatches("users", userRows, (data) => prisma.user.createMany({ data }));
	await insertInBatches("clients", clientRows, (data) => prisma.client.createMany({ data }));
	await insertInBatches("freelancers", freelancerRows, (data) => prisma.freelancer.createMany({ data }));
	await insertInBatches("jobs", jobRows, (data) => prisma.job.createMany({ data }));
	await insertInBatches("proposals", proposalRows, (data) => prisma.proposal.createMany({ data }));
	await insertInBatches("counterOffers", counterOfferRows, (data) => prisma.counterOffer.createMany({ data }));
	await insertInBatches("contracts", contractRows, (data) => prisma.contract.createMany({ data }));
	await insertInBatches("reviews", reviewRows, (data) => prisma.review.createMany({ data }));
	await insertInBatches("payments", paymentRows, (data) => prisma.payment.createMany({ data }));
	await insertInBatches("auditLogs", auditLogRows, (data) => prisma.auditLog.createMany({ data }));

	console.log(`Linking selected proposals (${selectedProposalUpdates.length})...`);
	if (selectedProposalUpdates.length) {
		const jobIds = selectedProposalUpdates.map((u) => u.jobId);
		const proposalIds = selectedProposalUpdates.map((u) => u.proposalId);
		await prisma.$executeRaw`
			UPDATE "jobs" AS j
			SET "selectedProposalId" = v.pid
			FROM unnest(${jobIds}::text[], ${proposalIds}::text[]) AS v(jid, pid)
			WHERE j.id = v.jid
		`;
	}

	const byStatus = (rows: Array<{ status?: unknown }>) =>
		Object.entries(
			rows.reduce<Record<string, number>>((acc, r) => {
				const k = String(r.status);
				acc[k] = (acc[k] ?? 0) + 1;
				return acc;
			}, {}),
		)
			.map(([k, v]) => `${k}: ${v}`)
			.join(", ");

	console.log(
		`\nSeeded: ${userRows.length} users, ${clientRows.length} clients, ${freelancerRows.length} freelancers, ${jobRows.length} jobs, ${proposalRows.length} proposals, ${counterOfferRows.length} counterOffers, ${contractRows.length} contracts, ${paymentRows.length} payments, ${reviewRows.length} reviews, ${auditLogRows.length} auditLogs`,
	);
	console.log(`Jobs      -> ${byStatus(jobRows)}`);
	console.log(`Proposals -> ${byStatus(proposalRows)}`);
	console.log(`Contracts -> ${byStatus(contractRows)}`);
	console.log(`Payments  -> ${byStatus(paymentRows)}`);
	console.log("\nDemo logins: admin@workmatch.com, client@workmatch.com, freelancer@workmatch.com");

	await prisma.$disconnect();
}

main().catch(async (e) => {
	console.error(e);
	await prisma.$disconnect();
	process.exit(1);
});