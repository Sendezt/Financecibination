const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../middleware/supabaseClient");

const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("pengguna")
      .select("id, full_name, email, password")
      .eq("email", email)
      .single();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      status: true,
      message: "Login successful",
      token,
    });
    console.log("Login successful:", token);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = loginHandler;
