import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
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
    analyzeChart(symbol: string, timeframe: string, marketData: string, provider: string, apiKey: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    chatWithAI(messages: string, provider: string, apiKey: string): Promise<string>;
    getApiKey(): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProviderApiKey(provider: string): Promise<string>;
    getSignalHistory(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveApiKey(apiKey: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveProviderApiKey(provider: string, apiKey: string): Promise<void>;
    saveSignal(signalJson: string): Promise<void>;
    /**
     * / Callback function for HTTP transformation required by IC
     */
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
