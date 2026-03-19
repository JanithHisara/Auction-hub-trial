-- Allow users to update their own bids (needed for bid editing in Sealed Bid auctions)
CREATE POLICY "Users can update own bids"
  ON public.bids FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
