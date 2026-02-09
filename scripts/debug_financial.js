
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env loading
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
    });
} else {
    console.error('.env not found!');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinancialQuery() {
    console.log('Fetching appointments...');
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (
                name,
                payment_type,
                custom_price,
                plans (
                    name,
                    value
                )
            )
        `)
        .limit(10); // Check a few

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} appointments.`);

    data.forEach(app => {
        const patient = app.patients;
        if (patient) {
            if (patient.payment_type === 'plano') {
                console.log(`[PLANO] Paciente: ${patient.name}`);
                console.log('  -> Plans Raw:', JSON.stringify(patient.plans));

                const plan = Array.isArray(patient.plans) ? patient.plans[0] : patient.plans;
                console.log('  -> Resolved Plan:', plan);

                if (plan) {
                    console.log('  -> Value:', Number(plan.value));
                } else {
                    console.log('  -> Plan MISSING!');
                }
            } else {
                console.log(`[PARTICULAR] Paciente: ${patient.name}, Value: ${patient.custom_price}`);
            }
        } else {
            console.log(`[appointment ${app.id}] No patient data.`);
        }
    });
}

testFinancialQuery();
