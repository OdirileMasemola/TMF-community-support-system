"use client";
import React, { JSX, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GetInvolvedHero(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-transparent">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-bold">Foundation Logo</a>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href="/" className="text-sm text-muted-foreground">Home</a>
          <a href="/about" className="text-sm text-muted-foreground">About</a>
          <a href="/get-involved" className="text-sm font-semibold">Get Involved</a>
        </div>

        <div className="md:hidden">
          <button aria-label="Toggle menu" onClick={() => setOpen(!open)} className="p-2 rounded-md">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-white/60 backdrop-blur-sm border-t">
          <div className="px-4 py-3 flex flex-col gap-2">
            <a href="/" className="text-sm">Home</a>
            <a href="/about" className="text-sm">About</a>
            <a href="/get-involved" className="text-sm font-semibold">Get Involved</a>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto text-center py-16 px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">Get Involved with the Foundation</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Join us — volunteer, donate, or connect with our community to make a lasting impact.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button to="#volunteer" variant="primary">Volunteer</Button>
          <Button to="#donate" variant="outline">Donate</Button>
        </div>
      </div>
    </header>
  );
}

export default GetInvolvedHero;
