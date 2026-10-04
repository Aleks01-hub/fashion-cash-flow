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
