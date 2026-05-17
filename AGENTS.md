# AGENTS.md — Fibery HTML Editor

## Objetivo do app

O **Fibery HTML Editor** é um editor operacional interno para criar, editar, visualizar, organizar e manter páginas HTML hospedadas no Fibery.

Ele não é um editor HTML genérico. Toda evolução deve preservar o uso principal dentro do Fibery: abrir páginas existentes, editar conteúdo HTML, visualizar prévia, organizar páginas em projetos locais e operar com fluidez semelhante a ferramentas como ChatGPT, Notion e VSCode leve.

## Ambiente de execução

O app roda como uma página HTML customizada dentro do Fibery.

Premissas do ambiente:

- o Fibery hospeda a página;
- o app é usado dentro de um workspace Fibery;
- o acesso depende das permissões do workspace e da página/área onde o app está disponível;
- o app não deve assumir exposição pública;
- o app não possui backend próprio;
- o app deve usar apenas recursos disponíveis no navegador e APIs/helpers oficiais do Fibery;
- integrações com páginas, entidades, permissões, carregamento, listagem, salvamento e exclusão devem respeitar os helpers oficiais disponíveis na fonte do Fibery.

## Arquivos de referência

### Arquivo HTML principal

O arquivo HTML do editor contém a interface principal, os estados locais, a experiência de edição, a sidebar, a prévia e os fluxos operacionais do app.

Ao modificar esse arquivo:

- preservar a estrutura visual aprovada;
- evitar reescrever blocos grandes sem necessidade;
- alterar o mínimo necessário;
- manter compatibilidade com o ambiente de custom HTML page do Fibery;
- não trocar a arquitetura por framework externo;
- não adicionar backend, build step ou dependência obrigatória de servidor próprio.

### `page-api.js`

Arquivo oficial de helper/API do Fibery usado como referência para operações de páginas.

Função deste arquivo no projeto:

- fonte oficial para descobrir como carregar, listar, salvar, excluir, validar página e checar permissões;
- não deve ser recriado manualmente dentro do app;
- não deve ser editado como se fosse código do projeto;
- não deve ser substituído por endpoints inventados;
- se o HTML precisar acessar diretamente seus exports, usar importação compatível com o ambiente real do Fibery e testar no workspace.

Helpers conhecidos nesse arquivo:

- `createEmptyPage`
- `checkIsAdmin`
- `loadPages`
- `loadPage`
- `savePage`
- `deletePage`
- `validatePageData`

### `editor.js`

Arquivo oficial/de referência do editor base disponível na fonte do Fibery.

Função deste arquivo no projeto:

- servir como referência de integração e comportamento esperado dos helpers oficiais;
- mostrar padrões originais de carregamento, salvamento, exclusão, modo de visualização e controle de permissão;
- não deve substituir automaticamente o editor customizado atual;
- não deve ser editado como se fosse código local do projeto, salvo se o ambiente real do Fibery exigir manutenção direta desse arquivo.

## Fontes de verdade

A ordem de confiança para integração deve ser:

1. helpers oficiais disponíveis na fonte do Fibery;
2. comportamento real testado no workspace Fibery;
3. HTML atual funcional do editor;
4. documentação oficial do Fibery;
5. suposições somente quando explicitamente marcadas como suposição.

Nunca inventar API, endpoint, formato de resposta, SDK ou estrutura de persistência.

## Arquitetura do app

O app é uma aplicação frontend única, executada no navegador.

Componentes principais:

- sidebar lateral;
- lista de páginas recentes;
- organização local por projetos;
- busca de páginas;
- tela inicial em branco/welcome;
- editor de código HTML;
- preview em iframe;
- modo foco da prévia;
- menus contextuais;
- configurações locais;
- histórico local de versões;
- logs opcionais;
- metadata local para ordenação e organização.

Não há backend próprio. Qualquer persistência além do Fibery deve usar armazenamento local do navegador.

## Persistência local

O app usa persistência local para estados que não pertencem diretamente ao Fibery.

### IndexedDB

Usar IndexedDB para dados locais estruturados, como:

- histórico local de versões;
- snapshots;
- metadados locais de página;
- projetos locais;
- vínculos página-projeto.

### localStorage

Usar localStorage para preferências simples, como:

- idioma;
- abrir última página ao iniciar;
- página aberta anteriormente;
- limite de versões locais;
- tamanho do split editor/preview;
- estado aberto/fechado da sidebar;
- modo de painel editor/preview.

Não trocar IndexedDB por localStorage para dados grandes ou estruturados. Não apagar dados locais sem migração ou confirmação clara.

## Regras de UX

Toda alteração deve preservar a experiência já aprovada.

Prioridades:

1. UX;
2. estabilidade;
3. fluidez;
4. persistência;
5. performance;
6. visual.

Regras obrigatórias:

- não fazer a sidebar piscar;
- não reconstruir listas inteiras sem necessidade;
- não resetar seleção ao atualizar dados;
- não sumir e voltar com painéis sem motivo;
- não recarregar preview desnecessariamente;
- não perder estado local;
- não quebrar responsividade horizontal atual;
- não remover animações suaves aprovadas;
- não simplificar funcionalidades já aprovadas;
- não trocar layout sem objetivo claro;
- não mexer no sistema de ícones enquanto a correção dos SVGs não for priorizada.

Preferir:

- diff incremental;
- atualização seletiva de DOM;
- comparação de estado anterior e próximo;
- classes e helpers pequenos;
- funções previsíveis;
- mudanças fáceis de reverter.

Evitar:

- hacks frágeis;
- duplicação de DOM;
- recriação total de listas;
- dependências desnecessárias;
- efeitos visuais chamativos sem necessidade;
- mudanças globais de CSS que afetem sidebar, páginas, projetos ou preview.

## Metadata local de páginas

A ordenação de páginas depende de metadata local.

Regras:

- páginas editadas/salvas pelo editor podem aparecer acima das páginas apenas listadas pela API;
- páginas sem metadata local devem ficar abaixo, preservando a ordem original da listagem/API;
- abrir página pode atualizar metadata de abertura;
- salvar conteúdo pode atualizar metadata de salvamento;
- renomear não deve contar como edição relevante de conteúdo;
- mover para projeto, fixar ou arquivar são ações locais e não devem alterar o conteúdo da página;
- ações de organização local não devem ser confundidas com edição real da página.

Campos conceituais recomendados:

- `lastOpenedAt`
- `lastSavedAt`
- `lastContentEditedAt`
- `lastRenamedAt`
- `pinnedAt`
- `archivedAt`

Nem todo campo precisa existir imediatamente, mas novas mudanças devem respeitar essa separação conceitual.

## Permissões e modo somente leitura

O app deve respeitar a checagem oficial de admin/permissão disponível nos helpers do Fibery.

Quando o usuário não tiver permissão administrativa/de edição:

- bloquear salvamento;
- bloquear criação;
- bloquear exclusão;
- colocar editor em modo somente leitura;
- preservar capacidade de visualização quando possível;
- não esconder erros de permissão.

Não criar regras paralelas de permissão sem validar contra o comportamento real do Fibery.

## Preview

A prévia usa iframe apontando para a rota de visualização da página quando há ID salvo.

Regras:

- não recarregar iframe se não for necessário;
- preservar modo foco;
- preservar botão/overlay de saída do modo foco;
- não quebrar layout ao entrar ou sair do foco;
- página nova sem ID pode ter preview limitado/local até ser salva;
- futuras melhorias devem respeitar o fluxo atual de preview.

## Sidebar

A sidebar é parte crítica da experiência.

Preservar:

- abrir/fechar com estado persistido;
- lista de páginas;
- projetos acima das páginas recentes;
- seleção da página atual;
- botão novo;
- botão busca;
- botão configurações;
- botão refresh;
- paginação/load more;
- hover com 3 pontinhos;
- alinhamento visual dos ícones;
- altura visual consistente dos itens.

Atualizações da sidebar devem ser incrementais sempre que possível.

## Projetos

Projetos são organização local do navegador, não estrutura oficial do Fibery.

Regras:

- criar projeto localmente;
- renomear projeto localmente;
- excluir projeto sem excluir páginas do Fibery;
- mover/remover páginas de projetos localmente;
- preservar vínculos em IndexedDB;
- não alterar conteúdo da página ao mudar organização local;
- não tratar projeto local como entidade Fibery, a menos que uma integração oficial seja planejada e testada.

## Busca

A busca deve continuar rápida e operacional.

Regras:

- evitar modal pesado quando um dropdown inline resolver melhor;
- preservar busca na tela welcome;
- preservar abertura de página pelo resultado;
- preservar ação de abrir preview;
- adicionar menus contextuais nos resultados sem quebrar clique principal;
- aplicar debounce em consultas;
- não buscar em excesso sem necessidade.

## Histórico e snapshots

Histórico é local no navegador.

Regras:

- salvar versões em IndexedDB;
- respeitar limite configurado pelo usuário;
- permitir restauração controlada;
- não depender de backend próprio;
- não prometer histórico compartilhado entre usuários/dispositivos;
- tratar snapshots como recurso local até existir integração oficial diferente.

## Editor

O editor atual é baseado em Monaco quando disponível, com fallback para textarea.

Preservar:

- contador de caracteres;
- copiar código;
- importar HTML;
- colar e substituir;
- selecionar tudo;
- salvar;
- estado dirty/unsaved;
- fallback seguro quando Monaco não carregar;
- read-only quando não houver permissão.

Futuras mudanças para editor triplo devem preservar o editor atual como base e migrar incrementalmente.

## Editor triplo planejado

Evolução planejada:

- separar HTML, CSS e JS;
- permitir ocultar painéis individualmente;
- permitir layout horizontal e vertical;
- persistir layout e visibilidade dos painéis;
- combinar HTML/CSS/JS para preview;
- salvar de forma compatível com as páginas Fibery atuais;
- evitar quebrar páginas existentes que já são HTML completo.

Estratégia recomendada:

- primeiro introduzir estrutura de dados compatível;
- depois UI tripla;
- depois preview combinado;
- depois importação inteligente de HTML completo para HTML/CSS/JS.

## Mobile e layout vertical

Evolução planejada:

- criar layout vertical para telas pequenas;
- adaptar sidebar e menus para toque;
- aumentar áreas clicáveis em mobile;
- preservar desktop sem regressão;
- evitar drag-resize complexo em telas pequenas até existir desenho específico.

## Atualizar App

O botão de atualizar app deve ser tratado com cuidado, pois pode afetar a própria página do editor.

Regras:

- detectar claramente quando a página aberta é a página do app/editor;
- pedir confirmação antes de sobrescrever conteúdo crítico;
- usar helpers oficiais para salvar;
- não criar endpoint próprio;
- não assumir formato de deploy sem teste no workspace;
- preservar backup/snapshot local antes de atualização relevante.

## Ícones

Os SVGs/HeroIcons existentes podem estar parcialmente deformados.

Regras atuais:

- não substituir sistema de ícones sem pedido específico;
- não reestruturar todos os ícones em mudanças não relacionadas;
- manter estrutura atual até uma etapa dedicada de correção visual;
- se houver troca futura, fazer em uma versão isolada e testável.

## Internacionalização

O app suporta idioma automático/EN/PT-BR.

Regras:

- novas strings visíveis devem entrar no mapa de i18n;
- preservar `data-i18n`, `data-i18n-title` e `data-i18n-placeholder` quando aplicável;
- não misturar texto hardcoded em português/inglês sem motivo;
- manter fallback em inglês quando chave não existir.

## Protocolo para novas alterações

Antes de alterar código:

1. ler o HTML atual;
2. consultar `page-api.js` e `editor.js` quando a mudança tocar API ou integração;
3. identificar se a funcionalidade já existe;
4. evitar implementar duplicado;
5. definir o menor patch possível;
6. preservar estados locais e UX aprovada.

Depois de alterar código:

1. validar sintaxe do JavaScript;
2. revisar IDs usados em `getElementById`;
3. revisar eventos com `addEventListener`;
4. revisar impacto na sidebar;
5. revisar impacto em preview/foco;
6. revisar localStorage/IndexedDB;
7. revisar i18n;
8. documentar o que mudou.

## Coisas que não devem ser feitas

Não fazer:

- inventar API;
- criar backend próprio;
- trocar IndexedDB por outro sistema sem decisão explícita;
- recriar helpers oficiais;
- editar arquivos oficiais do Fibery como se fossem do projeto;
- remover funcionalidades aprovadas;
- simplificar a UI sacrificando fluxo operacional;
- transformar o app em editor genérico;
- tornar o app público por padrão;
- adicionar autenticação paralela;
- salvar tokens no código;
- depender de dados dinâmicos neste documento;
- usar este documento como changelog.

## Como responder ao evoluir o projeto

Ao entregar uma nova alteração, responder sempre com:

1. O que foi implementado.
2. O que foi corrigido.
3. O que mudou visualmente.
4. Próxima versão sugerida.
5. Novas ideias/anotações futuras.
6. Atualização do planejamento caso novas ideias apareçam.

Esse formato funciona como registro operacional entre ciclos de desenvolvimento.
