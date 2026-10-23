# Migração do localStorage para a API

## Ordem de migração

1. **Autenticação**: login, sessão, usuários e permissões devem ser validados pelo backend. O token fica no navegador apenas como credencial; senha e regras de acesso nunca devem depender de dados editáveis no cliente.
2. **Produtos e clientes**: usar `src/lib/api.ts` para HTTP e `src/lib/api-mappers.ts` para converter os modelos da interface nos DTOs da API.
3. **Vendas e estoque**: migrar apenas depois que os endpoints transacionais garantirem baixa/devolução de estoque e atualização do AV dentro da mesma transação.
4. **Dados existentes**: importar o cache local com uma ação explícita de migração, mostrar a quantidade a importar e só limpar o cache após confirmação de sucesso. Não sobrescrever automaticamente dados do servidor.

## Endpoints existentes

- `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`
- `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}`

## Contrato de dados

A interface mantém variações de tamanho/cor, tags, detalhes de produto, pagamentos e compras do cliente. Os campos JSON usados pelos mappers precisam existir na entidade JPA para esses dados não serem perdidos em um ciclo de gravação/leitura.

## Configuração local

Defina `VITE_API_URL=http://localhost:8080` no ambiente do frontend. O cliente usa esse valor e, se ausente, assume localhost:8080.

> A integração HTTP é uma base de migração; não remova as chaves antigas do localStorage até concluir a importação validada e a migração transacional de vendas/estoque.
