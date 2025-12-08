# Sistema de Votação Anônima - LoL Team Picker

## 📋 Visão Geral

O sistema de votação permite que após uma partida, os jogadores votem anonimamente no MVP e no pior jogador, com os resultados sincronizados em tempo real usando Supabase Realtime.

## 🚀 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Suas variáveis existentes
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
SUPABASE_STORAGE_BUCKET=player-photos

# Novas variáveis públicas (necessárias para Realtime)
NEXT_PUBLIC_SUPABASE_URL=https://[SEU_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 2. Migrations do Banco

As seguintes tabelas foram criadas automaticamente pelo `drizzle-kit push`:

- `voting_sessions` - Armazena sessões de votação
- `votes` - Armazena os votos individuais
- `matches` - Nova coluna `voting_session_id`

### 3. Habilitar Realtime no Supabase

Execute o seguinte SQL no **Supabase SQL Editor**:

```sql
-- Enable realtime for votes table
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Enable realtime for voting_sessions (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE voting_sessions;

-- Grant permissions to anon role
GRANT SELECT ON votes TO anon;
GRANT SELECT ON voting_sessions TO anon;
GRANT INSERT, UPDATE ON votes TO anon;
```

## 🎮 Como Usar

### Finalizar Partida

1. Na página da partida, clique em **"Encerrar partida"**
2. Escolha entre dois modos:
   - **Modo Normal**: Você escolhe imediatamente MVP e pior jogador
   - **Modo Votação**: Cria um link de votação anônima

### Modo Votação

1. Selecione o time vencedor
2. Um link de votação será gerado automaticamente
3. Copie e compartilhe o link com os jogadores
4. Os votos aparecem em **tempo real** na página
5. Quando pronto, clique em **"Finalizar votação"** para processar os resultados

### Votação Anônima

- Cada jogador acessa o link único
- Vota no MVP (time vencedor) e pior jogador (time perdedor)
- Pode alterar seu voto antes da finalização
- Os votos são armazenados com um token único no localStorage

### Pontuação Final

Quando a votação é finalizada:
- Time vencedor: **+25 PDLs** por jogador
- Time perdedor: **-25 PDLs** por jogador
- MVP (mais votado): **+10 PDLs** adicionais
- Pior (mais votado): **-10 PDLs** adicionais

## 🔧 Estrutura Técnica

### Novas Tabelas

**voting_sessions:**
- `id` (UUID) - ID único da sessão
- `match_id` - Referência à partida
- `winner_team` - Time vencedor (1 ou 2)
- `status` - "active" ou "completed"
- `created_at`, `completed_at`

**votes:**
- `id` - ID serial
- `voting_session_id` - Referência à sessão
- `voter_token` - UUID único do votante (localStorage)
- `mvp_player_id` - Voto para MVP
- `dud_player_id` - Voto para pior
- `created_at`

### Server Actions

- `createVotingSessionAction` - Cria sessão de votação
- `submitVoteAction` - Envia ou atualiza voto
- `finalizeVotingAction` - Processa votos e aplica recompensas
- `getVotingSessionAction` - Busca dados da sessão

### Realtime

- Utiliza Supabase Realtime subscriptions
- Atualiza automaticamente quando novos votos chegam
- Não precisa refresh manual da página

## 🎨 Componentes

- `/app/match/[id]/_components/complete-match-dialog.tsx` - Modal de finalização com seleção de modo
- `/app/voting/[sessionId]/page.tsx` - Página de votação (Server Component)
- `/app/voting/[sessionId]/_components/voting-interface.tsx` - Interface de votação com Realtime

## ⚠️ Notas Importantes

1. **Tokens de Votação**: São armazenados no localStorage do navegador. Se limpar o navegador, poderá votar novamente.
2. **Realtime**: Certifique-se de que as variáveis `NEXT_PUBLIC_*` estão configuradas corretamente.
3. **Permissions**: As permissões SQL são necessárias para o Realtime funcionar com a role `anon`.
4. **Anonimato**: Os votos são anônimos - apenas um UUID é armazenado, sem identificação do jogador.

## 📱 Fluxo Completo

```
1. Jogar partida → 2. Encerrar → 3. Escolher modo
                                       ↓
                        ┌──────────────┴────────────────┐
                        ↓                               ↓
                   Modo Normal                    Modo Votação
                        ↓                               ↓
              Escolher MVP/Pior              Compartilhar link
                        ↓                               ↓
               Aplicar recompensas           Jogadores votam
                                                       ↓
                                              Finalizar votação
                                                       ↓
                                              Aplicar recompensas
```

## 🐛 Troubleshooting

**Realtime não funciona:**
- Verifique se executou o SQL no Supabase
- Confirme que `NEXT_PUBLIC_*` variáveis estão no `.env`
- Verifique no console do navegador se há erros de conexão

**Votos não aparecem:**
- Certifique-se que a role `anon` tem permissão `SELECT` na tabela `votes`
- Verifique se o Realtime está habilitado para a tabela

**Erro ao finalizar:**
- Confirme que há pelo menos 1 voto registrado
- Verifique os logs do servidor para mais detalhes

