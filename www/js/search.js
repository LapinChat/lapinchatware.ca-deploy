const options = {
    bool: "AND",
    fields: {
        title: {boost: 2},
        body: {boost: 1},
    }
};

// Load index
async function initIndex() {
    return await fetch("/search_index.fr.json")
        .then(
            async function(response) {
                return await elasticlunr.Index.load(await response.json());
            }
        );
}

// Taken from mdbook
// The strategy is as follows:
// First, assign a value to each word in the document:
//  Words that correspond to search terms (stemmer aware): 40
//  Normal words: 2
//  First word in a sentence: 8
// Then use a sliding window with a constant number of words and count the
// sum of the values of the words within the window. Then use the window that got the
// maximum sum. If there are multiple maximas, then get the last one.
// Enclose the terms in a custom tag.
function makeTeaser(body, terms, searchTermTagStart, searchTermTagEnd) {
    const TERM_WEIGHT = 40;
    const NORMAL_WORD_WEIGHT = 2;
    const FIRST_WORD_WEIGHT = 8;
    const TEASER_MAX_WORDS = 30;

    const stemmedTerms = terms.map(function (w) {
        return elasticlunr.stemmer(w.toLowerCase());
    });

    let termFound = false;
    let index = 0;
    let weighted = []; // contains elements of ["word", weight, index_in_document]

    // split in sentences, then words
    const sentences = body.toLowerCase().split(". ");

    for (let i in sentences) {
        const words = sentences[i].split(" ");
        let value = FIRST_WORD_WEIGHT;

        for (let j in words) {
            const word = words[j];

            if (word.length > 0) {
                for (let k in stemmedTerms) {
                    if (elasticlunr.stemmer(word).startsWith(stemmedTerms[k])) {
                        value = TERM_WEIGHT;
                        termFound = true;
                    }
                }
                weighted.push([word, value, index]);
                value = NORMAL_WORD_WEIGHT;
            }

            index += word.length;
            index += 1;  // ' ' or '.' if last word in sentence
        }

        index += 1;  // because we split at a two-char boundary '. '
    }

    if (weighted.length === 0) {
        return body;
    }

    let windowWeights = [];
    const windowSize = Math.min(weighted.length, TEASER_MAX_WORDS);
    // We add a window with all the weights first
    let curSum = 0;
    for (let i = 0; i < windowSize; i++) {
        curSum += weighted[i][1];
    }
    windowWeights.push(curSum);

    for (let i = 0; i < weighted.length - windowSize; i++) {
        curSum -= weighted[i][1];
        curSum += weighted[i + windowSize][1];
        windowWeights.push(curSum);
    }

    // If we didn't find the term, just pick the first window
    let maxSumIndex = 0;
    if (termFound) {
        let maxFound = 0;
        // backwards
        for (let i = windowWeights.length - 1; i >= 0; i--) {
            if (windowWeights[i] > maxFound) {
                maxFound = windowWeights[i];
                maxSumIndex = i;
            }
        }
    }

    let teaser = [];
    let startIndex = weighted[maxSumIndex][2];
    for (let i = maxSumIndex; i < maxSumIndex + windowSize; i++) {
        const word = weighted[i];
        if (startIndex < word[2]) {
            // missing text from index to start of `word`
            teaser.push(body.substring(startIndex, word[2]));
            startIndex = word[2];
        }

        // add custom tag round search terms
        if (word[1] === TERM_WEIGHT) {
            teaser.push(`${searchTermTagStart}`);
        }
        startIndex = word[2] + word[0].length;
        teaser.push(body.substring(word[2], startIndex));

        if (word[1] === TERM_WEIGHT) {
            teaser.push(`${searchTermTagEnd}`);
        }
    }
    teaser.push("…");
    return teaser.join("");
}

const main = document.getElementsByClassName("main")[0];
const resultsCountSpan = document.getElementsByClassName("section__other_title__result-count")[0];
async function search(searchTerm, maxItems) {
    const term = searchTerm.trim();
    if (term === "") {
        return;
    }

    const results = (await initIndex()).search(term, options);

    const resultsCount = results.length;
    resultsCountSpan.innerHTML = resultsCount;
    if (resultsCount === 0) {
        // No results
        return;
    }

    let list = document.createElement("ul");
    list.classList.add("search-results");
    for (let i = 0; i < Math.min(results.length, maxItems); i++) {
        let item = document.createElement("li");
        item.classList.add("search-results__item");
        const href = results[i].ref;
        const title = results[i].doc.title;
        const rawBody = results[i].doc.body;

        const parsedBody = makeTeaser(
            rawBody,
            term.split(" "),
            '<span class="search-results__item__content__term">',
            "</span>"
        );

        item.innerHTML = `<h3 class="search-results__item__title"><a class="search-results__item__link" href="${href}">${title}</a></h3>`
            + `<p class="search-results__item__content">${parsedBody}</p>`;
        list.append(item);
    }
    main.append(list);
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if (urlParams.has("search")) {
    const term = urlParams.get("search");
    search(term, 100);
}