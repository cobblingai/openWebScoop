// Generated by Wrangler by running `wrangler types`

interface Env {
	WEBSITE_CACHE: KVNamespace;
	BROWSER: DurableObjectNamespace<import("./src/index").Browser>;
	SCOOP_BUCKET: R2Bucket;
	RATE_LIMITER: RateLimit;
	MYBROWSER: Fetcher;
	BASE_PUBLIC_URL: string;
	ASSETS: Fetcher;
}

declare const Readability: any;
declare const TurndownService: any;
declare const document: any;