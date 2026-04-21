import express from 'express';
import dotenv from 'dotenv';
import { create as adapterCreate } from './adapter-layer/adapters/authAdapter.js';

// load env from Auth_System/.env
dotenv.config({ path: './Auth_System/.env' });

let pool = null;

const initDb = async () => {
	const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = process.env;
	if (DB_HOST && DB_USER && DB_NAME) {
		try {
			// dynamic import so missing mysql2 doesn't crash startup
			let mysql;
			try {
				const mod = await import('mysql2/promise');
				mysql = mod.default ?? mod;
			} catch (impErr) {
				console.error('mysql2 module is not installed or failed to import. To enable DB support run:');
				console.error('  npm install mysql2');
				console.error('Continuing without DB; requests will be forwarded to the adapter instead.');
				pool = null;
				return;
			}

			const port = DB_PORT ? Number(DB_PORT) : 3306;
			pool = mysql.createPool({
				host: DB_HOST,
				user: DB_USER,
				password: DB_PASS || '',
				database: DB_NAME,
				port,
				waitForConnections: true,
				connectionLimit: 10,
				queueLimit: 0
			});
			// test connection but don't let a transient failure stop the server
			await pool.query('SELECT 1');
			console.log(`Connected to DB ${DB_NAME} on ${DB_HOST}:${port}`);
		} catch (err) {
			console.error('DB initialization failed; continuing without DB. Error:', err.message);
			pool = null;
		}
	} else {
		console.log('DB env not fully set; running without DB.');
	}
};

const app = express();
// use express.json() instead of body-parser import
app.use(express.json());

app.post('/api/students', async (req, res) => {
	try {
		const profile = req.body;
		console.log('Incoming POST /api/students body:', profile); // debug

		if (!profile || Object.keys(profile).length === 0) {
			return res.status(400).json({ error: 'Empty body' });
		}

		// helper: convert undefined/null/empty-string -> null
		const norm = (v) => {
			if (v === undefined || v === null) return null;
			if (typeof v === 'string' && v.trim() === '') return null;
			return v;
		};

		// Support two shapes:
		// 1) Transformed from adapter: { name, birthdate, program, address, studentStatus }
		// 2) Raw from client: { firstName, lastName, dob, course, major, address, status }
		const nameFromAdapter = norm(profile.name);
		const birthdateFromAdapter = norm(profile.birthdate);
		const programFromAdapter = norm(profile.program);
		const addressFromAdapter = norm(profile.address);
		const studentStatusFromAdapter = norm(profile.studentStatus);

		const firstName = norm(profile.firstName);
		const lastName = norm(profile.lastName);
		const dob = norm(profile.dob);
		const course = norm(profile.course);
		const major = norm(profile.major);
		const address = addressFromAdapter ?? norm(profile.address);
		const status = studentStatusFromAdapter ?? norm(profile.status);

		// build name and program using whichever inputs are present
		const name = nameFromAdapter ?? ((firstName || lastName) ? [firstName, lastName].filter(Boolean).join(' ') : null);
		const program = programFromAdapter ?? ((course || major) ? [course, major].filter(Boolean).join(' ') : null);
		const birthdate = birthdateFromAdapter ?? dob;
		const studentStatus = studentStatusFromAdapter ?? status;

		// If DB requires name NOT NULL, enforce it here
		if (!name) {
			return res.status(400).json({ error: "Missing 'name' (provide firstName/lastName or name)" });
		}

		const transformed = {
			name,
			birthdate,
			program,
			address,
			studentStatus
		};

		if (pool) {
			const sql = `INSERT INTO students (name, birthdate, program, address, studentStatus) VALUES (?, ?, ?, ?, ?)`;
			const params = [
				transformed.name,
				transformed.birthdate,
				transformed.program,
				transformed.address,
				transformed.studentStatus
			];

			console.log('DB insert original params:', params);

			// defensive sanitization: replace any undefined with null (mysql2 rejects undefined)
			const sanitized = params.map(p => (p === undefined ? null : p));
			console.log('DB insert sanitized params:', sanitized);

			const undefinedIndexes = sanitized
				.map((v, i) => (v === undefined ? i : -1))
				.filter(i => i !== -1);
			if (undefinedIndexes.length) {
				console.error('Sanitized params still contain undefined at indexes:', undefinedIndexes);
				return res.status(400).json({ error: 'Request produced undefined DB params', indexes: undefinedIndexes });
			}

			try {
				const [result] = await pool.execute(sql, sanitized);
				return res.status(201).json({ id: result.insertId ?? null, ...transformed });
			} catch (dbErr) {
				console.error('DB execute error. params:', sanitized, 'error:', dbErr);
				return res.status(500).json({ error: dbErr?.message || 'DB error' });
			}
		} else {
			// fallback to adapter
			const adapterResult = await adapterCreate(profile);
			return res.status(201).json(adapterResult);
		}
	} catch (err) {
		console.error('POST /api/students error:', err);
		return res.status(500).json({ error: err.message || 'Server error' });
	}
});

// add this GET handler so browser /api/students returns JSON instead of "Cannot GET"
app.get('/api/students', async (req, res) => {
	try {
		if (pool) {
			const [rows] = await pool.query(
				'SELECT id, name, birthdate, program, address, studentStatus, created_at FROM students ORDER BY id DESC'
			);
			return res.json(rows);
		} else {
			// proxy to configured target (AUTH_SYSTEM_URL) or external simulated legacy endpoint
			const target = process.env.AUTH_SYSTEM_URL || 'https://ais-simulated-legacy.onrender.com/api/students';
			try {
				const upstream = await fetch(target);
				const data = await upstream.json().catch(() => null);
				return res.status(upstream.status).json(data);
			} catch (fetchErr) {
				console.error('Failed to fetch external /api/students:', fetchErr);
				return res.status(502).json({ error: 'Failed to fetch external students' });
			}
		}
	} catch (err) {
		console.error('GET /api/students error:', err);
		return res.status(500).json({ error: err.message || 'Server error' });
	}
});

const PORT = Number(process.env.PORT) || 3000;
initDb().finally(() => {
	app.listen(PORT, () => {
		console.log(`Server running: http://localhost:${PORT}`);
	});
});
