# Cloud de staging — publicado privadamente

O ambiente `app-staging.maltworks.com.br` usará o Worker estático exclusivo
`maltworks-cloud-site-staging`, com assets de `public/`. A produção continua no
Pages `maltworks-cloud-app`; `npm run deploy` continua publicando **produção**.

`wrangler.staging.private.jsonc` prepara o Worker sem domínio, sem workers.dev e
sem preview URL. `wrangler.staging.jsonc` adiciona apenas o custom domain de staging.
As duas configurações declaram logs/traces e não compartilham D1, R2 ou service bindings.
O navegador usa `api-staging` para HTTP/WS e `admin-staging` para o painel interno.

Antes de qualquer publicação: conferir conta, CI e integração aprovada da API,
conferir banco/buckets e os secrets já cadastrados na API privada, auditar Access e
planejar a transferência de `api-staging` (hoje do Lab) para a API completa.
O fluxo tem duas fases: config privada primeiro, já concluída; config com domínio
somente após configurar Access e revisar DNS/certificado. Nenhum merge na main ou
deploy de produção foi feito. API, Admin e Cloud já foram publicados privadamente;
secrets e DO exclusivos pertencem à API. D1/R2 e 0001–0018 estão
concluídos, conforme inventário abaixo. Nenhum domínio novo foi ativado.

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
A configuração privada da API permanece ignorada pelo Git e já foi aplicada ao
Worker `maltworks-api-staging`, versão `7a78a58f-842d-4524-981f-70bfd65374f8`.
DO SQLite exclusivo `a7eef169f38d4a2d850c4bbed602f043`, três secrets cadastrados sem
valores expostos, workers.dev/previews desativados e nenhuma route/custom domain.
O hostname `api-staging` continua no Lab antigo. Produção/Lab foram comparados por
metadados antes/depois e permaneceram iguais. A API não foi exposta para teste HTTP.
Detalhes e evidências no
[inventário da API](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/staging-resources-20261110.json).

- [x] Auditar DNS e políticas Access existentes pelo painel autenticado;
  identificado um testador, PIN por e-mail e dois tokens Lab, sem ampliar acesso.
- [ ] Revisar/aplicar o plano de proteção e janela de transferência; criar o token
  exclusivo dos simuladores da API completa e as políticas exatas dos frontends.
- [x] Criar o novo D1 `maltworks-app-staging` e os dois buckets R2 privados;
  conferir UUID/conta, nomes, ausência de dados e acesso público desativado.
- [x] Aplicar 0001–0018 somente no banco novo após autorização específica;
  registro das 18 migrations e schema validados, sem dados da aplicação.
- [x] Preparar três secrets exclusivos da API em cofre local DPAPI, fora do Git,
  sem valores exibidos nem arquivo plaintext permanente; na preparação inicial
  não houve envio remoto.
- [x] Cadastrar os três secrets junto à primeira publicação privada da API e criar
  seu DO SQLite isolado, sem ativar rotas públicas. Cofre local preservado; entrada
  temporária protegida removida. Para futuras atualizações não ativadas, ver
  [procedimento seguro na API](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/staging-secrets.md).
- [ ] Criar contas de teste, incluindo administrador autorizado e organizações dos
  três planos. Não copiar credenciais ou dados de produção.
- [x] Publicar a API com configuração privada e namespace DO próprio, com vínculos
  D1/R2 e privacidade confirmados por metadados remotos.
- [x] Publicar Admin/Cloud com configurações privadas, após autorização própria.
  Cloud: commit `0c69022299433b4830a88a18eb90fae39c72e7bd`, versão
  `e69b60de-04f9-470c-b322-ee27f70168ad`, deployment
  `da59bf45-2627-4968-91a3-38c05e2b6f06`. Admin: versão
  `494d4f56-4d11-4b60-ba67-5678118b0cb3`. Ambos sem bindings de dados/secrets,
  schedules, routes/custom domains, workers.dev ou previews. Assets e cabeçalhos
  conferidos nas versões remotas; nenhuma republicação da API.
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
Depois, API de staging foi publicada privadamente, com secrets e DO, seguida pelos
Workers privados de Admin/Cloud. Inventários de Workers existentes, namespaces DO,
Pages e suas publicações de produção, custom domains e rotas permaneceram iguais.
Não houve merge na main, publicação de produção/Lab, alteração de
domínios/Access ou envio de telemetria.
As observações de DNS/Access citadas no roteiro
são históricas; reconfirmá-las antes das próximas alterações ou publicações.

O staging completo será o ambiente consolidado; o Lab ainda não foi retirado.
Evidências da publicação em
[staging-static-publication.json](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/staging-static-publication.json)
e roteiro executável da etapa local/matriz remota em
[validação integrada](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/staging-integrated-validation.md).
Nesta etapa passaram 84 testes Workers/D1/WS e 38 Node na API, além de nove testes
e ensaio de publicação em cada frontend. A integração remota de navegador continua
pendente de acesso privado/protegido, contas QA e transferência de `api-staging`.

Cloud localhost seleciona API local, mas aliases arbitrários selecionam produção;
usar o hostname exato de staging na validação protegida. Admin localhost também
seleciona produção, portanto não utilizá-lo para integração. Logs/traces estão
declarados nas configs, mas os metadados das versões assets-only não confirmaram
observabilidade; validar em runtime quando existir acesso. Os commits documentais
posteriores não foram republicados.

## DNS/Access e transferência preparados

A auditoria visível no painel autenticado confirmou dez registros na zona, sem
`app-staging`/`admin-staging` ou wildcard. `api-staging` continua como registro Worker
proxied do Lab e bloqueia anônimos por Access. Existe uma aplicação, com um testador
humano explícito, PIN por e-mail e Service Auth para dois tokens Lab. CORS no Access
está vazio. Leituras CLI de DNS/Access da zona retornam 403; listas vazias da conta
contradizem o painel e não provam ausência de proteção.

O [plano de acesso protegido e rollback](https://github.com/netoceni/maltworksapi/blob/prepare/full-staging-20261110/docs/staging-access-cutover.md)
propõe aplicações exatas separadas, mesma lista humana, token novo somente na API,
cookies por hostname e OPTIONS tratado pela API completa. Reassociar apenas
`api-staging` após conferir Access e versões; ativar os frontends somente após smoke.
No Wrangler local, automação sem TTY pode substituir domínio ocupado sem prompt;
não executar configuração com domínio sem prechecks e revisão do diff.
Quatro ensaios locais de triggers e o cenário de dez simuladores passaram.
É somente preparação: não houve alteração de Access/DNS, associação ou deploy.
