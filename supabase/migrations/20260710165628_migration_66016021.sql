-- Add documents column to incidents for PDF uploads
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS documents text[] DEFAULT '{}';

-- Create storage bucket for incident documents
INSERT INTO storage.buckets (id, name, public) VALUES ('incident_documents', 'incident_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for incident_documents
CREATE POLICY "incident_documents_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'incident_documents');

CREATE POLICY "incident_documents_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident_documents');