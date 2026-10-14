# Integração frontend ↔ backend

## Estado desta etapa

O frontend existente continua preservando o modo local usado pelo MVP. Foi adicionado `src/lib/api-client.ts`, um cliente HTTP tipado para os endpoints atuais do backend:

- `GET /api/health`
- `GET/POST/PUT/DELETE /api/customers`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST /api/sales`
- `GET/POST /api/products/{productId}/variations`
- `PATCH /api/products/{productId}/variations/{variationId}/stock`

O cliente está disponível como `storeService`. Ele ainda não substitui automaticamente o `StoreProvider`: a migração deve ser feita módulo por módulo e validada com dados reais antes de desligar o armazenamento local.

## Estoque por variação e vendas

O backend agora possui uma entidade de variação por produto/cor/tamanho. A criação de venda usa uma transação, bloqueia as variações afetadas para atualização, valida o estoque e só então grava a venda e baixa as quantidades. Se qualquer item falhar, a transação deve ser revertida. Para criar uma venda, cada item precisa informar `variationId` ou a combinação `productId`, `color` e `size`, além de `quantity` e `unitPrice`.

As notificações STOMP são publicadas em `/topic/vendas` após o commit da transação. O endpoint WebSocket é `/ws`. O frontend ainda precisa instalar/configurar um cliente STOMP e assinar o tópico para atualizar a interface em tempo real.

## Executar localmente

1. Inicie o banco configurado pelo projeto com `docker compose up -d`.
2. Inicie a API a partir de `backend/` com `mvn spring-boot:run`.
3. Na raiz do frontend, copie `.env.example` para `.env.local` e confirme `VITE_API_BASE_URL=http://localhost:8080/api`.
4. Execute `npm install` e `npm run dev`.

## Limitações que precisam ser resolvidas antes de produção

- O backend existente usa PostgreSQL e IDs UUID. Esta integração mantém o banco atual para não quebrar o projeto; MySQL exigirá driver, configuração e validação próprios.
- O frontend ainda não foi migrado do `localStorage` para a API e não está sincronizando automaticamente os dados de telas existentes.
- O backend ainda não implementa isolamento por loja nem autenticação/autorização de servidor.
- Contas AV e pagamentos ainda precisam de entidades próprias e trilha de auditoria transacional.
- O número de venda é provisório; deve ser substituído por sequência atômica antes de vendas concorrentes.
- CORS deve ser configurado para os domínios exatos da implantação.
- Não envie chaves de IA ou segredos do banco ao frontend.

## Próxima ordem de trabalho

1. Implementar contas AV e pagamentos com saldo calculado no servidor.
2. Adicionar autenticação e escopo por loja.
3. Migrar leitura de produtos/clientes para a API, mantendo fallback explícito durante a transição.
4. Migrar vendas e AV somente depois dos testes automatizados.
5. Integrar o cliente STOMP na interface.
6. Implementar PWA/offline com fila sincronizada e estratégia de conflitos.
