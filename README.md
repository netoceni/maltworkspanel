# Maltworks Cloud Panel — Fase 5.11.0

Painel web responsivo para os controladores Maltworks, preparado para
Cloudflare Pages e integrado à API oficial em `https://api.maltworks.com.br`.

## Recursos

- login por sessão segura e cookie HttpOnly;
- acesso ao painel ADMIN exibido somente para contas autorizadas pelo sistema,
  sem alterar o papel da conta dentro da organização do cliente;
- múltiplos controladores por organização;
- menu de ações por controlador, com edição de nome e favorito persistidos na nuvem;
- temperatura, setpoint, histerese, relés e sinal Wi-Fi;
- perfil de fermentação, alarmes e dados do dispositivo;
- alteração remota segura do setpoint, com confirmação do ESP32;
- criação e edição de receitas armazenadas na nuvem;
- até oito etapas por receita, com temperatura e duração;
- início, pausa, retomada e interrupção remota dos perfis;
- cópia local da receita no ESP32 para execução offline;
- bloqueio automático durante perfil ativo, dispositivo offline ou comando pendente;
- gráfico SVG sem bibliotecas externas, com zoom pela roda do mouse e detalhes por ponto;
- atualização automática e layout responsivo;
- atualização visual a cada segundo, estado atual a cada dois segundos e
  histórico a cada trinta segundos;
- cabeçalhos de segurança para Cloudflare Pages;
- arquivos JavaScript e CSS versionados para impedir o uso de versões antigas
  mantidas no cache do navegador;
- correção do preenchimento do setpoint quando existe um comando pendente;
- formulário remoto enviado sem recarregar a página e com confirmação antes
  da alteração;
- navegação em abas para Dashboard, Controle, Receitas e Rampas, Densidade,
  Calibração, Alarmes, Histórico e Dispositivo;
- edição cloud de histerese, proteção do compressor e offsets dos sensores;
- configuração e reconhecimento remoto de alarmes;
- exportação do histórico térmico em CSV;
- gráfico de temperatura e setpoint diretamente no Dashboard;
- barra de progresso da receita ativa, calculada com duração e tempo restante;
- acompanhamento cloud de OG e leituras manuais de densidade;
- gráfico de fermentação, atenuação aparente e ABV estimado;
- correção e encerramento do acompanhamento de cada lote;
- compatibilidade com API 5.8.0 e firmware 5.3.3;
- correção da navegação por abas com inicialização independente da API;
- arquivos JavaScript e CSS exclusivos da versão 5.11.0 para impedir mistura
  com recursos antigos mantidos pelo navegador ou pela CDN.

## Desenvolvimento

```powershell
npm.cmd install
npm.cmd run dev
```

## Publicação

```powershell
npm.cmd run deploy
```

Depois da primeira publicação, associe `app.maltworks.com.br` ao projeto
`maltworks-cloud-app` no painel da Cloudflare Pages.
