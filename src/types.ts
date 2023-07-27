export interface Status {
	status: StatusServerInfo[];
	updatedAt: string;
}

export interface StatusServer {
	id: string;
	name: string;
	url: string;
}

export interface StatusServerInfo extends StatusServer {
	ok: boolean;
	status: number;
	statusText: string;
	body: string;
}

export interface StatusMaintenance {
	type: 'maintenance';
	title: string;
	description: string;
	startAt: string;
	endAt: string;
	scope: StatusServer['id'][];
}

export interface StatusHistory {
	id: string;
	name: string;
	status: number;
	statusText: string;
	ok: boolean;
	responseTime: number;
	timestamp: number;
}
