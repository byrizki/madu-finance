"use client"
import { Check, ChevronDown, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMember } from "@/components/context/member-context"

export function AccountSwitcher() {
  const { currentMember, members, switchMember } = useMember()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 h-auto">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Users className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Akun {currentMember.name.split(" ")[0]}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {members.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => switchMember(member.id)}
            className="flex items-center justify-between"
          >
            <span>Akun {member.name.split(" ")[0]}</span>
            {currentMember.id === member.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
