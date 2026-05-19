Título do prompt: <ação curta + área afetada>

Você está trabalhando no repositório:
[https://github.com/rabrunos/fibery-html-editor](https://github.com/rabrunos/fibery-html-editor)

Responda ao usuário em português do Brasil.

Issue relacionada:
<#número e título, ou “nenhuma issue relacionada encontrada/informada”>

Contexto:
<resumo objetivo do pedido, bug, feature ou revisão>

Problema observado:
<estado atual verificável; não afirmar causa sem investigar>

Comportamento esperado:
<resultado final esperado para o usuário/frontend>

Tarefa:
<implementar, corrigir, revisar ou documentar de forma objetiva>

Arquivos e fluxos para inspecionar:

* `AGENTS.md`
* `CHANGELOG.md`
* `source/config/manifest.json`
* `source/template/index.template.html`
* arquivos relevantes em `source/html/`, `source/css/`, `source/js/`
* `index.html` apenas como artefato gerado/comparação
* issue(s) relacionada(s), se houver
* `docs/fibery-src/page-api.js` e `docs/fibery-src/editor.js` se tocar load/save/delete/validate/admin/permissões/preview/Fibery

Investigação obrigatória:

* confirme a causa antes de alterar;
* registre hipóteses como hipóteses;
* verifique se a funcionalidade já existe;
* prefira o menor patch seguro;
* não remova funcionalidades aprovadas;
* não mude UX, layout ou ícones fora do escopo.

Escopo:

* <arquivos/áreas que podem ser alterados>
* <fluxos afetados>
* <limites da solução>

Não-objetivos:

* <o que não deve ser alterado>
* <o que deve ficar para outra issue/ciclo>

Requisitos técnicos:

* manter o app como frontend único, sem backend e sem framework obrigatório;
* editar `source/`, não `index.html` diretamente, salvo emergência justificada;
* gerar `index.html` somente via build;
* atualizar `source/config/manifest.json` quando houver novo módulo, mudança de ordem ou versão;
* manter `package.json.version` alinhado com o manifest quando existir;
* preservar ordem JS definida pelo manifest, não por nome de arquivo;
* usar IndexedDB para dados estruturados e localStorage só para preferências simples;
* não inventar endpoints, SDKs, formatos de resposta ou persistência Fibery;
* preservar sidebar sem piscar, seleção estável, preview sem recarga desnecessária e estado local;
* Fibery só deve mudar por ação explícita do usuário;
* autosave deve continuar local e não chamar API do Fibery;
* Tailwind browser/CDN, quando usado, deve entrar apenas no iframe de preview local, nunca no HTML salvo.

Versionamento e changelog:

* decidir patch/minor/major conforme impacto;
* atualizar `CHANGELOG.md` em inglês quando houver implementação, correção, ajuste técnico, mudança visual ou documentação relevante;
* nova entrada no topo, formato `## [x.y.z] - YYYY-MM-DD`;
* se a versão do `index.html` mudar, o topo do changelog deve ter a mesma versão;
* não adicionar “Unreleased” salvo pedido explícito.

Build e validação local:
Rodar:

npm run build:tmp
npm run validate:tmp
npm run build
npm run validate

Também verificar, quando aplicável:

* sintaxe JS;
* IDs e `getElementById`;
* eventos e `addEventListener`;
* i18n;
* versionamento propagado;
* changelog;
* IndexedDB/localStorage;
* regressões estáticas em sidebar, menus, editor, preview, histórico, autosave e Update App.

Testes que dependem do Fibery real:
Separar do que foi validado localmente. Não afirmar teste real sem executar no workspace Fibery.

Itens que podem depender do Fibery real:

* login/sessão;
* permissões;
* `/api/ai-answer/pages/...`;
* runtime da Custom HTML Page;
* `tailwind.css` hospedado pelo Fibery;
* preview real;
* save/load/delete/admin.

Git:

* rodar `git status` antes de finalizar;
* commitar por padrão se a validação passar;
* não commitar se validação falhar;
* incluir apenas arquivos relevantes;
* incluir `index.html` gerado quando `source/` mudar;
* incluir `CHANGELOG.md` quando aplicável;
* incluir `package.json` quando houver mudança de versão;
* nunca commitar `.tmp/`;
* não fazer push salvo pedido explícito;
* respeitar “sem commit” e “sem push” se o usuário tiver pedido.

Resposta final:
Responder em português do Brasil, com:

1. o que foi implementado/corrigido;
2. impacto visual/UX, se houver;
3. arquivos principais alterados;
4. validações executadas;
5. testes manuais no Fibery não executados ou pendentes;
6. changelog/versionamento;
7. commit criado ou motivo de não ter criado;
8. próximos passos ou issue recomendada, se necessário.
