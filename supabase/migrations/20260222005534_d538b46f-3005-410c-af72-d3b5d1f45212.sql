-- Allow admins to delete any photo (for photographer cleanup)
CREATE POLICY "Admins can delete all photos"
ON public.photos FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any photo
CREATE POLICY "Admins can update all photos"
ON public.photos FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));