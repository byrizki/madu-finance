"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Phone,
  Settings,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Share2,
  Users,
  Copy,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useMember } from "@/components/context/member-context";
import { useState } from "react";

export default function ProfilePage() {
  const {
    currentMember,
    members,
    sharedAccount,
    addMember,
    removeMember,
    generateShareCode,
  } = useMember();
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [shareCode, setShareCode] = useState(sharedAccount.shareCode);

  const handleAddMember = () => {
    if (newMemberEmail && currentMember.role === "owner") {
      addMember(newMemberEmail);
      setNewMemberEmail("");
    }
  };

  const handleGenerateNewCode = () => {
    const newCode = generateShareCode();
    setShareCode(newCode);
  };

  const copyShareCode = () => {
    navigator.clipboard.writeText(shareCode);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Profil
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola informasi akun dan preferensi Anda
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pribadi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 bg-background">
                  <AvatarImage
                    src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${currentMember.name}`}
                  />
                  <AvatarFallback className="text-lg">
                    {currentMember.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {currentMember.name}
                  </h3>
                  <p className="text-muted-foreground">{currentMember.email}</p>
                  <Badge className="mt-2 capitalize">
                    {currentMember.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nama Depan</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nama Belakang</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john.doe@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input id="phone" defaultValue="+62 812-3456-7890" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input id="address" defaultValue="Jakarta, Indonesia" />
                </div>
              </div>

              <Button className="w-full sm:w-auto">Simpan Perubahan</Button>
            </CardContent>
          </Card>

          {/* Shared Account Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Akun Bersama
                </CardTitle>
                <Badge variant="outline">{sharedAccount.name}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Anggota ({members.length})
                  </span>
                  {currentMember.role === "owner" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Tambah
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tambah Anggota Baru</DialogTitle>
                          <DialogDescription>
                            Masukkan email untuk mengundang anggota baru ke akun
                            bersama
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="contoh@email.com"
                              value={newMemberEmail}
                              onChange={(e) =>
                                setNewMemberEmail(e.target.value)
                              }
                            />
                          </div>
                          <Button onClick={handleAddMember} className="w-full">
                            Kirim Undangan
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {member.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {member.role}
                        </Badge>
                        {currentMember.role === "owner" &&
                          member.id !== currentMember.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMember(member.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {currentMember.role === "owner" && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Kode Berbagi</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateNewCode}
                    >
                      Generate Baru
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input value={shareCode} readOnly className="font-mono" />
                    <Button size="sm" variant="outline" onClick={copyShareCode}>
                      <Copy className="h-4 w-4 mr-2" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Bagikan kode ini untuk mengundang anggota baru
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Keamanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Kata Sandi</div>
                    <div className="text-sm text-muted-foreground">
                      Terakhir diubah 3 bulan yang lalu
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Ubah
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Autentikasi Dua Faktor</div>
                    <div className="text-sm text-muted-foreground">
                      Tambahan keamanan untuk akun Anda
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Aktifkan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Share Account Action */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Bagikan Akun
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bagikan Akun Keuangan</DialogTitle>
                    <DialogDescription>
                      Bagikan akses ke akun keuangan Anda dengan keluarga atau
                      tim
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Kode Akun:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyShareCode}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Salin
                        </Button>
                      </div>
                      <div className="font-mono text-lg text-center p-2 bg-background rounded border">
                        {shareCode}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bagikan kode ini kepada orang yang ingin Anda berikan
                      akses ke akun keuangan bersama.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifikasi
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Metode Pembayaran
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik Akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Bergabung sejak
                </span>
                <span className="text-sm font-medium">Jan 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Transaksi
                </span>
                <span className="text-sm font-medium">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Anggaran Aktif
                </span>
                <span className="text-sm font-medium">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Dompet Terhubung
                </span>
                <span className="text-sm font-medium">4</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
