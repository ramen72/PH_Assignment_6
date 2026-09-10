export interface ICreateVendorPayload {
	name: string;
	companyName?: string;
	email?: string;
	phone?: string;
	address?: string;
	website?: string;
	contactPerson?: string;
	isActive?: boolean;
}

export interface IUpdateVendorPayload {
	name?: string;
	companyName?: string;
	email?: string;
	phone?: string;
	address?: string;
	website?: string;
	contactPerson?: string;
	isActive?: boolean;
}
