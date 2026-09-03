# Sales Beacon

Crie uma aplicação Web e Mobile (PWA responsivo) para um sistema SaaS de gestão de estoque, vendas e controle financeiro de clientes em tempo real para lojas de roupas. O sistema deve ter duas visões principais: o Painel Desktop do Caixa e o App Mobile do Vendedor com interface focada em voz e fichas de clientes.

---

### 1. Estilo Visual e UX

- Design moderno, limpo e extremamente funcional, focado na agilidade de atendimento da loja física.

- Paleta de cores: Fundo claro (off-white/cinza neutro), cards em branco, acentos em Azul Indigo/Cobalto e destaques visuais de status:

  * Verde (Disponível / Ficha Em Dia / Sucesso)

  * Laranja (Reservado / Bag / Atenção)

  * Vermelho (Ficha Em Atraso / Esgotado)

- Tipografia legível, com suporte a modo escuro/claro e botões de toque grande no mobile.

---

### 2. Visão 1: App Mobile do Vendedor (Navegação Inferior / Bottom Bar)

#### Tela 1: Caixa, Voz e Ações Rápidas (Tela Principal)

- Header com seletor de loja e indicador de conexão (Online / Offline - Salvo Localmente).

- Botão de microfone central em destaque com animação de pulsação ao ser ativado.

- Instrução: "Fale um comando (ex: 'Vendi regata preta M no Pix' ou 'Registra 50 reais de abate no AV da cliente Maria')".

- Caixa de transcrição simulada exibindo o texto reconhecido em tempo real.

- Card de confirmação de ação com os dados extraídos em JSON e botões "Confirmar" ou "Cancelar".

- Feedback sonoro/visual simulado ao concluir a baixa ou o abatimento de valor.

#### Tela 2: Fichas de Clientes & AVs (Novidade)

- Campo de busca rápida por Nome, CPF ou WhatsApp do cliente.

- Filtro rápido por status: "Todas as Fichas", "Em Dia" e "Em Atraso (Vencidas)".

- Botão "Cadastrar Novo Cliente".

- **Ficha do Cliente (Detalhes ao clicar no cliente):**

  * Dados Cadastrais: Nome, WhatsApp, CPF, Endereço e Tamanho Preferido, com botão de "Editar Dados".

  * Badge de Status da Ficha: "Em Dia" (Verde) ou "Em Atraso" (Vermelho) com alerta de bloqueio para novas vendas a prazo.

  * **Módulo de AV (Abatimentos / Adiantamentos de Valor):** Card com Valor Total Original da Conta, Saldo Devedor Atual e Data de Vencimento. Botão "Registrar Abatimento/Pagamento" (abre modal para inserir valor pago, forma de pagamento e gera registro com data e horário exato).

  * Histórico de Pagamentos do AV: Lista com data, hora, valor pago e saldo restante após cada abate.

  * Histórico Integral de Compras: Tabela/Lista de todas as compras já feitas pelo cliente, exibindo data, hora, itens comprados, preço aplicado e forma de pagamento.

#### Tela 3: Estoque & Variações

- Busca por nome, cor, tamanho e tags.

- Filtros por Categoria, Tamanho (PP ao GG, 36 ao 48) e Status (Em Estoque, Reservado, Na Bag).

- Cards de produtos com Foto, Nome, Preço e Matriz de Variações de Cor/Tamanho com a quantidade disponível em cada variação.

#### Tela 4: Reservas, Bags e Aba de Viagem

- Abas superiores: "Reservas (Sacolas)", "Condicionais (Bags)" e "Aba de Viagem (Reposição Atacado)".

- Aba de Viagem: Lista automática de peças cujo estoque atingiu o limite mínimo, com botão de checkbox "Comprado no Fornecedor" para dar entrada direta no estoque durante a viagem de compras.

---

### 3. Visão 2: Painel Desktop do Caixa (Menu Lateral / Sidebar)

#### Dashboard e Monitor em Tempo Real

- Toast de Notificações Pop-up simulando WebSocket: "Vendedor Alex registrou um abate de R$ 50 no AV da cliente Maria (Pix) - Saldo Devedor Atualizado".

- Cards de Métricas do Dia: Total de Vendas (R$), Total Arrecadado em AVs (R$), Peças Vendidas, Saldo Pendente em Fichas Atrasadas (R$).

- Tabela de Fichas em Atraso com acesso direto ao WhatsApp do cliente para cobrança.

- Tabela do Catálogo Completo com edição de preços, estoque mínimo e relatórios diários de fechamento de caixa.

---

### 4. Funcionalidades e Estado Mockado (Simulação)

- Inclua dados fictícios (mock data) de clientes com Fichas "Em Dia" e "Em Atraso", contas de AV ativas com histórico de pagamentos com data e hora.

- Simule o envio de um comando de voz de abate de AV ou venda atualizando a Ficha do Cliente e o Estoque instantaneamente.

- Permita alternar facilmente no header entre a visão 'Mobile (Vendedor)' e 'Desktop (Caixa)'.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/58a57864-67e7-4e09-87ec-f64dc9ff84cf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
