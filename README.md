# **Formulário de Configuração Xbox 360 com Supabase e WhatsApp**

Este projeto consiste em um formulário web simples para coletar informações de configuração de Xbox 360\. Os dados preenchidos pelos usuários são armazenados em um banco de dados Supabase e, em seguida, uma mensagem formatada é enviada via WhatsApp para um número pré-definido.

## **Objetivo**

O principal objetivo deste projeto é fornecer uma solução funcional para:

- Coletar dados de clientes (informações pessoais, detalhes do Xbox e seleção de jogos).
- Armazenar esses dados de forma persistente e estruturada no Supabase.
- Automatizar o envio de um resumo das configurações para um número de WhatsApp.

## **Estrutura do Projeto**

A estrutura de pastas e arquivos do projeto é a seguinte:

/seu_projeto/  
├── www/  
│ ├── index.html  
│ ├── css/  
│ │ └── style.css  
│ ├── js/  
│ │ ├── script.js  
│ │ └── supabase_db.js  
│ └── img/  
│ └── logo.png (Opcional, se você tiver uma logo)  
└── config.xml (para projetos Cordova/Capacitor)

## **Configuração do Supabase**

Siga estes passos cruciais para configurar seu banco de dados no Supabase:

### **1\. Criar Projeto no Supabase**

1. Acesse o [Supabase Dashboard](https://www.google.com/search?q=https://app.supabase.com/).
2. Clique em **"New Project"**.
3. Siga as instruções para criar seu projeto. **Anote a senha do banco de dados**, pois ela pode ser necessária para futuras configurações ou acesso direto.

### **2\. Obter Credenciais da API**

1. Após a criação do projeto, no menu lateral esquerdo do dashboard, vá para **"Project Settings"** (o ícone de engrenagem) \> **"API"**.
2. Você precisará de duas informações cruciais:
   - **Project URL**: O URL do seu projeto Supabase. Exemplo: https://abcde12345.supabase.co
   - **anon (public) key**: Sua chave pública anônima. Exemplo: eyJhbGciOiJIUzI1Ni...
3. **Guarde estas duas informações\!** Você as inserirá no arquivo www/js/supabase_db.js.

### **3\. Criar a Tabela xbox_configs**

1. No menu lateral do Supabase, clique em **"Table Editor"** (o ícone de tabela).
2. Clique em **\+ New table**.
3. **Nome da Tabela**: xbox_configs
4. **Colunas**: Adicione as seguintes colunas (o Supabase geralmente cria id e created_at automaticamente):
   - id (Tipo: uuid, Primary Key, Default Value: gen_random_uuid())
   - created_at (Tipo: timestamp with time zone, Default Value: now())
   - nome (Tipo: text)
   - telefone (Tipo: text)
   - email (Tipo: text)
   - endereco (Tipo: text)
   - modeloXbox (Tipo: text)
   - anoXbox (Tipo: integer)
   - tipoHd (Tipo: text)
   - jogosSelecionados (Tipo: **jsonb** \- para armazenar um array de strings)
5. Clique em **"Save"**.

### **4\. Configurar Row Level Security (RLS)**

O RLS é ativado por padrão para segurança. Para permitir a inserção de dados pelo seu formulário:

1. No menu lateral, vá em **"Authentication"** \> **"Policies"**.
2. Clique em **"New Policy"** na sua tabela xbox_configs.
3. Selecione **"Enable read access to everyone"** e depois **"Enable insert for authenticated users only"**.
   - Isso permitirá que qualquer usuário (mesmo sem login explícito, usando a chave anon do SDK) insira dados.
4. Clique em **"Review"** e depois em **"Save policy"**.

## **Detalhes dos Arquivos**

### **index.html**

O arquivo HTML principal que estrutura o formulário:

- Importa as fontes Press Start 2P e Pixelify Sans do Google Fonts.
- Linka o arquivo css/style.css para estilização.
- Importa js/supabase_db.js e js/script.js como **módulos (type="module")**.
- Define os campos do formulário para informações pessoais, detalhes do Xbox e seleção de jogos.
- Possui um div (id="messageBox") para feedback ao usuário (sucesso/erro).

### **style.css**

Controla a aparência do formulário, garantindo responsividade e estética.

- Define estilos globais para fontes e cores.
- Estiliza todos os elementos do formulário (inputs, selects, radios, checkboxes).
- Ajusta os estilos de foco para campos de texto e selects para clareza visual.
- Garante a legibilidade das opções dentro dos dropdowns (select option).
- Inclui media queries para responsividade em diferentes dispositivos.

### **supabase_db.js**

Este módulo JavaScript gerencia a conexão e as operações com o Supabase.

- Inicializa o cliente Supabase usando o Project URL e a anon key.
- Contém a função saveXboxConfig(configData) que insere os dados do formulário na tabela xbox_configs. O .select() é usado para garantir o retorno do id gerado pelo Supabase.
- Expõe as funções de inicialização e salvamento globalmente (window.supabaseDb) para uso pelo script.js.

### **script.js**

A lógica principal do formulário, validações e integração.

- Acessa as funções do supabase_db.js.
- Gerencia a validação de campos obrigatórios e o limite de 15 jogos.
- Formata o número de telefone automaticamente.
- Aplica lógica para exibir avisos de HD e habilitar/desabilitar a seleção de jogos.
- Ao submeter o formulário:
  - Coleta e valida os dados.
  - Chama saveXboxConfig para armazenar no Supabase.
  - Monta uma mensagem detalhada com os dados do formulário.
  - Abre o WhatsApp com a mensagem pré-preenchida.
  - Limpa o formulário após o envio.

## **Como Usar**

1. **Estrutura de Pastas**: Organize seus arquivos conforme a estrutura descrita acima.
2. **Configuração do Supabase**: Siga o **Passo 1** completamente.
3. **Credenciais**: No arquivo www/js/supabase_db.js, substitua YOUR_SUPABASE_URL e YOUR_SUPABASE_ANON_KEY pelos valores obtidos no Supabase Dashboard.
4. **Número do WhatsApp**: No arquivo www/js/script.js, verifique e ajuste a constante WHATSAPP_NUMBER para o seu número de WhatsApp.
5. **Teste Local**: Abra o arquivo www/index.html em seu navegador para testar a funcionalidade.
6. **Para Ambientes Mobile (Cordova/Capacitor)**:
   - Certifique-se de ter cordova-plugin-inappbrowser (para links externos) e cordova-plugin-whitelist (para permissões de rede) instalados.
   - Execute cordova platform add android (ou ios).
   - Execute cordova build android (ou ios) e depois cordova run android (ou ios).

## **Melhorias Sugeridas**

- **Validação Frontend**: Adicionar validações mais avançadas (regex para e-mail/telefone).
- **Feedback Visual**: Implementar modais ou notificações mais sofisticadas para feedback.
- **Segurança de Produção**: Aprofundar nas políticas de RLS do Supabase para um controle de acesso mais granular.
- **Autenticação de Usuário**: Integrar as funcionalidades de autenticação do Supabase para usuários logados.
- **Design/Experiência**: Continuar refinando a interface para uma melhor experiência do usuário.
