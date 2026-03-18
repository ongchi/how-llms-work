// ── External HTML partials plugin ────────────────────────────────────────────
// Loads <section data-external="path/to/partial.html"> before Reveal inits.
// ── end External HTML partials plugin ────────────────────────────────────────

const RevealExternal = {
  id: 'external',
  async init(deck) {
    const sections = deck.getSlidesElement()
      .querySelectorAll('section[data-external]');

    await Promise.all([...sections].map(async (section) => {
      const url = section.getAttribute('data-external');
      const response = await fetch(url);
      const html = await response.text();
      section.innerHTML = html;
    }));
  }
};
