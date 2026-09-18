import { JobStatus } from "../../../generated/prisma/enums";

export interface IJobFilters {
	status?: JobStatus;
	skills?: string[];
	budgetMin?: number;
	budgetMax?: number;
	search?: string;
	sortBy?: "deadline" | "budgetMax" | "createdAt" | "proposedPrice";
	page?: number;
	limit?: number;
}

export interface IPaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
