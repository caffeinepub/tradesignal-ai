import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    analyzeChart(symbol: string, timeframe: string, marketData: string, apiKey: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    chatWithAI(messages: string, apiKey: string): Promise<string>;
    getApiKey(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getSignalHistory(): Promise<Array<string>>;
    isCallerAdmin(): Promise<boolean>;
    saveApiKey(apiKey: string): Promise<void>;
    saveSignal(signalJson: string): Promise<void>;
    /**
     * / Callback function for HTTP transformation required by IC
     */
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
