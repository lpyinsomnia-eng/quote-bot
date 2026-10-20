export function genresOf(quote) {
  return quote.genre.split('／').map(value => value.trim()).filter(Boolean);
}

export function filterQuotes(quotes, author = '', genre = '') {
  return quotes.filter(quote => (!author || quote.author === author)
    && (!genre || genresOf(quote).includes(genre)));
}

export class Lottery {
  constructor(random = Math.random) {
    this.random = random;
    this.pool = [];
    this.bag = [];
    this.lastId = null;
  }
  setPool(quotes) {
    this.pool = [...quotes];
    this.bag = [];
  }
  draw() {
    if (!this.pool.length) return null;
    if (!this.bag.length) {
      this.bag = [...this.pool];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
      // Also avoid a repeat across cycles and after a filter change.
      const end = this.bag.length - 1;
      if (end > 0 && this.bag[end].id === this.lastId) {
        const j = Math.floor(this.random() * end);
        [this.bag[end], this.bag[j]] = [this.bag[j], this.bag[end]];
      }
    }
    const quote = this.bag.pop();
    this.lastId = quote.id;
    return quote;
  }
}
