-- Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql_string text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_string;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
