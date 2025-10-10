export interface ProfileMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
}

export interface ProfileSharedAccount {
  id: string;
  slug: string;
  name: string;
}

export interface MemberAccountOption {
  id: string;
  slug: string;
  name: string;
  role: string;
}
