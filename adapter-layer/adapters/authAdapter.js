import dotenv from 'dotenv';
// ensure local Auth_System env is available during development
dotenv.config({ path: '../../Auth_System/.env' });

const EXTERNAL_URL = 'https://ais-simulated-legacy.onrender.com/api/students';
const TARGET_URL = process.env.AUTH_SYSTEM_URL || EXTERNAL_URL;

// polyfill fetch in Node.js if missing
if (typeof fetch === 'undefined') {
	try {
		const mod = await import('node-fetch');
		// node-fetch v3+ exports default
		globalThis.fetch = mod.default ?? mod;
	} catch (e) {
		// node-fetch not installed or failed to import — leave as-is.
		// If you see errors about fetch, run: npm install node-fetch
	}
}

export const create = async (profile) => {
    const transformedProfile = {
        name: profile.firstName + " " + profile.lastName,
        birthdate: profile.dob,
        "program": profile.course + " " + profile.major,
        "address": profile.address,
        "studentStatus": profile.status 
    }

	try {
		console.log('Posting to target URL:', TARGET_URL, 'payload:', transformedProfile);
		const response = await fetch(TARGET_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(transformedProfile)
		});

		// log status and full body for debugging
		let respText = '';
		try { respText = await response.text(); } catch (e) { respText = '<no-body>'; }
		console.log('Upstream response status:', response.status, response.statusText);
		console.log('Upstream response body:', respText);

		if (!response.ok) {
			throw new Error(`Target API error ${response.status} ${response.statusText} - ${respText}`);
		}

		// parse JSON if possible
		let data;
		try { data = JSON.parse(respText); } catch (e) { data = respText; }

		// If configured, also force-post directly to the external simulated legacy site
		if ((process.env.FORCE_EXTERNAL === 'true') && TARGET_URL !== EXTERNAL_URL) {
			try {
				console.log('FORCE_EXTERNAL is true — also posting to external URL for verification:', EXTERNAL_URL);
				const extRes = await fetch(EXTERNAL_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(transformedProfile)
				});
				let extText = '';
				try { extText = await extRes.text(); } catch (e) { extText = '<no-body>'; }
				console.log('External post status:', extRes.status, extRes.statusText);
				console.log('External post body:', extText);
			} catch (extErr) {
				console.error('Failed to POST directly to external URL:', extErr);
			}
		}

		return data;
	} catch (err) {
		console.error('authAdapter.create error:', err.message || err);
		throw err;
	}
}