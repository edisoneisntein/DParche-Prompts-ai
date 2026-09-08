const str = "a".repeat(13000000);
const start = Date.now();
const wordCount = str.trim().split(/\s+/).filter(Boolean).length;
console.log("Time:", Date.now() - start, "ms", "Count:", wordCount);
