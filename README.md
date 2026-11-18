# Radar Arcos — GitHub + Vercel

Esta versão está preparada para GitHub e Vercel. A configuração nas suas contas ainda precisa ser feita. A base incluída foi coletada em 17/11/2026; ela será substituída após a primeira coleta válida.

## 1. Criar o repositório e enviar os arquivos

1. Entre em https://github.com e crie um repositório na sua conta pessoal chamado `radar-arcos`.
2. Escolha público ou privado. Em repositório público, código e dados enviados ficam públicos; nunca envie segredos.
3. Extraia o ZIP. Envie o conteúdo extraído, não o ZIP e nem uma pasta extra envolvendo o projeto.
4. Use Add file > Upload files e confirme o commit na branch `main`.
5. Confira na raiz: `README.md`, `vercel.json`, `.gitignore`, `dist/`, `scripts/` e `.github/workflows/update.yml`.
6. Se `.github` não for enviada pelo navegador, use Add file > Create new file, digite `.github/workflows/update.yml` e copie o conteúdo do arquivo homônimo do pacote. Confirme o commit.

A pasta `dist` contém o site; `scripts` contém coleta e validações; `.github/workflows/update.yml` agenda a atualização. Não renomeie essas pastas.

## 2. Publicar na Vercel

1. Entre em https://vercel.com com sua conta GitHub.
2. Clique Add New > Project > Import Git Repository.
3. Autorize acesso ao repositório `radar-arcos` e importe-o.
4. Confira os campos abaixo. O arquivo `vercel.json` já contém a configuração principal.

| Campo | Valor |
|---|---|
| Framework Preset | Other |
| Root Directory | Raiz do repositório (`./`), não `dist` |
| Output Directory | `dist` |
| Build Command | `node --check dist/app.js && node scripts/check-ui.cjs` |
| Install Command | Sem comando adicional; projeto sem dependências npm |
| Production Branch | `main` ou a branch padrão usada no GitHub |

5. Clique Deploy. Aguarde o status **Ready**.
6. Abra o endereço `.vercel.app` fornecido pela Vercel. Não é necessário comprar domínio para começar.
7. Confira logo, navegação, busca, filtros, matérias, vereadores, sessões e links oficiais. Confira também no celular.

O primeiro deploy publica a base incluída. A coleta diária só começa após concluir os próximos passos. Alterações normais de código enviadas à branch de produção passam a gerar deploy pela integração GitHub/Vercel.

## 3. Criar o Deploy Hook

Na Vercel: projeto > Settings > Git > Deploy Hooks. Crie um hook chamado `radar-diario` apontando para `main` (ou sua branch padrão). Copie a URL gerada.

Essa URL permite solicitar publicação. Guarde-a apenas como Secret no GitHub: não coloque em código, README ou conversa.

## 4. Configurar o GitHub Actions

No repositório, abra Settings > Secrets and variables > Actions.

Na aba Secrets, crie:

| Nome | Conteúdo |
|---|---|
| `VERCEL_DEPLOY_HOOK` | URL gerada no passo anterior |

Na aba Variables, crie:

| Nome | Conteúdo |
|---|---|
| `RADAR_COMMIT_NAME` | Seu nome de autor dos commits |
| `RADAR_COMMIT_EMAIL` | Seu e-mail verificado no GitHub ou o endereço noreply exato exibido em Settings > Emails da sua conta |

Use a identidade da conta GitHub conectada ao proprietário do projeto na Vercel. Isso é especialmente importante para repositórios privados no plano Hobby. Para esse caminho, prefira repositório pessoal; repositórios privados de organização têm restrições no Hobby.

Em Settings > Actions > General, permita a execução do workflow e confira Workflow permissions > Read and write permissions, quando disponível. O workflow solicita `contents: write` para salvar a coleta. Regras de organização/branch podem exigir ajuste autorizado da política ou um fluxo com pull request; não desative indiscriminadamente as proteções.

Não precisa criar token pessoal do GitHub, chave da OpenAI ou configurar FTP/Hostinger. O GitHub fornece o `GITHUB_TOKEN` para esta execução. Não precisa de Vercel Cron.

## 5. Executar e validar a primeira atualização

1. Abra Actions > Atualizar Radar Arcos > Run workflow.
2. Selecione a branch padrão e confirme. A coleta completa pode levar vários minutos.
3. Confira se configuração, coleta, validação, commit e solicitação de publicação concluíram sem erro.
4. Confira no GitHub o commit de atualização de `dist/data.json`.
5. Na Vercel, abra Deployments e aguarde **Ready** no deploy correspondente.
6. Abra o site e confira a data de coleta. Abra uma matéria e compare o link/dados com a fonte oficial.

O aceite do Deploy Hook confirma apenas que a publicação foi solicitada. Workflow verde não substitui a verificação do status Ready e do conteúdo no site. A integração Git e o hook podem gerar mais de uma solicitação de deploy; verifique a publicação mais recente.

## 6. Rotina diária

O workflow está programado para **04h17 de Brasília** (07h17 UTC), todos os dias. O GitHub pode atrasar execuções; não é garantia de minuto exato. O arquivo precisa existir na branch padrão. Em repositórios públicos, agendamentos podem ser desativados após 60 dias sem atividade; confira Actions periodicamente.

Fluxo: fonte oficial SAPL → coleta → validação → commit no GitHub → solicitação de deploy → Vercel publica.

Coleta/validação com erro não substitui a base válida. Se o push ou a publicação falhar, confira separadamente o GitHub e a Vercel: o site pode continuar na versão anterior. O workflow guarda um artefato validado por 30 dias.

## 7. Boletim semanal com o ChatGPT

O boletim Radar Arcos está habilitado nesta conta para segundas-feiras, por volta das 08h de Brasília. Próxima execução prevista ao preparar este guia: 23/11/2026. Ainda não havia execução registrada.

Ele consulta fontes oficiais e resume os últimos sete dias, com referências e limitações. O resultado chega aqui para revisão; não altera nem publica o site automaticamente. Não precisa de chave da API da OpenAI.

Após publicar, envie na conversa o link do repositório e a URL pública da Vercel, para contextualizar futuras revisões. Um repositório privado exige acesso conectado autorizado para inspeção; apenas informar o link não concede acesso. A conexão do GitHub ao ChatGPT é opcional para revisar código/execuções, e não é necessária para o boletim baseado em fontes oficiais.

## 8. Domínio próprio, opcional

Em Vercel > Settings > Domains, adicione o domínio e configure no provedor de DNS exatamente os registros mostrados pela Vercel. Aguarde a validação e o HTTPS. Um domínio registrado na Hostinger pode continuar lá, apontando para a Vercel; não precisa hospedar o site nos dois lugares.

## Solução de problemas

| Sintoma | Conferir |
|---|---|
| Workflow não aparece | Caminho `.github/workflows/update.yml`, branch padrão e Actions habilitado |
| Configuração ausente | Nomes exatos dos Secrets/Variables do passo 4 |
| Push recusado/403 | Permissão de escrita e regras de branch/organização |
| Deploy bloqueado pelo autor | E-mail do commit associado ao GitHub ligado à conta proprietária na Vercel |
| Hook aceito, site antigo | Status e logs do deploy na Vercel; branch do hook; data mostrada pelo site |
| Coleta rejeitada | Logs de coleta/validação e disponibilidade do SAPL; não force publicação de base incompleta |
| Site não encontrado | Root na raiz; Output Directory `dist`; status Ready |

## Verificação antes de considerar concluído

- Site público funcionando em computador e celular.
- Primeira atualização manual validada no GitHub e publicada na Vercel.
- Uma execução diária agendada confirmada.
- Fonte e data exibidas corretamente; links oficiais funcionam.
- Boletim semanal recebido aqui após a primeira execução prevista.

As verificações locais validam integridade dos dados, sintaxe e renderização simulada. Elas não comprovam acesso às suas contas, deploy real ou revisão visual em navegador. A configuração externa e a primeira execução ainda precisam ser confirmadas.

## Documentação oficial

- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/deploy-hooks
- https://vercel.com/docs/deployments/troubleshoot-project-collaboration
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
