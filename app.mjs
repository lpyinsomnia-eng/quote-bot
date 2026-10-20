import { Lottery, filterQuotes, genresOf } from './lottery.mjs';

const $ = id => document.getElementById(id);
const lottery = new Lottery();
let quotes = [];

function fillSelect(id, values) {
  for (const value of [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ja'))) {
    const option = document.createElement('option');
    option.value = option.textContent = value;
    $(id).append(option);
  }
  $(id).disabled = false;
}

function showMessage(message) {
  $('quote-card').hidden = true;
  $('message').hidden = false;
  $('message').textContent = message;
}

function draw() {
  const quote = lottery.draw();
  if (!quote) {
    showMessage('この組み合わせの名言はありません。人物やジャンルを変更してください。');
    return;
  }
  $('message').hidden = true;
  $('quote-card').hidden = false;
  $('quote-text').textContent = quote.text;
  $('author').textContent = quote.author;
  $('expression').textContent = quote.expression;
  $('background').textContent = quote.background;
  $('quote-id').textContent = quote.id;
  $('genres').replaceChildren(...genresOf(quote).map(genre => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = genre;
    return tag;
  }));
  $('original-section').open = false;
  $('original-section').hidden = !quote.original;
  $('original').textContent = quote.original;
  $('source-name').textContent = quote.sourceName;
  if (quote.sourceUrl) {
    const url = new URL(quote.sourceUrl);
    if (['http:', 'https:'].includes(url.protocol)) {
      const link = document.createElement('a');
      link.href = quote.sourceUrl;
      link.textContent = quote.sourceName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      $('source-name').replaceChildren(link);
    }
  }
  $('source-location').textContent = quote.sourceLocation;
  $('source-location').hidden = !quote.sourceLocation;
}

function updateFilters() {
  const author = $('author-filter').value;
  const genre = $('genre-filter').value;
  const pool = filterQuotes(quotes, author, genre);
  lottery.setPool(pool);
  $('count').textContent = `${pool.length} 件の言葉${author || genre ? ` ／ 全 ${quotes.length} 件` : ''}`;
  $('reset').disabled = !(author || genre);
  $('draw').disabled = pool.length < 2;
  $('draw-hint').textContent = pool.length === 1 ? 'この条件に合う名言は1件です。' : pool.length === 0 ? '絞り込みを解除すると、すべての名言を引けます。' : '一巡するまで、同じ言葉は出ません。';
  draw();
}

function validateData(data) {
  if (data.schemaVersion !== 1 || !Array.isArray(data.quotes) || !data.quotes.length) throw new Error('Invalid data');
  const ids = new Set();
  for (const quote of data.quotes) {
    for (const key of ['id','author','text','original','background','genre','sourceName','sourceUrl','sourceLocation','expression','verification']) {
      if (typeof quote[key] !== 'string') throw new Error('Missing field');
    }
    if (!['確認済','確認済み'].includes(quote.verification) || ids.has(quote.id)) throw new Error('Unapproved or duplicate row');
    if (!quote.text || !quote.author) throw new Error('Missing text');
    if (quote.sourceUrl && !['https:', 'http:'].includes(new URL(quote.sourceUrl).protocol)) throw new Error('Invalid URL');
    ids.add(quote.id);
  }
  return data.quotes;
}

$('author-filter').addEventListener('change', updateFilters);
$('genre-filter').addEventListener('change', updateFilters);
$('reset').addEventListener('click', () => {
  $('author-filter').value = $('genre-filter').value = '';
  updateFilters();
});
$('draw').addEventListener('click', draw);

try {
  const response = await fetch(new URL('./data/quotes.json', import.meta.url), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  quotes = validateData(await response.json());
  fillSelect('author-filter', quotes.map(quote => quote.author));
  fillSelect('genre-filter', quotes.flatMap(genresOf));
  updateFilters();
} catch (error) {
  $('count').textContent = '名言を読み込めませんでした';
  showMessage('データを読み込めませんでした。接続を確認して、ページを再読み込みしてください。ローカルではREADMEの手順で起動してください。');
  $('draw').disabled = true;
  $('draw-hint').textContent = '';
  console.error('Quote data could not be loaded:', error.message);
}
