package br.com.caixacentral.auth;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "app_users", uniqueConstraints = @UniqueConstraint(columnNames = "login"))
public class AppUser {
    @Id @GeneratedValue private UUID id;
    @Column(nullable=false, unique=true) private String login;
    @Column(nullable=false) private String passwordHash;
    @Column(nullable=false) private String name;
    @Column(nullable=false) private String role = "Administrador";
    @Column(nullable=false) private String accessMode = "gestao";
    @Column(columnDefinition="text", nullable=false) private String permissionsJson = "[]";
    @Column(nullable=false) private boolean active = true;
    @Column(columnDefinition="text") private String sessionToken;

    public UUID getId(){return id;}
    public String getLogin(){return login;} public void setLogin(String login){this.login=login;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String passwordHash){this.passwordHash=passwordHash;}
    public String getName(){return name;} public void setName(String name){this.name=name;}
    public String getRole(){return role;} public void setRole(String role){this.role=role;}
    public String getAccessMode(){return accessMode;} public void setAccessMode(String accessMode){this.accessMode=accessMode;}
    public String getPermissionsJson(){return permissionsJson;} public void setPermissionsJson(String permissionsJson){this.permissionsJson=permissionsJson;}
    public boolean isActive(){return active;} public void setActive(boolean active){this.active=active;}
    public String getSessionToken(){return sessionToken;} public void setSessionToken(String sessionToken){this.sessionToken=sessionToken;}
}
