import { DurableObject } from 'cloudflare:workers';
import puppeteer from '@cloudflare/puppeteer';

// Use Web Crypto API to compute MD5 hash in Cloudflare Workers
async function md5Hash(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest('MD5', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}

const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;
const TEN_SECONDS = 10000;
/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class Browser extends DurableObject<Env> {
	browser: puppeteer.Browser | undefined;
	keptAliveInSeconds: number;
	storage: DurableObjectStorage;
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.json
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;
		this.keptAliveInSeconds = 0;
		this.storage = this.ctx.storage;
	}

	async fetch(request: Request) {
		try {
			const url = request.url;

			if (!url || !this.isValidUrl(url)) {
				return new Response('Invalid URL provided, should be a full URL starting with http:// or https://', { status: 400 });
			}

			if (!(await this.ensureBrowser())) {
				return new Response('Could not start browser instance', { status: 500 });
			}

			return this.processSinglePage(url);
		} catch (error) {
			console.error('Error processing request:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	async processSinglePage(url: string) {
		try {
			const md = await this.getWebsiteMarkdown({
				url: url,
			});

			return new Response(JSON.stringify(md), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		} catch (error) {
			console.error('Error processing page:', error);
			return new Response('Error processing page', { status: 500 });
		}
	}

	async getWebsiteMarkdown({ url }: { url: string }) {
		

		try {
			const isBrowserActive = await this.ensureBrowser();

			if (!isBrowserActive) {
				throw new Error('Could not start browser instance');
			}

			const hash_id = await md5Hash(url);

			try {
				const cached = await this.env.WEBSITE_CACHE.get(hash_id);
				if (cached) {
					const cachedParsed = JSON.parse(cached);
					return { url, content: cachedParsed };
				}
			} catch (cacheError) {
				console.error('Cache retrieval error:', cacheError);
				// Continue execution even if cache fails
			}

			// Reset keptAlive after each call to the DO
			this.keptAliveInSeconds = 0;
			const scrape = await this.fetchAndProcessPage(url, hash_id);

			// Reset keptAlive after performing tasks to the DO
			this.keptAliveInSeconds = 0;

			// Set the first alarm to keep DO alive
			let currentAlarm = await this.storage.getAlarm();
			if (currentAlarm == null) {
				console.log(`Browser DO: setting alarm`);
				await this.storage.setAlarm(Date.now() + TEN_SECONDS);
			}

			try {
				await this.env.WEBSITE_CACHE.put(hash_id, JSON.stringify(scrape), { expirationTtl: 86400 });
			} catch (cacheError) {
				console.error('Cache storage error:', cacheError);
				// Continue execution even if cache fails
			}

			return { url, content: scrape };
		} catch (error) {
			console.error('Error in getWebsiteMarkdown:', error);
			throw error; // Re-throw to be handled by the caller
		}
	}

	async fetchAndProcessPage(
		url: string,
		hash_id: string
	): Promise<{ title: string | null; og_tags: { [key: string]: string | null }; screenshot: string | null; markdown: string }> {
		const MAX_RETRIES = 3;
		let lastError = null;
		
		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			const page = await this.browser!.newPage();
			const requestHandler = (request: puppeteer.HTTPRequest) => {
				const headers = request.headers();
				headers['downgrade-http2'] = '1';
				request.continue({ headers });
			};
			try {
				// Set options to downgrade to HTTP1.1
				
				if (attempt > 0) {
					await page.setRequestInterception(true);
					page.on('request', requestHandler);
				}
				const userAgents = [
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
						'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.1418.62'
				];
				const languages = [
						'en-US,en;q=0.9',
						'en-GB,en;q=0.9,fr;q=0.8'
				];
				
				// Randomly select User-Agent and language
				const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
				const randomLang = languages[Math.floor(Math.random() * languages.length)];
				await page.setUserAgent(randomUA);
				await page.setExtraHTTPHeaders({
					'Accept-Language': randomLang,
					'Accept-Encoding': 'gzip, deflate, br'
				});
				await page.evaluateOnNewDocument(() => {
					Object.defineProperty(navigator, 'webdriver', { get: () => false });
				});
				// use the current date and time to create a folder structure for R2
				const nowDate = new Date();
				const coeff = 1000 * 60 * 5;
				const roundedDate = new Date(Math.round(nowDate.getTime() / coeff) * coeff).toString();
				const folder = roundedDate.split(' GMT')[0].replace(/[^0-9a-zA-Z-]/g, '-');

				await page.setViewport({ width: 1920, height: 1080 });
				await page.setBypassCSP(true);
				await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
				const title = await page.title();
				let og_tags: { [key: string]: string | null } = {};
				let screenshot = null;

				try {
					const ogTags = ['title', 'description', 'image', 'url', 'type', 'site_name'];
					for (const tag of ogTags) {
						try {
							og_tags[tag] = await page.$eval(`meta[property="og:${tag}"]`, (el) => el.getAttribute('content'));
						} catch (e) {
							og_tags[tag] = null;
							console.info(`Could not get og:${tag}. Error: ${e}`);
						}
					}
				} catch (e) {
					console.info(`Error processing og tags: ${e}`);
				}

				try {
					const fileName = `screenshot_${hash_id}_1920x1080`.replace(/[^0-9a-zA-Z-]/g, '-');
					const sc = await page.screenshot({ clip: { x: 0, y: 0, width: 1920, height: 1080 } });
					const screenshot_path = `${folder}/${fileName}.jpg`;
					await this.env.SCOOP_BUCKET.put(screenshot_path, sc);
					screenshot = this.env.BASE_PUBLIC_URL + '/' + screenshot_path;
				} catch (e) {
					console.info(`Could not get screenshot image. Error: ${e}`);
				}

				console.debug('Extracting markdown');

				let markdown = '';
				try {
					// Move the Turndown conversion to browser context where document is available
					const content = await page.evaluate(async () => {
						const readability = await import(
							// @ts-ignore
							"https://cdn.skypack.dev/@mozilla/readability"
						);
						
						// Load Turndown in the browser context
						const turndownModule = await import(
							// @ts-ignore
							"https://cdn.skypack.dev/turndown"
						);
						const TurndownService = turndownModule.default;
						
						const readable = new readability.Readability(document.cloneNode(true)).parse();
						const htmlContent = readable?.content || document.documentElement.outerHTML;
						
						// Convert HTML to markdown in the browser context
						const turndownService = new TurndownService();
						return turndownService.turndown(htmlContent);
					});
					
					markdown = content || '';
				} catch (error) {
					console.error('Error in markdown extraction:', error);
				}
				return {
					title,
					og_tags,
					screenshot,
					markdown,
				};
			} catch (error) {
				lastError = error;
				console.error(`Attempt ${attempt + 1} failed: ${error}`);
				if (attempt === MAX_RETRIES - 1) {
					throw lastError;
				}
			} finally {
				await page.close().catch((e) => console.error('Error closing page:', e));
				page.off('request', requestHandler);
			}
		}

		throw lastError;
	}

	/**
	 * 确保浏览器实例正常运行
	 * @returns Promise<boolean> 浏览器是否成功启动
	 */
	async ensureBrowser(): Promise<boolean> {
		// If browser is already connected, return true directly
		if (this.browser?.isConnected()) {
			return true;
		}

		return await this.initializeBrowser();
	}

	/**
	 * 初始化浏览器实例
	 * @returns Promise<boolean> 浏览器是否成功启动
	 */
	private async initializeBrowser(): Promise<boolean> {
		const MAX_RETRIES = 3;

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				this.browser = await puppeteer.launch(this.env.MYBROWSER);
				return true;
			} catch (error) {
				console.error(`Browser DO: Could not start browser instance. Error: ${error}`);

				if (attempt === MAX_RETRIES - 1) {
					return false;
				}

				await this.cleanupSessions();
				console.log(`Retrying to start browser instance. Retries left: ${MAX_RETRIES - attempt - 1}`);
			}
		}

		return false;
	}

	/**
	 * 清理现有的浏览器会话
	 */
	private async cleanupSessions(): Promise<void> {
		try {
			const sessions = await puppeteer.sessions(this.env.MYBROWSER);
			await Promise.all(
				sessions.map((session) => puppeteer.connect(this.env.MYBROWSER, session.sessionId).then((browser) => browser.close()))
			);
		} catch (error) {
			console.error(`Failed to clean up browser sessions: ${error}`);
		}
	}

	isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        // Optional: check hostname whitelist
        // && allowedHosts.includes(parsed.hostname);
    } catch {
        return false;
    }
}
	async alarm() {
		try {
			this.keptAliveInSeconds += 10;
			if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
				console.log(`Browser DO: has been kept alive for ${this.keptAliveInSeconds} seconds. Extending lifespan.`);
				await this.storage.setAlarm(Date.now() + TEN_SECONDS);
			} else {
				console.log(`Browser DO: exceeded life of ${KEEP_BROWSER_ALIVE_IN_SECONDS}s.`);
				await this.cleanup();
			}
		} catch (error) {
			console.error('Error in alarm handler:', error);
			// Try to clean up resources even if there's an error
			await this.cleanup().catch((e) => console.error('Error during cleanup:', e));
		}
	}

	private async cleanup() {
		if (this.browser) {
			try {
				const pages = await this.browser.pages();
				await Promise.all(pages.map((page) => page.close().catch((e) => console.error('Error closing page:', e))));
				await this.browser.close();
			} catch (error) {
				console.error('Error during browser cleanup:', error);
			} finally {
				this.browser = undefined;
			}
		}
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.json
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		// Handle GET request, return entry page
		if (request.method === 'GET') {
			return await env.ASSETS.fetch(new Request(request.url, {
				method: request.method,
				headers: request.headers
			}));
		}
		const ipAddress = request.headers.get('cf-connecting-ip') ?? 'anonymous';
		const { success } = await env.RATE_LIMITER.limit({ key: ipAddress });
		if (!success) {
			return new Response(`429 Failure – rate limit exceeded for anonymous user: ${ipAddress}`, { status: 429 });
		}

		// Handle POST request
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', { status: 405 });
		}

		// Get URL from request body
		let body;
		try {
			body = await request.json();
		} catch (e) {
			return new Response('Invalid JSON body', { status: 400 });
		}

		const url = (body as { url: string }).url;
		// We will create a `DurableObjectId` using the pathname from the Worker request
		// This id refers to a unique instance of our 'MyDurableObject' class above
		let id: DurableObjectId = env.BROWSER.idFromName('free-browser');

		// This stub creates a communication channel with the Durable Object instance
		// The Durable Object constructor will be invoked upon the first call for a given id
		let stub = env.BROWSER.get(id);

		// Durable Object instance
		const fetchPromise = stub.fetch(new Request(url));
		ctx.waitUntil(fetchPromise);
		let resp = await fetchPromise;

		return resp;
	},
} satisfies ExportedHandler<Env>;
