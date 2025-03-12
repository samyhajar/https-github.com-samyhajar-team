import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get request data
    const requestData = await request.json();
    const { client_user_id, accountant_id, name, email } = requestData;

    if (!client_user_id || !accountant_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a Supabase client with service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    // Verify that the user exists and is a client
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(client_user_id);

    if (userError || !userData.user) {
      console.error('Error verifying user:', userError);
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 400 }
      );
    }

    // Check if client is already registered
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .eq('user_id', accountant_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing client:', checkError);
      return NextResponse.json(
        { error: 'Error checking existing client' },
        { status: 500 }
      );
    }

    // If client already exists, update it
    if (existingClient) {
      const { data: updateData, error: updateError } = await supabase
        .from('clients')
        .update({
          client_user_id: client_user_id,
          status: 'active',
        })
        .eq('id', existingClient.id)
        .select();

      if (updateError) {
        console.error('Error updating client:', updateError);
        return NextResponse.json(
          { error: 'Error updating client' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Client updated successfully',
        client: updateData[0]
      });
    }

    // Otherwise create a new client
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        user_id: accountant_id,
        client_user_id: client_user_id,
        name: name,
        email: email,
        status: 'active',
        invoicing_frequency: 'monthly',
        created_at: new Date().toISOString()
      })
      .select();

    if (createError) {
      console.error('Error creating client:', createError);
      return NextResponse.json(
        { error: 'Error creating client record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      client: newClient[0]
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}