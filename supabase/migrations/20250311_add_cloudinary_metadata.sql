-- Add cloudinary_metadata column to cards table
CREATE OR REPLACE FUNCTION public.add_cloudinary_metadata_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'cards'
        AND column_name = 'cloudinary_metadata'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.cards
        ADD COLUMN cloudinary_metadata JSONB;
    END IF;
END;
$$;
