import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, ArrowRight, Zap } from "lucide-react";
import heroImage from "@assets/generated_images/minimalist_dark_green_and_neon_abstract_topography.png";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, signup } = useStore();
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email);
      // Determine if onboarding is needed in real app, but here we just go to dashboard or onboarding
      // Simulating simple logic:
      setLocation("/onboarding");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      signup(email);
      setLocation("/onboarding");
    }
  };

  const demoLogin = () => {
    login("demo@example.com");
    setLocation("/");
  };

  const demoAdminLogin = () => {
    login("admin@example.com");
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden">
      {/* Left Side - Hero */}
      <div className="relative hidden lg:flex flex-col items-center justify-center p-12 bg-sidebar text-foreground overflow-hidden">
        <div 
          className="absolute inset-0 opacity-40 z-0"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(0.5)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar to-transparent z-10" />
        
        <div className="relative z-20 max-w-md text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold font-display mb-4 tracking-tight">Play for Planet Earth</h1>
          <p className="text-xl text-muted-foreground">
            Log eco-actions, earn rewards, and join a global community making a real impact.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background relative z-30">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-display">Play for Planet Earth</h1>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Enter your email to access your account</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="bg-background/50"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button type="submit" className="w-full">
                      Login <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Start your journey to sustainability today</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="you@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input 
                        id="signup-password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="bg-background/50"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      Get Started <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

           <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={demoLogin} className="w-full text-xs">
                <Zap className="mr-2 h-3 w-3" /> Demo User
              </Button>
               <Button variant="outline" onClick={demoAdminLogin} className="w-full text-xs">
                <Zap className="mr-2 h-3 w-3" /> Demo Admin
              </Button>
            </div>

          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
