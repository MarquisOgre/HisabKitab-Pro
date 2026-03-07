import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

export interface Party {
  id: string;
  name: string;
  gstin?: string;
  phone?: string;
  billing_address?: string;
  party_type: "customer" | "supplier";
  opening_balance: string | number;
}

interface PartySelectorProps {
  value: string;
  onChange: (value: string) => void;
  partyType?: "customer" | "supplier" | "all";
  label?: string;
  disabled?: boolean;
}

export function PartySelector({ value, onChange, partyType = "all", label = "Select Party", disabled = false }: PartySelectorProps) {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchParties();
    }
  }, [user, partyType, selectedBusiness]);

  const fetchParties = async () => {
    if (!selectedBusiness) return;
    
    setLoading(true);
    let query = supabase
      .from("parties")
      .select("id, name, gstin, phone, billing_address, party_type, opening_balance")
      .eq("business_id", selectedBusiness.id)
      .order("name");

    if (partyType !== "all") {
      query = query.eq("party_type", partyType);
    }

    const { data } = await query;
    if (data) {
      setParties(data as Party[]);
    }
    setLoading(false);
  };

  const selectedParty = parties.find(p => p.id === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : disabled ? "Party selected" : "Search or select party..."} />
        </SelectTrigger>
        <SelectContent>
          {parties.map((party) => (
            <SelectItem key={party.id} value={party.id}>
              <div className="flex flex-col">
                <span className="font-medium">{party.name}</span>
                <span className="text-xs text-muted-foreground">{party.phone}</span>
              </div>
            </SelectItem>
          ))}
          {parties.length === 0 && !loading && (
            <div className="py-2 px-3 text-sm text-muted-foreground">
              No parties found. Add a party first.
            </div>
          )}
        </SelectContent>
      </Select>
      
      {selectedParty && (
        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-1">
          <p><span className="font-medium">GSTIN:</span> {selectedParty.gstin || "N/A"}</p>
          <p><span className="font-medium">Phone:</span> {selectedParty.phone || "N/A"}</p>
          <p><span className="font-medium">Address:</span> {selectedParty.billing_address || "N/A"}</p>
          <p>
            <span className="font-medium">Opening Balance:</span>{" "}
            <span className={Number(selectedParty.opening_balance) >= 0 ? "text-success" : "text-destructive"}>
              ₹{Math.abs(Number(selectedParty.opening_balance) || 0).toLocaleString("en-IN")}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
