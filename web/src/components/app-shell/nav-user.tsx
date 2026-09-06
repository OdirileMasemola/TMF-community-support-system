"use client";

import { LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { UserRole } from "@/types/app.types";

function roleProfilePath(role: UserRole | undefined): string | null {
  switch (role) {
    case "donor":
      return "/donor/dashboard/profile";
    case "volunteer":
      return "/volunteer/profile";
    case "beneficiary":
      return "/beneficiary/profile";
    case "sponsor":
      return "/sponsor/profile";
    default:
      return null;
  }
}

function roleSettingsPath(role: UserRole | undefined): string {
  switch (role) {
    case "donor":
      return "/donor/dashboard/settings";
    case "volunteer":
      return "/volunteer/settings";
    case "beneficiary":
      return "/beneficiary/settings";
    case "sponsor":
      return "/sponsor/settings";
    default:
      return "/admin/settings";
  }
}

export function NavUser() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const name = profile?.full_name ?? "Member";
  const email = profile?.email ?? "";
  const profilePath = roleProfilePath(profile?.role);
  const settingsPath = roleSettingsPath(profile?.role);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="size-7">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate text-sm font-medium md:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{name}</span>
            {email ? <span className="text-xs text-muted-foreground">{email}</span> : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {profilePath ? (
            <DropdownMenuItem onSelect={() => navigate(profilePath)}>
              <User aria-hidden="true" />
              Profile
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => navigate(settingsPath)}>
            <Settings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
