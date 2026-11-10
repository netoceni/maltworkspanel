# Cloud de staging — configuração preparada, sem publicação

O ambiente `app-staging.maltworks.com.br` usará o Worker estático exclusivo
`maltworks-cloud-site-staging`, com assets de `public/`. A produção continua no
Pages `maltworks-cloud-app`; `npm run deploy` continua publicando **produção**.

`wrangler.staging.private.jsonc` prepara o Worker sem domínio, sem workers.dev e
sem preview URL. `wrangler.staging.jsonc` adiciona apenas o custom domain de staging.
As duas configurações têm logs/traces e não compartilham D1, R2 ou service bindings.
O navegador usa `api-staging` para HTTP/WS e `admin-staging` para o painel interno.

Antes de qualquer publicação: conferir conta, CI e integração aprovada da API,
criar banco/buckets exclusivos e secrets novos, auditar a proteção Access e
planejar a transferência de `api-staging` (hoje do Lab) para a API completa.
Depois, publicar em duas fases: config privada primeiro; config com domínio
somente após configurar Access e revisar DNS/certificado. Nenhuma publicação,
criação de recurso, migração ou mudança na main foi feita nesta preparação.

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

## Pendências de staging após a incorporação

- [ ] Auditar DNS e políticas Access existentes com acesso de leitura adequado;
  aprovar testadores, IdP e service token exclusivo dos simuladores.
- [ ] Criar o novo D1 `maltworks-app-staging` e os dois buckets R2 privados;
  conferir UUID/conta e aplicar 0001–0018 somente nesse banco novo.
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

Nenhum recurso remoto, migração remota, deploy ou envio de telemetria foi executado
durante esta incorporação. As observações remotas citadas no roteiro são históricas;
reconfirmá-las antes de provisionar ou publicar.
