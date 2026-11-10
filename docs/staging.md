# Cloud de staging — configuração preparada, sem publicação

O ambiente `app-staging.maltworks.com.br` usará o Worker estático exclusivo
`maltworks-cloud-site-staging`, com assets de `public/`. A produção continua no
Pages `maltworks-cloud-app`; `npm run deploy` continua publicando **produção**.

`wrangler.staging.private.jsonc` prepara o Worker sem domínio, sem workers.dev e
sem preview URL. `wrangler.staging.jsonc` adiciona apenas o custom domain de staging.
As duas configurações têm logs/traces e não compartilham D1, R2 ou service bindings.
O navegador usa `api-staging` para HTTP/WS e `admin-staging` para o painel interno.

Antes de qualquer publicação: conferir conta, CI e integração aprovada da API,
conferir banco/buckets exclusivos já criados e preparar secrets novos, auditar Access e
planejar a transferência de `api-staging` (hoje do Lab) para a API completa.
Depois, publicar em duas fases: config privada primeiro; config com domínio
somente após configurar Access e revisar DNS/certificado. Nenhuma publicação ou
mudança na main foi feita. A criação do D1/R2 e a aplicação de 0001–0018 no novo D1
foram autorizadas em etapas separadas e estão concluídas, conforme inventário abaixo.

Roteiro completo e matriz de validação:
[API — staging completo](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/full-staging-20261110.md).
Validar navegador real: login/logout, cookies Access nos domínios, CORS/OPTIONS,
WebSocket, planos e controladores simulados. Os testes estáticos verificam assets,
sintaxe, cabeçalhos e seleção dos endereços; não comprovam recursos remotos.

## Dependências incorporadas e validadas

O [Cloud #13](https://github.com/netoceni/maltworkspanel/pull/13), commit
`fdfb60da423e6802cee966e62e0ba91ec704c35f`, foi incorporado à branch de staging
do [PR #12](https://github.com/netoceni/maltworkspanel/pull/12), sem conflitos.
Undici está em 7.30.1 e Sharp em 0.35.5; Wrangler 4.118.0, Miniflare e workerd
permanecem nas versões anteriores. O relatório de
[triagem](dependency-triage-20261110.md) registra os avisos e os overrides.

No conjunto incorporado: instalação limpa por `npm ci --ignore-scripts`, nove
testes aprovados (sete do Cloud/staging e dois de compatibilidade nativa), auditorias
completa e `--omit=dev` com zero alertas conhecidos e leitura da configuração
privada pelo Wrangler com geração local de tipos. O CI do PR #12 exige auditoria
e os nove testes; o resultado final e SHA ficam na descrição do PR. Isso resolve
a pendência de triagem/incorporação do Cloud, sem validar os recursos remotos.
Os assets, as duas configurações de staging e o workflow de deploy Pages não foram
alterados pela incorporação. A main não recebeu merge.

## Inventário criado e pendências de staging

Na conta `4e8c08f70722d344cf39c362a110d706`, após conferir nomes livres, foram criados:

- D1 `maltworks-app-staging`, UUID `5151e251-52c1-4406-8ae9-c6d38961d124`, região ENAM.
- R2 `maltworks-staging-firmware` e `maltworks-staging-batch-files`, ENAM, Standard,
  zero objetos, r2.dev desativado e sem custom domains.

Após conferir novamente conta e UUID, foram aplicadas 0001–0018 somente nesse D1.
As 36 tabelas da aplicação e 40 índices explícitos correspondem ao schema esperado
dos mesmos arquivos em SQLite local; nenhuma migration pendente, `quick_check=ok`
e nenhuma violação de FK. Todas as tabelas da aplicação têm zero registros; a
validação foi somente de leitura. Evidências no
[relatório de migrations da API](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/staging-migrations-0001-0018.json).
A configuração privada da API foi gerada apenas localmente, ignorada pelo Git e sem upload. Não há Worker
publicado ou DO de staging criado nesta etapa. Detalhes e evidências no
[inventário da API](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/staging-resources-20261110.json).

- [ ] Auditar DNS e políticas Access existentes com acesso de leitura adequado;
  aprovar testadores, IdP e service token exclusivo dos simuladores.
- [x] Criar o novo D1 `maltworks-app-staging` e os dois buckets R2 privados;
  conferir UUID/conta, nomes, ausência de dados e acesso público desativado.
- [x] Aplicar 0001–0018 somente no banco novo após autorização específica;
  registro das 18 migrations e schema validados, sem dados da aplicação.
- [ ] Gerar secrets novos e contas de teste, incluindo administrador autorizado
  e organizações dos três planos. Não copiar credenciais ou dados de produção.
- [ ] Publicar API/Admin/Cloud primeiro com configurações privadas; criar o
  namespace DO próprio na publicação da API. Nenhuma dessas publicações foi feita.
- [ ] Proteger e ativar `app-staging`/`admin-staging`; planejar e autorizar a
  transferência de `api-staging` do Lab para a nova API, preservando os recursos
  antigos e registrando rollback. Não reutilizar banco, DO ou buckets de produção/Lab.
- [ ] Validar DNS/TLS, Access, login/permissões, cookies, CORS/OPTIONS, HTTP/WS,
  comandos/ACK, planos/limites/downgrades, histórico, lotes/densidade e R2 com
  controladores simulados. Confirmar isolamento entre organizações.
- [ ] Conferir versões publicadas, migrations, rollup, retenção desativada e,
  se habilitado, cron completo de offline/monitor D1. E-mail permanece off até
  configurar e autorizar remetente e inbox de teste restrito.

Na incorporação de dependências não houve mudanças remotas. Em etapas posteriores,
D1/R2 foram criados e 0001–0018 aplicadas somente no novo D1, conforme inventário.
Não houve deploy, merge na main, alterações em outros recursos ou envio de telemetria.
As observações de DNS/Access citadas no roteiro
são históricas; reconfirmá-las antes das próximas alterações ou publicações.
