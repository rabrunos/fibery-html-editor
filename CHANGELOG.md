# Changelog

Todas as mudanças relevantes do Fibery HTML Editor devem ser registradas neste arquivo.

Formato padrão:

* novas entradas entram no topo;
* cada versão usa `## [x.y.z] - YYYY-MM-DD`;
* usar apenas as seções que fizerem sentido:

  * `### Implementado`
  * `### Corrigido`
  * `### Ajustes técnicos`
  * `### Mudanças visuais`
  * `### Validação`
  * `### Observações`
* manter descrições objetivas e focadas no usuário/frontend.

> Histórico inicial reconstruído em 2026-05-18 com base no estado atual do GitHub, versão declarada no `index.html`, issues abertas/relevantes e commits recentes disponíveis. Versões antigas sem tag/release pública foram agrupadas quando a reconstrução exata não era segura.

## [Não lançado]

### Observações

* Próximas mudanças relevantes devem ser adicionadas aqui ou em uma nova seção de versão no topo quando a versão for definida.

## [8.4.1] - 2026-05-18

### Corrigido

* Polido o preview inteligente para evitar reconstruções desnecessárias do iframe local quando o conteúdo efetivo da prévia não mudou.
* Ajustado o status interno do preview local para deixar de usar nomenclatura de PoC no fluxo principal.
* Mantido o retorno seguro para preview real quando o conteúdo volta ao baseline salvo/carregado.

### Ajustes técnicos

* Adicionada assinatura específica para renderização do preview local, considerando HTML, `baseHref` e uso de Tailwind.
* Renomeada a origem das mensagens internas de preview para `fibery-html-editor/local-preview`.
* Mantido filtro de mensagens vindas do iframe por `requestId` e `contentWindow`.
* Sincronizado versionamento do app em metadata e `APP_VERSION`.

### Validação

* Mudança derivada do commit recente `Polish intelligent preview`.

## [8.4.0] - 2026-05-18

### Implementado

* Implementada a alternância automática entre preview real e preview local.
* Implementado live preview local com debounce, sem salvar no Fibery enquanto o usuário digita.
* Consolidada a estratégia de preview local com `srcdoc + base + tailwind.css`.
* Adicionado suporte a Tailwind browser/CDN apenas dentro do iframe local, para melhorar a visualização de classes novas/arbitrárias durante edição.
* Mantido o preview real como referência quando o conteúdo atual corresponde ao baseline salvo/carregado.
* Ao salvar manualmente, o app volta a usar o preview real do Fibery.

### Corrigido

* Removido o fluxo manual de PoC como experiência principal do usuário.
* Preservado o fluxo de autosave, histórico e recovery sem transformar preview local em salvamento real.
* Evitadas chamadas de API de preview/salvamento enquanto o usuário digita.

### Ajustes técnicos

* O HTML gerado para o iframe local é separado do HTML do editor.
* O Tailwind browser/CDN é injetado somente no documento temporário do iframe.
* O conteúdo salvo no Fibery continua sendo somente o HTML do usuário.
* A decisão entre preview real/local usa baseline confiável, não apenas estado `dirty`.

### Mudanças visuais

* A área de preview passa a responder automaticamente às edições locais.
* O menu de preview permanece simples, sem botões diagnósticos da PoC no fluxo normal.

## [8.3.1] - 2026-05-18

### Implementado

* Adicionados modos diagnósticos para investigar carregamento de CSS no preview local:

  * Blob com `tailwind.css`;
  * Blob com `/tailwind.css`;
  * `srcdoc` com `tailwind.css`;
  * `srcdoc` com `/tailwind.css`;
  * `srcdoc + base`.
* Adicionada instrumentação para identificar carregamento, falha, ausência ou timeout do CSS da prévia local.
* Adicionados logs/status para facilitar testes no runtime real do Fibery.

### Corrigido

* Confirmado por teste real que Blob não era a estratégia mais confiável para `tailwind.css`.
* Confirmado que `/tailwind.css` não é confiável como caminho global.
* Identificado que `srcdoc + base + tailwind.css` é a estratégia mais robusta para o ambiente atual.

### Ajustes técnicos

* Adicionado uso de `<base href="...">` no documento local para melhorar resolução de caminhos relativos.
* Adicionado `postMessage` filtrado para receber diagnósticos do iframe local.

## [8.3.0] - 2026-05-18

### Implementado

* Implementada a primeira PoC de preview local no menu da prévia.
* Adicionadas ações explícitas para testar:

  * `Prévia local PoC (tailwind.css)`;
  * `Prévia local PoC (/tailwind.css)`;
  * retorno para prévia real.
* A PoC passou a renderizar o HTML atual do editor no iframe sem salvar no Fibery.

### Corrigido

* Adicionado controle de ciclo de vida de Blob URL com `URL.revokeObjectURL`.
* Mantido o preview real como padrão através do fluxo `/api/ai-answer/pages/{id}/view`.

### Ajustes técnicos

* O preview local da PoC não chama `API.savePage`.
* O preview local da PoC não cria histórico manual.
* O preview local da PoC não interfere diretamente em autosave/drafts.

## [8.2.4] - 2026-05-18

### Corrigido

* Polido o fluxo de autosave, recovery e diff após separação entre autosave local e histórico manual.
* Melhorado o comportamento de recuperação para evitar reaparecimento insistente do modal grande quando o usuário mantém a versão atual.
* Ajustada limpeza de drafts/autosaves obsoletos após salvamento manual quando não há diferença real.
* Reforçado que restore aplica no editor, marca como não salvo e não salva automaticamente no Fibery.

### Ajustes técnicos

* Mantida a separação entre histórico manual e autosaves.
* Preservado autosave como recurso local, sem chamada de API do Fibery.
* Reforçada a comparação com baseline para decidir se existe diferença relevante.

## [8.2.x] - 2026-05-17

### Implementado

* Implementada a base de autosave local.
* Implementada recuperação de rascunho local.
* Implementado diff antes de restaurar rascunho/autosave.
* Separado histórico manual de autosaves.
* Adicionado limite próprio para autosaves.
* Adicionado botão discreto para reabrir comparação de recovery.

### Corrigido

* Corrigidos textos PT-BR e problemas de codificação/símbolos quebrados.
* Ajustados fluxos para garantir que autosave não salva no Fibery.
* Ajustado restore para marcar dirty sem salvar automaticamente.

### Ajustes técnicos

* Autosaves, histórico manual e metadata local usam IndexedDB.
* Preferências simples continuam em localStorage.
* Histórico manual passa a representar salvamentos intencionais.

## [8.1.x] - 2026-05-17

### Corrigido

* Ajustada limpeza de busca.
* Corrigidos menus de três pontinhos.
* Corrigido submenu “Mover para projeto” para permanecer aberto durante interação.
* Refinados comportamentos de sidebar, menus contextuais e organização local.

### Ajustes técnicos

* Mantida a organização de projetos como recurso local, sem criar entidades no Fibery.
* Preservada a seleção atual e reduzidos resets desnecessários de UI.

## [Antes de 8.1.x]

### Implementado

* Criada base do Fibery HTML Editor como Custom HTML Page em arquivo único.
* Implementado carregamento/listagem de páginas HTML do Fibery.
* Implementada edição de título, descrição e HTML.
* Implementado salvamento manual no Fibery.
* Implementada exclusão de páginas quando permitido.
* Implementado preview real usando o endpoint de visualização do Fibery.
* Implementada sidebar com páginas e organização local.
* Implementado editor de código com Monaco e fallback em textarea.
* Implementadas preferências locais básicas, como idioma, última página, layout e painel editor/preview.

### Ajustes técnicos

* Mantida arquitetura de frontend único, sem backend próprio.
* Usadas APIs/comportamentos disponíveis do Fibery.
* Usado IndexedDB/localStorage para persistência local do app.
