/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env) {
		if (request.method === 'OPTIONS') {
			return handleCORS();
		}

		if (request.method === 'GET') {
			return await handleGet(request, env);
		}

		if (request.method === 'POST') {
			return await handlePost(request, env);
		}

		return new Response('Method not allowed', { status: 405 });
	}
} satisfies ExportedHandler<Env>;

type Data = {
    "timestamp": string,
    "hostname": string,
    "metrics": {
        "uptime": string,
        "load": string,
        "memory": {
            "total": number,
            "used": number
        },
        "cpu_usage": number,
        "disk_usage": string
    }
}
async function handlePost(request: Request, env: Env) {
	try {
		const data = await request.json<Data>();

		// 插入数据到 D1
		const { timestamp, hostname, metrics } = data;
		await env.DB.prepare(
			`INSERT INTO probe_data
            (timestamp, hostname, uptime, load, memory_total, memory_used, cpu_usage, disk_usage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(
			timestamp,
			hostname,
			metrics.uptime,
			metrics.load,
			metrics.memory.total,
			metrics.memory.used,
			metrics.cpu_usage,
			metrics.disk_usage
		).run();

		return new Response(JSON.stringify({ status: 'success' }), {
			headers: corsHeaders()
		});
	} catch (error) {
		return new Response(JSON.stringify({
			status: 'error',
			message: (error as Error).message
		}), {
			status: 400,
			headers: corsHeaders()
		});
	}
}

async function handleGet(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const hostname = url.searchParams.get('hostname');
        const hours = parseInt(url.searchParams.get('hours') || '24');

        let query = `
            SELECT * FROM probe_data
            WHERE timestamp > datetime('now', '-${hours} hours')
        `;

        if (hostname && hostname !== 'all') {
            query += ` AND hostname = '${hostname}'`;
        }

        query += ` ORDER BY timestamp DESC LIMIT 1000`;

        const results = await env.DB.prepare(query).all();

        // 打印一下数据格式便于调试
        console.log('Query results:', results);

        return new Response(JSON.stringify(results.results || []), {
            headers: corsHeaders()
        });
    } catch (error) {
        return new Response(JSON.stringify({
            status: 'error',
            message: (error as Error).message,
            stack: (error as Error).stack // 添加堆栈信息便于调试
        }), {
            status: 500,
            headers: corsHeaders()
        });
    }
}

function corsHeaders() {
	return {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	};
}

function handleCORS() {
	return new Response(null, {
		headers: corsHeaders()
	});
}
