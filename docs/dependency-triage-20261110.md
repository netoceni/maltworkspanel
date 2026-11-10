# Dependências do Cloud — 10/11/2026

Branch `fix/cloud-dependencies-20261110`, sobre main
`15ff04bddc1e5371e0e0f71885d141d0595bb298`. Auditoria npm própria:
**4 registros high → 0 alertas conhecidos** na árvore completa. O resultado
`--omit=dev` também é zero. Os quatro registros são Sharp, Undici e os pais
Miniflare/Wrangler que herdam seus alertas; não são quatro falhas independentes.
O relatório [JSON](dependency-triage-20261110.json) registra os 20 avisos individuais
de Sharp/Undici, versões, classificação e resultado da auditoria.

## Correção mínima

| Dependência | Antes | Depois | Motivo |
| --- | --- | --- | --- |
| Undici | 7.29.0 | 7.30.1 | Versão corrigida na mesma linha principal, por override |
| Sharp | 0.35.2 | 0.35.5 | Correção com novos binários e libvips, por override |
| Wrangler | 4.118.0 | 4.118.0 | Preservado |
| Miniflare | 5.20260730.0-alpha | 5.20260730.0-alpha | Preservado |
| workerd | 1.20260730.1 | 1.20260730.1 | Preservado |

O lockfile atualiza apenas Undici, Sharp e os pacotes nativos/libvips de Sharp.
Uma atualização incidental de `tslib` proposta pelo npm foi removida, preservando
a entrada anterior 2.8.1 e sua integridade. Não foi executado `npm audit fix --force`,
nem aceita a atualização ampla de Wrangler sugerida pela auditoria.

São dependências de desenvolvimento, usadas no computador e CI; não são pacotes
distribuídos no JavaScript do navegador. A árvore de dependências de produção não
contém pacotes npm externos. Isso não elimina o risco do tooling, razão da correção.
Zero alertas é a resposta do registro nesta data, não uma garantia geral de segurança
do frontend ou a confirmação de encerramento dos alertas GitHub na main.

Miniflare fixa versões transitivas exatas; os overrides são uma exceção explícita
validada por compatibilidade. Removê-los apenas após atualização compatível dos
pacotes pais, nova auditoria e testes. Permaneceram as mesmas versões já adotadas
na triagem da API/Admin, sem atualizar o runtime do simulador.

## Evidências e testes

- Instalação limpa por `npm ci --ignore-scripts`, sem alterar o lockfile.
- `npm audit --json`: quatro registros high antes, zero depois.
- `npm audit --omit=dev --json`: zero.
- `npm run check`: seis testes estáticos existentes e dois novos testes nativos.
  Sharp decodifica SVG/PNG, redimensiona e gera JPEG; Undici consome HTTP gzip
  em loopback e encerra sua conexão. Os pacotes são resolvidos a partir do consumidor
  Miniflare, cobrindo layouts de dependências aninhados ou compartilhados.
- Entrada local do Wrangler confirma versão 4.118.0; `npm ls` confirma os dois
  overrides e o runtime preservado. Testes locais em Windows, Node 24.18.1/npm 11.16.0.
- CI de PR mantém Node 22/Linux, instala normalmente por `npm ci`, executa os oito
  testes e exige `npm audit --audit-level=moderate`. SHA e resultado final ficam no PR.

Os testes são de compatibilidade, não reproduções de todas as vulnerabilidades.
As versões corrigidas foram conferidas no registro npm, nos avisos e nos releases
oficiais: [Undici 7.30.1](https://github.com/nodejs/undici/releases/tag/v7.30.1),
[Sharp 0.35.5](https://github.com/lovell/sharp/releases/tag/v0.35.5),
[aviso de TLS no Undici](https://github.com/advisories/GHSA-2m5v-pch6-74hx) e
[aviso de librsvg no Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).

## Relação com staging e publicação

A correção do [Cloud #13](https://github.com/netoceni/maltworkspanel/pull/13) foi
incorporada ao conjunto do [Cloud #12](https://github.com/netoceni/maltworkspanel/pull/12),
que prepara o staging. A triagem e a incorporação deixam de ser pendências nesse
conjunto de versões, mas o ambiente continua sem provisionamento/publicação.

Não houve mudança nos assets do frontend, no workflow de deploy Pages, na main,
nas configurações de staging, na API ou no fluxo dos dispositivos. Não foram
executados deploy, migração, envio de telemetria ou alterações remotas no Cloudflare.
Continuam pendentes os recursos isolados, DNS/Access, secrets, publicação e
validações com simuladores descritos no roteiro de staging.

Atualização da incorporação: o commit `fdfb60da423e6802cee966e62e0ba91ec704c35f`
do PR #13 foi incluído, sem conflitos, na branch `prepare/full-staging-20261110`
do PR #12. Instalação limpa e auditorias completa/produção retornaram zero alertas;
os nove testes do conjunto Cloud + staging + compatibilidade passaram localmente.
O CI final e SHA do conjunto ficam no PR #12; o PR #13 e a main continuam sem merge.
As pendências remotas atualizadas estão em [staging](staging.md).
