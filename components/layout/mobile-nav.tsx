"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center space-x-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                FS
              </div>
              <span className="font-bold">Football Squares</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-4">
          {session ? (
            <>
              <div className="flex flex-col gap-1 px-2">
                <p className="font-medium">{session.user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session.user?.email}
                </p>
              </div>
              <Separator />
              <nav className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                >
                  Dashboard
                </Link>
                <Link
                  href="/games/create"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                >
                  Create Game
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                >
                  Settings
                </Link>
              </nav>
              <Separator />
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                >
                  Home
                </Link>
              </nav>
              <Separator />
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
