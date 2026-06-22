# Lobby Online

Aplicação base de lobby online com frontend React + TypeScript e backend Java 21 + Spring Boot, comunicando via WebSocket.

## Arquitetura

- **Frontend** (porta `8080`): React, Vite, Tailwind CSS, Nginx com proxy WebSocket
- **Backend** (rede interna `8081`): Spring Boot, WebSocket, H2 in-memory
- **Comunicação**: cliente ↔ Nginx ↔ backend via `/ws/lobby`

## Pré-requisitos

- Docker
- Docker Compose

## Variáveis de ambiente

Arquivo [`.env`](.env) na raiz do projeto:

```env
LOBBY_SIZE=4
```

Define a capacidade máxima do lobby (padrão: 4 jogadores).

## Executar

```bash
docker compose up --build
```

Acesse: [http://localhost:8080](http://localhost:8080)

## Encerrar

```bash
docker compose down
```

Reset completo:

```bash
docker compose down -v
```

## Fluxo de uso

1. Informe um nickname e entre no lobby.
2. Seu card aparece no topo da tela junto com os demais jogadores.
3. Todos os clientes recebem atualizações sincronizadas via WebSocket.
4. Se o lobby estiver cheio, uma mensagem de erro é exibida.
5. Ao fechar a aba, o jogador é removido e o slot é liberado.

## Validação (somente via Docker)

Não execute `npm run dev` nem `mvn spring-boot:run` no host. Use apenas:

```bash
docker compose up --build
docker compose logs -f backend
docker compose logs -f frontend
```

### Checklist

1. Build e startup sem erros
2. Join básico com 1 aba
3. Sincronização com até 4 abas
4. 5ª aba recebe erro de lobby cheio
5. Fechar aba libera slot e atualiza demais clientes
6. Desconexão remove jogador automaticamente
7. `docker compose down` + `up` reinicia lobby vazio (H2 não persiste)
8. Backend não acessível diretamente no host (apenas `:8080` do frontend)

## Estrutura

```
dominoes/
├── backend/          # Spring Boot + WebSocket + H2
├── frontend/         # React + Vite + Tailwind
├── docker-compose.yml
└── .env
```
