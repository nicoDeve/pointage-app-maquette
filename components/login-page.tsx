"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-semibold text-center text-foreground">
          Login to your account
        </h1>
        
        <Button
          onClick={login}
          className="w-full h-11 bg-[#18181b] hover:bg-[#18181b]/90 text-white rounded-lg font-medium"
        >
          Login OAuth
        </Button>
        
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button className="text-foreground underline hover:no-underline font-medium">
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
