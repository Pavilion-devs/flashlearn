import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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

  // Mock authentication strategy - accepts any credentials
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
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
      // For mock development - return a fixed user
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
      // For development, just create a mock user response with the submitted username
      const mockUser: SelectUser = {
        id: 1,
        username: req.body.username,
        name: req.body.name || req.body.username,
        password: "hashed-password", // Not sent to client
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
    } catch (err) {
      next(err);
    }
  });

  // Accept any login credentials in development mode
  app.post("/api/login", (req, res, next) => {
    const mockUser: SelectUser = {
      id: 1,
      username: req.body.username,
      name: req.body.username,
      password: "hashed-password", // Not sent to client
      streak: 3,
      xp: 250,
      dailyGoal: 20,
      dailyProgress: 5,
      isAdmin: true,
      lastStudied: new Date(),
      createdAt: new Date()
    };
    
    req.login(mockUser, (err) => {
      if (err) return next(err);
      // Don't send password back to the client
      const { password, ...userWithoutPassword } = mockUser;
      res.status(200).json(userWithoutPassword);
    });
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
