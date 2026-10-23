# Fashion Cash Flow — Caixa Central

Sistema de gestão e PDV para lojas de moda, com foco em vendas, fichas/contas a receber, estoque por variação, clientes, agenda comercial, compras e relatórios.

## Módulos

- **Dashboard:** indicadores, rankings, formas de pagamento, evolução das vendas, vencimentos clicáveis e alertas.
- **Clientes:** ficha completa, histórico financeiro, data de nascimento, tamanho, endereço, total comprado e última compra.
- **Vendas:** nova venda, edição completa de itens, desconto, pagamento, ficha (AV), cancelamento e trocas/devoluções vinculadas à venda.
- **Produtos:** cadastro, foto, código de barras, custo, margem, preço, atacado, fornecedor, grade por cor/tamanho e estoque.
- **Gestão:** caixa, estoque, histórico de movimentações, compras, fornecedores, relatórios e agenda.
- **Perfil e Configurações:** perfil do operador, equipe/perfis, loja atual, prazo padrão de ficha, notificações, aparência, backup local e restauração.

## Persistência atual

O frontend continua operando localmente para o MVP, usando `localStorage` para manter dados de produtos, clientes, vendas, trocas, estoque, compras, agenda, perfil e configurações.

## Backend

A base de uma API em **Java + Spring Boot + PostgreSQL** está em `/backend`. O frontend ainda não foi migrado para consumir a API; a próxima etapa é substituir a persistência local por endpoints autenticados e centralizados.

## Desenvolvimento

```bash
npm install
npm run dev
```

Backend:

```bash
docker compose up -d
cd backend
mvn spring-boot:run
```

Endpoint de saúde:

```
GET http://localhost:8080/api/health
```

## Observação

O projeto está estruturado como um MVP funcional de gestão comercial. Para produção, a autenticação, autorização, auditoria e persistência centralizada devem ser ligadas ao backend.
