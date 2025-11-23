# Calculadora de Aporte

Aplicação web responsiva que distribui o valor de um aporte entre vários ativos com base em percentuais definidos pelo usuário, exibindo validações em tempo real e os valores calculados já formatados em reais.

## Visão Geral

- Configure o valor total do aporte.
- Adicione ou remova ativos a qualquer momento.
- Defina o percentual destinado a cada ativo e acompanhe a soma total.
- Veja imediatamente quanto cada ativo receberá, com todos os valores em R$.

## Tecnologias

- HTML5 semântico
- CSS3 com customizações próprias
- Bootstrap 5.3 para layout e componentes responsivos
- JavaScript vanilla com Intl API para formatação monetária

## Funcionalidades

- Campo de valor total com formatação brasileira (R$).
- Adição e remoção dinâmica de ativos.
- Validação visual: a soma dos percentuais deve ser 100%.
- Cálculo automático conforme o usuário digita.
- Prevenção de valores negativos ou inválidos.
- Interface adaptada para dispositivos móveis e desktops.
- Salvamento em memória de várias distribuições nomeadas, com carregamento rápido.

## Como usar

1. Não há dependências: abra diretamente o arquivo `index.html` no navegador.
2. Informe o valor total desejado no campo “Valor total do aporte”.
3. Use o botão “Adicionar ativo” para criar novas linhas ou o ícone de lixeira para removê-las.
4. Preencha o nome e o percentual de cada ativo; a tabela de resultados será atualizada automaticamente.
5. Ajuste os percentuais até atingir exatamente 100% para liberar o resultado final.
6. Dê um nome à configuração no cartão de resultados e clique em “Salvar distribuição” para memorizar o cenário atual.

> Dica: ao focar no campo de valor total, o número é mostrado sem formatação para facilitar a edição; ao sair do campo ele volta a aparecer como moeda.

## Exemplo de uso

A configuração abaixo (pré-carregada na aplicação) demonstra um aporte de **R$ 5.000,00** distribuído entre quatro ativos:

| Ativo | Percentual | Valor calculado |
| --- | --- | --- |
| Bitcoin (BTC) | 80% | R$ 4.000,00 |
| Tether (USDT) | 10% | R$ 500,00 |
| Solana (SOL) | 5% | R$ 250,00 |
| Ethereum (ETH) | 5% | R$ 250,00 |

Qualquer alteração nos percentuais ou no valor total atualiza a tabela em tempo real.

## Estrutura

- `index.html` — Estrutura, carregamento do Bootstrap e containers principais.
- `styles.css` — Personalizações de layout, cores e estados de validação.
- `script.js` — Lógica para manipular ativos, validar percentuais e calcular aportes.

## Distribuições salvas

- As distribuições ficam guardadas apenas em memória enquanto a aba estiver aberta (não há backend ou armazenamento local).
- Cada cenário contém o valor do aporte e a lista de ativos/percentuais que estava vigente no momento do salvamento.
- Salvar com o mesmo nome atualiza o cenário existente; nomes diferentes criam novas entradas.
- Use o botão “Remover” para apagar distribuições que não fazem mais sentido.
- Ao clicar em um cartão salvo, a interface carrega imediatamente os dados e recalcula o resultado com o valor informado no cenário (você pode alterar o valor e salvar novamente se quiser comparar).

Sinta-se à vontade para adaptar a lista inicial de ativos ou a paleta de cores no CSS conforme a identidade do seu projeto.

