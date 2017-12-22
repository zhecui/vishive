var textAnalysis = {

    countWords : function(text){
      var words = text.match(/\w+['-']*\w*/g);
      return words ? words.length : 0;
    },

    countSentences : function(text){
      var sentences = text.match(/[^.!?]+/g);
      return sentences ? sentences.length : 0;
    },

    countParagraphs : function(text){
      var paragraphs = text.match(/[^\n]+\s*/g);
      return paragraphs ? paragraphs.length : 0;
    },

    estimateReadingTime : function(text, readingSpeed){
      readingSpeed = readingSpeed || 250;
      var wordCount = countWords(text);
      return Math.ceil(wordCount / readingSpeed);
    },

    analyzeText : function(text, options){
      options = options || {};
      var analysis = {};
      analysis.wordCount = countWords(text);
      analysis.sentenceCount = countSentences(text);
      analysis.paragraphCount = countParagraphs(text);
      analysis.readingSpeed = options.readingSpeed || 250;
      analysis.estimatedReadingTime = estimateReadingTime(text, options.readingSpeed);
      analysis.tags = options.tags || [];
      return analysis;
    },

    addTags : function(analysis, newTags){
      var tags = {};
      for(var i = 0; i < analysis.tags.length; i++){
        tags[analysis.tags[i]] = true;
      }
      for(var i = 0; i < newTags.length; i++){
        tags[newTags[i]] = true;
      }
      analysis.tags = Object.keys(tags);
      return tags;
    },

}