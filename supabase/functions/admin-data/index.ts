import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RequestBody {
  action: 'fetchEmployees' | 'fetchAttendanceRecords' | 'createEmployee' | 'updateEmployee' | 'deleteEmployee' | 'updateAttendanceRecord' | 'deleteAttendanceRecord';
  data?: any;
  filters?: {
    startDate?: string;
    endDate?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin using the regular client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    if (user.email !== 'admin@admin.com') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin privileges required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data, filters }: RequestBody = await req.json();

    let result;

    switch (action) {
      case 'fetchEmployees':
        const { data: employees, error: employeesError } = await supabaseAdmin
          .from('employees')
          .select(`
            *,
            shift:shifts(*)
          `)
          .order('name');
        
        if (employeesError) throw employeesError;
        
        // Map the data to match frontend expectations
        result = employees?.map(employee => ({
          ...employee,
          shift: employee.shift
        })) || [];
        break;

      case 'fetchAttendanceRecords':
        let query = supabaseAdmin
          .from('attendance_records')
          .select(`
            *,
            employees(name, email),
            shifts(name)
          `)
          .order('date', { ascending: false });

        if (filters?.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('date', filters.endDate);
        }

        const { data: attendanceRecords, error: attendanceError } = await query;
        
        if (attendanceError) throw attendanceError;
        
        // Debug: Log the actual data structure
        console.log('Raw attendance records:', JSON.stringify(attendanceRecords?.slice(0, 1), null, 2));
        
        // Map the data to match frontend expectations
        result = attendanceRecords?.map(record => ({
          ...record,
          employee: record.employees,
          shift: record.shifts
        })) || [];
        
        // Debug: Log the mapped data structure
        console.log('Mapped attendance records:', JSON.stringify(result?.slice(0, 1), null, 2));
        break;

      case 'createEmployee':
        console.log('Creating employee with data:', data);
        
        // First create the auth user
        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password || 'password123',
          email_confirm: true
        });

        if (authUserError) {
          console.error('Auth user creation error:', authUserError);
          throw authUserError;
        }
        
        console.log('Auth user created:', authUser.user.id);

        // Then create the employee record
        const { data: employee, error: employeeError } = await supabaseAdmin
          .from('employees')
          .insert([{
            id: authUser.user.id,
            name: data.name,
            email: data.email,
            assigned_shift_id: data.assigned_shift_id || null
          }])
          .select()
          .single();
        
        if (employeeError) {
          console.error('Employee record creation error:', employeeError);
          // If employee creation fails, delete the auth user
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          throw employeeError;
        }
        
        console.log('Employee record created:', employee);
        result = employee;
        break;

      case 'updateEmployee':
        console.log('Updating employee:', data.id, 'with updates:', data.updates);
        
        const { data: updatedEmployee, error: updateError } = await supabaseAdmin
          .from('employees')
          .update(data.updates)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Employee update error:', updateError);
          throw updateError;
        }
        
        console.log('Employee updated successfully:', updatedEmployee);
        result = updatedEmployee;
        break;

      case 'deleteEmployee':
        // Delete from auth (this will cascade to employees table)
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(data.id);
        if (deleteAuthError) throw deleteAuthError;
        
        result = { success: true };
        break;

      case 'updateAttendanceRecord':
        const { data: updatedRecord, error: updateRecordError } = await supabaseAdmin
          .from('attendance_records')
          .update(data.updates)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateRecordError) throw updateRecordError;
        result = updatedRecord;
        break;

      case 'deleteAttendanceRecord':
        const { error: deleteRecordError } = await supabaseAdmin
          .from('attendance_records')
          .delete()
          .eq('id', data.id);
        
        if (deleteRecordError) throw deleteRecordError;
        result = { success: true };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ data: result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Admin data function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});