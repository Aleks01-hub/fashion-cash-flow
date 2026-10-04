import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import type { Size } from "@/lib/mock-data";

export function NewCustomerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addCustomer } = useStore();
  const [name,setName]=useState(""); const [whatsapp,setWhatsapp]=useState(""); const [cpf,setCpf]=useState(""); const [address,setAddress]=useState(""); const [size,setSize]=useState<Size>("M"); const [birthDate,setBirthDate]=useState(""); const [notes,setNotes]=useState("");
  const save=()=>{ if(!name.trim() || !whatsapp.trim()) return; addCustomer({name,whatsapp,cpf,address,preferredSize:size,birthDate,av:null,notes}); setName("");setWhatsapp("");setCpf("");setAddress("");setSize("M");setBirthDate("");setNotes("");onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><div><Label>Nome *</Label><Input value={name} onChange={e=>setName(e.target.value)} /></div><div><Label>WhatsApp *</Label><Input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} /></div><div><Label>CPF</Label><Input value={cpf} onChange={e=>setCpf(e.target.value)} /></div><div><Label>Tamanho</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={size} onChange={e=>setSize(e.target.value as Size)}>{["PP","P","M","G","GG","36","38","40","42","44","46","48"].map(x=><option key={x}>{x}</option>)}</select></div><div className="sm:col-span-2"><Label>Endereço</Label><Input value={address} onChange={e=>setAddress(e.target.value)} /></div><div><Label>Data de nascimento *</Label><Input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} /></div><div><Label>Observações</Label><Input value={notes} onChange={e=>setNotes(e.target.value)} /></div></div><Button onClick={save} disabled={!name.trim()||!whatsapp.trim()||!birthDate}><Plus className="mr-2 h-4 w-4"/>Cadastrar cliente</Button></DialogContent></Dialog>;
}
