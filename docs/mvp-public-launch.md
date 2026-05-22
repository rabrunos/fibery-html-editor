# MVP público - material de lançamento

Versão base sugerida: `8.47.4`

Status: MVP para primeiros usuários. Pode ter bug; a ideia é coletar feedback rápido antes de polir demais.

## 1. Convite curto

Oi! Estou abrindo um primeiro teste do **Fibery HTML Editor** com poucas pessoas.

Ele ainda é MVP, então pode ter bug, texto estranho ou algum fluxo confuso. A ideia agora é validar se o básico funciona bem: abrir o app, criar/editar uma página HTML, ver preview, salvar e reabrir.

Se algo quebrar, me manda um print, vídeo curto ou o log/erro que aparecer. Feedback sincero vale mais que teste perfeito.

## 2. Apresentação curta

O **Fibery HTML Editor** é um editor de páginas HTML para Fibery.

Ele roda como uma **Custom HTML Page** dentro do próprio Fibery. Você edita título, descrição e HTML, vê o preview local antes de salvar e só altera o Fibery quando clica em **Save**.

O app também tem histórico e drafts locais, organização local por projetos/pastas, busca de páginas e um fluxo de **Update App** para aplicar novas versões com confirmação.

Ainda é MVP: serve para uso inicial e feedback real, não para prometer estabilidade total.

## 3. Como usar

1. Abra o app no Fibery.
2. Clique em **New Page** para criar uma página.
3. Edite título, descrição e HTML.
4. Veja o resultado no painel de preview.
5. Clique em **Save** para salvar no Fibery.
6. Abra uma página existente pela sidebar ou pela busca.
7. Se precisar, use histórico, draft/recovery ou comparação antes de restaurar conteúdo.

## 4. O que testar primeiro

- [ ] Abrir o app.
- [ ] Criar uma página nova.
- [ ] Editar HTML.
- [ ] Conferir o preview.
- [ ] Salvar.
- [ ] Recarregar o app.
- [ ] Abrir a página salva.
- [ ] Buscar uma página.
- [ ] Criar ou abrir projeto/pasta na sidebar.
- [ ] Clicar no menu de três pontos de página/projeto.
- [ ] Abrir **Settings**.
- [ ] Verificar **Update App**.
- [ ] Testar em tela menor, se possível.

## 5. O que reportar

Reporte qualquer coisa que atrapalhe o uso, especialmente:

- erro no console ou no log do app;
- botão que não aparece ou não responde;
- texto quebrado, cortado ou difícil de entender;
- ícone desalinhado;
- lentidão ao abrir, buscar, salvar ou trocar de página;
- problema em save/load;
- preview diferente do esperado;
- Update App confuso ou sem botão esperado;
- fluxo que parece perigoso ou fácil de usar errado;
- sugestão de melhoria que faria diferença no uso real.

Não precisa investigar tecnicamente. Um print com "cliquei aqui e aconteceu isso" já ajuda muito.

## 6. Template de feedback

```text
Versão do app:
Navegador:
Sistema operacional:

O que tentei fazer:

O que aconteceu:

O que eu esperava:

Print ou vídeo:

Logs/erros, se tiver:

Comentário livre:
```

## 7. Mensagem curta final

Estou mandando o MVP do Fibery HTML Editor para um teste rápido. Se puder, tenta criar/editar/salvar uma página HTML e me diz onde travou, confundiu ou pareceu lento. É MVP, então bug é esperado - print, vídeo curto ou log já ajuda demais.
