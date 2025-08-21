import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  employee_id: string;
  date: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { employee_id, date }: RequestBody = await req.json();

    if (!employee_id || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing employee_id or date' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch the attendance record
    const { data: record, error: fetchError } = await supabaseClient
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('date', date)
      .single();

    if (fetchError) {
      console.error('Error fetching attendance record:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch attendance record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate work hours
    let totalHours = 0;

    // Calculate first session
    if (record.check_in_1 && record.check_out_1) {
      // Convert to Jakarta timezone for calculation
      const session1Start = new Date(new Date(record.check_in_1).toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      const session1End = new Date(new Date(record.check_out_1).toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      const session1Hours = (session1End.getTime() - session1Start.getTime()) / (1000 * 60 * 60);
      totalHours += session1Hours;
    }

    // Calculate second session (if exists)
    if (record.check_in_2 && record.check_out_2) {
      // Convert to Jakarta timezone for calculation
      const session2Start = new Date(new Date(record.check_in_2).toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      const session2End = new Date(new Date(record.check_out_2).toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      const session2Hours = (session2End.getTime() - session2Start.getTime()) / (1000 * 60 * 60);
      totalHours += session2Hours;
    }

    // Ensure non-negative hours
    totalHours = Math.max(0, totalHours);

    // Calculate salary
    const baseSalary = 80000; // Base salary for 6 hours
    const expectedHours = 6;
    let calculatedSalary = 0;

    if (totalHours >= expectedHours) {
      // Full salary for 6+ hours
      calculatedSalary = baseSalary;
    } else {
      // Proportional salary for less than 6 hours
      calculatedSalary = (baseSalary / expectedHours) * totalHours;
    }

    // Round values
    const roundedHours = Math.round(totalHours * 100) / 100;
    const roundedSalary = Math.round(calculatedSalary);

    // Update the attendance record
    const { error: updateError } = await supabaseClient
      .from('attendance_records')
      .update({
        calculated_work_hours: roundedHours,
        calculated_salary: roundedSalary,
        updated_at: new Date().toISOString(),
      })
      .eq('employee_id', employee_id)
      .eq('date', date);

    if (updateError) {
      console.error('Error updating attendance record:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update attendance record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        calculated_work_hours: roundedHours,
        calculated_salary: roundedSalary,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});