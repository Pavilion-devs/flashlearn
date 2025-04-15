import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { Logo } from "@/components/icons";
import { Redirect } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Extend the insertUserSchema with custom validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // If user is logged in, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };
  
  // Handle register form submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // Remove confirmPassword before submitting
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <Logo className="text-3xl" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Enter your credentials to login to your account"
                : "Create a FlashLearn account to start learning"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-neutral-500">
              {activeTab === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-medium text-primary" 
                    onClick={() => setActiveTab("register")}
                  >
                    Sign up
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-medium text-primary" 
                    onClick={() => setActiveTab("login")}
                  >
                    Login
                  </Button>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-primary-500 text-white flex-col items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-poppins font-bold mb-6">
            Learn Smarter with FlashLearn
          </h1>
          <p className="text-lg mb-8">
            The smart flashcard platform that helps you learn and retain vocabulary, 
            grammar, and more with powerful spaced repetition.
          </p>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <i className="ri-flashcard-line text-3xl"></i>
              </div>
              <p className="font-medium">Create Flashcards</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <i className="ri-brain-line text-3xl"></i>
              </div>
              <p className="font-medium">Smart Repetition</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <i className="ri-volume-up-line text-3xl"></i>
              </div>
              <p className="font-medium">Listening Practice</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <i className="ri-line-chart-line text-3xl"></i>
              </div>
              <p className="font-medium">Track Progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
