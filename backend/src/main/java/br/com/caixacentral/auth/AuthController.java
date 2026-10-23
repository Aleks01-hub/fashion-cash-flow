package br.com.caixacentral.auth;

import java.security.SecureRandom;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final AppUserRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(AppUserRepository users) { this.users = users; }

    // Matches the first-access credentials shown by the current login screen.
    // This seed runs only on an empty user table; change the password immediately.
    @Bean
    ApplicationRunner seedInitialAdministrator() {
        return args -> {
            if (users.count() != 0) return;
            AppUser admin = new AppUser();
            admin.setLogin("admin");
            admin.setPasswordHash(encoder.encode("admin"));
            admin.setName("Administrador");
            admin.setRole("Administrador");
            admin.setAccessMode("gestao");
            admin.setPermissionsJson("[\"dashboard\",\"clientes\",\"vendas\",\"produtos\",\"gestao\",\"configuracoes\",\"estoque\",\"reservas\"]");
            admin.setActive(true);
            users.save(admin);
        };
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        AppUser user = users.findByLoginIgnoreCase(request.login().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login ou senha inválidos."));
        if (!user.isActive() || !encoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login ou senha inválidos.");
        }
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);
        user.setSessionToken(token);
        users.save(user);
        return Map.of("token", token, "user", Map.of(
            "id", user.getId().toString(), "login", user.getLogin(), "name", user.getName(),
            "role", user.getRole(), "accessMode", user.getAccessMode(),
            "permissions", user.getPermissionsJson(), "active", user.isActive()
        ));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value="Authorization", required=false) String authorization) {
        AppUser user = userFromHeader(authorization);
        if (user != null) { user.setSessionToken(null); users.save(user); }
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader(value="Authorization", required=false) String authorization) {
        AppUser user = userFromHeader(authorization);
        if (user == null || !user.isActive()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        return Map.of("id", user.getId().toString(), "login", user.getLogin(), "name", user.getName(),
            "role", user.getRole(), "accessMode", user.getAccessMode(),
            "permissions", user.getPermissionsJson(), "active", user.isActive());
    }

    private AppUser userFromHeader(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        return users.findBySessionToken(authorization.substring(7)).orElse(null);
    }

    public record LoginRequest(String login, String password) {}
}
