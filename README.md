# AUTISMUS - Comunicação Alternativa para Autismo

![AUTISMUS](assets/preview.png)

## Sobre o Projeto

Autismus é uma aplicação web moderna projetada para auxiliar na comunicação de crianças no espectro do autismo, utilizando um sistema de comunicação por imagens. A aplicação permite criar, organizar e utilizar cartões de comunicação personalizados para facilitar a interação e expressão.

## Arquitetura Técnica

### Tecnologias Principais
- **Frontend**: React 18 com TypeScript e Vite (porta 4000)
- **Estilização**: TailwindCSS para interface responsiva
- **Gerenciamento de Estado**: Zustand para estado global
- **Animações**: Framer Motion para transições suaves
- **Backend**: Supabase para banco de dados e autenticação
- **Armazenamento de Imagens**: Cloudinary com otimização de imagens
- **Implantação**: Netlify para hospedagem

### Sistema de Autenticação
- Integração com Supabase Authentication
- Login com Google
- Gerenciamento de sessão persistente
- Tratamento de metadados do usuário

### Fluxo de Dados

#### Gerenciamento de Estado
A aplicação utiliza múltiplos stores Zustand para gerenciar diferentes aspectos:

1. **Card Management Store**:
   - Gerencia cartões e categorias
   - Manipula operações CRUD para ambos
   - Sincroniza com o banco de dados Supabase
   - Gerencia uploads de imagens para o Cloudinary

2. **Communication Store**:
   - Gerencia cartões selecionados na barra de comunicação
   - Fornece métodos para adicionar, remover e limpar cartões selecionados

#### Sistema de Gerenciamento de Imagens

O tratamento de imagens utiliza uma abordagem de armazenamento duplo:

1. **Fluxo de Upload**:
   - Imagens podem ser carregadas via URL ou arquivo
   - Uploads de arquivos são comprimidos se excederem 2MB
   - Imagens Base64 são enviadas diretamente para o Cloudinary
   - Metadados do Cloudinary (public_id) são armazenados para referência futura
   - Imagens são armazenadas na pasta 'autismus' no Cloudinary

2. **Fluxo de Exclusão**:
   - Quando um cartão é excluído, sua imagem é removida do Cloudinary usando o public_id armazenado
   - O registro do banco de dados é então excluído do Supabase
   - Caminhos de armazenamento legados também são verificados e limpos, se presentes

### Componentes de Interface

#### Componentes Principais
1. **CategoryList**: Exibe e gerencia categorias com funcionalidade de seleção
2. **PictureGrid**: Exibe cartões em um layout de grade com funcionalidade de arrastar e soltar
3. **CommunicationBar**: Mostra cartões selecionados e fornece funcionalidade de fala
4. **CardManagementModal**: Gerencia a adição de novos cartões com opções de upload de imagem

#### Exibição e Interação com Cartões
- Cartões são exibidos com suas imagens e rótulos
- Cartões podem ser selecionados e adicionados à barra de comunicação
- A barra de comunicação permite funcionalidade de texto para fala
- Cartões podem ser reordenados dentro e entre categorias

### Estruturas de Dados

1. **Card**:
   - Propriedades principais: id, name, image_url, category_id, order
   - Propriedades de exibição: display_name (visual), name (para fala)
   - Metadados do Cloudinary: public_id para gerenciamento de imagens

2. **Category**:
   - Propriedades: id, name, icon, color
   - Flag de sistema para distinguir categorias padrão vs. criadas pelo usuário

### Recursos Especiais

1. **Texto para Fala**:
   - Usa a Web Speech API
   - Configurado para português (pt-PT) com preferência de voz feminina
   - Lê os cartões selecionados em sequência

2. **Otimização de Imagem**:
   - Compressão de imagem do lado do cliente antes do upload
   - Mantém a proporção enquanto limita as dimensões a 800px no máximo
   - Qualidade de compressão ajustável com base no tamanho da imagem

3. **Arrastar e Soltar**:
   - Cartões podem ser reordenados dentro das categorias
   - Cartões podem ser movidos entre categorias
   - Alterações de ordem são persistidas no banco de dados

## Como Usar o Autismus

A aplicação é intuitiva, permitindo que os cuidadores, terapeutas ou pais adicionem imagens personalizadas para criar um sistema de comunicação adaptado às necessidades da criança. As imagens representam objetos, lugares, roupas, alimentos ou outras categorias essenciais para a comunicação.

### Como Funciona:
1. **Seleção de Imagens**:
   - As imagens são organizadas por categorias (ex.: Comida, Lugares, Roupa).
   - A criança seleciona a imagem que corresponde ao que deseja comunicar, como "comer maçã" ou "ir ao parque."

2. **Criação de Frases**:
   - A aplicação permite combinar imagens com texto ou áudio para formar frases simples, como "Quero comer" seguido da imagem de comida escolhida.

3. **Interação e Feedback**:
   - Ao selecionar uma imagem, a aplicação pode reproduzir um som ou frase correspondente (ex.: "Maçã"). Isso reforça a associação visual e auditiva.

4. **Personalização**:
   - É possível adicionar imagens importadas a partir do computador ou por URL.
   - O texto ou som associado a cada imagem pode ser ajustado para refletir a linguagem usada pela criança.

5. **Usar imagens PEC's na aplicação Autismus**:
   - Para puder usar a aplicação com imagens, fornecemos uma pasta zipada com as categorias todas.
   - Depois de descarregar no computador, descompactar a pasta zipada.
   - Adicione as imagens em cada categoria, usando a função "Adicionar imagem", ou seja, uma de cada vez.
   - Porém, pode adicionar novas imagens nas categorias correspondentes.

### Objetivo:
A utilização das imagens facilita a comunicação funcional, reduz frustrações e incentiva a autonomia das crianças no espectro do autismo. A aplicação é clara, com botões grandes e imagens de alta qualidade para promover uma experiência agradável e acessível.

## Considerações Técnicas

### Tratamento de Erros
- Tratamento de erros abrangente em toda a aplicação
- Mensagens de erro amigáveis para problemas comuns
- Registro detalhado de erros para depuração

### Otimizações de Desempenho
- Compressão de imagem para reduzir o uso de largura de banda
- Atualizações otimistas da UI para melhor experiência do usuário
- Gerenciamento de estado eficiente com Zustand

### Considerações de Segurança
- Autenticação com Supabase para acesso seguro
- Isolamento de dados específicos do usuário
- Tratamento adequado de erros para evitar vazamento de informações

## Desenvolvedores da Autismus

Esta aplicação foi desenvolvida com o propósito de promover a inclusão e melhorar a comunicação de crianças no espectro do autismo. O conteúdo e as funcionalidades são projetados para facilitar a interação entre cuidadores, terapeutas e crianças, respeitando as necessidades individuais de cada utilizador. A reprodução, distribuição ou uso não autorizado de qualquer parte deste sistema é estritamente proibida. As imagens usadas nesta aplicação foram todas geradas com inteligência artificial. Obrigado por contribuir para um mundo mais acessível e inclusivo. O conteúdo está disponível sob a licença Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International, permitindo a partilha e adaptação, desde que seja atribuído o devido crédito, para fins não comerciais, e com distribuição sob os mesmos termos. Juntos, construímos um mundo mais inclusivo e acessível.

Desenvolvido por Patrício Brito & Pedro Deleu 2025. Todos os direitos reservados.

Descarregar imagens: https://drive.google.com/file/d/1cWgL2x6OsNXAHwQGjMnmWJvGZUwkfiJI/view?usp=drive_link
