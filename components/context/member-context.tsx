"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Member {
  id: string
  name: string
  avatar?: string
  role: "owner" | "member"
  email: string
}

interface SharedAccount {
  id: string
  name: string
  members: Member[]
  createdBy: string
  shareCode: string
}

interface MemberContextType {
  currentMember: Member
  members: Member[]
  sharedAccount: SharedAccount
  switchMember: (memberId: string) => void
  addMember: (email: string) => void
  removeMember: (memberId: string) => void
  generateShareCode: () => string
}

const MemberContext = createContext<MemberContextType | undefined>(undefined)

const defaultMembers: Member[] = [
  { id: "1", name: "Andi Pratama", role: "owner", email: "andi@email.com" },
  { id: "2", name: "Sari Dewi", role: "member", email: "sari@email.com" },
  { id: "3", name: "Budi Santoso", role: "member", email: "budi@email.com" },
]

const defaultSharedAccount: SharedAccount = {
  id: "acc_1",
  name: "Keluarga Pratama",
  members: defaultMembers,
  createdBy: "1",
  shareCode: "FAM2024",
}

export function MemberProvider({ children }: { children: ReactNode }) {
  const [currentMember, setCurrentMember] = useState<Member>(defaultMembers[0])
  const [members, setMembers] = useState<Member[]>(defaultMembers)
  const [sharedAccount, setSharedAccount] = useState<SharedAccount>(defaultSharedAccount)

  const switchMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (member) {
      setCurrentMember(member)
    }
  }

  const addMember = (email: string) => {
    // Simulate adding member by email
    const newMember: Member = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
      role: "member",
    }
    setMembers((prev) => [...prev, newMember])
  }

  const removeMember = (memberId: string) => {
    if (currentMember.role === "owner") {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    }
  }

  const generateShareCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setSharedAccount((prev) => ({ ...prev, shareCode: newCode }))
    return newCode
  }

  return (
    <MemberContext.Provider
      value={{
        currentMember,
        members,
        sharedAccount,
        switchMember,
        addMember,
        removeMember,
        generateShareCode,
      }}
    >
      {children}
    </MemberContext.Provider>
  )
}

export function useMember() {
  const context = useContext(MemberContext)
  if (context === undefined) {
    throw new Error("useMember must be used within a MemberProvider")
  }
  return context
}
