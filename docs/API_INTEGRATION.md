# Integração frontend ↔ backend

## Banco de dados: MySQL 8.4

O backend está configurado para MySQL 8.4 com Connector/J. O docker-compose.yml sobe o serviço mysql e mantém os dados no volume caixa-central-mysql. Para iniciar um ambiente local novo:

1. Copie .env.docker.example para .env e altere as senhas de desenvolvimento.
2. Execute `docker compose up -d` e aguarde o healthcheck do MySQL.
3. Na pasta backend/, execute `mvn spring-boot:run`.
4. No frontend, configure `VITE_API_BASE_URL=http://localhost:8080/api` em .env.local, depois execute `npm install && npm run dev`.

**Atenção:** trocar o Compose para MySQL não converte nem copia dados de um volume PostgreSQL existente. Faça backup e migração explícita antes de reaproveitar dados antigos. O ddl-auto: update é conveniente no desenvolvimento; em produção, use migrações versionadas (Flyway/Liquibase), backups e credenciais fortes.

## Endpoints disponíveis

- `GET /api/health`
- `GET/POST/PUT/DELETE /api/customers`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST /api/sales`
- `GET/POST /api/products/{productId}/variations`
- `PATCH /api/products/{productId}/variations/{variationId}/stock`
- `GET /api/contas-av` para listar todas as contas; `GET /api/contas-av/cliente/{customerId}` e `GET /api/contas-av/{accountId}`
- `POST /api/contas-av` para criar uma conta a receber
- `POST /api/contas-av/{accountId}/abatimento` para registrar pagamento/abatimento

O cliente HTTP tipado está em src/lib/api-client.ts, exportado como storeService. Os métodos storeService.av já apontam para os endpoints de AV. A interface existente ainda usa localStorage em seus fluxos atuais; adicionar o serviço não migra automaticamente os dados/telas para o backend.

## Estoque, vendas e AV

O backend tem variações por produto/cor/tamanho. A criação de venda usa transação, bloqueia variações para atualização e baixa estoque dentro da mesma transação. Notificações STOMP são publicadas em /topic/vendas após o commit, no endpoint /ws. O frontend ainda precisa de um cliente STOMP para assinar o tópico.

O módulo AV usa tabelas próprias av_accounts e av_payments. Os valores financeiros desse módulo usam BigDecimal, cada pagamento registra saldo anterior e posterior, e o saldo é atualizado sob bloqueio pessimista para impedir abatimentos concorrentes que ultrapassem o saldo. A API retorna DTOs para não expor entidades JPA diretamente.

## Limitações antes de produção

- O backend usa IDs UUID; o Hibernate mapeia esses IDs no MySQL. Isso difere de um modelo com IDs BIGINT e requer que o frontend envie IDs retornados pela API.
- O frontend ainda não foi migrado do localStorage para a API e não sincroniza automaticamente as telas existentes.
- Ainda falta autenticação/autorização de servidor e isolamento de dados por loja/tenant.
- Valores monetários em partes antigas do modelo de produtos/vendas ainda usam double; migrar para BigDecimal requer atualização coordenada de DTOs, cálculos, testes e frontend.
- O número de venda continua provisório e precisa de sequência atômica para uso concorrente.
- Configure CORS para os domínios exatos de implantação; nunca exponha credenciais do banco ou chaves de IA no frontend.
- O backend e o fluxo completo precisam de testes automatizados e validação ponta a ponta antes de uso com vendas reais.

## Próximas etapas

1. Adicionar testes de integração com MySQL para venda, estoque e AV.
2. Migrar as telas de clientes e AV para storeService, com plano de importação dos dados locais.
3. Implementar autenticação e isolamento por loja.
4. Migrar os valores monetários antigos para BigDecimal e substituir o contador provisório de vendas.
5. Integrar WebSocket, PWA/offline e fila de sincronização com resolução de conflitos.
