# Caixa Central API

Backend inicial do Caixa Central usando Java 17, Spring Boot 4.1.1 e PostgreSQL 18.6.

## Estrutura

- REST API
- Spring Data JPA
- PostgreSQL
- Endpoint de saúde em `GET /api/health`

## Executar

Na raiz:

```bash
docker compose up -d
cd backend
mvn spring-boot:run
```

O frontend atual continua funcionando localmente; esta API é a base para migrar os dados do localStorage para persistência centralizada.

## Próxima integração

Migrar produtos, clientes, vendas, fichas, pagamentos, estoque, trocas, agenda e usuários para entidades JPA e proteger endpoints com autenticação e autorização por perfil.

## WhatsApp Cloud API

O endpoint `POST /api/whatsapp/send` funciona como gateway para não expor o segredo no navegador. Configure no ambiente do backend:

- `WHATSAPP_TOKEN`: token da API
- `WHATSAPP_PHONE_NUMBER_ID`: ID do número do WhatsApp Business

O corpo esperado é `{ "to": "...", "message": "...", "event": "pagamento" }`.
