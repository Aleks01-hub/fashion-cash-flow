# Migração do localStorage para a API

## Ordem de migração

1. **Autenticação (iniciada)**: login, senha com BCrypt e validação de sessão são feitos pela API. O token fica no navegador apenas como credencial. O primeiro administrador é criado como `admin/admin` somente se a tabela de usuários estiver vazia; troque essa senha antes de usar em produção. A administração de usuários e a recuperação/troca de senha ainda precisam de endpoints próprios — não trate essas telas locais como segurança real.
2. **Produtos e clientes**: usar `src/lib/api.ts` para HTTP e `src/lib/api-mappers.ts` para converter os modelos da interface nos DTOs da API.
3. **Vendas e estoque (primeira parte implementada)**: criação de venda e baixa de estoque agora acontecem na mesma transação da API; entradas manuais também são persistidas como movimentos. Edição/cancelamento de venda, trocas/devoluções e atualizações do AV precisam de endpoints transacionais próprios antes de remover o restante do cache local.
4. **Dados existentes**: produtos/clientes podem ser importados do cache se a coleção do servidor estiver vazia. Vendas antigas não são importadas automaticamente porque a quantidade de estoque atual já pode refletir essas vendas; importar o histórico sem reconciliação poderia baixar o estoque duas vezes.

## Endpoints

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- As rotas `/api/**` exigem Bearer token, exceto login e health.
- `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`
- `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}`
- `GET/POST /api/sales` — a criação valida estoque, baixa as quantidades e registra movimentos atomicamente.
- `GET /api/stock/movements` — consulta os últimos 500 movimentos.
- `POST /api/stock/adjustments` — registra entrada/ajuste de estoque e atualiza a variação na mesma transação.

## Endpoints existentes

- `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`
- `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}`

## Contrato de dados

A interface mantém variações de tamanho/cor, tags, detalhes de produto, pagamentos e compras do cliente. Os campos JSON usados pelos mappers precisam existir na entidade JPA para esses dados não serem perdidos em um ciclo de gravação/leitura.

## Configuração local

Defina `VITE_API_URL=http://localhost:8080` no ambiente do frontend. O cliente usa esse valor e, se ausente, assume localhost:8080.

> A integração HTTP é uma base de migração; não remova as chaves antigas do localStorage até concluir a importação validada e a migração transacional de vendas/estoque.
