package br.com.caixacentral.customer;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue
    private UUID id;
    @Column(nullable=false) private String name;
    @Column(nullable=false) private String whatsapp;
    private String cpf;
    private String address;
    private String preferredSize;
    private LocalDate birthDate;
    private String notes;
    private double avTotal;
    private double avBalance;
    private LocalDate avDueDate;

    public UUID getId(){return id;}
    public String getName(){return name;}
    public void setName(String name){this.name=name;}
    public String getWhatsapp(){return whatsapp;}
    public void setWhatsapp(String whatsapp){this.whatsapp=whatsapp;}
    public String getCpf(){return cpf;}
    public void setCpf(String cpf){this.cpf=cpf;}
    public String getAddress(){return address;}
    public void setAddress(String address){this.address=address;}
    public String getPreferredSize(){return preferredSize;}
    public void setPreferredSize(String preferredSize){this.preferredSize=preferredSize;}
    public LocalDate getBirthDate(){return birthDate;}
    public void setBirthDate(LocalDate birthDate){this.birthDate=birthDate;}
    public String getNotes(){return notes;}
    public void setNotes(String notes){this.notes=notes;}
    public double getAvTotal(){return avTotal;}
    public void setAvTotal(double avTotal){this.avTotal=avTotal;}
    public double getAvBalance(){return avBalance;}
    public void setAvBalance(double avBalance){this.avBalance=avBalance;}
    public LocalDate getAvDueDate(){return avDueDate;}
    public void setAvDueDate(LocalDate avDueDate){this.avDueDate=avDueDate;}
}
