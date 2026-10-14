# Integração frontend ↔ backend

## Estado desta etapa

O frontend existente continua preservando o modo local usado pelo MVP. Foi adicionado `src/lib/api-client.ts`, um cliente HTTP tipado para os endpoints atuais do backend:

- `GET /api/health`
- `GET/POST/PUT/DELETE /api/customers`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST /api/sales`

O cliente está disponível como `storeService`. Ele ainda não substitui automaticamente o `StoreProvider`: a migração deve ser feita módulo por módulo e validada com dados reais antes de desligar o armazenamento local.

## Executar localmente

1. Inicie o banco configurado pelo projeto com `docker compose up -d`.
2. Inicie a API a partir de `backend/` com `mvn spring-boot:run`.
3. Na raiz do frontend, copie `.env.example` para `.env.local` e confirme `VITE_API_BASE_URL=http://localhost:8080/api`.
4. Execute `npm install` e `npm run dev`.

## Limitações que precisam ser resolvidas antes de produção

- O backend existente usa PostgreSQL e IDs UUID. Esta integração mantém o banco atual para não quebrar o projeto; MySQL exigirá driver, configuração e validação próprios.
- Os endpoints atuais não implementam ainda isolamento por loja nem autenticação/autorização de servidor.
- A entidade de venda atual ainda não efetua baixa transacional de estoque por variação. Não use o endpoint de vendas para operação real até implementar essa regra e testes de concorrência.
- AV precisa de entidades próprias para contas e pagamentos, com transações e trilha de auditoria.
- CORS não deve usar origem curinga em produção.
- Não envie chaves de IA ou segredos do banco ao frontend.
- O cliente lança `ApiError` em respostas HTTP não bem-sucedidas; as telas devem tratar os erros e apresentar feedback ao operador.

## Próxima ordem de trabalho

1. Implementar estoque por variação e serviço de vendas transacional no backend.
2. Implementar contas AV e pagamentos com saldo calculado no servidor.
3. Adicionar autenticação e escopo por loja.
4. Migrar leitura de produtos/clientes para a API, mantendo fallback explícito durante a transição.
5. Migrar vendas e AV somente depois dos testes automatizados.
6. Adicionar WebSocket/STOMP e interface de reconexão.
7. Implementar PWA/offline com fila sincronizada e estratégia de conflitos.
