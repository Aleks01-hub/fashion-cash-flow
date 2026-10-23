package br.com.caixacentral.api;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppController {
    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody SendRequest request) {
        String token = System.getenv("WHATSAPP_TOKEN");
        String phoneNumberId = System.getenv("WHATSAPP_PHONE_NUMBER_ID");

        if (token == null || token.isBlank() || phoneNumberId == null || phoneNumberId.isBlank()) {
            return ResponseEntity.status(503).body(Map.of("error", "WhatsApp API não configurada no servidor."));
        }

        try {
            String body = mapper.writeValueAsString(Map.of(
                "messaging_product", "whatsapp",
                "to", request.to(),
                "type", "text",
                "text", Map.of("body", request.message())
            ));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://graph.facebook.com/v23.0/" + phoneNumberId + "/messages"))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            return ResponseEntity.status(response.statusCode()).body(response.body());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Falha ao enviar mensagem pelo WhatsApp."));
        }
    }

    public record SendRequest(String to, String message, String event) {}
}
