"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function NavAuthButtons() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Button asChild size="sm" className="bg-[hsl(81,10%,54%)] text-white hover:bg-[hsl(81,10%,44%)]">
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
      <Button asChild size="sm" className="bg-[hsl(81,10%,54%)] text-white hover:bg-[hsl(81,10%,44%)]">
        <Link href="/signup">Comenzar gratis</Link>
      </Button>
    </>
  );
}

export function HeroAuthButtons() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Button asChild size="lg" className="bg-[hsl(81,10%,54%)] text-white hover:bg-[hsl(81,10%,44%)] h-12 px-8 text-base">
        <Link href="/dashboard">
          Ir al dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg" className="bg-[hsl(81,10%,54%)] text-white hover:bg-[hsl(81,10%,44%)] h-12 px-8 text-base">
        <Link href="/signup">
          Comenzar gratis
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    </>
  );
}
