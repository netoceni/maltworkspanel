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

Pendência separada: o Cloud ainda usa override `undici@7.29.0` no tooling; realizar
triagem própria antes de publicar. Este PR não altera dependências nem o deploy Pages.
