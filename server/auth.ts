import { Express } from "express";
import { supabase } from "./supabase";

export function setupAuth(app: Express) {
  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: "Username, email and password are required" 
        });
      }

      // Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          }
        }
      });

      if (error) {
        console.error("Supabase signup error:", error);
        return res.status(400).json({ message: error.message });
      }

      if (!data.user || !data.session) {
        return res.status(400).json({ message: "Registration failed" });
      }

      // Return user data with session token
      res.status(201).json({
        id: data.user.id,
        username,
        email: data.user.email,
        name: username,
        streak: 0,
        xp: 0,
        daily_goal: 20,
        daily_progress: 0,
        is_admin: false,
        last_studied: null,
        created_at: new Date(),
        updated_at: new Date(),
        session: data.session,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email and password are required" 
        });
      }

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!data.user || !data.session) {
        return res.status(401).json({ message: "Login failed" });
      }

      // Get user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error fetching user data:", userError);
      }

      // Return user data with session
      res.json({
        id: data.user.id,
        username: userData?.username || data.user.user_metadata?.username || data.user.email?.split('@')[0],
        email: data.user.email,
        name: userData?.name || data.user.user_metadata?.display_name || data.user.user_metadata?.username,
        streak: userData?.streak || 0,
        xp: userData?.xp || 0,
        daily_goal: userData?.daily_goal || 20,
        daily_progress: userData?.daily_progress || 0,
        is_admin: userData?.is_admin || false,
        last_studied: userData?.last_studied || null,
        created_at: userData?.created_at || data.user.created_at,
        updated_at: userData?.updated_at || data.user.created_at,
        session: data.session,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", async (req, res) => {
    try {
      // Get the Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Sign out from Supabase
        await supabase.auth.admin.signOut(token);
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user endpoint
  app.get("/api/user", async (req, res) => {
    try {
      // Get the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.substring(7);
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Get user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error fetching user data:", userError);
      }

      // Return user data
      res.json({
        id: user.id,
        username: userData?.username || user.user_metadata?.username || user.email?.split('@')[0],
        email: user.email,
        name: userData?.name || user.user_metadata?.display_name || user.user_metadata?.username,
        streak: userData?.streak || 0,
        xp: userData?.xp || 0,
        daily_goal: userData?.daily_goal || 20,
        daily_progress: userData?.daily_progress || 0,
        is_admin: userData?.is_admin || false,
        last_studied: userData?.last_studied || null,
        created_at: userData?.created_at || user.created_at,
        updated_at: userData?.updated_at || user.created_at,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
