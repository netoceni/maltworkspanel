# Publicação do Maltworks Cloud Panel — Fase 5.9.0

## 1. Instalar e publicar

Abra o PowerShell nesta pasta e execute:

```powershell
npm.cmd install
npm.cmd run deploy
```

Na primeira publicação, o Wrangler pode perguntar se deseja criar o projeto
`maltworks-cloud-app`. Confirme a criação e use `main` como branch de produção.

## 2. Testar a URL temporária

Ao concluir, o Wrangler exibirá um endereço `pages.dev`. Abra esse endereço e
confirme que a tela de login Maltworks é carregada.

O login pela URL temporária pode ser recusado pela política de origem da API.
Isso é esperado: a origem autorizada é somente o domínio oficial.

## 3. Associar o domínio oficial

No painel Cloudflare:

1. abra **Workers & Pages**;
2. selecione **maltworks-cloud-app**;
3. abra **Custom domains**;
4. escolha **Set up a custom domain**;
5. informe `app.maltworks.com.br` e confirme.

Depois que o domínio ficar ativo, abra `https://app.maltworks.com.br` e faça
login. A API autorizada é `https://api.maltworks.com.br`.

Esta versão usa a API 5.6.0 e o firmware 5.3.2 para administrar receitas,
perfis, parâmetros de controle, calibração, alarmes e curvas de densidade pela
nuvem. Proprietários e administradores também podem excluir um controlador e
todos os seus dados cloud para cadastrá-lo novamente. Publique o painel somente
depois de atualizar a API e aplicar a migração `0007_user_signup.sql`. Para usar
o novo código seguro de cadastro, grave o firmware 5.3.2 no controlador.
