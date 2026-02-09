
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

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
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Data returned:', JSON.stringify(data, null, 2));

    data?.forEach((app: any) => {
        const patient = app.patients;
        if (patient && patient.payment_type === 'plano') {
            console.log(`Checking patient ${patient.name} (Plano):`);
            console.log('Plans raw:', patient.plans);
            const plan = Array.isArray(patient.plans) ? patient.plans[0] : patient.plans;
            console.log('Resolved Plan:', plan);
            if (plan) {
                console.log('Value:', Number(plan.value));
            } else {
                console.log('Plan is missing!');
            }
        }
    });
}

testFinancialQuery();
