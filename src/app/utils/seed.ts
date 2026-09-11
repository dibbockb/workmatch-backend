import { UserRoles, UserStatus, JobStatus, ProposalStatus, ContractStatus, PaymentStatus, CounterOfferOrigin, CounterOfferStatus } from '../../generated/prisma/enums'
import { PrismaPg } from '@prisma/adapter-pg'
import envConfig from '../envConfig'
import { PrismaClient } from '../../generated/prisma/client'

const connectionString = `${envConfig.database_url}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

function seededRandom(seed: number) {
    return () => {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
    }
}
const rand = seededRandom(42)

const firstNames = ['Sarah', 'James', 'Priya', 'Mohammed', 'Emma', 'Wei', 'Carlos', 'Aisha', 'Liam', 'Sofia', 'Dmitri', 'Yuki', 'Omar', 'Elena', 'Raj', 'Mei', 'Andrei', 'Chidi', 'Ingrid', 'Hans', 'Fatima', 'Thomas', 'Noor', 'Keiko', 'Alejandro']
const lastNames = ['Chen', 'Smith', 'Patel', 'Garcia', 'Kim', 'O\'Brien', 'Nguyen', 'Wilson', 'Tanaka', 'Mohamed', 'Petrov', 'Yamamoto', 'Singh', 'Johansson', 'Brown', 'Fernandez', 'Kowalski', 'Mueller', 'Santos', 'Larsson', 'Ivanova', 'Nakamura', 'Okafor', 'Kimura', 'Romero']
const companyNames = ['TechVision Solutions', 'BuildRight Construction', 'NovaWave Media', 'DataPulse Analytics', 'CloudPeak Logistics', 'BrightPath Consulting', 'SummitEdge Tech', 'ApexDesign Studio', 'GreenField Ventures', 'IronCore Systems', 'StarBridge Digital', 'QuantumLeap Labs', 'TrueNorth Advisors', 'BlueOcean Creative', 'RedStone Capital']

const jobTitles = ['Full Stack Developer', 'UX Designer', 'DevOps Engineer', 'Mobile App Developer', 'Data Scientist', 'Backend Engineer', 'Frontend Developer', 'Product Manager', 'QA Engineer', 'Cloud Architect', 'Blockchain Developer', 'AI Researcher', 'Security Analyst', 'Database Administrator', 'IoT Engineer']
const jobDescriptions = [
    'We need a skilled developer to build and maintain our core platform. You will work on microservices architecture and lead technical decisions.',
    'Looking for a creative designer to revamp our user interface and improve user experience across all touchpoints.',
    'Seeking an experienced engineer to manage our CI/CD pipelines and cloud infrastructure deployment.',
    'Help us build a cross-platform mobile application that serves millions of users worldwide.',
    'We need a data scientist to analyze user behavior patterns and build predictive models for our recommendation engine.',
    'Join our backend team to develop scalable APIs and optimize database performance for high-traffic workloads.',
    'We are looking for a frontend developer to create responsive and accessible web applications using modern frameworks.',
    'Hiring a product manager to oversee the development lifecycle of our flagship SaaS product.',
    'Need a QA engineer to establish testing frameworks and ensure software quality across all releases.',
    'Seeking a cloud architect to design and implement scalable infrastructure solutions for enterprise clients.',
]
const skills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'MongoDB', 'Redis', 'Rust', 'Go', 'Swift']
const approachDescriptions = [
    'I have 5 years of experience in this domain and have completed similar projects. My approach is to break down the requirements into sprints and deliver incremental value.',
    'I bring a strong background in this area with a track record of delivering projects on time. I prefer agile methodology and frequent communication.',
    'My expertise aligns well with this scope. I focus on clean code, thorough testing, and maintaining documentation throughout the project.',
    'I have worked on similar challenges before and understand the nuances involved. My strategy is to start with a proof of concept before full development.',
    'I offer a systematic approach: requirement analysis, architecture design, implementation, testing, and deployment. I prioritize code quality and maintainability.',
]

const comments = [
    'Excellent work, highly recommend.',
    'Very professional and delivered on time.',
    'Great communication and quality output.',
    'Would work with again. Strong skills.',
    'Outstanding attention to detail.',
]

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    console.log('Seeding database for demo...')

    await prisma.$connect()

    await prisma.auditLog.deleteMany()
    await prisma.review.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.contract.deleteMany()
    await prisma.counterOffer.deleteMany()
    await prisma.proposal.deleteMany()
    await prisma.job.deleteMany()
    await prisma.freelancer.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()

    const userCount = 25
    const clientCount = 10
    const freelancerCount = 10
    const adminCount = 1
    const jobCount = 15
    const proposalCount = 40
    const counterOfferCount = 12
    const contractCount = 15
    const paymentCount = 15
    const reviewCount = 12
    const auditLogCount = 30

    const users: any[] = []
    const clients: any[] = []
    const freelancers: any[] = []
    const jobs: any[] = []
    const proposals: any[] = []
    const counterOffers: any[] = []
    const contracts: any[] = []
    const payments: any[] = []
    const reviews: any[] = []
    const auditLogs: any[] = []

    const clientUserIds: string[] = []
    const freelancerUserIds: string[] = []

    for (let i = 0; i < userCount; i++) {
        const firstName = firstNames[i % firstNames.length]
        const lastName = lastNames[i % lastNames.length]
        const role = i < adminCount ? UserRoles.ADMIN : (i < adminCount + clientCount ? UserRoles.CLIENT : UserRoles.FREELANCER)
        const status = rand() > 0.1 ? UserStatus.ACTIVE : UserStatus.BLOCKED
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`

        const user = {
            id: crypto.randomUUID(),
            name: `${firstName} ${lastName}`,
            email,
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz67Xr1xI5uTZJpY4v5w8x9Km2nR1qG',
            role,
            status,
            emailVerified: true,
            profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`)}&background=random`,
        }
        users.push(user)

        if (role === UserRoles.CLIENT) {
            clientUserIds.push(user.id)
        } else if (role === UserRoles.FREELANCER) {
            freelancerUserIds.push(user.id)
        }
    }

    let userIndex = adminCount + clientCount
    for (let i = 0; i < clientCount; i++) {
        const userId = clientUserIds[i]
        clients.push({
            id: crypto.randomUUID(),
            userId,
            companyName: companyNames[i % companyNames.length],
            bio: `Established company specializing in ${jobTitles[i % jobTitles.length].toLowerCase()}. Trusted by 50+ clients worldwide.`,
            totalSpent: Number((rand() * 50000 + 1000).toFixed(2)),
            postedJobs: Math.floor(rand() * 20) + 1,
            averageRating: Number((rand() * 2 + 3).toFixed(2)),
        })
    }

    for (let i = 0; i < freelancerCount; i++) {
        const userId = freelancerUserIds[i]
        const freelancerSkills = skills.sort(() => rand() - 0.5).slice(0, Math.floor(rand() * 4) + 2)
        freelancers.push({
            id: crypto.randomUUID(),
            userId,
            bio: `Experienced ${jobTitles[i % jobTitles.length].toLowerCase()} with 5+ years in the industry. Specializing in modern web technologies and scalable solutions.`,
            skills: freelancerSkills,
            hourlyRate: Number((rand() * 100 + 25).toFixed(2)),
            totalEarnings: Number((rand() * 30000 + 500).toFixed(2)),
            averageRating: Number((rand() * 2 + 3).toFixed(2)),
            completedWork: Math.floor(rand() * 50) + 5,
            verified: rand() > 0.3,
            portfolioUrl: `https://${firstNames[i].toLowerCase()}${lastNames[i].toLowerCase()}.dev`,
        })
    }

    const jobStatuses = [JobStatus.OPEN, JobStatus.OPEN, JobStatus.IN_PROGRESS, JobStatus.IN_PROGRESS, JobStatus.CLOSED, JobStatus.COMPLETED, JobStatus.CANCELLED]
    for (let i = 0; i < jobCount; i++) {
        const clientId = clientUserIds[i % clientUserIds.length]
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + Math.floor(rand() * 60) + 7)
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - Math.floor(rand() * 90) + 1)

        jobs.push({
            id: crypto.randomUUID(),
            clientId,
            title: jobTitles[i % jobTitles.length],
            description: jobDescriptions[i % jobDescriptions.length],
            requiredSkills: skills.sort(() => rand() - 0.5).slice(0, Math.floor(rand() * 5) + 2),
            budgetMin: Number((rand() * 2000 + 500).toFixed(2)),
            budgetMax: Number((rand() * 5000 + 3000).toFixed(2)),
            deadline,
            status: jobStatuses[i % jobStatuses.length],
            proposalCount: Math.floor(rand() * 10) + 1,
            selectedProposalId: jobStatuses[i % jobStatuses.length] !== JobStatus.OPEN ? crypto.randomUUID() : null,
            createdAt,
            deletedAt: jobStatuses[i % jobStatuses.length] === JobStatus.CANCELLED ? new Date() : null,
        })
    }

    for (let i = 0; i < proposalCount; i++) {
        const job = jobs[i % jobs.length]
        const freelancerId = freelancerUserIds[i % freelancerUserIds.length]
        const statusRand = rand()
        const status: ProposalStatus = statusRand < 0.3 ? ProposalStatus.PENDING : (statusRand < 0.6 ? ProposalStatus.ACCEPTED : (statusRand < 0.8 ? ProposalStatus.REJECTED : ProposalStatus.WITHDRAWN))
        const submittedAt = new Date(job.createdAt)
        submittedAt.setDate(submittedAt.getDate() + Math.floor(rand() * 7) + 1)

        proposals.push({
            id: crypto.randomUUID(),
            jobId: job.id,
            freelancerId,
            proposedPrice: Number((rand() * (Number(job.budgetMax) - Number(job.budgetMin)) + Number(job.budgetMin)).toFixed(2)),
            proposedTimeline: Math.floor(rand() * 30) + 7,
            approachDescription: approachDescriptions[i % approachDescriptions.length],
            status,
            submittedAt,
            respondedAt: status !== ProposalStatus.PENDING ? new Date(submittedAt) : null,
        })
    }

    for (let i = 0; i < counterOfferCount; i++) {
        const proposal = proposals[i % proposals.length]
        const freelancerId = proposal.freelancerId
        const clientId = jobs.find(j => j.id === proposal.jobId)?.clientId || clientUserIds[0]
        const offeredBy = rand() > 0.5 ? CounterOfferOrigin.CLIENT : CounterOfferOrigin.FREELANCER

        counterOffers.push({
            id: crypto.randomUUID(),
            proposalId: proposal.id,
            offeredBy,
            proposedPrice: Number((Number(proposal.proposedPrice) * (0.8 + rand() * 0.4)).toFixed(2)),
            proposedTimeline: proposal.proposedTimeline + Math.floor(rand() * 10) - 5,
            message: offeredBy === CounterOfferOrigin.CLIENT ? 'We can adjust the timeline if the price fits our budget.' : 'I can adjust the timeline to meet your deadline while maintaining fair compensation.',
            status: CounterOfferStatus.PENDING,
        })
    }

    for (let i = 0; i < contractCount; i++) {
        const proposal = proposals[i % proposals.length]
        const job = jobs.find(j => j.id === proposal.jobId)
        const clientId = job?.clientId || clientUserIds[0]
        const freelancerId = proposal.freelancerId
        const contractStatuses = [ContractStatus.ACTIVE, ContractStatus.ACTIVE, ContractStatus.COMPLETED, ContractStatus.COMPLETED, ContractStatus.CANCELLED]
        const status = contractStatuses[i % contractStatuses.length]

        contracts.push({
            id: crypto.randomUUID(),
            jobId: job.id,
            proposalId: proposal.id,
            clientId,
            freelancerId,
            agreedPrice: proposal.proposedPrice,
            agreedTimeline: proposal.proposedTimeline,
            status,
            startDate: proposal.submittedAt,
            endDate: status === ContractStatus.COMPLETED ? new Date(proposal.submittedAt) : null,
            deliverables: 'Full project delivery with source code, documentation, and testing results.',
        })
    }

    for (let i = 0; i < paymentCount; i++) {
        const contract = contracts[i % contracts.length]
        const amount = Number((Number(contract.agreedPrice) * 0.1).toFixed(2))
        const platformCommission = Number((amount * 0.1).toFixed(2))
        const freelancerEarns = Number((amount - platformCommission).toFixed(2))
        const paymentStatuses = [PaymentStatus.SUCCEEDED, PaymentStatus.SUCCEEDED, PaymentStatus.PENDING, PaymentStatus.FAILED]
        const status = paymentStatuses[i % paymentStatuses.length]

        payments.push({
            id: crypto.randomUUID(),
            contractId: contract.id,
            clientId: contract.clientId,
            freelancerId: contract.freelancerId,
            amount,
            platformCommission,
            freelancerEarns,
            status,
            stripeSessionId: status === PaymentStatus.SUCCEEDED ? `cs_test_${crypto.randomUUID().slice(0, 24)}` : null,
            reviewId: reviews[i % reviews.length]?.id || null,
        })
    }

    for (let i = 0; i < reviewCount; i++) {
        const contract = contracts[i % contracts.length]
        const reviewerId = contract.clientId
        const revieweeId = contract.freelancerId

        reviews.push({
            id: crypto.randomUUID(),
            contractId: contract.id,
            reviewerId,
            revieweeId,
            rating: Math.floor(rand() * 3) + 4,
            comment: comments[i % comments.length],
        })
    }

    for (let i = 0; i < auditLogCount; i++) {
        const userId = users[i % users.length].id
        const actions = ['USER_LOGIN', 'PROPOSAL_SUBMITTED', 'CONTRACT_CREATED', 'PAYMENT_INITIATED', 'JOB_POSTED', 'REVIEW_CREATED', 'PROFILE_UPDATED']
        const entityTypes = ['User', 'Proposal', 'Contract', 'Payment', 'Job', 'Review']

        auditLogs.push({
            id: crypto.randomUUID(),
            userId,
            action: actions[i % actions.length],
            entityType: entityTypes[i % entityTypes.length],
            entityId: users[i % users.length].id,
            changes: JSON.stringify({ field: 'status', from: 'PENDING', to: 'ACTIVE' }),
        })
    }

    console.log('Inserting users...')
    for (let i = 0; i < users.length; i += 10) {
        await prisma.user.createMany({ data: users.slice(i, i + 10) })
    }

    console.log('Inserting clients...')
    for (let i = 0; i < clients.length; i += 10) {
        await prisma.client.createMany({ data: clients.slice(i, i + 10) })
    }

    console.log('Inserting freelancers...')
    for (let i = 0; i < freelancers.length; i += 10) {
        await prisma.freelancer.createMany({ data: freelancers.slice(i, i + 10) })
    }

    console.log('Inserting jobs...')
    for (let i = 0; i < jobs.length; i += 10) {
        await prisma.job.createMany({ data: jobs.slice(i, i + 10) })
    }

    console.log('Inserting proposals...')
    for (let i = 0; i < proposals.length; i += 10) {
        await prisma.proposal.createMany({ data: proposals.slice(i, i + 10) })
    }

    console.log('Inserting counterOffers...')
    for (let i = 0; i < counterOffers.length; i += 10) {
        await prisma.counterOffer.createMany({ data: counterOffers.slice(i, i + 10) })
    }

    console.log('Inserting contracts...')
    for (let i = 0; i < contracts.length; i += 10) {
        await prisma.contract.createMany({ data: contracts.slice(i, i + 10) })
    }

    console.log('Inserting payments...')
    for (let i = 0; i < payments.length; i += 10) {
        await prisma.payment.createMany({ data: payments.slice(i, i + 10) })
    }

    console.log('Inserting reviews...')
    for (let i = 0; i < reviews.length; i += 10) {
        await prisma.review.createMany({ data: reviews.slice(i, i + 10) })
    }

    console.log('Inserting auditLogs...')
    for (let i = 0; i < auditLogs.length; i += 10) {
        await prisma.auditLog.createMany({ data: auditLogs.slice(i, i + 10) })
    }

    console.log(`Seeded: ${users.length} users, ${clients.length} clients, ${freelancers.length} freelancers, ${jobs.length} jobs, ${proposals.length} proposals, ${counterOffers.length} counterOffers, ${contracts.length} contracts, ${payments.length} payments, ${reviews.length} reviews, ${auditLogs.length} auditLogs`)

    await prisma.$disconnect()
}

main().catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})
