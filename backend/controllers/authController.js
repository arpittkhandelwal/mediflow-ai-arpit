/**
 * AUTH CONTROLLER
 * Handles signup, login, and session management via Supabase Auth
 */

const { supabase, supabaseAdmin } = require("../config/supabase");
const logger = require("../config/logger");

/**
 * POST /auth/signup
 * Register a new patient or doctor
 */
const signup = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // 1. Create Supabase Auth user via public sign-up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }, // Store in user metadata
      },
    });

    if (authError) {
      logger.warn(`Signup failed for ${email}: ${authError.message}`);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // 2. Create user profile in users table
    const { error: profileError } = await supabaseAdmin
      .from("users")
      .insert([{ id: userId, name, email, role }]);

    if (profileError) {
      logger.error(`Profile creation failed: ${profileError.message}`);
    }

    // 3. Create role-specific profile
    if (role === "patient") {
      await supabaseAdmin.from("patients").insert([{ user_id: userId }]);
    } else if (role === "doctor") {
      await supabaseAdmin.from("doctors").insert([{ user_id: userId }]);
    }

    logger.info(`✅ New ${role} registered: ${email}`);

    res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: userId,
        email: authData.user.email,
        name,
        role,
      },
      // Session is included if email verification is disabled
      session: authData.session,
      token: authData.session?.access_token,
    });
  } catch (err) {
    logger.error(`Signup error: ${err.message}`);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

/**
 * POST /auth/login
 * Authenticate user and return JWT tokens
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn(`Login failed for ${email}: ${error.message}`);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Fetch user profile from our users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      logger.warn(`Profile fetch failed: ${profileError.message}`);
    }

    logger.info(`✅ User logged in: ${email}`);

    res.json({
      message: "Login successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || data.user.user_metadata?.role,
        emailConfirmed: data.user.email_confirmed_at !== null,
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

/**
 * POST /auth/logout
 * Invalidate the user's session
 */
const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.warn(`Logout error: ${error.message}`);
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    });
  } catch (err) {
    logger.error(`Token refresh error: ${err.message}`);
    res.status(500).json({ error: "Token refresh failed" });
  }
};

/**
 * GET /auth/me
 * Get current user's profile
 */
const getMe = async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        ...profile,
      },
    });
  } catch (err) {
    logger.error(`Get me error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

module.exports = { signup, login, logout, refreshToken, getMe };
