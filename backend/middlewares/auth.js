/**
 * AUTH MIDDLEWARE
 * Verifies Supabase JWT tokens and attaches user to request
 */

const { supabase } = require("../config/supabase");
const logger = require("../config/logger");

/**
 * Verify JWT token from Supabase
 * Attaches req.user and req.token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "No token provided. Please log in." });
    }

    const token = authHeader.split(" ")[1];

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(`Auth failed: ${error?.message}`);
      return res
        .status(401)
        .json({ error: "Invalid or expired token. Please log in again." });
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Require Doctor role
 * Must be used after authenticate middleware
 */
const requireDoctor = async (req, res, next) => {
  try {
    const { supabaseAdmin } = require("../config/supabase");

    // Check user role in users table
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error || !data) {
      return res
        .status(403)
        .json({ error: "Access denied. User profile not found." });
    }

    if (data.role !== "doctor") {
      return res
        .status(403)
        .json({ error: "Access denied. Doctor role required." });
    }

    req.userRole = "doctor";
    next();
  } catch (err) {
    logger.error(`Doctor auth check error: ${err.message}`);
    res.status(500).json({ error: "Authorization error" });
  }
};

/**
 * Require Patient role
 * Must be used after authenticate middleware
 */
const requirePatient = async (req, res, next) => {
  try {
    const { supabaseAdmin } = require("../config/supabase");

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error || !data) {
      return res
        .status(403)
        .json({ error: "Access denied. User profile not found." });
    }

    if (data.role !== "patient") {
      return res
        .status(403)
        .json({ error: "Access denied. Patient role required." });
    }

    req.userRole = "patient";
    next();
  } catch (err) {
    logger.error(`Patient auth check error: ${err.message}`);
    res.status(500).json({ error: "Authorization error" });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Attaches user if token is present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (user) {
      req.user = user;
      req.token = token;
    }
    next();
  } catch (err) {
    next(); // Continue even if auth fails
  }
};

module.exports = { authenticate, requireDoctor, requirePatient, optionalAuth };
