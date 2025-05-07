const bcrypt = require("bcryptjs");
const supabase = require("../middleware/supabaseClient");

const registerHandler = async (req, res) => {
  const { full_name, email, password, wa_number } = req.body;

  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const { data, error } = await supabase
      .from("pengguna")
      .insert([{ full_name, email, password: hashedPassword, wa_number }])
      .select("id, full_name, email, wa_number")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }
      console.error("Error creating user:", error);
      return res
        .status(500)
        .json({ message: "Gagal mendaftarkan user", error });
    }

    res.status(201).json({
      status: true,
      message: "User registered successfully",
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = registerHandler;
