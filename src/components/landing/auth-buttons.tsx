"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function NavAuthButtons() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Button asChild size="sm" className="bg-[#0C5E8A] text-white hover:bg-[#757D6A]">
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
      <Button asChild size="sm" className="bg-[#0C5E8A] text-white hover:bg-[#757D6A]">
        <Link href="/signup">Comenzar gratis</Link>
      </Button>
    </>
  );
}

export function HeroAuthButtons() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Button asChild size="lg" className="bg-[#0C5E8A] text-white hover:bg-[#757D6A] h-12 px-8 text-base">
        <Link href="/dashboard">
          Ir al dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg" className="bg-[#0C5E8A] text-white hover:bg-[#757D6A] h-12 px-8 text-base w-full sm:w-auto">
        <Link href="/signup">
          Comenzar gratis
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base bg-white text-[hsl(222,47%,11%)] border-[hsl(214,32%,85%)] hover:bg-[hsl(214,32%,97%)] w-full sm:w-auto">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    </>
  );
}
