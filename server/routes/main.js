const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");

router.get("/", (req, res) => {
  res.json({ message: "API is working!" });
});

router.get("/debug-booking/:id", async (req, res) => {
  const bookingId = req.params.id;

  const { data, error } = await supabase
    .from("demo_bookings")
    .select("id, full_name, email, status")
    .eq("id", bookingId)
    .maybeSingle();

  res.json({
    bookingId,
    data,
    error,
    supabaseUrl: process.env.SUPABASE_URL
  });
});

module.exports = router;
