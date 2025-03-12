-- Migration to add organizations table for accountants
-- Organizations belong to accountants and clients belong to organizations

-- Create the organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    vat_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment explaining the table
COMMENT ON TABLE organizations IS 'Organizations table for accountants. Each accountant has one organization, and clients belong to an organization.';

-- Add RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy for organization owners
CREATE POLICY "Organization owners can manage their organization"
ON organizations
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Update users table to include organization id
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_accountant BOOLEAN DEFAULT FALSE;

-- Create trigger to automatically set the organization_id when an accountant registers
CREATE OR REPLACE FUNCTION public.handle_new_accountant()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Check if the user is an accountant (set in auth.users metadata)
    IF NEW.raw_user_meta_data->>'is_accountant' = 'true' THEN
        -- Create a new organization for the accountant
        INSERT INTO public.organizations (
            name,
            owner_id,
            email,
            created_at,
            updated_at
        ) VALUES (
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Organization'),
            NEW.id,
            NEW.email,
            NEW.created_at,
            NEW.updated_at
        ) RETURNING id INTO org_id;

        -- Update the user's organization_id and is_accountant flag
        UPDATE public.users
        SET
            organization_id = org_id,
            is_accountant = TRUE
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function after a new user is inserted
CREATE TRIGGER on_accountant_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_accountant();

-- Update the clients table to reference the organization rather than directly to the user
-- First create the organization_id column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create a function to migrate existing data
CREATE OR REPLACE FUNCTION public.migrate_client_organization_ids()
RETURNS void AS $$
BEGIN
    -- For each existing client, find the accountant's organization and update the client
    UPDATE public.clients c
    SET organization_id = (
        SELECT organization_id
        FROM public.users u
        WHERE u.id = c.user_id
    )
    WHERE c.organization_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an RPC function to create organizations
CREATE OR REPLACE FUNCTION public.create_organization(
    name TEXT,
    description TEXT DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    address TEXT DEFAULT NULL,
    website TEXT DEFAULT NULL,
    phone TEXT DEFAULT NULL,
    email TEXT DEFAULT NULL,
    vat_number TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Insert the new organization
    INSERT INTO public.organizations (
        name,
        owner_id,
        description,
        logo_url,
        address,
        website,
        phone,
        email,
        vat_number,
        created_at,
        updated_at
    ) VALUES (
        name,
        auth.uid(),
        description,
        logo_url,
        address,
        website,
        phone,
        email,
        vat_number,
        NOW(),
        NOW()
    ) RETURNING id INTO org_id;

    -- Update the user's organization_id
    UPDATE public.users
    SET
        organization_id = org_id,
        is_accountant = TRUE
    WHERE id = auth.uid();

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'organization_id', org_id,
        'message', 'Organization created successfully'
    );
END;
$$;