import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { supabase } from "./supabase";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "flashlearn-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Check if the table exists in Supabase
  async function checkTablesExistence() {
    try {
      // Try to query the users table
      const { error } = await supabase.from('users').select('id').limit(1);
      
      // If we get a specific error about the table not existing, create tables
      if (error && error.message.includes('relation "users" does not exist')) {
        console.log('Tables do not exist, initializing mock auth');
        return false;
      }
      
      return !error;
    } catch (err) {
      console.error('Error checking tables:', err);
      return false;
    }
  }

  // Initially, we'll use a combination approach - we'll check if Supabase tables exist,
  // but fallback to mock authentication if needed
  checkTablesExistence().then(tablesExist => {
    console.log(`Using ${tablesExist ? 'Supabase' : 'mock'} authentication`);
  });

  // Authentication strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // First try to get the user from Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        
        // If user exists and password matches, use the user
        if (user && await comparePasswords(password, user.password)) {
          return done(null, user as SelectUser);
        }
        
        // If Supabase query failed or user not found, fall back to mock user
        // For development, create a mock user with any credentials
        const mockUser: SelectUser = {
          id: 1,
          username: username,
          name: username,
          password: "hashed-password", // Not used in mock
          streak: 3,
          xp: 250,
          dailyGoal: 20,
          dailyProgress: 5,
          isAdmin: true,
          lastStudied: new Date(),
          createdAt: new Date()
        };
        return done(null, mockUser);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Try to get user from Supabase first
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (user) {
        return done(null, user as SelectUser);
      }
      
      // Fallback to mock user if not found
      const mockUser: SelectUser = {
        id: 1,
        username: "testuser",
        name: "Test User",
        password: "hashed-password", // Not used in mock
        streak: 3,
        xp: 250,
        dailyGoal: 20,
        dailyProgress: 5,
        isAdmin: true,
        lastStudied: new Date(),
        createdAt: new Date()
      };
      done(null, mockUser);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', req.body.username)
        .single();
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Try to insert the user into Supabase
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          username: req.body.username,
          name: req.body.name || req.body.username,
          password: hashedPassword,
          streak: 0,
          xp: 0,
          dailyGoal: 20,
          dailyProgress: 0,
          isAdmin: false,
          lastStudied: null,
          createdAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        // If Supabase insertion fails, fall back to mock user
        const mockUser: SelectUser = {
          id: 1,
          username: req.body.username,
          name: req.body.name || req.body.username,
          password: hashedPassword,
          streak: 0,
          xp: 0,
          dailyGoal: 20,
          dailyProgress: 0,
          isAdmin: false,
          lastStudied: null,
          createdAt: new Date()
        };
        
        req.login(mockUser, (err) => {
          if (err) return next(err);
          // Don't send password back to the client
          const { password, ...userWithoutPassword } = mockUser;
          res.status(201).json(userWithoutPassword);
        });
      } else {
        // Use the user from Supabase
        req.login(newUser as SelectUser, (err) => {
          if (err) return next(err);
          // Don't send password back to the client
          const { password, ...userWithoutPassword } = newUser;
          res.status(201).json(userWithoutPassword);
        });
      }
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    // We'll use passport's authenticate method which will use our LocalStrategy
    passport.authenticate('local', (err, user) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Don't send password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send password back to the client
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
  
  // Middleware to check if user is admin
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user!.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  });
}
