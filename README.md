# 🎲 Escudo do Mestre

Aplicação web e desktop standalone desenvolvida para centralizar e agilizar o gerenciamento de campanhas de RPG de mesa em tempo real — reunindo controle de cenas, fluxo narrativo, rastreador de combate e iniciativa, fichas de agentes, NPCs, pontos de interesse (POIs), rolagem de dados e consulta rápida de regras.

---

## ✨ Funcionalidades Principais

- **Gestão de Campanhas e Cenas:** Organização hierárquica de campanhas, cenas interconectadas (`scene_links`), etapas narrativas (`scene_steps`) e pontos de interesse (`pois`).
- **Rastreador de Combate e Iniciativa:** Controle dinâmico de turnos, ordem de iniciativa, condições e status durante encontros.
- **Fichas de Agentes e NPCs:** Cadastro, edição e acompanhamento em tempo real de atributos, recursos, perícias e itens.
- **Rolagem de Dados e Consulta de Regras:** Sistema integrado de rolagem de dados e painel de referência rápida para regras e testes.
- **Temas Visuais Dinâmicos:** Interface estilizada com suporte a temas e elementos visuais customizados.
- **Modo Portátil (.EXE):** Empacotamento em executável único para Windows, permitindo compartilhar o sistema zerado com outros mestres sem necessidade de instalar Python ou configurar ambiente.

---

## 🏗️ Arquitetura e Tecnologias

O projeto foi construído com foco em **baixo acoplamento, zero dependências externas em tempo de execução e persistência relacional local**:

- **Backend:** Python 3 (biblioteca padrão: `http.server.ThreadingHTTPServer`, `sqlite3`, `json`, `webbrowser`)
- **Banco de Dados:** SQLite (`escudo_mestre.db`) com integridade referencial (`PRAGMA foreign_keys = ON`)
- **Frontend:** HTML5, CSS3 modularizado por domínio e JavaScript Vanilla (ES6+)
- **Empacotamento:** PyInstaller (`GERAR_EXE.bat`)

### Estrutura de Diretórios

```text
escudo_do_mestre/
├── server.py                  # Servidor HTTP multithread, roteamento API e abertura automática no navegador
├── config.py                  # Configurações de host, porta (127.0.0.1:8000), caminho do banco e tabelas permitidas
├── database.py                # Inicialização do SQLite, migrações leves e schema relacional
├── routes_get.py              # Endpoints GET para leitura e agregação de dados
├── routes_post.py             # Endpoints POST para criação de registros
├── routes_update_delete.py    # Endpoints PUT/DELETE para atualização e remoção (CRUD)
├── GERAR_EXE.bat              # Script de automação para build do executável portátil via PyInstaller
├── index.html                 # Interface principal da aplicação
├── css/                       # Folhas de estilo separadas por módulo (layout, combate, fichas, cenas, dados, temas)
├── js/                        # Lógica frontend modular (estado global, CRUD, combate, fichas, cenas, navegação, regras)
└── assets/                    # Recursos gráficos e ícones dos elementos
```

---

## 🚀 Como Executar

### 1. Executando via Python (Desenvolvimento)

**Pré-requisitos:** Python 3.8 ou superior instalado (não requer instalação de pacotes externos via `pip`).

1. Clone o repositório:
   ```bash
   git clone https://github.com/Tody0224/escudo-do-mestre.git
   cd escudo-do-mestre
   ```

2. Inicie o servidor:
   ```bash
   python server.py
   ```

3. O servidor iniciará localmente em `http://127.0.0.1:8000` e abrirá a interface automaticamente no seu navegador padrão. O arquivo `escudo_mestre.db` será criado automaticamente na primeira execução.

---

### 2. Gerando o Executável Portátil (.EXE para Windows)

Para gerar um arquivo `.exe` único que roda em qualquer máquina Windows sem Python instalado:

1. Execute o script `GERAR_EXE.bat` (clique duplo ou via terminal).
2. O script instalará/atualizará o `PyInstaller` e empacotará o servidor, HTML, CSS, JS e assets em:
   ```text
   dist/EscudoDoMestre.exe
   ```
3. **Uso com dados existentes:** mantenha o arquivo `escudo_mestre.db` na mesma pasta do `EscudoDoMestre.exe`.
4. **Distribuição limpa:** envie apenas o `EscudoDoMestre.exe` — um novo banco vazio será gerado automaticamente ao abrir.

---

## 🛠️ Conceitos Técnicos Aplicados

- **API RESTful / CRUD sem frameworks:** Implementação manual de tratamento de requisições HTTP (`GET`, `POST`, `PUT`, `DELETE`), serialização JSON e validação de tabelas permitidas (`ALLOWED_TABLES`).
- **Modelagem Relacional:** Estrutura normalizada com chaves estrangeiras e exclusão em cascata (`ON DELETE CASCADE`) para campanhas, cenas, NPCs e itens.
- **Gerenciamento de Estado no Frontend:** Separação clara entre camada de estado (`state.js`), comunicação com API (`crud.js`) e renderização de componentes de interface.

---

## 👤 Autor

**Gabriel Oliveira do Nascimento**  
- GitHub: [@Tody0224](https://github.com/Tody0224)  
- LinkedIn: [Gabriel Oliveira do Nascimento](https://www.linkedin.com/in/gabriel-oliveira-do-nascimento-314054379)
