Título do prompt: <ação curta + área afetada>

Você está trabalhando no repositório:
[https://github.com/rabrunos/fibery-html-editor](https://github.com/rabrunos/fibery-html-editor)

Responda ao usuário em português do Brasil.

Issue relacionada:
<#número e título, ou "nenhuma issue relacionada encontrada/informada">

Contexto:
<resumo objetivo do pedido, bug, feature, revisão ou atualização documental>

Problema observado:
<estado atual verificável; separar hipótese de causa confirmada>

Comportamento esperado:
<resultado final esperado para o usuário, frontend, runtime, documentação ou fluxo>

Tarefa:
<implementar, corrigir, revisar, documentar ou investigar de forma objetiva>

Arquivos e fluxos para inspecionar:

* `AGENTS.md` obrigatoriamente antes de qualquer execução;
* issue(s) relacionada(s), se houver;
* `source/config/manifest.json`;
* `source/template/index.template.html`;
* arquivos relevantes em `source/html/`, `source/css/`, `source/js/`;
* `CHANGELOG.md` quando houver mudança de app/runtime/build/UX/validação/release ou documentação relevante ao app;
* `index.html` apenas como artefato gerado/comparação;
* `docs/fibery-src/page-api.js` e `docs/fibery-src/editor.js` se tocar load/save/delete/validate/admin/permissões/preview/Fibery runtime;
* `docs/.chat/` somente se este prompt pedir explicitamente ou se a tarefa for sobre governança, instruções, templates ou orquestração;
* `docs/.human/` somente se este prompt pedir explicitamente ou se a tarefa for sobre ferramenta humana, formulário, checklist ou relatório de teste.

Investigação obrigatória:

* rodar `git status` antes de qualquer alteração;
* identificar mudanças pré-existentes e não sobrescrevê-las sem necessidade;
* confirmar a causa antes de alterar; registrar hipóteses como hipóteses;
* verificar se a funcionalidade ou regra já existe antes de reescrever;
* não mudar UX, layout ou ícones fora do escopo;
* verificar referências, caminhos e dependências afetadas.

Seguir `AGENTS.md` para regras completas de investigação e arquitetura.

Escopo:

* <arquivos/áreas que podem ser alterados>
* <fluxos afetados>
* <limites da solução>

Não-objetivos:

* <o que não deve ser alterado>
* <o que deve ficar para outra issue/ciclo>
* não editar `index.html` diretamente, salvo emergência justificada e reconciliada em `source/`;
* não acessar `docs/.chat/` ou `docs/.human/` em tarefa normal do app, salvo autorização explícita neste prompt;

Requisitos técnicos:

* app como frontend único, entregue como `index.html` gerado via build; editar `source/`, nunca `index.html` diretamente;
* atualizar `source/config/manifest.json` quando houver novo módulo, mudança de ordem ou versão; manter `package.json.version` alinhado;
* verificar no repositório antes de assumir que Vite, TypeScript ou `npm run verify` existem;
* usar IndexedDB para dados estruturados e localStorage só para preferências simples;
* não inventar endpoints, SDKs, formatos de resposta ou persistência Fibery;
* Fibery só muda por ação explícita do usuário; autosave é local e não chama a API do Fibery;
* Tailwind browser/CDN entra apenas no iframe de preview local, nunca no HTML salvo.

Seguir `AGENTS.md` para regras completas de arquitetura e persistência.

Versionamento e changelog:

* decidir patch/minor/major conforme impacto quando houver mudança de app/runtime/build;
* não alterar versão em mudanças puramente documentais/governança interna, salvo pedido explícito;
* atualizar `CHANGELOG.md` em inglês quando houver implementação, correção, refactor, build, validação, runtime, release/update, UX ou documentação relevante ao app;
* não atualizar `CHANGELOG.md` quando a mudança for apenas planejamento por issues ou governança interna em `AGENTS.md`, `docs/.chat/` ou `docs/.human/`, salvo pedido explícito;
* nova entrada no topo, formato `## [x.y.z] - YYYY-MM-DD`;
* se a versão do `index.html` mudar, o topo do changelog deve ter a mesma versão;
* não adicionar `Unreleased` salvo pedido explícito.

Build e validação local:

Para mudanças de app/runtime/build/source, rodar:

npm run build:tmp

npm run validate:tmp

npm run build

npm run validate

Para mudanças somente documentais internas, build do app não é obrigatório, salvo se este prompt pedir.

Também verificar quando aplicável: sintaxe JS, IDs, eventos, i18n, versionamento propagado, changelog, IndexedDB/localStorage, regressões de UI e caminhos citados nos documentos. Detalhes completos em `AGENTS.md`.

Quando `npm run verify` existir no repositório, preferir esse comando como agregador local, sem misturar validação local com teste real no Fibery.

Testes que dependem do Fibery real:

Separar do que foi validado localmente. Não afirmar teste real sem executar no workspace Fibery.

Itens que podem depender do Fibery real:

* login/sessão;
* permissões;
* `/api/ai-answer/pages/...`;
* runtime da Custom HTML Page;
* `tailwind.css` hospedado pelo Fibery;
* preview real;
* save/load/delete/admin;
* Update App aplicado em página real.

Git:

* rodar `git status` antes de finalizar;
* commitar por padrão se este prompt permitir commit e a validação aplicável passar;
* fazer push por padrão se este prompt permitir push e a validação aplicável passar;
* não commitar se validação aplicável falhar;
* incluir apenas arquivos relevantes;
* incluir `index.html` gerado quando `source/` mudar;
* incluir `CHANGELOG.md` quando aplicável;
* incluir `package.json` quando houver mudança de versão ou tooling;
* não incluir alterações pré-existentes não relacionadas;
* respeitar "sem commit" e "sem push" se o usuário tiver pedido.

Resposta final:

Responder em português do Brasil, com:

1. o que foi implementado/corrigido;
2. impacto visual/UX, se houver;
3. arquivos principais alterados;
4. validações/document checks executados;
5. testes manuais no Fibery não executados ou pendentes;
6. changelog/versionamento;
7. commit criado ou motivo de não ter criado;
8. próximo passo recomendado ou issue relacionada.
