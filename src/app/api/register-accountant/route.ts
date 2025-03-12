import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

// Endpoint to register an accountant directly
// This is useful during development or when Supabase email validation is too strict
export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        {
          success: false,
          error: "Email, password, and fullName are required"
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format"
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Create user with Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          email: email,
          is_accountant: true,
        },
      },
    });

    if (authError) {
      console.error("Auth error:", authError);

      return NextResponse.json(
        {
          success: false,
          error: authError.message,
          code: authError.code
        },
        { status: 400 }
      );
    }

    // If user creation succeeded, create or update user profile
    if (userData.user) {
      try {
        // Insert into users table
        const { error: profileError } = await supabase.from("users").insert({
          id: userData.user.id,
          name: fullName,
          full_name: fullName,
          email: email,
          user_id: userData.user.id,
          token_identifier: userData.user.id,
          is_accountant: true,
          created_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Profile error:", profileError);
          // Continue anyway as the trigger will handle the organization creation
        }

        // Call the create_organization RPC function to ensure organization is created
        const { data: orgData, error: orgError } = await supabase.rpc('create_organization', {
          name: `${fullName}'s Organization`,
          email: email
        });

        if (orgError) {
          console.error("Error creating organization:", orgError);
          // Continue anyway as we've already created the user account
        } else {
          console.log("Organization created successfully:", orgData);
        }

      } catch (err) {
        console.error("Error in user profile or organization creation:", err);
      }

      return NextResponse.json({
        success: true,
        userId: userData.user.id,
        message: "Accountant registered successfully",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Unknown error occurred during registration",
    }, { status: 500 });

  } catch (error) {
    console.error('Error in accountant registration:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error)
      },
      { status: 500 }
    );
  }
}