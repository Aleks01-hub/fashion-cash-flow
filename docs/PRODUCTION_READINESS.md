# Preparação local e checklist de liberação

> Não use dados reais de clientes nem registre vendas comerciais até concluir os testes abaixo. Esta configuração é para desenvolvimento local, não para produção pública.

## Configuração local

1. Faça backup dos dados atuais antes de mudar banco, container ou volume. Não execute `docker compose down -v`: isso apaga volumes.
2. Copie `.env.example` para `.env` e troque todos os valores de exemplo por senhas fortes e diferentes.
3. Inicie somente o banco: `docker compose up -d mysql`.
4. Aguarde o banco ficar saudável: `docker compose ps`.
5. Inicie a API a partir de `backend/` com o perfil de desenvolvimento e as variáveis `DATABASE_PASSWORD` e `INITIAL_ADMIN_PASSWORD` carregadas no ambiente.
6. Inicie o frontend com `npm install` e `npm run dev`; confira a variável `VITE_API_URL` conforme o cliente de API utilizado.
7. Faça login com usuário `admin` e a senha que você definiu em `INITIAL_ADMIN_PASSWORD`. O administrador inicial só é criado se a tabela de usuários estiver vazia. Se já houver usuários, a variável não redefine senhas existentes.

O Spring Boot usa MySQL por padrão neste branch. O Hibernate está configurado com `ddl-auto: update`, adequado apenas para desenvolvimento inicial; antes de produção, migrar o schema com ferramenta versionada (ex.: Flyway) e avaliar as alterações em uma cópia do banco.

## Testes obrigatórios antes de liberar

- [ ] Frontend: `npm run build` e `npm run lint` sem erros.
- [ ] Backend: `./mvnw test` (ou `mvn test`) sem erros.
- [ ] API: saúde, login/logout, clientes, produtos, variações, vendas e movimentações respondem como esperado.
- [ ] Persistência: cadastrar/editar produto e cliente, reiniciar API e confirmar que os dados continuam lá.
- [ ] Venda: estoque diminui uma única vez para a variação correta; estoque insuficiente rejeita a venda sem gravar venda parcial.
- [ ] Cancelamento/devolução: saldo, caixa, histórico e estoque são corrigidos uma única vez.
- [ ] AV: registrar conta, abatimento parcial, abatimento total, valor acima do saldo e histórico de pagamentos.
- [ ] Segurança: endpoints privados recusam chamadas sem token; perfis de vendedor não conseguem executar ações administrativas via API.
- [ ] Concorrência: duas vendas simultâneas da última unidade não podem deixar estoque negativo.
- [ ] Recuperação: gerar backup e restaurar esse backup em um banco separado.
- [ ] Implantação: HTTPS, CORS restrito ao domínio real, segredos fora do Git, logs sem dados sensíveis, política de backup e procedimento de recuperação documentados.

## Atenção a dados existentes

O volume Docker `caixa-central-mysql` deve ser preservado. Não remova volumes e não altere nomes de volumes sem confirmar onde estão os dados atuais. Se os dados estiverem em PostgreSQL, a troca do driver não migra os dados automaticamente: faça exportação, conversão e validação em ambiente separado antes de apontar o sistema para o MySQL.

## Critério de pronto

Só liberar para operação depois de todos os testes críticos acima passarem, os saldos serem conferidos manualmente e um backup ter sido restaurado com sucesso. Esta lista é um roteiro de validação, não prova de que os testes já passaram.
