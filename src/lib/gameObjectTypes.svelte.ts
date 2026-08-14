export interface IHCPenalty {
	"id": number
	"text": string
	"digitalSafe": boolean
}

interface IHCPrompt {
	id: number,
	task: string,
	samplePrompts: string[]
}

export interface IHCModule {
	id: number
	name: string
	difficulty: "Introductory" | "Easy" | "Intermediate" | "Hard",
	coverSheet: string
	primaryPrompts: IHCPrompt[]
	secondaryPrompts: IHCPrompt[]
	darkIcon: string
	lightIcon: string
	mazePoints: [string,string,string,string,string,string]
	patientRobotProfiles: number[],
	violentRobotProfiles: number[]
}

export interface IHCBackground {
	id: number
	background: string
}

export interface IHCHumanProfile {
	type: "human"
}

export interface IHCPatientRobotProfile {
	id: number
	type: "patientRobot"
	restriction: string
	explainerText: string
}

export interface IHCViolentRobotProfile {
	id: number
	type: "violentRobot"
	requirements: string[]
}

export type IHCProfile = IHCHumanProfile | IHCPatientRobotProfile | IHCViolentRobotProfile