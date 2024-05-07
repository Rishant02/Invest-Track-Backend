/**
 * Capitalizes the first letter of a word and makes the rest lowercase.
 *
 * @param {string} word - The word to be capitalized.
 * @return {string} The capitalized word.
 */
function capitalize(word) {
  if (!word) return word;
  return word[0].toUpperCase() + word.substr(1).toLowerCase();
}

module.exports = capitalize;
