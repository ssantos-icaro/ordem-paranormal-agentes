# Ordem Paranormal RPG 2 — Criador de Agentes

Ferramenta web para criar e gerenciar fichas de agentes do RPG de mesa
**Ordem Paranormal RPG — 2ª Edição**, baseada na engenharia reversa do
playtest *A Maldição do Ídolo de Pedra*.

Cada usuário tem login próprio (usuário + senha) e suas fichas ficam
salvas em um banco PostgreSQL persistente, **independente** do servidor.
Ou seja: redeploys e reinícios no Render **não apagam** os dados.

> Projeto de fã, não-oficial. Sistema original © Jambô Editora & Rafael
> Lange (Cellbit). Regras de criação reconstruídas pela comunidade
> (@SkStatic_).

---

## Arquitetura

- **Backend:** Node.js + Express
- **Banco:** PostgreSQL no [Supabase](https://supabase.com) (grátis e persistente)
- **Auth:** usuário/senha com hash bcrypt + token de sessão (Bearer, guardado em `localStorage`)
- **Frontend:** HTML/CSS/JS puro em `public/`

### Estrutura

```
├── server.js          # Express + rotas de auth e CRUD de agentes
├── db.js              # Pool pg + criação das tabelas
├── package.json
├── render.yaml        # config de deploy no Render
├── public/
│   ├── index.html     # login + home + ficha
│   ├── css/style.css  # estilos (inclui tema por perfil)
│   └── js/app.js      # lógica do frontend + chamadas à API
```

### Perfis e cores da ficha

| Perfil | Cor      | Habilidade |
|--------|----------|------------|
| Executor | Vermelho | Ímpeto |
| Analista | Azul     | Avaliação |
| Vigilante| Verde    | Prontidão |

---

## Passo a passo de deploy

### 1. Criar o banco no Supabase (free)

1. Crie uma conta em <https://supabase.com> → **New project**
   - Dê um nome e defina a senha do banco de dados (guarde essa senha!)
2. No painel do projeto, vá em **Project Settings → Database → Connection string**
3. Selecione o modo **Pooler → Transaction** (ou **Direct connection**)
   - A string terá este formato:
     ```
     postgresql://postgres.<ref>:<SENHA>@aws-0-<regiao>.pooler.supabase.com:6543/postgres
     ```
   - Copie a string completa. Você vai colá-la no Render como variável de ambiente.
   - **Cuidado:** a string usa `<SENHA>` no lugar da senha que você definiu no passo 1 — preencha esse campo.

### 2. Subir o código para o GitHub

1. Crie um repositório público ou privado no GitHub
2. Adicione esta pasta como remoto e faça o push (ou pelo GitHub Desktop / interface)

### 3. Deploy no Render (free)

1. Crie uma conta em <https://render.com> → **New** → **Web Service**
2. Conecte ao repositório do GitHub
3. Configurações:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Plan:** Free
4. Em **Environment**, adicione:
   - Key: `DATABASE_URL`
   - Value: a string do Supabase do passo 1
5. Clique em **Create Web Service** e aguarde o deploy

A primeira subida cria as tabelas automaticamente no banco.

---

## Uso local (opcional)

Se o `DATABASE_URL` não estiver definida, o `db.js` tenta conectar em
`postgres://postgres:postgres@localhost:5432/op2`. Para rodar localmente:

```bash
npm install
node server.js
```

Acesse <http://localhost:3000>.

---

## Persistência

O PostgreSQL do Supabase guarda os dados fora do Render. Portanto, mesmo
que o serviço gratuito do Render reinicie ou seja redeployado, **ninguém
perde suas fichas**. Para backups, o própria Supabase já gera backups
diários automáticos.

---

## Observação

O arquivo `render.yaml` incluído aqui tem a `DATABASE_URL` como exemplo
(`postgres://...`). Você **não precisa** preenchê-la nesse arquivo — o
valor real é colado no painel do Render (passo 3). O `render.yaml` serve
para deploy via blueprint, mas pela interface do Render a `DATABASE_URL`
é definida em Environment.
