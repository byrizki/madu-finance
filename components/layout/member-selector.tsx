"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { useMember } from "@/components/context/member-context";

export function MemberSelector() {
  const { currentMember, members, switchMember } = useMember();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {currentMember.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentMember.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{currentMember.role}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {members.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => switchMember(member.id)}
            className="flex items-center space-x-2 p-3"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{member.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
            </div>
            {member.id === currentMember.id && <div className="ml-auto h-2 w-2 bg-primary rounded-full" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
