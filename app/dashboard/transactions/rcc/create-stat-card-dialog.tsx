"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

import type { CustomStatCard, CreateCustomStatCard } from "./custom-stat-types";

interface CreateStatCardDialogProps {
  availableCategories: string[];
  onCreateCard: (card: CreateCustomStatCard) => void;
  onUpdateCard?: (card: CustomStatCard) => void;
  editingCard?: CustomStatCard;
  trigger?: React.ReactNode;
  isLoading?: boolean;
}

export function CreateStatCardDialog({
  availableCategories,
  onCreateCard,
  onUpdateCard,
  editingCard,
  trigger,
  isLoading = false,
}: CreateStatCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<{name?: string; categories?: string}>({});
  
  const isEditing = Boolean(editingCard);

  // Initialize form with editing data
  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setType(editingCard.type);
      setSelectedCategories(editingCard.categories);
      setOpen(true);
    }
  }, [editingCard]);

  const validateForm = () => {
    const newErrors: {name?: string; categories?: string} = {};
    
    if (!name.trim()) {
      newErrors.name = "Nama card tidak boleh kosong";
    }
    
    if (selectedCategories.length === 0) {
      newErrors.categories = "Pilih minimal satu kategori";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isLoading) return;

    if (isEditing && editingCard && onUpdateCard) {
      const updatedCard: CustomStatCard = {
        ...editingCard,
        name: name.trim(),
        type,
        categories: selectedCategories,
        color: type === "income" ? "emerald" : "rose",
      };
      onUpdateCard(updatedCard);
    } else {
      const newCard: CreateCustomStatCard = {
        name: name.trim(),
        type,
        categories: selectedCategories,
        color: type === "income" ? "emerald" : "rose",
      };
      onCreateCard(newCard);
    }
    
    // Reset form
    setName("");
    setType("expense");
    setSelectedCategories([]);
    setErrors({});
    setOpen(false);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-8 gap-2 border-dashed"
    >
      <Plus className="h-3.5 w-3.5" />
      <span>Card Baru</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Card" : "Buat Card Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Card</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="Contoh: Pemasukan Bisnis"
              className={errors.name ? "border-destructive" : ""}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Tipe Transaksi</Label>
            <RadioGroup value={type} onValueChange={setType as (value: string) => void}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="flex items-center gap-2 font-normal cursor-pointer">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  Pemasukan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="flex items-center gap-2 font-normal cursor-pointer">
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                  Pengeluaran
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="space-y-3">
              <Label>Kategori</Label>
              <div className={`max-h-32 overflow-y-auto border rounded-lg p-2 space-y-2 ${
                errors.categories ? "border-destructive" : ""
              }`}>
                {availableCategories.length > 0 ? (
                  availableCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, category]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== category));
                          }
                          if (errors.categories) {
                            setErrors(prev => ({ ...prev, categories: undefined }));
                          }
                        }}
                      />
                      <Label htmlFor={category} className="text-sm font-normal">
                        {category}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tidak ada kategori tersedia
                  </p>
                )}
              </div>
              {errors.categories && (
                <p className="text-sm text-destructive">{errors.categories}</p>
              )}
              {selectedCategories.length === 0 && !errors.categories && (
                <p className="text-xs text-muted-foreground">
                  Pilih kategori untuk menghitung total
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOpen(false);
                  setErrors({});
                }}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || availableCategories.length === 0}
                className="min-w-[80px]"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </span>
                ) : (
                  isEditing ? "Update" : "Buat"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
